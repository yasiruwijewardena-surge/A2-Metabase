import puppeteer from 'puppeteer-core';
const [url, out, startY, count] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,500)); });
for (let i = 0; i < Number(count); i++) {
  const y = Number(startY) + i * 900;
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await new Promise(r => setTimeout(r, 350));
  await p.screenshot({ path: `${out}-${i}.png` });
}
await b.close();
