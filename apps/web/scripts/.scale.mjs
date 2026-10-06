/* Harvests the original's type and layout at each breakpoint, so the replica
   is built to its scale rather than to one desktop screenshot. */
import puppeteer from 'puppeteer-core';
const WIDTHS = [1440, 980, 767, 390];
const PAGES = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const rows = {};
for (const url of PAGES) {
  for (const w of WIDTHS) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, isMobile: w <= 767, hasTouch: w <= 767 });
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0,0); });
    const got = await p.evaluate(() => {
      const pick = {};
      const note = (k, e) => { if (!e || pick[k]) return; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        pick[k] = `${parseFloat(cs.fontSize)}/${Math.round(parseFloat(cs.lineHeight))} w=${Math.round(r.width)}`; };
      note('h1', document.querySelector('h1'));
      note('hero-sub', document.querySelector('h1') && document.querySelector('h1').parentElement.querySelector('p'));
      const h2 = [...document.querySelectorAll('h2')].find((e) => e.textContent.trim().length > 12);
      note('h2', h2);
      const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent.trim().length > 12);
      note('h3', h3);
      const body = [...document.querySelectorAll('p')].find((e) => e.textContent.trim().length > 90);
      note('body', body);
      const btn = document.querySelector('a.btn, .btn-primary, header a[class*=btn]');
      note('btn', btn);
      const cont = document.querySelector('.container');
      if (cont) { const cs = getComputedStyle(cont), r = cont.getBoundingClientRect();
        pick.container = `${Math.round(r.width)} pad=${cs.paddingLeft}`; }
      return pick;
    });
    rows[`${url.split('/').pop() || 'home'} @${w}`] = got;
    await p.close();
  }
}
for (const [k, v] of Object.entries(rows)) console.log(k.padEnd(28), JSON.stringify(v));
await b.close();
