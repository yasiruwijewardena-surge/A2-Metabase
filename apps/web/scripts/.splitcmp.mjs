import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:240000,args:['--no-sandbox']});
const probe=async(url,sel,tag)=>{
  const p=await b.newPage(); await p.setViewport({width:1512,height:1000});
  try{await p.goto(url,{waitUntil:'networkidle2',timeout:90000});}catch(e){console.log(tag,'nav fail');await p.close();return;}
  await p.evaluate(()=>new Promise(r=>setTimeout(r,1500)));
  const m=await p.evaluate((sel)=>{
    const sec=[...document.querySelectorAll(sel)].find(e=>/querying 5 minutes/i.test(e.textContent));
    if(!sec) return {err:'section not found'};
    const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {w:Math.round(b.width),h:Math.round(b.height)};};
    const cs=e=>e?getComputedStyle(e):null;
    const h2=sec.querySelector('h2,h3');
    const media=sec.querySelector('video,img,picture');
    const frame=media?.closest('div');
    const cap=[...sec.querySelectorAll('p')].find(p=>/Watch how quick/i.test(p.textContent));
    return {section:r(sec), heading:{...r(h2), font:`${cs(h2).fontSize}/${cs(h2).lineHeight}`},
            frame:{...r(frame), bg:cs(frame)?.backgroundColor, pad:cs(frame)?.padding, radius:cs(frame)?.borderRadius},
            media:r(media),
            caption: cap?{...r(cap), align:cs(cap).textAlign, order:(cap.firstElementChild?.tagName==='SVG'?'svg-first':'text-first')}:null};
  }, sel);
  console.log(tag, JSON.stringify(m,null,1));
  await p.close();
};
await probe('https://www.metabase.com/product/business-intelligence','.feature-container','ORIG');
await probe('http://127.0.0.1:4399/product/business-intelligence','.pp-split','MINE');
await b.close();
