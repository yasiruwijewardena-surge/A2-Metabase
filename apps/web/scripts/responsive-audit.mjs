/*
 * Responsive audit. Per width, reports page-level horizontal scroll, then any
 * element wider than the viewport that is NOT inside a clipping ancestor --
 * those are the ones that actually break the layout, as opposed to a marquee
 * track that is meant to run past its frame. On phone widths it also flags
 * text under 12px and tap targets under 32px.
 *
 *   node scripts/responsive-audit.mjs <url>...        # the default widths
 *   W=980,390 node scripts/responsive-audit.mjs <url> # specific ones
 */
import puppeteer from 'puppeteer-core';
const WIDTHS = process.env.W ? process.env.W.split(',').map(Number) : [1440, 1280, 1024, 980, 834, 767, 430, 375];
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
for (const url of process.argv.slice(2)) {
  console.log('\n### ' + url.replace(/^https?:\/\/[^/]+/, ''));
  for (const w of WIDTHS) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, isMobile: w <= 767, hasTouch: w <= 767, deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,250)); });
    const r = await p.evaluate((w) => {
      const clipped = (e) => { for (let n = e.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n); if (/hidden|clip|auto|scroll/.test(o.overflowX)) return true; } return false; };
      const wide = [], small = [], taps = [];
      for (const e of document.querySelectorAll('body *')) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(e);
        if (cs.position === 'fixed') continue;
        if (r.width > w + 1 && !clipped(e)) wide.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(r.width)}w`);
        if (w <= 767) {
          const fs = parseFloat(cs.fontSize);
          const txt = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (txt && fs < 12) small.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${fs}px`);
          if ((e.tagName === 'A' || e.tagName === 'BUTTON') && txt && (r.height < 32 || r.width < 32)) taps.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return { scrollW: document.documentElement.scrollWidth, h: document.body.scrollHeight,
        wide: [...new Set(wide)].slice(0, 5), nw: new Set(wide).size,
        small: [...new Set(small)].slice(0, 3), ns: new Set(small).size,
        taps: [...new Set(taps)].slice(0, 3), nt: new Set(taps).size };
    }, w);
    const flags = [];
    if (r.scrollW > w + 1) flags.push(`H-SCROLL ${r.scrollW}`);
    if (r.nw) flags.push(`${r.nw} too wide`);
    if (r.ns) flags.push(`${r.ns} text <12px`);
    if (r.nt) flags.push(`${r.nt} small taps`);
    console.log(`  ${String(w).padStart(5)}  h=${String(r.h).padStart(6)}  ${flags.length ? '❌ ' + flags.join(' | ') : 'ok'}`);
    for (const x of [...r.wide, ...r.small, ...r.taps]) console.log('          ' + x);
    await p.close();
  }
}
await b.close();
