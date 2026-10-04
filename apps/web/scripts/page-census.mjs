/**
 * What is missing, not what is wrong.
 *
 * `page-metrics` and the section differ compare elements I already know about;
 * they are silent about a section I never noticed. This walks the ORIGINAL top
 * to bottom and asks what of it the replica cannot account for, so a whole
 * missing band shows up as an absence rather than as nothing at all.
 *
 *   npm run census -- /pricing
 *   npm run census -- / --width 1512
 *
 * Reports, in order of how much they usually matter:
 *   headings   every h1-h4 in document order, aligned by text
 *   text       every visible text block, diffed as a sequence
 *   roles      per-section counts of links, buttons, images, videos, inputs, li
 *   heights    total and per-section, to catch a band that is quietly short
 *   assets     every img/video, with natural and rendered size
 */
import { launch } from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORIGINAL = 'https://www.metabase.com';
const REPLICA = process.env.PSI_SITE || 'https://elegant-spontaneity-production-28e1.up.railway.app';

const args = process.argv.slice(2);
const page = args.find((a) => a.startsWith('/')) || '/';
const width = Number(args[args.indexOf('--width') + 1]) || 1512;

/** Collected inside the browser, so it sees what actually rendered. */
function harvest() {
  /* Site chrome is excluded. Both navigations hold their megamenu panels in the
     DOM, but the original leaves them measurable while this build hides them,
     so counting them compares two different ideas of "visible" and buries the
     page's own content under sixty false absences. */
  const CHROME = 'header, nav, footer, [role="banner"], [role="navigation"], [role="contentinfo"], .site-footer, .gdpr-cookie-notice';
  /* Only PAGE-level chrome. `<header>` and `<nav>` are also legitimate section
     wrappers -- this build uses `<header>` around section headings -- so a
     landmark that sits inside main/article/section is content, not chrome.
     Matching on the tag alone silently swallowed three whole sections. */
  const inChrome = (e) => {
    const l = e.closest(CHROME);
    return !!l && !l.closest('main, article, section');
  };
  const vis = (e) => {
    if (inChrome(e)) return false;
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none';
  };
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  const headings = [...document.querySelectorAll('h1,h2,h3,h4')]
    .filter(vis)
    .map((h) => ({
      level: +h.tagName[1],
      text: norm(h.textContent).slice(0, 90),
      y: Math.round(h.getBoundingClientRect().top + scrollY),
      font: getComputedStyle(h).fontSize + '/' + getComputedStyle(h).fontWeight,
      color: getComputedStyle(h).color,
    }));

  /* Leaf text, so a paragraph counts once rather than once per ancestor. */
  /* `small`, `code`, `b` and `strong` carry real copy -- a source card's
     library name, a shell command, a bolded finding -- and leaving them out of
     this list reported each of them as missing while they sat on the page. */
  const texts = [...document.querySelectorAll(
    'p,li,span,a,button,figcaption,dt,dd,label,blockquote,small,code,b,strong,h5,h6,td,th')]
    .filter((e) => vis(e) && ![...e.children].some((c) => c.textContent.trim()))
    .map((e) => norm(e.textContent))
    .filter((t) => t.length > 1);

  const count = (sel) => [...document.querySelectorAll(sel)].filter(vis).length;
  const roles = {
    links: count('a'),
    buttons: count('button'),
    images: count('img'),
    videos: count('video'),
    svgs: count('svg'),
    inputs: count('input,select,textarea'),
    listItems: count('li'),
    headings: headings.length,
  };

  const assets = [
    ...[...document.querySelectorAll('img')].filter(vis).map((i) => {
      const r = i.getBoundingClientRect();
      return {
        kind: 'img',
        name: (i.currentSrc || i.src).split('/').pop().split('?')[0].slice(0, 46),
        rendered: Math.round(r.width) + 'x' + Math.round(r.height),
        natural: i.naturalWidth + 'x' + i.naturalHeight,
      };
    }),
    ...[...document.querySelectorAll('video')].filter(vis).map((v) => {
      const r = v.getBoundingClientRect();
      const s = v.querySelector('source');
      return {
        kind: 'video',
        name: ((s && s.src) || v.src || '').split('/').pop().split('?')[0].slice(0, 46),
        rendered: Math.round(r.width) + 'x' + Math.round(r.height),
        natural: v.videoWidth + 'x' + v.videoHeight,
      };
    }),
  ];

  return {
    headings,
    texts,
    roles,
    assets,
    height: Math.round(document.documentElement.scrollHeight),
  };
}

