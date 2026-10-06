import puppeteer from 'puppeteer-core';
const [url, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
const out = await p.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return 'NOT FOUND';
  const dump = (e, d = 0) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    const pad = '  '.repeat(d);
    let s = `${pad}<${e.tagName.toLowerCase()} class="${e.className}"> ${Math.round(r.width)}x${Math.round(r.height)} ${cs.display} fs=${cs.fontSize}/${cs.lineHeight} w=${cs.width} h=${cs.height} pad=${cs.padding} mar=${cs.margin} gap=${cs.gap} jc=${cs.justifyContent} ai=${cs.alignItems} bb=${cs.borderBottom} col=${cs.color} txt="${(e.childNodes[0] && e.childNodes[0].nodeType===3 ? e.childNodes[0].textContent.trim() : '').slice(0,30)}"\n`;
    for (const c of e.children) s += dump(c, d + 1);
    const after = getComputedStyle(e, '::after'), before = getComputedStyle(e, '::before');
    if (after.content !== 'none') s += `${pad}  ::after content=${after.content} w=${after.width} h=${after.height} bg=${after.backgroundColor} pos=${after.position} bottom=${after.bottom}\n`;
    if (before.content !== 'none') s += `${pad}  ::before content=${before.content} w=${before.width} h=${before.height} bg=${before.backgroundColor} pos=${before.position} bottom=${before.bottom}\n`;
    return s;
  };
  return dump(el);
}, sel);
console.log(out);
await b.close();
