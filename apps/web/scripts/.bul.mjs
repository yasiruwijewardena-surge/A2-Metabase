import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0,4).map((e) => {
  const bf = getComputedStyle(e, '::before'), cs = getComputedStyle(e);
  return `li pad=${cs.padding} listStyle=${cs.listStyleType} img=${cs.listStyleImage}\n  ::before content=${bf.content} w=${bf.width} h=${bf.height} bg=${bf.background.slice(0,120)} pos=${bf.position} left=${bf.left} top=${bf.top}\n  html=${e.innerHTML.slice(0,140)}`;
}).join('\n'), sel));
await b.close();
