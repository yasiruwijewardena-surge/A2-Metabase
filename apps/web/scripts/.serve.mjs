import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain'};
http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
 if(u.startsWith('/uploads/')){http.get('http://127.0.0.1:1337'+u,up=>{r.writeHead(up.statusCode??500,up.headers);up.pipe(r);}).on('error',()=>{r.writeHead(502);r.end();});return;}
 let f=path.join('dist',u); if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){r.writeHead(404);return r.end('nope');}
 r.writeHead(200,{'content-type':MIME[path.extname(f)]??'application/octet-stream'}); fs.createReadStream(f).pipe(r);
}).listen(4399,()=>console.log('serving dist on 4399 (uploads proxied to strapi)'));
