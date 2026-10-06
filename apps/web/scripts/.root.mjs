import puppeteer from 'puppeteer-core';
const [url] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
console.log(await p.evaluate(() => {
  // deepest element still taller than 60% of the document
  let best = document.body, cur = document.body;
  const walk = (e) => { for (const c of e.children) { const r = c.getBoundingClientRect();
    if (r.height > document.body.scrollHeight * 0.5 && c.children.length > 3) { best = c; walk(c); } } };
  walk(document.body);
  return `${best.tagName}.${best.className} children=${best.children.length}`;
}));
await b.close();
