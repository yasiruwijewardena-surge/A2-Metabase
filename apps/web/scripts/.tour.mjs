import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{
  const u=decodeURIComponent(q.url.split('?')[0]);
  // Uploads live in Strapi, not in dist; proxy them so screenshots are honest.
  if(u.startsWith('/uploads/')){
    http.get('http://127.0.0.1:1337'+u,(up)=>{r.writeHead(up.statusCode??500,up.headers);up.pipe(r);})
        .on('error',()=>{r.writeHead(502);r.end();});
    return;
  }
  let f=path.join('dist',u);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){r.writeHead(404);return r.end();}
  r.writeHead(200,{'content-type':MIME[path.extname(f)]??'application/octet-stream'});
  fs.createReadStream(f).pipe(r);
});
await new Promise(r=>srv.listen(0,r));
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1512,height:1100});
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle2'});
await p.evaluate(()=>new Promise(r=>setTimeout(r,600)));
const m=await p.evaluate(()=>{
  const q=s=>document.querySelector(s); const g=e=>e?getComputedStyle(e):null;
  const box=e=>{const r=e.getBoundingClientRect();return {w:+r.width.toFixed(1),h:+r.height.toFixed(1),top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1)};};
  const pill=q('.hero-tour'), media=q('.hero-tour__media'), th=q('.hero-tour__thumb'), av=q('.hero-tour__avatar'), lab=q('.hero-tour__label'), pl=q('.hero-tour__play svg path');
  const cp=g(pill), cm=g(media), ct=g(th), ca=g(av), cl=g(lab);
  return {
    pill:{...box(pill), overflow:cp.overflow, position:cp.position, minHeight:cp.minHeight, justify:cp.justifyContent, border:cp.borderColor, radius:cp.borderRadius},
    play:{fill:g(pl).fill},
    label:{font:`${cl.fontSize}/${cl.lineHeight}/${cl.fontWeight}`, color:cl.color, z:cl.zIndex, pos:cl.position,
           strong:(()=>{const st=q('.hero-tour__label strong');const c=g(st);return st?`${c.fontWeight} ${c.color}`:null;})()},
    media:{...box(media), position:cm.position, pointer:cm.pointerEvents, right:cm.right, top:cm.top, bottom:cm.bottom},
    thumb:{...box(th), position:ct.position, top:ct.top, right:ct.right, radius:ct.borderRadius},
    avatar:{...box(av), position:ca.position, top:ca.top, right:ca.right, radius:ca.borderRadius, border:ca.borderWidth+' '+ca.borderColor, shadow:ca.boxShadow.slice(0,60), transition:ca.transitionProperty},
    clipped:{thumbBelow:+(th.getBoundingClientRect().bottom - pill.getBoundingClientRect().bottom).toFixed(1),
             avatarBelow:+(av.getBoundingClientRect().bottom - pill.getBoundingClientRect().bottom).toFixed(1)},
  };
});
console.log(JSON.stringify(m,null,1));
await p.hover('.hero-tour');
await p.evaluate(()=>new Promise(r=>setTimeout(r,500)));
const h=await p.evaluate(()=>{const pill=document.querySelector('.hero-tour');const av=document.querySelector('.hero-tour__avatar');
  return {pillBg:getComputedStyle(pill).backgroundColor, pillBorder:getComputedStyle(pill).borderColor, avatarRotate:getComputedStyle(av).rotate, avatarTransform:getComputedStyle(av).transform};});
console.log('HOVER', JSON.stringify(h));
await b.close(); srv.close();
