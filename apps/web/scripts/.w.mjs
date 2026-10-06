import puppeteer from 'puppeteer-core';
const [url, sel, w] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: Number(w), height: 1000 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,300)); });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0,6).map((e) => {
  const cs = getComputedStyle(e), r = e.getBoundingClientRect();
  return `${Math.round(r.width)}x${Math.round(r.height)} left=${Math.round(r.left)} right=${Math.round(innerWidth - r.right)} maxw=${cs.maxWidth} mar=${cs.margin} pad=${cs.padding} <${e.tagName.toLowerCase()}.${String(e.className).slice(0,40)}>`;
}).join('\n'), sel));
await b.close();
