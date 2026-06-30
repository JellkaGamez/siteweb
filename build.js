import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const data = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { data, body: match[2] };
}

function processBBCode(html) {
  let out = html, prev;
  do {
    prev = out;
    out = out.replace(/\[color=([^\]]{1,50})\]([\s\S]*?)\[\/color\]/gi, (_, color, content) => {
      const safe = color.trim().replace(/[^a-zA-Z0-9#(),.\s%-]/g, '');
      return `<span style="color:${safe}">${content}</span>`;
    });
  } while (out !== prev);
  return out;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthIndex(name) {
  return MONTHS.findIndex(m => m.toLowerCase().startsWith(name.slice(0, 3).toLowerCase()));
}

function ordinal(n) {
  const v = n % 100;
  const s = ['th','st','nd','rd'];
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function parseDate(str) {
  // YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  // YYYY Month DD  (e.g. "2026 June 24" or "2026 June 24th")
  const natural = str.match(/^(\d{4})\s+([A-Za-z]+)\s+(\d+)/);
  if (natural) return new Date(Date.UTC(+natural[1], monthIndex(natural[2]), +natural[3]));
  return new Date(str);
}

function formatDate(d) {
  return `${d.getUTCFullYear()} ${MONTHS[d.getUTCMonth()]} ${ordinal(d.getUTCDate())}`;
}

const entriesDir = path.join(__dirname, 'devlogs/karl/entries');
const postsDir   = path.join(__dirname, 'devlogs/karl/posts');

fs.mkdirSync(postsDir, { recursive: true });

const files = fs.readdirSync(entriesDir).filter(f => f.endsWith('.md'));

const entries = files.map(filename => {
  const raw = fs.readFileSync(path.join(entriesDir, filename), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = filename.replace(/\.md$/, '');
  const dateObj = data.date ? parseDate(data.date) : new Date(0);
  const rawTitle = data.title ?? slug;
  const demoMatch = rawTitle.match(/^\[DEMO\]\s*/i);
  const title = demoMatch ? rawTitle.slice(demoMatch[0].length) : rawTitle;
  const tag = demoMatch ? 'DEMO' : 'FULL GAME';
  return { slug, title, tag, dateObj, displayDate: formatDate(dateObj), body };
});

// Sort newest first for display; oldest-first for numbering (#001 = oldest)
entries.sort((a, b) => b.dateObj - a.dateObj);
const total = entries.length;

function entryNum(i) {
  return '//' + ' #' + String(total - i).padStart(3, '0');
}

// Generate individual post pages
for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const num = entryNum(i);
  const contentHtml = processBBCode(marked.parse(e.body));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(e.title)} — Devlog | JellkaGamez</title>
  <link rel="icon" type="image/jpeg" href="../../../favicon.jpg">
  <link rel="stylesheet" href="../../../style.css">
</head>
<body>

<nav class="devlog-nav">
  <a href="../../../devlog.html" class="nav-back">BACK</a>
  <span class="nav-label">${escHtml(num)}</span>
</nav>

<main class="devlog-main">
  <header class="devlog-header">
    <p class="game-label">${escHtml(num)} &mdash; ${escHtml(e.displayDate)}</p>
    <span class="post-tag post-tag-${e.tag === 'DEMO' ? 'demo' : 'full'}">${escHtml(e.tag)}</span>
    <h1 class="devlog-title">${escHtml(e.title)}</h1>
  </header>

  <div class="entry-body">
    ${contentHtml}
  </div>
</main>

</body>
</html>`;

  fs.writeFileSync(path.join(postsDir, e.slug + '.html'), html);
}

// Regenerate devlog.html
const entryRows = entries.length === 0
  ? '<p class="devlog-empty">// no entries yet. check back soon.</p>'
  : entries.map((e, i) => {
      const num = entryNum(i);
      const tagCls = e.tag === 'DEMO' ? 'demo' : 'full';
      return `    <a class="devlog-row" href="devlogs/karl/posts/${e.slug}.html">
      <span class="row-num">${escHtml(num)}</span>
      <span class="row-date">${escHtml(e.displayDate)}</span>
      <span class="row-title"><span class="post-tag post-tag-${tagCls}">${escHtml(e.tag)}</span>${escHtml(e.title)}</span>
    </a>`;
    }).join('\n');

const devlogHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devlog — The Walk of Karl | JellkaGamez</title>
  <link rel="icon" type="image/jpeg" href="favicon.jpg">
  <link rel="stylesheet" href="style.css">
</head>
<body>
<script>
var DEVLOG_ENTRIES = ${JSON.stringify(entries.map(e => ({
  slug: e.slug,
  title: e.title,
  tag: e.tag,
  displayDate: e.displayDate,
  dateMs: e.dateObj.getTime(),
})), null, 0)};
</script>

<nav class="devlog-nav">
  <a href="index.html" class="nav-back">BACK</a>
  <span class="nav-label">// devlog: The Walk of Karl</span>
</nav>

<main class="devlog-main">
  <header class="devlog-header">
    <p class="game-label">// development log</p>
    <h1 class="devlog-title">The Walk<br>of <span class="accent">Karl</span></h1>
  </header>

  <div id="tl-root" class="timeline"></div>

  <div class="devlog-entries">
${entryRows}
  </div>
</main>

<script>
${fs.readFileSync(path.join(__dirname, 'timeline.js'), 'utf8')}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'devlog.html'), devlogHtml);

console.log(`Built ${entries.length} devlog ${entries.length === 1 ? 'entry' : 'entries'}.`);
