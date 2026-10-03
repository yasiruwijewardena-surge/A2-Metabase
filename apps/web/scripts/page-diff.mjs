/**
 * Structural diff of a replica page against the page it replicates.
 *
 * Walks the ORIGINAL's tree and looks for a counterpart in ours, so the output
 * can say "you are missing this element". A diff keyed only on shared text can
 * never do that: anything absent from the replica has nothing to match against
 * and disappears from the report instead of being flagged.
 *
 *   node scripts/page-diff.mjs <original-url> <replica-url> [--root <selector>]
 *
 * Matching is by a signature of tag + trimmed own-text + ordinal, which
 * survives the different class names the two builds use. Elements with no text
 * are matched by their position in the tree, so containers are compared too.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [origUrl, mineUrl] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const rootArg = process.argv.indexOf('--root');
const ROOT = rootArg > -1 ? process.argv[rootArg + 1] : 'main';
const VIEWPORT = { width: 1512, height: 900 };

if (!origUrl || !mineUrl) {
  console.error('usage: page-diff.mjs <original-url> <replica-url> [--root <selector>]');
  process.exit(1);
}

const extract = (rootSel) => {
  const root = document.querySelector(rootSel) || document.body;
  const rows = [];
  const ownText = (e) => [...e.childNodes]
    .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim())
    .join(' ').replace(/\s+/g, ' ').trim();
  const walk = (e, path, depth) => {
    if (depth > 6) return;
    const s = getComputedStyle(e);
    if (s.display === 'none') return;
    const r = e.getBoundingClientRect();
    const px = (v) => (/px$/.test(v) ? Math.round(parseFloat(v)) : v);
    rows.push({
      path, depth, tag: e.tagName.toLowerCase(), text: ownText(e).slice(0, 60),
      w: Math.round(r.width), h: Math.round(r.height),
      fs: px(s.fontSize), lh: px(s.lineHeight), fw: s.fontWeight, color: s.color,
      bg: s.backgroundColor, radius: px(s.borderRadius),
      border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].map(px).join(','),
      margin: [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].map(px).join(','),
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px).join(','),
      display: s.display, gap: px(s.gap), align: s.alignItems, justify: s.justifyContent,
      dir: s.flexDirection, cols: s.gridTemplateColumns.split(' ').length,
    });
    [...e.children].forEach((c, i) => walk(c, `${path}/${c.tagName.toLowerCase()}${i}`, depth + 1));
  };
  walk(root, '', 0);
  return rows;
};

const grab = async (browser, url) => {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Lazy content below the fold never lays out until it is scrolled to, and a
  // collapsed element reports zero — which has already produced two wrong
  // measurements in this project.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 800));
  const rows = await page.evaluate(extract, ROOT);
  await page.close();
  return rows;
};

/*
 * Text is the key when an element has any. The two builds reach the same
 * rendering through different wrappers, so keying on tag as well reports a
 * <span> against a <div> as a missing element when the content is plainly
 * there. Tag mismatches are still reported, just as differences rather than
 * omissions. Elements with no text fall back to tag + ordinal depth.
 */
const key = (r) => (r.text ? `t:${r.text}` : `x:${r.tag}|${r.depth}`);
const COMPARE = ['fs','lh','fw','color','bg','radius','border','margin','padding','display','gap','align','justify','dir','cols'];
const tagOf = (r) => r.tag;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const [orig, mine] = [await grab(browser, origUrl), await grab(browser, mineUrl)];
await browser.close();

// index the replica by signature, allowing repeats
const buckets = new Map();
for (const r of mine) {
  const k = key(r);
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(r);
}

const missing = [], differs = [];
for (const o of orig) {
  const k = key(o);
  const pool = buckets.get(k);
  if (!pool || !pool.length) {
    // Only report something substantial: a box with size, or text.
    if (o.text || o.w > 40) missing.push(o);
    continue;
  }
  const m = pool.shift();
  const bad = COMPARE.filter((p) => String(o[p]) !== String(m[p]));
  if (o.tag !== m.tag) bad.unshift('tag');
  const dw = Math.abs(o.w - m.w), dh = Math.abs(o.h - m.h);
  if (bad.length || dw > 8 || dh > 8) {
    differs.push({ o, m, bad, dw, dh });
  }
}

console.log(`original ${orig.length} nodes | replica ${mine.length} nodes\n`);

console.log(`MISSING FROM REPLICA (${missing.length})`);
for (const o of missing.slice(0, 40)) {
  console.log(`  ${'  '.repeat(o.depth)}<${o.tag}> ${o.w}x${o.h}  ${o.text ? JSON.stringify(o.text.slice(0, 48)) : '(no text)'}`);
}
if (missing.length > 40) console.log(`  ...and ${missing.length - 40} more`);

console.log(`\nPRESENT BUT DIFFERENT (${differs.length})`);
for (const d of differs.slice(0, 40)) {
  const label = d.o.text ? JSON.stringify(d.o.text.slice(0, 34)) : `<${d.o.tag}>`;
  const box = (d.dw > 8 || d.dh > 8) ? ` box ${d.o.w}x${d.o.h} -> ${d.m.w}x${d.m.h}` : '';
  const props = d.bad.map((p) => `${p} ${d.o[p]} -> ${d.m[p]}`).join('; ');
  console.log(`  ${label}${box}${props ? '  ' + props : ''}`);
}
if (differs.length > 40) console.log(`  ...and ${differs.length - 40} more`);
