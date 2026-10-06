import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
for (const [url, sel] of [['https://www.metabase.com/product/embedded-analytics','summary'],['http://127.0.0.1:4399/product/embedded-analytics','summary']]) {
  const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
  console.log(url, '\n' + await p.evaluate((s) => [...document.querySelectorAll(s)].map((e,i)=>` ${i}: ${e.textContent.trim().slice(0,56)}`).join('\n'), sel));
  await p.close();
}
await b.close();
