import puppeteer from 'puppeteer-core';
const S='/private/tmp/claude-501/-Users-yasiruwijewardena-Desktop-work-L2-Assignments-Assignment-2/f67ffae0-727c-4518-bc06-6d860ad1c857/scratchpad';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:240000,args:['--no-sandbox']});
const probe = async (url, sel, tag) => {
  const p=await b.newPage(); await p.setViewport({width:1512,height:1000});
  try{ await p.goto(url,{waitUntil:'networkidle2',timeout:90000}); }catch(e){ console.log(tag,'nav fail',e.message); await p.close(); return; }
  await p.evaluate(()=>new Promise(r=>setTimeout(r,1500)));
  const m=await p.evaluate((sel)=>{
    const pill=document.querySelector(sel); if(!pill) return {err:'no pill'};
    const cs=getComputedStyle(pill);
    const kid=(s)=>pill.querySelector(s);
    const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();const p=pill.getBoundingClientRect();
      return {x:Math.round(b.left-p.left),y:Math.round(b.top-p.top),w:Math.round(b.width),h:Math.round(b.height),
              overBottom:Math.round(b.bottom-p.bottom)};};
    const img=[...pill.querySelectorAll('img')];
    return {pillW:Math.round(pill.getBoundingClientRect().width),pillH:Math.round(pill.getBoundingClientRect().height),
            overflow:cs.overflow, justify:cs.justifyContent, minH:cs.minHeight,
            label:r(pill.querySelector('[class*=label]')),
            thumb:r(img[0]), avatar:r(img[1]),
            thumbNat: img[0]?`${img[0].naturalWidth}x${img[0].naturalHeight}`:null,
            avatarNat: img[1]?`${img[1].naturalWidth}x${img[1].naturalHeight}`:null};
  }, sel);
  console.log(tag, JSON.stringify(m));
  const el=await p.$(sel); if(el) await el.screenshot({path:`${S}/cmp-${tag}.png`});
  await p.close();
};
await probe('https://www.metabase.com/','.up-and-running-tour','orig');
await probe('http://127.0.0.1:4399/','.hero-tour','mine');
await b.close();
