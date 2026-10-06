import puppeteer from 'puppeteer-core';
const [url] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
console.log(await p.evaluate(() => [...document.querySelectorAll('.landing-page__three-cards .card')].map((c) => {
  const t = c.querySelector('h4,h5,h3');
  const svg = c.querySelector('svg');
  return `### ${t ? t.textContent.trim() : '?'}\n${svg ? svg.outerHTML : 'NO SVG'}`;
}).join('\n\n')));
await b.close();
