import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => {
  const cs = getComputedStyle(e), r = e.getBoundingClientRect(), par = e.parentElement, pcs = getComputedStyle(par), pr = par.getBoundingClientRect();
  return `<${e.tagName.toLowerCase()}.${String(e.className).slice(0,40)}> ${Math.round(r.width)}x${Math.round(r.height)} top=${Math.round(r.top+scrollY)} pos=${cs.position} mar=${cs.margin} | parent ${Math.round(pr.width)}x${Math.round(pr.height)} top=${Math.round(pr.top+scrollY)} ${pcs.display}/${pcs.flexDirection} jc=${pcs.justifyContent} ai=${pcs.alignItems} overflow=${pcs.overflow}`;
}).join('\n'), sel));
await b.close();
