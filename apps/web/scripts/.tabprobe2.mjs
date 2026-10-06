import puppeteer from 'puppeteer-core';
const [url] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
const out = await p.evaluate(() => {
  const roots = [...document.querySelectorAll('.tabs-with-timer')];
  return roots.map((root, idx) => {
    const btns = [...root.querySelectorAll('.tabs-with-timer__button')];
    const ul = root.querySelector('.tabs-with-timer__nav__list');
    const ucs = getComputedStyle(ul), ur = ul.getBoundingClientRect();
    const cont = root.querySelector('.tabs-with-timer__container');
    const ccs = cont && getComputedStyle(cont);
    const sec = root.closest('section') || root.parentElement;
    const scs = getComputedStyle(sec), sr = sec.getBoundingClientRect();
    return {
      idx, narrow: root.hasAttribute('data-tabs-narrow-buttons'),
      section: `${sec.tagName}.${sec.className} ${Math.round(sr.width)}x${Math.round(sr.height)} pad=${scs.padding} mar=${scs.margin} bg=${scs.backgroundColor} radius=${scs.borderRadius}`,
      ul: `${Math.round(ur.width)}x${Math.round(ur.height)} ${ucs.display} jc=${ucs.justifyContent} gap=${ucs.gap} listStyle=${ucs.listStyleType}`,
      container: ccs && `pad=${ccs.padding}`,
      tabs: btns.map((el) => {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        const li = el.parentElement, lcs = getComputedStyle(li), lr = li.getBoundingClientRect();
        return { label: el.textContent.trim() || el.getAttribute('data-slug'),
          box: `${Math.round(r.width)}x${Math.round(r.height)}`, w: cs.width, h: cs.height, minW: cs.minWidth,
          pad: cs.padding, fs: `${cs.fontSize}/${cs.lineHeight}/${cs.fontWeight}`, color: cs.color, ta: cs.textAlign,
          dur: el.style.getPropertyValue('--tabs-duration'),
          li: `${Math.round(lr.width)}x${Math.round(lr.height)} mar=${lcs.margin} w=${lcs.width}` };
      }) };
  });
});
console.log(JSON.stringify(out, null, 1));
await b.close();
