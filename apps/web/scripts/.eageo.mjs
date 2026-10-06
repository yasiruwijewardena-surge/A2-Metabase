import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:240000,args:['--no-sandbox']});
const probe=async(url,tag)=>{
  const p=await b.newPage(); await p.setViewport({width:1512,height:1000});
  await p.goto(url,{waitUntil:'networkidle2',timeout:90000});
  await p.evaluate(()=>new Promise(r=>setTimeout(r,1800)));
  const m=await p.evaluate(()=>{
    const out=[];
    const seen=new Set();
    for (const h of document.querySelectorAll('h1,h2,h3')) {
      const t=h.textContent.trim().replace(/\s+/g,' ').slice(0,42);
      if(!t||seen.has(t)) continue; seen.add(t);
      // the section that owns this heading
      const sec=h.closest('section,div[class*="container"],div[class*="panel"]');
      const r=sec?sec.getBoundingClientRect():h.getBoundingClientRect();
      const hr=h.getBoundingClientRect();
      const c=getComputedStyle(h);
      out.push({t, head:`${Math.round(hr.width)}x${Math.round(hr.height)}`,
                font:`${c.fontSize}/${c.lineHeight}/${c.fontWeight}`,
                sec:`${Math.round(r.width)}x${Math.round(r.height)}`});
    }
    return out;
  });
  await p.close(); return m;
};
const o=await probe('https://www.metabase.com/product/embedded-analytics','ORIG');
const n=await probe('http://127.0.0.1:4399/product/embedded-analytics','MINE');
const nm=new Map(n.map(x=>[x.t,x]));
let diff=0, missing=0;
for(const a of o){
  const b2=nm.get(a.t);
  if(!b2){ missing++; if(missing<=6) console.log(`  MISSING  ${a.t}`); continue; }
  if(a.font!==b2.font || a.sec!==b2.sec){
    diff++;
    if(diff<=14) console.log(`  ${a.t}\n      orig head=${a.head} font=${a.font} sec=${a.sec}\n      mine head=${b2.head} font=${b2.font} sec=${b2.sec}`);
  }
}
console.log(`\nheadings: orig ${o.length}, mine ${n.length} | missing ${missing} | differing ${diff}`);
await b.close();
