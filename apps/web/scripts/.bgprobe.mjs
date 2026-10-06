import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => {
  const cs = getComputedStyle(e), r = e.getBoundingClientRect();
  const bef = getComputedStyle(e, '::before');
  return `<${e.tagName.toLowerCase()} class="${String(e.className).slice(0,52)}"> ${Math.round(r.width)}x${Math.round(r.height)} left=${Math.round(r.left)} bg=${cs.backgroundColor} r=${cs.borderRadius} bd=${cs.border} pad=${cs.padding} mar=${cs.margin}` + (bef.content !== 'none' ? ` ::before ${bef.width}x${bef.height} bg=${bef.backgroundColor} pos=${bef.position} left=${bef.left}` : '');
}).join('\n'), sel));
await b.close();
