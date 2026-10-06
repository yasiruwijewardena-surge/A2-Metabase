import puppeteer from 'puppeteer-core';
const [url, w, shot] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: Number(w), height: 844, isMobile: Number(w) <= 1023, hasTouch: true });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
const state = () => p.evaluate(() => {
  const pn = document.querySelector('[data-mobile-panel]');
  const r = pn.getBoundingClientRect();
  const vis = [...pn.querySelectorAll('a,button')].filter((e) => e.getBoundingClientRect().height > 0);
  return { display: getComputedStyle(pn).display, box: `${Math.round(r.width)}x${Math.round(r.height)}`,
    bodyLocked: document.body.hasAttribute('data-nav-open'),
    visible: vis.map((e) => e.textContent.trim().split('\n')[0].slice(0, 32)) };
});
console.log('closed:', JSON.stringify(await state()));
await p.click('[data-mobile-toggle]'); await new Promise(r => setTimeout(r, 350));
const open = await state();
console.log('open:  ', open.display, open.box, 'bodyLocked=' + open.bodyLocked, '\n  rows:', open.visible.join(' | '));
await p.screenshot({ path: shot });
// expand Features
await p.evaluate(() => { [...document.querySelectorAll('[data-msec]')].find((b) => b.textContent.includes('Features')).click(); });
await new Promise(r => setTimeout(r, 350));
const exp = await state();
console.log('Features open:', exp.visible.length, 'items ->', exp.visible.slice(0, 7).join(' | '));
await p.screenshot({ path: shot.replace('.png', '-expanded.png') });
console.log('errors:', errs);
await b.close();
