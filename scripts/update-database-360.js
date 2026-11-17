'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');
const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const WRANGLER=path.join(ROOT,'TOOLS_CLOUDFLARE','node_modules','wrangler','bin','wrangler.js');
const CONFIG=path.join(ROOT,'wrangler.jsonc');
const CONFIG_TOML=path.join(ROOT,'wrangler.toml');
const DB_NAME='naprawa-pc-akademia-db';
const PROJECT='naprawa-pc-akademia-serwisu-pro';
const ACCOUNT='4ddfc3803a4f0c4457ccae083f18b975';
function ask(q){const rl=readline.createInterface({input:process.stdin,output:process.stdout});return new Promise(resolve=>rl.question(q,a=>{rl.close();resolve(a.trim())}));}
function readConfig(){
  if(!fs.existsSync(CONFIG))throw new Error(fs.existsSync(CONFIG_TOML)?'Znaleziono wrangler.toml. Uruchom URUCHOM_AKADEMIE.cmd z poprawki 3.8.1, która obsługuje TOML. Nie tworzę nowej konfiguracji ani bazy.':'Nie znaleziono pliku konfiguracji Wrangler. Przywróć konfigurację istniejącego Pages; nie uruchamiaj kreatora tworzącego nową bazę.');
  const raw=fs.readFileSync(CONFIG,'utf8');
  let cfg;try{cfg=JSON.parse(raw)}catch{throw new Error('wrangler.jsonc nie jest czystym JSON wygenerowanym przez konfigurator Akademii. Nie modyfikuję pliku. Sprawdź konfigurację ręcznie.');}
  if(cfg.name!==PROJECT)throw new Error(`Konfiguracja wskazuje inny projekt (${cfg.name||'brak'}). Przerwano bez zmian.`);
  const db=(cfg.d1_databases||[]).find(x=>x.binding==='DB'&&x.database_name===DB_NAME&&x.database_id);
  if(!db)throw new Error(`Nie znaleziono istniejącego bindingu DB dla ${DB_NAME}. Nie tworzę nowej bazy.`);
  return {cfg,db};
}
function run(args){
  const r=spawnSync(process.execPath,[WRANGLER,...args],{cwd:ROOT,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024,env:{...process.env,CLOUDFLARE_ACCOUNT_ID:ACCOUNT}});
  const out=(r.stdout||'')+(r.stderr||'');if(out)process.stdout.write(out);
  if(r.error)throw r.error;if(r.status!==0)throw new Error(`Wrangler zakończył kodem ${r.status}: ${args.join(' ')}`);
  return out;
}
async function main(){
  console.log('======================================================');
  console.log('AKADEMIA SERWISU PRO 3.7.0 — AKTUALIZACJA ISTNIEJĄCEJ BAZY');
  console.log('======================================================');
  if(!fs.existsSync(WRANGLER))throw new Error('Brak lokalnego Wrangler JS. Uruchom INSTALUJ_WRANGLER.cmd.');
  const {db}=readConfig();
  console.log(`[OK] Projekt: ${PROJECT}`);console.log(`[OK] Istniejąca baza: ${DB_NAME}`);console.log(`[OK] Database ID: ${db.database_id}`);
  console.log('[1/5] Sprawdzam aktywne konto Cloudflare...');
  const who=run(['whoami']);
  if(!who.includes(ACCOUNT))throw new Error('Aktywne logowanie Wrangler wskazuje inne konto niż zapisane w projekcie. Zaloguj właściwe konto; baza nie została zmieniona.');
  console.log('[OK] Aktywne konto Cloudflare jest zgodne.');
  console.log('[INFO] Ta operacja NIE tworzy nowej bazy i NIE usuwa istniejących danych.');
  console.log('[INFO] Zastosuje oczekujące migracje oraz idempotentne pakiety wiedzy 032, 033 i 05.');
  const confirm=await ask('Aby kontynuować aktualizację schematu i bazy, wpisz AKTUALIZUJ_BAZE: ');
  if(confirm!=='AKTUALIZUJ_BAZE'){console.log('Anulowano. Baza nie została zmieniona.');return;}
  console.log('\n[2/5] Zastosowanie oczekujących migracji D1 do istniejącej bazy...');
  run(['d1','migrations','apply',DB_NAME,'--remote']);
  const seedFiles=['seeds/knowledge_032.sql','seeds/knowledge_033.sql','seeds/sources_05.sql'];
  for(let i=0;i<seedFiles.length;i++){
    const rel=seedFiles[i],full=path.join(ROOT,rel);if(!fs.existsSync(full))throw new Error(`Brak pliku ${rel}.`);
    console.log(`\n[${i+3}/5] Import ${rel} (INSERT OR IGNORE — bez duplikatów)...`);
    run(['d1','execute',DB_NAME,'--remote','--file',rel]);
  }
  console.log('\n[5/5] Aktualizacja bazy zakończona.');
  console.log('Teraz uruchom START_AUTO_PUBLISH.cmd, aby opublikować WEB_PUBLISH i Pages Functions.');
}
main().catch(e=>{console.error('\n[BLAD] '+(e.stack||e.message||e));process.exitCode=1;});
