import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','WEB_PUBLISH');
const HOST='127.0.0.1';
const PORT=Number(process.env.PORT||8765);
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8','.srt':'text/plain; charset=utf-8','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method Not Allowed');return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url||'/',`http://${HOST}:${PORT}`).pathname);}catch{res.writeHead(400);res.end('Bad Request');return;}
  if(pathname==='/'||pathname.endsWith('/'))pathname+='/index.html';
  const target=path.resolve(ROOT,'.'+pathname);
  if(target!==ROOT&&!target.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  fs.stat(target,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Not Found');return;}
    const ext=path.extname(target).toLowerCase();
    res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'?'no-store':'public, max-age=300'});
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(target).pipe(res);
  });
});
server.listen(PORT,HOST,()=>console.log(`FIX51 preview: http://${HOST}:${PORT}/`));
server.on('error',error=>{console.error(`[FIX51 preview] ${error.message}`);process.exitCode=1;});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
