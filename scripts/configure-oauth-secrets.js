// Bezpieczny lokalny konfigurator sekretów OAuth dla Cloudflare Pages.
// Dane wpisuje się w przeglądarce localhost; nie trafiają do plików projektu ani argumentów procesu.
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PROJECT = 'naprawa-pc-akademia-serwisu-pro';
const ACCOUNT = '4ddfc3803a4f0c4457ccae083f18b975';
const WRANGLER = path.join(ROOT, 'TOOLS_CLOUDFLARE', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const HOST = '127.0.0.1';
const FIELDS = {
  google: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_CLIENT_ID','FACEBOOK_CLIENT_SECRET'],
  microsoft: ['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'],
  github: ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET'],
  discord: ['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET']
};
const EMAIL_FIELDS = ['RESEND_API_KEY','AUTH_EMAIL_FROM'];
const __testServers = new Map();
function safeEqual(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function redact(value,secrets=[]){let out=String(value||'');for(const secret of secrets)if(secret)out=out.split(secret).join('[UKRYTO]');return out;}
function validCredential(value){return typeof value==='string'&&value.length>=3&&value.length<=512&&!/[\u0000-\u0020\u007f]/.test(value);}
function validateCredentials(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Nieprawidłowe dane formularza.');
  const secrets={};
  for(const [provider,names] of Object.entries(FIELDS)){
    const id=String(input[`${provider}ClientId`]||'').trim();
    const secret=String(input[`${provider}ClientSecret`]||'').trim();
    if(!id&&!secret)continue;
    if(!validCredential(id)||!validCredential(secret))throw new Error(`${provider}: podaj jednocześnie prawidłowy Client ID i Client Secret (3–512 znaków, bez spacji i znaków sterujących).`);
    secrets[names[0]]=id;secrets[names[1]]=secret;
  }
  const resendKey=String(input.resendApiKey||'').trim();
  const emailFrom=String(input.authEmailFrom||'').trim();
  if(resendKey||emailFrom){
    if(!/^re_[A-Za-z0-9_-]{8,}$/i.test(resendKey))throw new Error('Resend: podaj prawidłowy klucz API zaczynający się od re_.');
    const senderMatch=emailFrom.match(/^(?:[^<>\r\n]{1,80}\s*)?<([^<>\s]+)>$/);
    const senderAddress=senderMatch?senderMatch[1]:emailFrom;
    if(!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(senderAddress)||/[\r\n]/.test(emailFrom)||emailFrom.length>160)throw new Error('Podaj prawidłowy AUTH_EMAIL_FROM, np. Akademia <noreply@twojadomena.pl>.');
    secrets.RESEND_API_KEY=resendKey;secrets.AUTH_EMAIL_FROM=emailFrom;
  }
  if(!Object.keys(secrets).length)throw new Error('Wpisz parę Client ID/Secret przynajmniej jednego dostawcy albo skonfiguruj Resend (API Key + adres nadawcy).');
  return secrets;
}
function runWrangler(args,input,secrets=[]){
  const result=spawnSync(process.execPath,[WRANGLER,...args],{cwd:ROOT,input,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:2*1024*1024,env:{...process.env,CLOUDFLARE_ACCOUNT_ID:ACCOUNT,WRANGLER_SEND_METRICS:'false'}});
  if(result.error)throw new Error('Nie udało się uruchomić lokalnego Wrangler.');
  const output=redact(`${result.stdout||''}\n${result.stderr||''}`,secrets);
  if(result.status!==0)throw new Error(`Wrangler zakończył się kodem ${result.status}. ${output.trim().slice(-1000)}`);
  return output;
}
function storeSecrets(values){
  const working={...values};let generatedTotpKey=false;let payload=null;
  try{
    const before=runWrangler(['pages','secret','list','--project-name',PROJECT,'--env','production']);
    if(!/\bAUTH_TOTP_ENCRYPTION_KEY\b/.test(before)){
      working.AUTH_TOTP_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');
      generatedTotpKey=true;
    }
    const entries=Object.entries(working);const secrets=entries.map(([,v])=>v);
    payload=Buffer.from(JSON.stringify(working),'utf8');
    runWrangler(['pages','secret','bulk','--project-name',PROJECT,'--env','production'],payload,secrets);
    const list=runWrangler(['pages','secret','list','--project-name',PROJECT,'--env','production'],undefined,secrets);
    const missing=entries.map(([name])=>name).filter(name=>!new RegExp('(?:\"name\"\\s*:\\s*\"'+name+'\"|\\b'+name+'\\b)','i').test(list));
    if(missing.length)throw new Error(`Cloudflare nie potwierdził zapisania: ${missing.join(', ')}.`);
    return {saved:entries.map(([name])=>name),generatedTotpKey};
  }finally{
    if(payload)payload.fill(0);payload=null;
    for(const key of Object.keys(values))values[key]='';
    for(const key of Object.keys(working))working[key]='';
  }
}
function buildHtml(token){
  const nonce=crypto.randomBytes(18).toString('base64');
  const providers=[['google','Google'],['facebook','Facebook'],['microsoft','Microsoft'],['github','GitHub'],['discord','Discord']];
  const rows=providers.map(([key,label])=>`<section class="provider"><h2>${label}</h2><label>Client ID<input name="${key}ClientId" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="512"></label><label>Client Secret<input name="${key}ClientSecret" type="password" autocomplete="new-password" maxlength="512"></label></section>`).join('');
  const emailSetup=`<section class="provider email-provider"><h2>Poczta / reset hasła</h2><p class="hint">Resend · potwierdzanie adresu i odzyskiwanie hasła. Wymaga zweryfikowanej domeny nadawcy.</p><label>Resend API Key<input name="resendApiKey" type="password" autocomplete="new-password" maxlength="512" placeholder="re_…"></label><label>Adres nadawcy<input name="authEmailFrom" type="text" autocomplete="off" maxlength="160" placeholder="Akademia &lt;noreply@twojadomena.pl&gt;"></label></section>`;
  const html=`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="setup-token" content="${token}"><meta name="robots" content="noindex,nofollow"><title>Konfiguracja logowania OAuth — Akademia</title><style>
:root{color-scheme:dark;font-family:Segoe UI,Arial,sans-serif;background:#061321;color:#eaf5ff}*{box-sizing:border-box}body{margin:0;padding:24px;background:radial-gradient(ellipse at 10% 0%,#123c5c,transparent 48%),#061321}.panel{width:min(100%,960px);margin:0 auto;border:1px solid #0879ad;border-radius:20px;background:linear-gradient(160deg,#0c2940,#071827 70%);box-shadow:0 24px 70px #0009;padding:28px}.brand{color:#6fdfff;font-size:11px;letter-spacing:.16em;font-weight:800}.panel h1{font-size:28px;margin:12px 0}.lead,.hint{color:#adc3d4;line-height:1.6;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-top:20px}.provider{padding:15px;border:1px solid #1b5878;border-radius:13px;background:#061a2b}.provider h2{margin:0 0 12px;font-size:16px;color:#75e7ff}.provider label{display:grid;gap:6px;margin-top:9px;font-size:11px;color:#a9c2d4}.provider input{width:100%;min-width:0;border:1px solid #17628a;border-radius:9px;background:#04111d;color:#fff;padding:11px;font:12px Consolas,monospace}.actions{display:flex;gap:10px;margin-top:18px}.save{border:0;border-radius:10px;padding:13px 18px;font-weight:800;color:white;background:linear-gradient(90deg,#078fba,#06a98d);cursor:pointer}.save:disabled{opacity:.55}.status{display:none;margin-top:14px;padding:12px;border-radius:10px;line-height:1.5;font-size:12px}.status.ok{display:block;color:#9af0c7;background:#06382f;border:1px solid #137b63}.status.err{display:block;color:#ffb2b2;background:#3b171b;border:1px solid #9f3535}.secure{border-top:1px solid #19435a;padding-top:14px;margin-top:20px;color:#91aabe;font-size:11px;line-height:1.6}.secure b{color:#7ce8bd}@media(max-width:520px){body{padding:10px}.panel{padding:18px}.panel h1{font-size:23px}.actions .save{width:100%}}
</style></head><body><main class="panel"><div class="brand">NAUKA OD A DO Z · FIX197</div><h1>Skonfiguruj logowanie społecznościowe</h1><p class="lead">Wklej Client ID oraz Client Secret z paneli dostawców. Możesz skonfigurować tylko wybranych dostawców — puste pary pozostaną bez zmian. Opcjonalnie ustaw Resend, aby uruchomić potwierdzanie e-mail i reset hasła. Sekrety zostaną przesłane wyłącznie do lokalnego konfiguratora i zapisane przez Wrangler w Cloudflare Pages Production. Przy pierwszym zapisie konfigurator automatycznie wygeneruje także AUTH_TOTP_ENCRYPTION_KEY (32 bajty), używany do szyfrowania sekretów aplikacji 2FA.</p><form id="form"><div class="grid">${rows}${emailSetup}</div><div class="actions"><button class="save" id="save" type="submit">Zapisz skonfigurowane metody w Cloudflare</button></div></form><div class="status" id="status" role="status" aria-live="polite"></div><p class="hint">Dla e-maila użyj zweryfikowanej domeny nadawcy w Resend. Callback OAuth do wpisania u każdego dostawcy: <code>https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback</code></p><div class="secure">🔒 <b>Bezpieczeństwo:</b> serwer nasłuchuje tylko na 127.0.0.1, formularz ma jednorazowy token, dane są usuwane z pól po wysłaniu, a wartości nie trafiają do logów, plików .env, wrangler.toml ani argumentów procesu. Nigdy nie wysyłaj Client Secret przez czat.</div></main><script nonce="${nonce}">
const token=document.querySelector('meta[name="setup-token"]').content,form=document.getElementById('form'),save=document.getElementById('save'),status=document.getElementById('status');function show(message,kind){status.className='status '+kind;status.textContent=message}form.addEventListener('submit',async e=>{e.preventDefault();const data={};for(const input of form.querySelectorAll('input'))data[input.name]=input.value;save.disabled=true;save.textContent='Zapisuję sekrety…';try{const response=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json','X-Akademia-Token':token},body:JSON.stringify(data)});const result=await response.json();for(const input of form.querySelectorAll('input'))input.value='';if(!response.ok||!result.ok)throw new Error(result.message||'Nie udało się zapisać sekretów.');form.style.display='none';show('Zapisano sekrety: '+result.saved.join(', ')+'.'+(result.generatedTotpKey?' Wygenerowano także klucz szyfrujący 2FA.':' Klucz szyfrujący 2FA był już skonfigurowany.')+' Nie wykonano jeszcze publikacji. Uruchom bezpieczny publikator Akademii.','ok')}catch(error){show(error.message||'Błąd zapisu.','err');save.disabled=false;save.textContent='Spróbuj ponownie'}});
</script></body></html>`;
  return {html,nonce};
}
function sendJson(res,status,data){const body=Buffer.from(JSON.stringify(data));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store, no-cache, must-revalidate','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(body);}
function openBrowser(url){if(process.env.AKADEMIA_OAUTH_SETUP_NO_BROWSER==='1'){console.log(`[TEST] Lokalny formularz: ${url}`);return;}if(process.platform!=='win32'){console.log(`Otwórz lokalny formularz: ${url}`);return;}const child=spawn('cmd.exe',['/d','/s','/c',`start "" "${url}"`],{stdio:'ignore',windowsHide:true,detached:true});child.on('error',()=>console.log(`Otwórz lokalny formularz: ${url}`));child.unref();}
function startLocalSetupPage({onSave=storeSecrets}={}){
  const token=crypto.randomBytes(32).toString('hex');const {html,nonce}=buildHtml(token);let finish;const finished=new Promise(resolve=>finish=resolve);
  const server=http.createServer((req,res)=>{
    const host=req.headers.host||'';if(!/^127\.0\.0\.1:\d+$/.test(host))return sendJson(res,403,{ok:false,message:'Dostęp lokalny odrzucony.'});
    if(req.method==='GET'&&req.url==='/'){const body=Buffer.from(html);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store, no-cache, must-revalidate','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`});return res.end(body);}
    if(req.method==='POST'&&req.url==='/save'){
      const origin=req.headers.origin;if(origin&&origin!==`http://${host}`)return sendJson(res,403,{ok:false,message:'Nieprawidłowe źródło żądania.'});if(!safeEqual(req.headers['x-akademia-token'],token))return sendJson(res,403,{ok:false,message:'Sesja formularza wygasła. Uruchom konfigurator ponownie.'});if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return sendJson(res,415,{ok:false,message:'Nieprawidłowy typ danych.'});
      let size=0;const chunks=[];req.on('data',chunk=>{size+=chunk.length;if(size>16384)req.destroy();else chunks.push(chunk);});req.on('end',()=>{if(size>16384)return sendJson(res,413,{ok:false,message:'Formularz jest zbyt duży.'});let values={};try{values=validateCredentials(JSON.parse(Buffer.concat(chunks).toString('utf8')));const result=onSave(values);if(result&&typeof result.then==='function'){result.then(data=>{for(const k of Object.keys(values))values[k]='';sendJson(res,200,{ok:true,saved:data.saved,generatedTotpKey:!!data.generatedTotpKey});setTimeout(()=>server.close(()=>finish({saved:true})),1200).unref();}).catch(error=>{for(const k of Object.keys(values))values[k]='';sendJson(res,500,{ok:false,message:redact(error.message,Object.values(values)).slice(0,800)});});}else{for(const k of Object.keys(values))values[k]='';sendJson(res,200,{ok:true,saved:result.saved,generatedTotpKey:!!result.generatedTotpKey});setTimeout(()=>server.close(()=>finish({saved:true})),1200).unref();}}catch(error){for(const k of Object.keys(values))values[k]='';sendJson(res,400,{ok:false,message:String(error.message||'Nie udało się zapisać sekretów.').slice(0,800)});}finally{for(const chunk of chunks)chunk.fill(0);}});return;
    }
    res.writeHead(404,{'Cache-Control':'no-store'});res.end();
  });
  server.on('error',error=>finish({error}));server.listen(0,HOST,()=>{const address=server.address();const url=`http://${HOST}:${address.port}/`;__testServers.set(address.port,{url,origin:`http://${HOST}:${address.port}`,server});const expiry=setTimeout(()=>server.close(()=>finish({timeout:true})),10*60*1000);expiry.unref();server.once('close',()=>{clearTimeout(expiry);__testServers.delete(address.port);});console.log('[OK] Uruchomiono lokalny konfigurator OAuth.');console.log('[INFO] Formularz działa wyłącznie na 127.0.0.1; CMD nie odczytuje pól.');openBrowser(url);});return finished;
}
function main(){if(!fs.existsSync(WRANGLER))throw new Error('Brak lokalnego Wrangler w TOOLS_CLOUDFLARE.');const identity=runWrangler(['whoami']);if(!identity.includes(ACCOUNT))throw new Error('Wrangler nie jest zalogowany na właściwe konto Cloudflare Akademii.');const projectList=runWrangler(['pages','project','list']);if(!projectList.includes(PROJECT))throw new Error('Nie znaleziono istniejącego projektu Pages Akademii na zalogowanym koncie. Nie tworzę nowego projektu.');console.log('======================================================');console.log('NAUKA OD A DO Z FIX19B — LOGOWANIE OAUTH + 2FA TOTP');console.log('Sekrety wpisujesz w lokalnym formularzu przeglądarki.');console.log('======================================================');return startLocalSetupPage();}
if(require.main===module){try{Promise.resolve(main()).catch(error=>{console.error('[BLAD]',redact(error.message));process.exitCode=1;});}catch(error){console.error('[BLAD]',redact(error.message));process.exitCode=1;}}
module.exports={FIELDS,EMAIL_FIELDS,validateCredentials,buildHtml,startLocalSetupPage,safeEqual};
