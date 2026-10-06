import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate((sel) => {
  const out = [];
  const walk = (e, d, max) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    out.push(`${'  '.repeat(d)}<${e.tagName.toLowerCase()} class="${String(e.className).slice(0,46)}"> ${Math.round(r.width)}x${Math.round(r.height)} ${cs.display} pad=${cs.padding} mar=${cs.margin} gap=${cs.gap} "${e.textContent.trim().slice(0,26).replace(/\s+/g,' ')}"`);
    if (d < max) for (const c of e.children) walk(c, d + 1, max);
  };
  document.querySelectorAll(sel).forEach((e) => walk(e, 0, 2));
  return out.join('\n');
}, sel));
await b.close();
