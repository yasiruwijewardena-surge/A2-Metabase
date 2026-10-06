import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
for (const url of process.argv.slice(2)) {
  console.log('\n' + url.replace(/^https?:\/\/[^/]+/, '') + ' ' + (url.includes('metabase.com') ? '(ORIGINAL)' : '(MINE)'));
  for (const w of [1440, 1200, 1024, 980, 900, 834, 767]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: 800, isMobile: w <= 767 });
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    const r = await p.evaluate(() => {
      const vis = (e) => { if (!e) return false; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0; };
      const burger = [...document.querySelectorAll('button,a,label')].find((e) => /menu|burger|hamburger|toggle/i.test(e.className + ' ' + (e.getAttribute('aria-label') || '')));
      const links = [...document.querySelectorAll('header nav a, header nav button, nav a, nav button')].filter(vis).length;
      return `burger=${burger ? (vis(burger) ? 'shown' : 'hidden') : 'none'} navItems=${links}`;
    });
    console.log(`  ${String(w).padStart(5)}  ${r}`);
    await p.close();
  }
}
await b.close();
