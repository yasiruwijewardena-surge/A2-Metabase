import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate((sel) => {
  return [...document.querySelectorAll(sel)].map((e) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    const top = Math.round(r.top + window.scrollY);
    return `${String(top).padStart(6)} h=${String(Math.round(r.height)).padStart(5)} pad=${cs.paddingTop}/${cs.paddingBottom} mar=${cs.marginTop}/${cs.marginBottom}  "${e.textContent.trim().slice(0,40).replace(/\s+/g,' ')}"`;
  }).join('\n');
}, sel));
await b.close();
