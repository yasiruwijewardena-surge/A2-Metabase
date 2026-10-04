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
const [route, sel, out, hover] = process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,protocolTimeout:180000,args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1512,height:1100});
await p.goto(`http://127.0.0.1:${srv.address().port}${route}`,{waitUntil:'networkidle2'});
await p.evaluate(()=>new Promise(r=>setTimeout(r,900)));
if (hover) { await p.hover(hover); await p.evaluate(()=>new Promise(r=>setTimeout(r,600))); }
const el = await p.$(sel);
await el.screenshot({path:out});
await b.close(); srv.close(); console.log('->', out);
