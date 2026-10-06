import puppeteer from 'puppeteer-core';
const [url] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,400)); });
console.log(await p.evaluate(() => [...document.querySelectorAll('main h1,main h2,main h3,main h4, .embedding-page h1,.embedding-page h2,.embedding-page h3,.embedding-page h4')].map((e) => `${String(Math.round(e.getBoundingClientRect().top+window.scrollY)).padStart(6)} ${e.tagName} ${e.textContent.trim().slice(0,58)}`).join('\n')));
await b.close();
