const badge = document.querySelector('.badge');
const hero  = document.querySelector('.hero');
const badgePrefix = '// loading... Please wait: ';
let badgeNum = '';
badge.textContent = badgePrefix + 'years';

requestAnimationFrame(() => {
  const br = badge.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const indent = br.left - hr.left;
  const lineH  = parseFloat(getComputedStyle(badge).fontSize) * 2;

  badge.style.position   = 'absolute';
  badge.style.left       = '0';
  badge.style.top        = (br.top - hr.top) + 'px';
  badge.style.margin     = '0';
  badge.style.textAlign  = 'left';
  badge.style.textIndent = indent + 'px';
  badge.style.width      = '100%';
  badge.style.whiteSpace  = 'normal';
  badge.style.wordBreak   = 'break-all';
  badge.style.maxHeight  = (lineH * 40) + 'px';
  badge.style.overflow   = 'hidden';

  let n = 1;
  function addDigit() {
    badgeNum += Math.floor(Math.random() * 9) + 1;
    badge.textContent = badgePrefix + badgeNum + ' years';
    const delay = Math.max(16, n < 10 ? 2000 / Math.sqrt(n) : 2000 / n);
    n++;
    setTimeout(addDigit, delay);
  }
  setTimeout(addDigit, 0); // it adds the first number instantly
});

const title = document.querySelector('h1');
let cx = window.innerWidth / 2;
let cy = window.innerHeight / 2;
let tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  cx = e.clientX;
  cy = e.clientY;
});

function tick() {
  const rect = title.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  const dx = (cx - ox) / window.innerWidth;
  const dy = (cy - oy) / window.innerHeight;
  tx += (dx * 18 - tx) * 0.08;
  ty += (dy * 12 - ty) * 0.08;
  title.style.transform = `translate(${tx}px, ${ty}px)`;
  requestAnimationFrame(tick);
}

tick();
