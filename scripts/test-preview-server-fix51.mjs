import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PORT=18765;
const server=spawn(process.execPath,[path.join(ROOT,'scripts/serve-fix51-preview.mjs')],{cwd:ROOT,env:{...process.env,PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',d=>output+=d.toString());server.stderr.on('data',d=>output+=d.toString());
const base=`http://127.0.0.1:${PORT}`;
async function get(url,options){return fetch(`${base}${url}`,options);}
try{
  let ready=false;
  for(let i=0;i<40;i++){
    try{const response=await get('/index.html');if(response.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready,`serwer podglądu nie wystartował: ${output}`);
  const html=await (await get('/index.html')).text();
  assert.ok(html.includes('visual-academy-fix51.js'));
  for(const [url,type] of [
    ['/assets/visual-assets-fix51.js','javascript'],
    ['/assets/visual-academy-fix51.js','javascript'],
    ['/assets/visual-academy-fix51.css','css'],
    ['/assets/artwork-fix51/02-power-vrm.svg','image/svg+xml'],
    ['/assets/visual-asset-manifest-fix51.json','application/json'],
    ['/media/laptop-board-inspection.jpg','image/jpeg']
  ]){
    const response=await get(url);assert.equal(response.status,200,`${url} HTTP ${response.status}`);
    if(type==='image/svg+xml')assert.match(response.headers.get('content-type')||'',/image\/svg\+xml/);
    if(type==='image/jpeg')assert.match(response.headers.get('content-type')||'',/image\/jpeg/);
    assert.ok((await response.arrayBuffer()).byteLength>100);
  }
  const head=await get('/assets/artwork-fix51/02-power-vrm.svg',{method:'HEAD'});assert.equal(head.status,200);
  const missing=await get('/does-not-exist.svg');assert.equal(missing.status,404);
  const traversal=await get('/%2e%2e/%2e%2e/etc/passwd');assert.ok([403,404].includes(traversal.status));
  console.log('PASS FIX51 preview HTTP: HTML, JS, CSS, SVG, JSON, JPG, HEAD, 404 and path-safety.');
}finally{
  server.kill('SIGTERM');
  await new Promise(resolve=>server.once('exit',resolve));
}
