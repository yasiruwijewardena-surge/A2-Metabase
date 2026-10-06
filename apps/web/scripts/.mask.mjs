import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => {
  const cs = getComputedStyle(e), r = e.getBoundingClientRect(), af = getComputedStyle(e, '::after');
  return `<${e.tagName.toLowerCase()}.${String(e.className).slice(0,44)}> ${Math.round(r.width)}x${Math.round(r.height)} mask=${cs.maskImage} overflow=${cs.overflow} radius=${cs.borderRadius}` + (af.content !== 'none' ? `\n   ::after ${af.width}x${af.height} bg=${af.backgroundImage.slice(0,90)} pos=${af.position} bottom=${af.bottom}` : '');
}).join('\n'), sel));
await b.close();
