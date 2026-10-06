import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,300)); });
const out = await p.evaluate((sel) => {
  const root = document.querySelector(sel);
  if (!root) return 'NOT FOUND ' + sel;
  const rows = [];
  const walk = (e, d) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (r.width || r.height) rows.push(`${'  '.repeat(d)}${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} ${cs.fontSize}/${cs.lineHeight} pad=${cs.padding} mar=${cs.margin} "${(e.childNodes[0]&&e.childNodes[0].nodeType===3?e.childNodes[0].textContent.trim():'').slice(0,34)}"`);
    for (const c of e.children) walk(c, d + 1);
  };
  walk(root, 0);
  return rows.join('\n');
}, sel);
console.log(out);
await b.close();
