/**
 * Is this section right? -- the companion to `page-census`, which answers
 * whether it is there at all.
 *
 * Point it at a heading both pages share. It takes the section that heading
 * belongs to on each side, walks both trees, pairs elements by ROLE rather
 * than by position, and prints every computed difference that would be visible.
 *
 *   npm run sdiff -- / "Deploy in minutes"
 *   npm run sdiff -- /pricing "First-class compliance" --width 1512
 *
 * Pairing by position is what made the first attempt at this useless: the two
 * trees nest differently, so a container on one side lines up against a card on
 * the other and every row reads as a difference. Here each element is reduced
 * to a role -- its tag, whether it carries its own text, its depth from the
 * section root and its index among siblings of the same tag -- and roles are
 * matched as a sequence, so an extra wrapper shifts nothing after it.
 */
import { launch } from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORIGINAL = 'https://www.metabase.com';
const REPLICA = process.env.PSI_SITE || 'https://elegant-spontaneity-production-28e1.up.railway.app';

const argv = process.argv.slice(2);
const page = argv.find((a) => a.startsWith('/')) || '/';
const needle = argv.find((a) => !a.startsWith('/') && !a.startsWith('--')) || '';
const width = Number(argv[argv.indexOf('--width') + 1]) || 1512;
const verbose = argv.includes('--all');

if (!needle) {
  console.error('usage: npm run sdiff -- <path> "<heading text>" [--width N] [--all]');
  process.exit(1);
}

/** Properties worth comparing: the ones that show. */
const PROPS = [
  'fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'fontFamily',
  'color', 'backgroundColor', 'textAlign', 'textTransform',
  'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'borderTopWidth', 'borderTopColor', 'borderRadius',
  'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap',
  'width', 'height', 'maxWidth', 'opacity', 'boxShadow',
];

function harvest(needle, PROPS) {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const squash = (s) => norm(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const want = squash(needle);

  const all = [...document.querySelectorAll('h1,h2,h3,h4,h5')];
  const heading = all.find((h) => squash(h.textContent).includes(want));
  if (!heading) return { error: 'heading not found' };

  /* The section is a BAND, not a subtree. The two trees nest differently, so
     walking up to a "section root" lands on a different element on each side
     and the whole comparison is then between different scopes. A band is the
     vertical strip from this heading to the next one, which is what a person
     means by the section and does not care how it is wrapped. */
  const top = heading.getBoundingClientRect().top + scrollY;
  const after = all
    .map((h) => h.getBoundingClientRect().top + scrollY)
    .filter((y) => y > top + 4)
    .sort((a, b) => a - b)[0];
  const bottom = after ?? top + 4000;

  const vis = (e) => {
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none';
  };

  const inBand = [...document.querySelectorAll('body *')].filter((e) => {
    if (!vis(e)) return false;
    if (e.closest('header[role="banner"], nav, footer, .site-footer')) return false;
    const r = e.getBoundingClientRect();
    const y = r.top + scrollY;
    /* Centre inside the band, and not a wrapper that swallows it whole. */
    return y >= top - 2 && y < bottom - 2 && r.height < (bottom - top) * 1.4;
  });

  const seen = new Map();
  const out = [];
  for (const el of inBand) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    const key = el.tagName + (own ? '@text' : '');
    const n = (seen.get(key) ?? 0); seen.set(key, n + 1);
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const style = {};
    for (const p of PROPS) {
      let v = c[p];
      /* Sub-pixel noise: 39.9996px and 40px are the same line. */
      if (/^-?\d+(\.\d+)?px$/.test(v)) v = Math.round(parseFloat(v)) + 'px';
      style[p] = v;
    }
    style.width = Math.round(r.width) + 'px';
    style.height = Math.round(r.height) + 'px';
    out.push({ role: `${key}.${n}`, tag: el.tagName.toLowerCase(), text: norm(own).slice(0, 48), style });
  }
  return {
    section: `band ${Math.round(top)}..${Math.round(bottom)}`,
    box: Math.round(heading.getBoundingClientRect().width) + 'w',
    nodes: out,
  };
}

async function read(browser, url) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 1000 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 700));
  const out = await p.evaluate(harvest, needle, PROPS);
  await p.close();
  return out;
}

/** Longest common subsequence on role, so an extra wrapper shifts nothing. */
function pair(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = a[i].role === b[j].role ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const pairs = [], onlyO = [], onlyM = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].role === b[j].role) pairs.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) onlyO.push(a[i++]);
    else onlyM.push(b[j++]);
  }
  while (i < n) onlyO.push(a[i++]);
  while (j < m) onlyM.push(b[j++]);
  return { pairs, onlyO, onlyM };
}

const browser = await launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const [o, m] = await Promise.all([read(browser, ORIGINAL + page), read(browser, REPLICA + page)]);
await browser.close();

if (o.error || m.error) {
  console.error(`original: ${o.error || 'ok'}   replica: ${m.error || 'ok'}`);
  process.exit(1);
}

console.log(`section "${needle}" on ${page} at ${width}px`);
console.log(`  original ${o.section} ${o.box}, ${o.nodes.length} elements`);
console.log(`  replica  ${m.section} ${m.box}, ${m.nodes.length} elements\n`);

const { pairs, onlyO, onlyM } = pair(o.nodes, m.nodes);
let diffs = 0;
for (const [a, b] of pairs) {
  const d = PROPS.filter((p) => a.style[p] !== b.style[p]);
  if (!d.length) continue;
  /* A box that differs only because its text does is noise, not a style bug. */
  const sameFamily = (x, y) => x.split(',')[0].trim() === y.split(',')[0].trim();
  const meaningful = verbose ? d : d.filter((p) =>
    !(p === 'fontFamily' && sameFamily(a.style[p], b.style[p])));
  if (!meaningful.length) continue;
  diffs++;
  console.log(`${a.tag}${a.text ? ` "${a.text}"` : ''}`);
  for (const p of meaningful) console.log(`    ${p.padEnd(16)} ${a.style[p]}   ->   ${b.style[p]}`);
}
if (onlyO.length) {
  console.log('\nonly on the original:');
  onlyO.slice(0, 12).forEach((x) => console.log(`  ${x.tag}${x.text ? ` "${x.text}"` : ''}`));
}
if (onlyM.length) {
  console.log('\nonly here:');
  onlyM.slice(0, 12).forEach((x) => console.log(`  ${x.tag}${x.text ? ` "${x.text}"` : ''}`));
}
console.log(`\n${diffs} element${diffs === 1 ? '' : 's'} differ, ${onlyO.length} missing, ${onlyM.length} extra`);
