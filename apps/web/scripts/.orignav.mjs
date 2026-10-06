import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('https://www.metabase.com/', { waitUntil: 'networkidle2', timeout: 120000 });
await new Promise(r => setTimeout(r, 1200));
// find the hamburger
const info = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('button,a,div,span')].filter((e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 20 || r.width > 70 || r.height < 20 || r.height > 70) return false;
    if (r.top > 100) return false;
    return /burger|menu|toggle|nav/i.test(e.className + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.id || ''));
  });
  return cands.map((e) => `${e.tagName}.${String(e.className).slice(0,50)} aria=${e.getAttribute('aria-label')} box=${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
});
console.log('candidates:', info);
await b.close();
