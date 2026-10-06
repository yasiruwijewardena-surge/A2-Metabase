import puppeteer from 'puppeteer-core';
const [url] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
console.log(await p.evaluate(() => {
  const t = document.querySelector('[data-track]');
  return `track h=${Math.round(t.getBoundingClientRect().height)} pinned=${t.hasAttribute('data-pinned')}`;
}));
const top = await p.evaluate(() => document.querySelector('[data-track]').getBoundingClientRect().top + scrollY);
for (const d of [0, 400, 1200]) {
  await p.evaluate((y) => window.scrollTo(0, y), top + d);
  await new Promise(r => setTimeout(r, 200));
  console.log(d, await p.evaluate(() => `active=${[...document.querySelectorAll('.pp-feature-radio')].findIndex((r) => r.checked)}`));
}
await b.close();
