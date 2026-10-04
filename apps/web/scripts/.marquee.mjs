import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
 if(u.startsWith('/uploads/')){http.get('http://127.0.0.1:1337'+u,up=>{r.writeHead(up.statusCode??500,up.headers);up.pipe(r);}).on('error',()=>{r.writeHead(502);r.end();});return;}
 let f=path.join('dist',u); if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':MIME[path.extname(f)]??'application/octet-stream'}); fs.createReadStream(f).pipe(r);});
await new Promise(r=>srv.listen(0,r));
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1512,height:1100});
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle2'});
await p.evaluate(()=>new Promise(r=>{document.querySelector('.ds')?.scrollIntoView({block:'center'});setTimeout(r,1200);}));
const pos = () => p.evaluate(()=>{const t=document.querySelector('.ds__row .ds__track');
  return {x:+new DOMMatrixReadOnly(getComputedStyle(t).transform).m41.toFixed(2), play:getComputedStyle(t).animationPlayState};});
const a = await pos();
await p.hover('.ds__item');
await p.evaluate(()=>new Promise(r=>setTimeout(r,900)));
const h = await pos();
const lift = await p.evaluate(()=>{const it=document.querySelector('.ds__item:hover')||document.querySelector('.ds__item');
  const row=document.querySelector('.ds__row'); const ir=it.getBoundingClientRect(), rr=row.getBoundingClientRect();
  return {itemTop:+ir.top.toFixed(1), rowTop:+rr.top.toFixed(1), clippedAbove:+(rr.top-ir.top).toFixed(1),
          transform:getComputedStyle(it).transform, rowOverflow:getComputedStyle(row).overflow};});
console.log('before hover:', JSON.stringify(a));
console.log('during hover:', JSON.stringify(h));
console.log('still moving :', a.x !== h.x ? 'YES' : 'NO (paused)');
console.log('hover lift   :', JSON.stringify(lift));
await b.close(); srv.close();