async function read(browser, url) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 1000 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
  /* Lazy content only exists once it has been scrolled past. */
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 700));
  const out = await p.evaluate(harvest);
  await p.close();
  return out;
}

/** Longest common subsequence, so one missing item does not desync the rest. */
function align(a, b, key = (x) => x) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const missing = [], extra = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) { i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) missing.push(a[i++]);
    else extra.push(b[j++]);
  }
  while (i < n) missing.push(a[i++]);
  while (j < m) extra.push(b[j++]);
  return { missing, extra };
}

const browser = await launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const [o, m] = await Promise.all([read(browser, ORIGINAL + page), read(browser, REPLICA + page)]);
await browser.close();

const bar = (s) => '\n' + s + ' ' + '-'.repeat(Math.max(0, 70 - s.length));

console.log(`census ${page} at ${width}px`);
console.log(`  original ${o.height}px tall, replica ${m.height}px  (${m.height - o.height >= 0 ? '+' : ''}${m.height - o.height})`);

console.log(bar('headings'));
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const h = align(o.headings, m.headings, (x) => x.text.toLowerCase());
/* Paired on squashed text, a missing/extra couple is the same heading with
   different whitespace -- an inline spacing bug, not an absent section. */
const near = [];
for (let i = h.missing.length - 1; i >= 0; i--) {
  const j = h.extra.findIndex((e) => squash(e.text) === squash(h.missing[i].text));
  if (j > -1) { near.push([h.missing[i], h.extra[j]]); h.extra.splice(j, 1); h.missing.splice(i, 1); }
}
if (!h.missing.length && !h.extra.length && !near.length) console.log('  every heading present and in order');
h.missing.forEach((x) => console.log(`  MISSING  h${x.level} @${x.y}  "${x.text}"`));
h.extra.forEach((x) => console.log(`  EXTRA    h${x.level} @${x.y}  "${x.text}"`));
near.forEach(([a, b]) => console.log(`  SPACING  h${a.level}  orig "${a.text}"\n                 mine "${b.text}"`));
/* Same heading, different type. */
for (const a of o.headings) {
  const b = m.headings.find((x) => squash(x.text) === squash(a.text));
  if (b && (a.font !== b.font || a.color !== b.color)) {
    console.log(`  TYPE     h${a.level} "${a.text.slice(0, 44)}"`);
    console.log(`             orig ${a.font} ${a.color}   mine ${b.font} ${b.color}`);
  }
}

console.log(bar('text blocks'));
const key = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
const t = align(o.texts, m.texts, key);
/* Alignment is a sequence diff, so when the two sides differ a lot in length --
   here they often do, because this build renders demo content the original
   loads in an iframe -- it reports text as missing that is present but in a
   different position. Anything that appears anywhere on the replica is taken
   out of the missing list and counted as moved instead. */
const present = new Set(m.texts.map(key));
const moved = t.missing.filter((x) => present.has(key(x)));
t.missing = t.missing.filter((x) => !present.has(key(x)));
console.log(`  original ${o.texts.length}, replica ${m.texts.length}` +
  (moved.length ? `, ${moved.length} present but in a different order` : ''));
t.missing.slice(0, 40).forEach((x) => console.log(`  MISSING  "${x.slice(0, 92)}"`));
if (t.missing.length > 40) console.log(`  ... and ${t.missing.length - 40} more missing`);
t.extra.slice(0, 10).forEach((x) => console.log(`  EXTRA    "${x.slice(0, 92)}"`));
if (t.extra.length > 10) console.log(`  ... and ${t.extra.length - 10} more extra`);

console.log(bar('element counts'));
for (const k of Object.keys(o.roles)) {
  const d = m.roles[k] - o.roles[k];
  console.log(`  ${k.padEnd(11)} original ${String(o.roles[k]).padStart(4)}   replica ${String(m.roles[k]).padStart(4)}   ${d === 0 ? 'ok' : (d > 0 ? '+' : '') + d}`);
}

console.log(bar('assets'));
console.log(`  original ${o.assets.length}, replica ${m.assets.length}`);
const blurry = m.assets.filter((a) => {
  const [rw] = a.rendered.split('x').map(Number);
  const [nw] = a.natural.split('x').map(Number);
  return nw > 0 && rw > 0 && nw < rw;
});
blurry.forEach((a) => console.log(`  UPSCALED ${a.name}  natural ${a.natural} < rendered ${a.rendered}`));
if (!blurry.length) console.log('  no image rendered above its natural size');
