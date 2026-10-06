import puppeteer from 'puppeteer-core';
const [url, mode] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 180000, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1512, height: 900 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0,0); await new Promise(r=>setTimeout(r,300)); });
const out = await p.evaluate((mode) => {
  const find = (txt, tag) => [...document.querySelectorAll(tag || '*')].find((e) => e.textContent.trim().startsWith(txt) && !([...e.children].some(c => c.textContent.trim().startsWith(txt))));
  const d = (e, label) => {
    if (!e) return `${label}: NOT FOUND`;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return `${label}: <${e.tagName.toLowerCase()} class="${String(e.className).slice(0,60)}"> ${Math.round(r.width)}x${Math.round(r.height)} ${cs.display} fs=${cs.fontSize}/${cs.lineHeight}/${cs.fontWeight} col=${cs.color} pad=${cs.padding} mar=${cs.margin} gap=${cs.gap} ai=${cs.alignItems}`;
  };
  const lines = [];
  // implementation card internals
  const card = find('Low-code');
  const li = card && card.closest('div,article,section');
  lines.push(d(card, 'badge'));
  const ul = document.querySelector(mode === 'orig' ? '.embedding-page ul' : '.ea-impl-points');
  // walk up from the badge to the card
  let c = card; let up = [];
  for (let i = 0; i < 5 && c; i++) { c = c.parentElement; up.push(d(c, `  up${i}`)); }
  lines.push(...up);
  // the bullet list
  const lists = [...document.querySelectorAll('ul')].filter((u) => u.children.length >= 4 && /Build custom analytics|Set up in minutes|Compose from React/.test(u.textContent));
  lists.forEach((u, i) => { lines.push(d(u, `list${i}`)); const k = u.children[0]; lines.push(d(k, `  li0`));
    const bm = getComputedStyle(k, '::before'); lines.push(`  li0::before content=${bm.content} w=${bm.width} h=${bm.height} bg=${bm.backgroundColor} top=${bm.top} left=${bm.left} pos=${bm.position} radius=${bm.borderRadius}`);
    const cs2 = getComputedStyle(k); lines.push(`  li0 listStyle=${cs2.listStyleType} listPos=${cs2.listStylePosition}`);
  });
  // customize labels
  const cust = find('Customize labels');
  lines.push(d(cust, 'customize'));
  if (cust) { lines.push(d(cust.parentElement, '  custParent')); lines.push(d(cust.parentElement && cust.parentElement.parentElement, '  custGP')); }
  // open source
  const os = find('Open source');
  lines.push(d(os, 'opensource'));
  if (os) lines.push(d(os.parentElement, '  osParent'));
  // FAQ
  const sums = [...document.querySelectorAll('summary, .faq__question, [class*=faq] button')].slice(0, 3);
  sums.forEach((s2, i) => lines.push(d(s2, `summary${i} "${s2.textContent.trim().slice(0,30)}"`)));
  return lines.join('\n');
}, mode);
console.log(out);
await b.close();
