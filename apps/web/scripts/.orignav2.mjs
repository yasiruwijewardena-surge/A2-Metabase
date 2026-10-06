import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('https://www.metabase.com/', { waitUntil: 'networkidle2', timeout: 120000 });
await new Promise(r => setTimeout(r, 1500));
await p.click('button[aria-label="Toggle navigation"]');
await new Promise(r => setTimeout(r, 1200));
console.log(await p.evaluate(() => {
  // the opened panel: the biggest newly-visible container under the header
  const panels = [...document.querySelectorAll('div,nav,ul')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.height > 200 && r.width > 300 && r.top >= 0 && r.top < 200;
  }).slice(0, 3);
  return panels.map((e) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return `<${e.tagName.toLowerCase()}.${String(e.className).slice(0,60)}> ${Math.round(r.width)}x${Math.round(r.height)} top=${Math.round(r.top)} pos=${cs.position} bg=${cs.backgroundColor} overflow=${cs.overflowY}`;
  }).join('\n');
}));
console.log('\n--- visible nav text:');
console.log(await p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 0 && r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  return [...document.querySelectorAll('header a, header button, nav a, nav button')].filter(vis)
    .map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName} "${e.textContent.trim().slice(0,30)}" ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.top)}`; }).join('\n');
}));
await p.screenshot({ path: process.argv[2] });
await b.close();
