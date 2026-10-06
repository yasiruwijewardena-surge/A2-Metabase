import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.setViewport({width:1512,height:900});
await p.goto('http://127.0.0.1:4399/product/business-intelligence',{waitUntil:'networkidle2'});
await p.evaluate(()=>new Promise(r=>setTimeout(r,600)));
const trackTop = await p.evaluate(()=>{const t=document.querySelector('[data-track]');return window.scrollY+t.getBoundingClientRect().top;});
const read=()=>p.evaluate(()=>{
  const root=document.querySelector('[data-carousel]');
  const rs=[...root.querySelectorAll('.pp-feature-radio')];
  const fills=[...root.querySelectorAll('.pp-feature-fill')].map(f=>getComputedStyle(f).height);
  const shown=[...root.querySelectorAll('.pp-accordion-shot')].findIndex(s=>getComputedStyle(s).display!=='none');
  const sticky=getComputedStyle(root).position;
  return {open:rs.findIndex(r=>r.checked), shot:shown, sticky, fill:fills[rs.findIndex(r=>r.checked)]};
});
for (const frac of [0, 0.1, 0.3, 0.5, 0.7, 0.95]) {
  await p.evaluate((y)=>window.scrollTo(0,y), trackTop + frac*3000);
  await p.evaluate(()=>new Promise(r=>setTimeout(r,160)));
  const s=await read();
  console.log(`  progress ${String(frac).padEnd(5)} -> open=${s.open} shot=${s.shot} fill=${String(s.fill).padEnd(9)} position=${s.sticky}`);
}
console.log('errors:', errs.length?errs[0].slice(0,80):'none');
await b.close();
