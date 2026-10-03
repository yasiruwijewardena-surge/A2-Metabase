/**
 * Prints a page's structure: sections, headings and the boxes that carry them.
 * Used to plan a replica before building it, so the shape is known up front
 * rather than discovered after the fact.
 *
 *   node scripts/page-outline.mjs <url> [--depth 3]
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2];
const ri = process.argv.indexOf('--root');
const ROOT = ri > -1 ? process.argv[ri + 1] : null;
const di = process.argv.indexOf('--depth');
const DEPTH = di > -1 ? Number(process.argv[di + 1]) : 3;
if (!url) { console.error('usage: page-outline.mjs <url> [--depth N]'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1512, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 600));

const out = await page.evaluate((DEPTH, ROOT) => {
  const root = (ROOT && document.querySelector(ROOT)) ?? document.querySelector('main') ?? document.body;
  const px = (v) => (/px$/.test(v) ? Math.round(parseFloat(v)) : v);
  const own = (e) => [...e.childNodes].filter((n) => n.nodeType === 3)
    .map((n) => n.textContent.trim()).join(' ').replace(/\s+/g, ' ').trim();
  const lines = [];
  const walk = (e, d) => {
    const s = getComputedStyle(e);
    if (s.display === 'none') return;
    const r = e.getBoundingClientRect();
    if (r.height < 1) return;
    const t = own(e);
    const tag = e.tagName.toLowerCase();
    const interesting = /^(h1|h2|h3|h4|section|article|header|ul|ol|table|form|img|svg|video)$/.test(tag) || t || d <= 1;
    if (interesting) {
      lines.push(`${'  '.repeat(d)}<${tag}> ${Math.round(r.width)}x${Math.round(r.height)}`
        + (t ? `  ${JSON.stringify(t.slice(0, 64))}` : '')
        + (/^h[1-4]$/.test(tag) ? `  [${px(s.fontSize)}/${px(s.lineHeight)} ${s.fontWeight}]` : ''));
    }
    if (d < DEPTH) [...e.children].forEach((c) => walk(c, d + 1));
  };
  walk(root, 0);
  return { title: document.title, height: Math.round(document.body.scrollHeight), lines: lines.join('\n') };
}, DEPTH, ROOT);

console.log(`${out.title}\npage height ${out.height}\n`);
console.log(out.lines);
await browser.close();
