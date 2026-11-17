import fs from 'node:fs';
import path from 'node:path';
const base=(process.env.NAUKA_SMOKE_URL||'').trim().replace(/\/$/,'');
if(!base){console.error('[FAIL] Ustaw NAUKA_SMOKE_URL, np. https://twoja-domena.example');process.exit(2);}
const results=[];let failed=0;
async function check(name,url,validate,options={}){
  try{const response=await fetch(url,{redirect:'follow',cache:'no-store',...options,headers:{accept:'application/json,text/html,*/*',...(options.headers||{})}});const body=await response.text();const result=validate(response,body);const ok=result===true;results.push({name,ok,status:response.status,detail:ok?'OK':String(result)});console.log(`[${ok?'PASS':'FAIL'}] ${name} (HTTP ${response.status})${ok?'':`: ${result}`}`);if(!ok)failed++;return{response,body};}
  catch(error){results.push({name,ok:false,detail:String(error?.message||error)});console.log(`[FAIL] ${name}: ${error?.message||error}`);failed++;return null;}
}
const home=await check('strona główna',`${base}/`,(r,b)=>r.ok&&b.includes('NAUKA OD A DO Z')||'Nie znaleziono strony platformy.');
if(home){for(const asset of ['assets/platform-enhancements-fix231-239.css?v=6.8.0-fix239','assets/platform-enhancements-fix231-239.js?v=6.8.0-fix239'])await check(`zasób ${asset.split('?')[0]}`,new URL(`/${asset}`,base).toString(),r=>r.ok||'Brak zasobu po publikacji.');}
const sw=await check('Service Worker',`${base}/service-worker.js`,(r,b)=>r.ok&&b.includes('platform-enhancements-fix231-239.js')&&b.includes('CACHE_NAME')||'Service Worker nie zawiera modułów FIX231–FIX239.');
await check('API health i migracja 0023',`${base}/api/health`,(r,b)=>{let j={};try{j=JSON.parse(b)}catch{}return r.ok&&j.ok===true&&j.schemaReady===true&&j.productVersion==='6.8.0'||`D1/migracje niegotowe (schemaReady=${j.schemaReady}, brak=${j.missingMigrationCount??'?'})`;});
await check('pięciu dostawców OAuth',`${base}/api/auth/status`,(r,b)=>{let j={};try{j=JSON.parse(b)}catch{}const p=j.providers||{};return r.ok&&['google','microsoft','facebook','github','discord'].every(k=>k in p)&&!('x'in p)||'Niepoprawny zestaw dostawców OAuth.';});
await check('powiadomienia wymagają sesji',`${base}/api/notifications`,(r)=>r.status===401||'Endpoint powiadomień nie zwrócił 401 dla gościa.');
await check('portal opiekuna wymaga sesji',`${base}/api/guardians`,(r)=>r.status===401||'Endpoint opiekunów nie zwrócił 401 dla gościa.');
await check('zgłoszenia treści wymagają logowania',`${base}/api/content-reports`,(r)=>[401,404,405].includes(r.status)||'Endpoint zgłoszeń nie zachował ochrony dla gościa.');
const cookie=process.env.NAUKA_SMOKE_COOKIE||'';
if(cookie){const inbox=await check('skrzynka zalogowanego użytkownika',`${base}/api/notifications`,(r,b)=>r.ok&&b.includes('preferences')||`Nieudana skrzynka powiadomień (HTTP ${r.status}).`,{headers:{cookie}});if(inbox){let data={};try{data=JSON.parse(inbox.body)}catch{}if(data.notifications?.some(x=>/token|secret|password/i.test(JSON.stringify(x)))){failed++;results.push({name:'brak sekretów w powiadomieniach',ok:false,detail:'Wykryto podejrzane słowo w treści powiadomienia.'});}}
  await check('eksport danych użytkownika',`${base}/api/export`,(r,b)=>r.ok&&b.includes('exportSchema')||`Eksport użytkownika nie działa (HTTP ${r.status}).`,{headers:{cookie}});
}
const adminToken=process.env.NAUKA_SMOKE_ADMIN_TOKEN||'';
if(adminToken){const headers={authorization:`Bearer ${adminToken}`};await check('kolejka zgłoszeń jakości treści administratora',`${base}/api/admin/content-reports`,(r,b)=>r.ok&&b.includes('reports')||`Brak kolejki administratora (HTTP ${r.status}).`,{headers});await check('agregaty administratora',`${base}/api/admin/health`,(r,b)=>{let j={};try{j=JSON.parse(b)}catch{}return r.ok&&j.ok===true&&j.analytics?.personalDataReturned===false||`Panel zdrowia nie potwierdził schematu (HTTP ${r.status}).`;},{headers});}
const report={hotfix:'FIX239',productVersion:'6.8.0',baseUrl:base,checkedAt:new Date().toISOString(),authenticatedChecks:!!cookie,adminChecks:!!adminToken,passed:results.filter(x=>x.ok).length,failed,results};fs.mkdirSync('reports',{recursive:true});fs.writeFileSync(path.join('reports','FIX239_POST_DEPLOY_SMOKE.json'),JSON.stringify(report,null,2));console.log(`\nFIX239 POST-DEPLOY SMOKE: ${report.passed}/${results.length} PASS`);if(failed)process.exit(1);
