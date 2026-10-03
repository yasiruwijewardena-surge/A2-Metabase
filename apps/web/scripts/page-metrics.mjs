/*
 * Dumps every rendered element of a page as one ordered line:
 *   <y> <tag> <WxH> <font> <colour> <text>
 *
 * page-diff.mjs pairs containers positionally, which only works when both
 * trees nest the same way; when they don't, its container rows are noise.
 * This prints a flat, document-ordered list from each page instead, so two
 * runs can be diffed directly and read element by element.
 *
 *   node scripts/page-metrics.mjs <url> [--root <selector>] [--all]
 *
 * Without --all only text nodes, media and boxes with a visible background,
 * border or radius are listed, which is what actually has to match.
 */
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args[0];
const rootSel = args.includes('--root') ? args[args.indexOf('--root') + 1] : null;
const all = args.includes('--all');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1512, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

// Lazy content measures 0 until it has been in view at least once.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 70));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
});

const rows = await page.evaluate(({ rootSel, all }) => {
  const root = (rootSel && document.querySelector(rootSel)) || document.body;
  const out = [];
  for (const el of root.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (/^(script|style|noscript|head|meta|link|title|defs|clippath)$/.test(tag)) continue;
    // video.js injects a whole control-bar UI the replica has no counterpart for.
    if (el.closest('.vjs-control-bar, .vjs-menu, .vjs-modal-dialog, .vjs-text-track-display')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;

    // Own text only, so a wrapper is not labelled with its children's words.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3).map((n) => n.textContent)
      .join(' ').replace(/\s+/g, ' ').trim();

    const media = /^(img|video|svg|path|rect|circle|source)$/.test(tag);
    const painted =
      (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
      cs.borderTopWidth !== '0px' || cs.borderLeftWidth !== '0px' ||
      parseFloat(cs.borderTopLeftRadius) > 0;

    if (!all && !own && !media && !painted) continue;

    const px = (v) => Math.round(parseFloat(v) || 0);
    out.push([
      Math.round(r.top + window.scrollY),
      tag,
      `${Math.round(r.width)}x${Math.round(r.height)}`,
      `${px(cs.fontSize)}/${cs.lineHeight === 'normal' ? 'n' : px(cs.lineHeight)}/${cs.fontWeight}`,
      cs.color.replace(/rgba?\(|\)|\s/g, '').split(',').slice(0, 3).join('.'),
      `bg:${cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '-' : cs.backgroundColor.replace(/rgba?\(|\)|\s/g, '').split(',').slice(0, 3).join('.')}`,
      `r:${px(cs.borderTopLeftRadius)}`,
      `bd:${px(cs.borderTopWidth)}.${px(cs.borderRightWidth)}.${px(cs.borderBottomWidth)}.${px(cs.borderLeftWidth)}`,
      `m:${px(cs.marginTop)}.${px(cs.marginRight)}.${px(cs.marginBottom)}.${px(cs.marginLeft)}`,
      `p:${px(cs.paddingTop)}.${px(cs.paddingRight)}.${px(cs.paddingBottom)}.${px(cs.paddingLeft)}`,
      `${cs.display}${cs.display.includes('flex') ? `/${cs.flexDirection}/g${px(cs.gap)}/${cs.alignItems}/${cs.justifyContent}` : ''}`,
      own.slice(0, 60),
    ]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}, { rootSel, all });

for (const r of rows) {
  console.log(
    String(r[0]).padStart(5), r[1].padEnd(12), r[2].padEnd(11), r[3].padEnd(13),
    r[4].padEnd(13), r[5].padEnd(17), r[6].padEnd(5), r[7].padEnd(12),
    r[8].padEnd(16), r[9].padEnd(16), r[10].padEnd(34), r[11],
  );
}
console.error(`${rows.length} rows`);
await browser.close();
