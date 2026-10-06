import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
const reqFail=[]; p.on('requestfailed',r=>reqFail.push(r.url().slice(-60)));
await p.setViewport({width:1512,height:1000});
await p.goto(process.argv[2],{waitUntil:'networkidle2',timeout:90000});
await p.evaluate(()=>new Promise(r=>{document.querySelector('[data-carousel]')?.scrollIntoView({block:'center'});setTimeout(r,1200);}));
const st=()=>p.evaluate(()=>{
  const root=document.querySelector('[data-carousel]');
  if(!root) return {err:'no [data-carousel] on page'};
  const rs=[...root.querySelectorAll('.pp-feature-radio')];
  const fill=root.querySelector('.pp-feature:has(.pp-feature-radio:checked) .pp-feature-fill');
  return {open:rs.findIndex(r=>r.checked), radios:rs.length,
          fillW:fill?getComputedStyle(fill).height:null,
          anim:fill?getComputedStyle(fill).animationName:null,
          shots:[...root.querySelectorAll('.pp-accordion-shot')].length,
          paused:root.dataset.paused};
});
console.log('t=0  ',JSON.stringify(await st()));
await p.evaluate(()=>new Promise(r=>setTimeout(r,8000)));
console.log('t=8  ',JSON.stringify(await st()));
console.log('errors:',errs.length?errs.slice(0,2):'none');
console.log('failed requests:',reqFail.length?reqFail.slice(0,3):'none');
await b.close();
