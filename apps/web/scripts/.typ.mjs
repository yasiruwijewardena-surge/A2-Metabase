import puppeteer from 'puppeteer-core';
const [url, w] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: Number(w), height: 844, isMobile: true, hasTouch: true });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
console.log(await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3')].slice(0, 6).map((e) => {
  const cs = getComputedStyle(e), r = e.getBoundingClientRect();
  return `${e.tagName} ${cs.fontSize}/${cs.lineHeight} ${Math.round(r.width)}x${Math.round(r.height)} "${e.textContent.trim().slice(0, 36)}"`;
}).join('\n')));
await b.close();
