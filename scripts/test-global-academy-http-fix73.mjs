import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','WEB_PUBLISH');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');const full=path.resolve(root,rel);if(!full.startsWith(path.resolve(root)+path.sep)&&full!==path.resolve(root)){res.writeHead(403);return res.end('forbidden');}if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);return res.end('not found');}const ext=path.extname(full).toLowerCase();res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':'no-store'});if(req.method==='HEAD')return res.end();fs.createReadStream(full).pipe(res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const paths=['/','/index.html','/assets/global-academy-expansion-fix73.js','/assets/global-academy-expansion-fix73.css','/assets/global-academy-expansion-manifest-fix73.json','/assets/global-academy-suite-fix60.js','/service-worker.js','/assets/artwork-fix54/30-keyboard-touchpad.svg','/media/laptop-board-inspection.jpg'];
try{for(const p of paths){const r=await fetch(base+p);assert.equal(r.status,200,`${p}: HTTP ${r.status}`);const expected=mime[path.extname(p).toLowerCase()];if(expected)assert.ok((r.headers.get('content-type')||'').startsWith(expected.split(';')[0]),`${p}: MIME mismatch`);const body=await r.arrayBuffer();assert.ok(body.byteLength>50,`${p}: empty response`);}const traversal=await fetch(base+'/%2e%2e/AUTO_PUBLISH_WATCHER.js');assert.ok([403,404].includes(traversal.status),`path traversal unexpectedly served: ${traversal.status}`);console.log(`[PASS] Local HTTP FIX64–FIX73: ${paths.length}/${paths.length} resources and path-safety.`);}finally{await new Promise(resolve=>server.close(resolve));}
