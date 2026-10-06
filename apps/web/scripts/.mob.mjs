import puppeteer from 'puppeteer-core';
const [url, out, w, startY, count] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: Number(w), height: 844, isMobile: Number(w) <= 767, hasTouch: Number(w) <= 767 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
for (let i = 0; i < Number(count); i++) {
  await p.evaluate((v) => window.scrollTo(0, v), Number(startY) + i * 844);
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: `${out}-${i}.png` });
}
await b.close();
