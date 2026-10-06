import puppeteer from 'puppeteer-core';
const [url, sel, idx] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate(([sel, idx]) => {
  const root = document.querySelectorAll(sel)[Number(idx)];
  const out = [`ROOT ${root.tagName}.${root.className} doc=${document.body.scrollHeight}`];
  for (const c of root.children) { const cs = getComputedStyle(c), r = c.getBoundingClientRect();
    out.push(`${String(Math.round(r.top+window.scrollY)).padStart(6)} h=${String(Math.round(r.height)).padStart(5)} pad=${cs.paddingTop}/${cs.paddingBottom} mar=${cs.marginTop}/${cs.marginBottom} <${c.tagName.toLowerCase()}.${String(c.className).slice(0,34)}> "${c.textContent.trim().slice(0,34).replace(/\s+/g,' ')}"`); }
  return out.join('\n');
}, [sel, idx]));
await b.close();
