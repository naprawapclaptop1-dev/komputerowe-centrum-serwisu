import fs from 'node:fs';
import path from 'node:path';
const base=(process.env.NAUKA_SMOKE_URL||'').trim().replace(/\/$/,'');
if(!base){console.error('[FAIL] Ustaw NAUKA_SMOKE_URL, np. https://twoja-domena.example');process.exit(2);}
let failed=0;const results=[];
async function check(name,url,validate,options={}){
  try{
    const response=await fetch(url,{redirect:'follow',cache:'no-store',...options,headers:{accept:'application/json,text/html,*/*',...(options.headers||{})}});
    const body=await response.text();const result=validate(response,body);const ok=result===true;
    results.push({name,ok,status:response.status,detail:ok?'OK':String(result)});
    console.log(`[${ok?'PASS':'FAIL'}] ${name}${response.status?` (HTTP ${response.status})`:''}${ok?'':`: ${result}`}`);
    if(!ok)failed++;return {response,body};
  }catch(error){results.push({name,ok:false,detail:String(error?.message||error)});console.log(`[FAIL] ${name}: ${error?.message||error}`);failed++;return null;}
}
const home=await check('strona główna',base+'/',(r,b)=>r.ok&&b.includes('NAUKA OD A DO Z')||'Strona główna nie zwróciła oczekiwanej treści.');
if(home){const refs=[...home.body.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]).filter(x=>x.startsWith('/assets/')&&(/fix222|fix225|fix228|cloud-academy/.test(x))).slice(0,30);for(const ref of refs)await check(`zasób ${ref}`,new URL(ref,base).toString(),r=>r.ok||`Nie można pobrać zasobu ${ref}.`);}
await check('service-worker',base+'/service-worker.js',(r,b)=>r.ok&&b.includes('CACHE_NAME')||'Service worker nie jest dostępny.');
await check('API health i migracje D1',base+'/api/health',(r,b)=>{let x={};try{x=JSON.parse(b)}catch{}return r.ok&&x.ok===true&&x.productVersion==='6.8.0'&&x.schemaReady===true||`D1 lub migracje nie są gotowe (schemaReady=${x.schemaReady}, brakujące migracje=${x.missingMigrationCount??'?'})`;});
await check('status OAuth',base+'/api/auth/status',(r,b)=>{let x={};try{x=JSON.parse(b)}catch{}const providers=x.providers||{};const keys=['google','microsoft','facebook','github','discord'];return r.ok&&keys.every(k=>k in providers)&&!('x' in providers)||'Status OAuth nie zawiera oczekiwanego zestawu pięciu dostawców lub nadal wystawia X.';});
const cookie=process.env.NAUKA_SMOKE_COOKIE||'';
if(cookie)await check('uwierzytelniona sesja i profil',base+'/api/me',(r,b)=>r.ok&&b.includes('user')||`Sesja testowa nie działa (HTTP ${r.status}).`,{headers:{cookie}});
const adminToken=process.env.NAUKA_SMOKE_ADMIN_TOKEN||'';
if(adminToken){
  const headers={authorization:`Bearer ${adminToken}`,accept:'application/json'};
  await check('chroniony panel zdrowia i agregaty administratora',base+'/api/admin/health',(r,b)=>{let x={};try{x=JSON.parse(b)}catch{}return r.ok&&x.ok===true&&x.analytics?.personalDataReturned===false||`Panel administratora nie potwierdził schematu i agregatów (HTTP ${r.status}).`;},{headers});
  await check('chroniony bank pytań egzaminacyjnych',base+'/api/admin/exam-bank',(r,b)=>{let x={};try{x=JSON.parse(b)}catch{}return r.ok&&Array.isArray(x.questions)&&Number(x.builtInQuestionCount)>=50||`Bank egzaminów nie odpowiada (HTTP ${r.status}).`;},{headers});
}
const report={productVersion:'6.8.0',hotfix:'FIX220',baseUrl:base,checkedAt:new Date().toISOString(),authenticatedChecks:!!cookie,adminChecks:!!adminToken,passed:results.filter(x=>x.ok).length,failed,results};
fs.mkdirSync('reports',{recursive:true});fs.writeFileSync(path.join('reports','FIX220_POST_DEPLOY_SMOKE.json'),JSON.stringify(report,null,2));
console.log(`\nFIX220 POST-DEPLOY SMOKE: ${report.passed}/${results.length} PASS`);
if(failed)process.exit(1);
