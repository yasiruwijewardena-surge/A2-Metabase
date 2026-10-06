import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate((sel) => {
  const root = document.querySelector(sel);
  const out = [`doc=${document.body.scrollHeight}  root=${Math.round(root.getBoundingClientRect().height)}`];
  let y = root.getBoundingClientRect().top + window.scrollY;
  for (const c of root.children) {
    const r = c.getBoundingClientRect();
    out.push(`  ${Math.round(r.height).toString().padStart(5)}  <${c.tagName.toLowerCase()} class="${String(c.className).slice(0,52)}"> "${c.textContent.trim().slice(0,38).replace(/\s+/g,' ')}"`);
  }
  return out.join('\n');
}, sel));
await b.close();
