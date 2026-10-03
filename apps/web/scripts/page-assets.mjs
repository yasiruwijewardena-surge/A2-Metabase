// List every img/video source on a page, with its rendered box, so the
// replica can pull the right assets instead of reusing one screenshot.
import puppeteer from 'puppeteer-core';
const url = process.argv[2];
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--no-sandbox'],
});
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
});
const out = await p.evaluate(() =>
  [...document.querySelectorAll('img,video,source')].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      src: el.currentSrc || el.src || el.getAttribute('srcset') || el.getAttribute('poster') || '',
      alt: el.getAttribute('alt') || '',
      w: Math.round(r.width), h: Math.round(r.height),
    };
  }).filter((x) => x.src));
console.log(JSON.stringify(out, null, 1));
await b.close();
