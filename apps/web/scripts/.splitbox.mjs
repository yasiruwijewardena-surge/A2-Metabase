import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:240000,args:['--no-sandbox']});
const probe=async(url,sel,tag)=>{
  const p=await b.newPage(); await p.setViewport({width:1512,height:1000});
  await p.goto(url,{waitUntil:'networkidle2',timeout:90000});
  await p.evaluate(()=>new Promise(r=>setTimeout(r,1500)));
  const m=await p.evaluate((sel)=>{
    const sec=[...document.querySelectorAll(sel)].find(e=>/querying 5 minutes/i.test(e.textContent));
    const c=getComputedStyle(sec);
    const box=e=>{const b=e.getBoundingClientRect();return `${Math.round(b.width)}x${Math.round(b.height)}`;};
    const kids=[...sec.children].map(k=>`${k.tagName.toLowerCase()}.${(k.className||'').toString().split(' ')[0]} ${box(k)} gap-parent`);
    const cap=[...sec.querySelectorAll('p')].find(p=>/Watch how quick/i.test(p.textContent));
    const cc=cap?getComputedStyle(cap):null;
    return {sec:box(sec), margin:c.margin, padding:c.padding, gap:c.gap, display:c.display, align:c.alignItems,
            children:kids,
            caption: cc?{margin:cc.margin, textAlign:cc.textAlign, display:cc.display, width:cc.width}:null};
  }, sel);
  console.log(tag, JSON.stringify(m,null,1));
  await p.close();
};
await probe('https://www.metabase.com/product/business-intelligence','.feature-container','ORIG');
await probe('http://127.0.0.1:4399/product/business-intelligence','.pp-split','MINE');
await b.close();
