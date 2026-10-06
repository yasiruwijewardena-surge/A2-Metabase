import puppeteer from 'puppeteer-core';
const [url, w] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: Number(w||1512), height: 900 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
console.log(await p.evaluate(() => {
  const t = document.querySelector('[data-track]'), c = document.querySelector('[data-carousel]');
  if (!t) return 'NO TRACK';
  const cs = getComputedStyle(t), ccs = c && getComputedStyle(c);
  return `track h=${Math.round(t.getBoundingClientRect().height)} pinned=${t.hasAttribute('data-pinned')} css-h=${cs.height} | carousel pos=${ccs && ccs.position} top=${ccs && ccs.top} minh=${ccs && ccs.minHeight}`;
}));
const top = await p.evaluate(() => document.querySelector('[data-track]').getBoundingClientRect().top + scrollY);
for (const frac of [0, 0.25, 0.5, 0.75, 0.98]) {
  await p.evaluate((y) => window.scrollTo(0, y), top + frac * 3000);
  await new Promise(r => setTimeout(r, 250));
  console.log(frac, await p.evaluate(() => {
    const rs = [...document.querySelectorAll('.pp-feature-radio')];
    const fills = [...document.querySelectorAll('.pp-feature-fill')].map((f) => getComputedStyle(f).height);
    const car = document.querySelector('[data-carousel]');
    return `active=${rs.findIndex((r) => r.checked)} fills=[${fills.join(',')}] carTop=${Math.round(car.getBoundingClientRect().top)}`;
  }));
}
console.log('ERRORS:', errs.slice(0, 5));
await b.close();
