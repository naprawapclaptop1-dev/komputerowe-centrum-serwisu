'use strict';
const {spawn}=require('child_process');
const http=require('http');
const path=require('path');
const port=18765;
const child=spawn(process.execPath,[path.join(__dirname,'preview-static.js'),String(port)],{stdio:['ignore','pipe','pipe']});
let output='';
child.stdout.on('data',x=>output+=x.toString());
child.stderr.on('data',x=>output+=x.toString());
const request=(method,pathName,headers={})=>new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port,path:pathName,method,headers},res=>{const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});r.on('error',reject);r.end();});
(async()=>{
 try{
  const until=Date.now()+5000;while(!output.includes('LOCAL_PREVIEW_READY')&&Date.now()<until){if(child.exitCode!==null)throw new Error(output||'preview exited');await new Promise(r=>setTimeout(r,50));}
  if(!output.includes('LOCAL_PREVIEW_READY'))throw new Error('preview did not start: '+output);
  const home=await request('GET','/');if(home.status!==200||!home.body.toString('utf8').includes('MASTER SERVICE CENTER / FIX17'))throw new Error('homepage not served');
  const asset=await request('GET','/assets/master-academy-640-pro.js');if(asset.status!==200||!asset.body.toString('utf8').includes('NPA_MASTER_ACADEMY_640'))throw new Error('FIX15 JS asset not served');
  const fix16=await request('GET','/assets/master-academy-650-ultimate.js');if(fix16.status!==200||!fix16.body.toString('utf8').includes('NPA_MASTER_ACADEMY_650'))throw new Error('FIX16 JS asset not served');
  const fix16css=await request('GET','/assets/master-academy-650-ultimate.css');if(fix16css.status!==200||!fix16css.body.toString('utf8').includes('.n65-measure-grid'))throw new Error('FIX16 CSS asset not served');
  const fix17=await request('GET','/assets/master-academy-660-center.js');if(fix17.status!==200||!fix17.body.toString('utf8').includes('NPA_MASTER_CENTER_660'))throw new Error('FIX17 JS asset not served');
  const fix17css=await request('GET','/assets/master-academy-660-center.css');if(fix17css.status!==200||!fix17css.body.toString('utf8').includes('.n66-pane'))throw new Error('FIX17 CSS asset not served');
  const head=await request('HEAD','/index.html');if(head.status!==200||Number(head.headers['content-length'])<=0)throw new Error('HEAD not served');
  const api=await request('GET','/api/state');if(api.status!==503||!api.body.toString().includes('static-preview'))throw new Error('API not blocked/labelled');
  const post=await request('POST','/index.html');if(post.status!==405)throw new Error('POST must be rejected');
  const traversal=await request('GET','/%2e%2e%2fREADME_FIX15_ULTIMATE_SERVICE_ACADEMY.txt');if(![400,403,404].includes(traversal.status))throw new Error('path traversal not rejected: '+traversal.status);
  console.log('PASS: lokalny podgląd serwuje stronę oraz JS/CSS modułu FIX17.');
  console.log('PASS: HEAD i statyczne zasoby FIX17 działają.');
  console.log('PASS: /api jest jawnie odcięte, POST odrzucony, próba traversal blokowana.');
 }catch(e){console.error('FAIL:',e.message);process.exitCode=1;}
 finally{child.kill('SIGTERM');setTimeout(()=>{if(child.exitCode===null)child.kill('SIGKILL');},1000).unref();}
})();
