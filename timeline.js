const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_F = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const ZOOMS = [
  { label: 'LIFETIME', days: null },
  { label: '1W',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
  { label: '1Y',  days: 365 },
];

function todayUtc() {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

let activeZoom = 'LIFETIME';

function render() {
  const root = document.getElementById('tl-root');
  if (!root || !window.DEVLOG_ENTRIES || !DEVLOG_ENTRIES.length) return;

  const today      = todayUtc();
  const firstEntry = Math.min(...DEVLOG_ENTRIES.map(e => e.dateMs));

  const available = ZOOMS.filter(z =>
    z.days === null || (today - z.days * 86400000) >= firstEntry
  );

  if (!available.find(z => z.label === activeZoom)) activeZoom = available[0].label;

  const zoom        = available.find(z => z.label === activeZoom);
  const winStart    = zoom.days === null ? firstEntry : today - zoom.days * 86400000;
  const winEnd      = today;
  const spanDays    = Math.round((winEnd - winStart) / 86400000);
  const daysMini    = spanDays > 14;
  const showDayTick = spanDays <= 365;

  function pct(ms) {
    const span = winEnd - winStart;
    return span === 0 ? 0 : (ms - winStart) / span * 100;
  }

  // Zoom buttons
  const zoomBtns = available.map(z =>
    `<button class="tl-zoom-btn${z.label === activeZoom ? ' tl-zoom-active' : ''}" data-zoom="${z.label}">${z.label}</button>`
  ).join('');

  // Ticks
  const ticks = [];
  const cur = new Date(winStart);
  while (cur.getTime() < winEnd) {
    const ms   = cur.getTime();
    const left = pct(ms).toFixed(3);
    const d    = cur.getUTCDate();
    const mon  = cur.getUTCMonth();
    const dow  = cur.getUTCDay();

    if (d === 1 && mon === 0) {
      ticks.push(`<div class="tl-tick tl-year" style="left:${left}%"><span class="tl-tick-lbl">${cur.getUTCFullYear()}</span></div>`);
    } else if (d === 1) {
      ticks.push(`<div class="tl-tick tl-month" style="left:${left}%"><span class="tl-tick-lbl">${MONTHS_S[mon]}</span></div>`);
    } else if (daysMini && dow === 1) {
      ticks.push(`<div class="tl-tick tl-week" style="left:${left}%"><span class="tl-tick-lbl">${d}</span></div>`);
    } else if (showDayTick) {
      ticks.push(`<div class="tl-tick ${daysMini ? 'tl-day-mini' : 'tl-day'}" style="left:${left}%">${daysMini ? '' : `<span class="tl-tick-lbl">${d}</span>`}</div>`);
    }

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Entry markers
  const markers = DEVLOG_ENTRIES
    .filter(e => e.dateMs >= winStart && e.dateMs <= winEnd)
    .map(e => {
      const left = pct(e.dateMs).toFixed(2);
      return `<a class="tl-marker" href="devlogs/karl/posts/${e.slug}.html" style="left:${left}%">
        <div class="tl-dot${e.tag === 'DEMO' ? ' tl-dot-demo' : ''}"></div>
        <div class="tl-popup">
          <span class="tl-pop-title">${e.title}</span>
          <span class="tl-pop-date">${e.displayDate}</span>
        </div>
      </a>`;
    });

  root.innerHTML = `
    <div class="tl-header">
      <p class="game-label">// timeline</p>
      <div class="tl-zooms">${zoomBtns}</div>
    </div>
    <div class="tl-track">
      ${ticks.join('')}
      ${markers.join('')}
      <div class="tl-now">
        <div class="tl-dot tl-dot-now"></div>
        <span class="tl-now-label">TODAY</span>
      </div>
    </div>`;

  root.querySelectorAll('.tl-zoom-btn').forEach(btn =>
    btn.addEventListener('click', () => { activeZoom = btn.dataset.zoom; render(); })
  );
}

document.addEventListener('DOMContentLoaded', render);
