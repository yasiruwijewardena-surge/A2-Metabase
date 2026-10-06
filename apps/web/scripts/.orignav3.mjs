import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('https://www.metabase.com/', { waitUntil: 'networkidle2', timeout: 120000 });
await new Promise(r => setTimeout(r, 1500));
await p.click('button[aria-label="Toggle navigation"]');
await new Promise(r => setTimeout(r, 900));
console.log('--- row geometry (closed):');
console.log(await p.evaluate(() => {
  const rows = [...document.querySelectorAll('*')].filter((e) => {
    const t = e.textContent.trim();
    return ['Product','Features','Docs','Resources','Pricing'].includes(t) && e.getBoundingClientRect().width > 200;
  });
  return rows.map((e) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return `${e.tagName}.${String(e.className).slice(0,34)} "${e.textContent.trim()}" ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.top)} fs=${cs.fontSize}/${cs.lineHeight} w=${cs.fontWeight} pad=${cs.padding} bd=${cs.borderBottom}`; }).join('\n');
}));
// expand Product
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => e.textContent.trim() === 'Product' && e.getBoundingClientRect().width > 200);
  (el.closest('button,a,[role=button]') || el).click();
});
await new Promise(r => setTimeout(r, 1000));
console.log('\n--- after expanding Product, visible links:');
console.log(await p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 0 && cs.display !== 'none'; };
  return [...document.querySelectorAll('header a')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return `"${e.textContent.trim().slice(0,38)}" ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.top)} fs=${cs.fontSize}`; }).join('\n');
}));
await p.screenshot({ path: process.argv[2] });
await b.close();
