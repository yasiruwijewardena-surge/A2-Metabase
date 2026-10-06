import puppeteer from 'puppeteer-core';
const S='/private/tmp/claude-501/-Users-yasiruwijewardena-Desktop-work-L2-Assignments-Assignment-2/f67ffae0-727c-4518-bc06-6d860ad1c857/scratchpad';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.setViewport({width:1512,height:1200});
await p.goto('http://127.0.0.1:4399/events/tour-of-metabase-building-dashboards-with-or-without-ai',{waitUntil:'networkidle2'});
await p.evaluate(()=>new Promise(r=>setTimeout(r,1200)));
const read=()=>p.evaluate(()=>{
  const t=document.querySelector('[data-countdown]');
  const val=(u)=>document.querySelector(`[data-unit="${u}"]`)?.textContent;
  return {meta:document.querySelector('.ev-one-meta')?.textContent.trim().replace(/\s+/g,' '),
          timer:t?{d:val('days'),h:val('hours'),m:val('minutes'),s:val('seconds'),hidden:t.hidden}:null,
          guests:[...document.querySelectorAll('.ev-one-guest')].map(g=>g.querySelector('.ev-one-guest-name')?.textContent),
          buttons:[...document.querySelectorAll('.ev-one-guests ~ a, .ev-one-guests + div a')].map(a=>a.textContent.trim())};
});
const a=await read();
console.log('meta  :', a.meta);
console.log('timer :', JSON.stringify(a.timer));
console.log('guests:', JSON.stringify(a.guests));
await p.evaluate(()=>new Promise(r=>setTimeout(r,2500)));
const c=await read();
console.log('timer after 2.5s:', JSON.stringify(c.timer), ' ticking =', a.timer.s!==c.timer.s);
console.log('errors:', errs.length?errs[0].slice(0,90):'none');
await p.$('.ev-one-card').then(e=>e.screenshot({path:`${S}/event3.png`}));
await b.close();
