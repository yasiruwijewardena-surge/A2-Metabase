import puppeteer from 'puppeteer-core';
const url = process.argv[2];
const sel = process.argv[3];
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, protocolTimeout: 180000, args: ['--no-sandbox'],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
const out = await p.evaluate((sel) => {
  const keep = ['display','width','height','minWidth','maxWidth','flex','flexGrow','flexBasis','padding','margin','fontSize','lineHeight','fontWeight','textAlign','justifyContent','alignItems','borderRadius','gap','color','backgroundColor','border','whiteSpace','boxSizing'];
  return [...document.querySelectorAll(sel)].slice(0, 8).map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const o = { text: el.textContent.trim().slice(0, 40), box: `${Math.round(r.width)}x${Math.round(r.height)}`, cls: el.className };
    for (const k of keep) o[k] = cs[k];
    const par = el.parentElement, pcs = getComputedStyle(par), pr = par.getBoundingClientRect();
    o._parent = { tag: par.tagName, cls: par.className, box: `${Math.round(pr.width)}x${Math.round(pr.height)}`, display: pcs.display, flex: pcs.flex, gap: pcs.gap, justifyContent: pcs.justifyContent, padding: pcs.padding, width: pcs.width };
    const gp = par.parentElement, gcs = getComputedStyle(gp), gr = gp.getBoundingClientRect();
    o._gp = { tag: gp.tagName, cls: gp.className, box: `${Math.round(gr.width)}x${Math.round(gr.height)}`, display: gcs.display, gap: gcs.gap, justifyContent: gcs.justifyContent, gridTemplateColumns: gcs.gridTemplateColumns, borderBottom: gcs.borderBottom, padding: gcs.padding };
    return o;
  });
}, sel);
console.log(JSON.stringify(out, null, 1));
await b.close();
