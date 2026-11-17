'use strict';
// Read-only static preview. Binds only to loopback; no Cloudflare, D1 or API writes.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..', 'WEB_PUBLISH');
const HOST = '127.0.0.1';
const PORT = Math.max(1024, Math.min(65535, Number(process.argv[2]) || 8765));
const MIME = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.gif':'image/gif','.ico':'image/x-icon','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8',
  '.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2'
};
const send=(res,status,body,headers={})=>{res.writeHead(status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(body);};
const server=http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method Not Allowed',{'Allow':'GET, HEAD'});
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,`http://${HOST}:${PORT}`).pathname);}catch(_){return send(res,400,'Bad Request');}
  if(pathname.startsWith('/api/'))return send(res,503,JSON.stringify({ok:false,mode:'static-preview',message:'API Pages Functions nie są uruchamiane w podglądzie statycznym. Dane produkcyjne nie są dostępne.'}),{'Content-Type':'application/json; charset=utf-8'});
  if(pathname.includes('\\')||pathname.includes('\0'))return send(res,400,'Bad Request');
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const target=path.resolve(ROOT,relative);
  if(target!==ROOT&&!target.startsWith(ROOT+path.sep))return send(res,403,'Forbidden');
  let stat;try{stat=fs.statSync(target);}catch(_){return send(res,404,'Not Found');}
  if(!stat.isFile())return send(res,404,'Not Found');
  const ext=path.extname(target).toLowerCase(),headers={'Content-Type':MIME[ext]||'application/octet-stream','Accept-Ranges':'bytes','Content-Length':stat.size};
  if(req.method==='HEAD')return send(res,200,'',headers);
  const range=req.headers.range;
  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match)return send(res,416,'Range Not Satisfiable',{'Content-Range':`bytes */${stat.size}`});
    let start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]||0));
    let end=match[2]&&match[1]?Number(match[2]):stat.size-1;
    if(!match[1]&&match[2])end=stat.size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||start>=stat.size)return send(res,416,'Range Not Satisfiable',{'Content-Range':`bytes */${stat.size}`});
    end=Math.min(end,stat.size-1);
    headers['Content-Length']=end-start+1;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    res.writeHead(206,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});
    return fs.createReadStream(target,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }
  res.writeHead(200,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});
  fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
});
server.on('error',err=>{process.stderr.write(`[PREVIEW_ERROR] ${err.message}\n`);process.exitCode=1;});
server.listen(PORT,HOST,()=>{
  const url=`http://${HOST}:${PORT}/`;
  process.stdout.write(`[LOCAL_PREVIEW_READY] ${url}\n`);
  process.stdout.write('Tryb statyczny tylko do podglądu: API Pages Functions, logowanie i integracje serwerowe są wyłączone. Ctrl+C kończy.\n');
  if(process.platform==='win32'&&process.argv.includes('--open')){
    const opener=spawn('cmd.exe',['/d','/s','/c','start "" '+url],{stdio:'ignore',detached:true,windowsHide:true});opener.unref();
  }
});
function close(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
process.on('SIGINT',close);process.on('SIGTERM',close);
