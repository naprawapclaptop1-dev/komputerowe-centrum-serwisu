import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {buildDirectUploadProductionArgs,assertDirectUploadProductionArgs}=require('./pages-production-direct-upload-fix86.cjs');
const watcher=fs.readFileSync(path.join(ROOT,'AUTO_PUBLISH_WATCHER.js'),'utf8');
const release=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH','release.json'),'utf8'));
const currentHotfix=String(release.latestHotfix || '');
const oneclick=fs.readFileSync(path.join(ROOT,'ONECLICK_AKADEMIA.js'),'utf8');
const directory=path.join(ROOT,'WEB_PUBLISH');
const projectName='naprawa-pc-akademia-serwisu-pro';
const args=buildDirectUploadProductionArgs({directory,projectName,commitMessage:`Nauka od A do Z 6.8.0 ${currentHotfix} — production Direct Upload`});
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}

check('FIX86 tworzy produkcyjne Direct Upload bez --branch i --env',()=>{
  assert.deepEqual(args.slice(0,2),['pages','deploy']);
  assert.equal(args[2],directory);
  assert.equal(args[args.indexOf('--project-name')+1],projectName);
  assert.ok(!args.includes('--branch'));
  assert.ok(!args.includes('--env'));
  assert.ok(!args.some(x=>String(x).startsWith('--branch=')));
  assertDirectUploadProductionArgs(args,{directory,projectName});
});
check('FIX86 blokuje --branch, czyli target Preview',()=>{
  assert.throws(()=>assertDirectUploadProductionArgs([...args,'--branch','main'],{directory,projectName}),/Preview/);
  assert.throws(()=>assertDirectUploadProductionArgs([...args,'--branch=main'],{directory,projectName}),/Preview/);
});
check('FIX86 blokuje --env i --production-branch w poleceniu deploymentu',()=>{
  assert.throws(()=>assertDirectUploadProductionArgs([...args,'--env','preview'],{directory,projectName}),/--env/);
  assert.throws(()=>assertDirectUploadProductionArgs([...args,'--production-branch','main'],{directory,projectName}),/konfiguracji projektu/);
});
check('FIX86 blokuje inny projekt, katalog lub względną ścieżkę',()=>{
  assert.throws(()=>assertDirectUploadProductionArgs(args,{directory,projectName:'other-project'}),/właściwy istniejący projekt/);
  assert.throws(()=>assertDirectUploadProductionArgs(args,{directory:path.join(ROOT,'other'),projectName}),/inny katalog/);
  const relative=[...args];relative[2]='WEB_PUBLISH';
  assert.throws(()=>assertDirectUploadProductionArgs(relative,{projectName}),/absolutną ścieżką/);
});
check('FIX86 wymaga commit metadata i prawidłowych argumentów Wrangler',()=>{
  assert.throws(()=>assertDirectUploadProductionArgs(['pages','deploy',directory],{directory,projectName}),/--project-name/);
  assert.throws(()=>assertDirectUploadProductionArgs(args.filter(x=>x!=='--commit-dirty'),{directory,projectName}),/metadanych/);
});
check('Watcher używa tylko nowego helpera produkcyjnego Direct Upload',()=>{
  assert.ok(currentHotfix);
  assert.ok(watcher.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${currentHotfix}`));
  assert.ok(watcher.includes("buildDirectUploadProductionArgs({"));
  assert.ok(!watcher.includes("buildProductionBranchArgs({"));
  assert.ok(watcher.includes('pomijam --branch i --env'));
});
check('Watcher odczytuje tryb i domyślną Production Branch, ale nie przekazuje --branch',()=>{
  assert.ok(watcher.includes("PAGES_PROJECT_MODE !== 'DIRECT_UPLOAD'"));
  assert.ok(watcher.includes('if (!BRANCH)'));
  assert.ok(watcher.includes('productionBranch: BRANCH')===false);
  assert.ok(watcher.includes('domyślnej Production Branch projektu'));
});
check('OneClick i watcher uruchamiają regresję FIX86 przed publikacją',()=>{
  assert.ok(oneclick.includes("'scripts/test-pages-production-direct-upload-fix86.mjs'"));
  assert.ok(watcher.includes("'scripts/test-pages-production-direct-upload-fix86.mjs'"));
  assert.ok(oneclick.includes("'scripts/test-fix83-manifest-contract-fix86.mjs'"));
  assert.ok(watcher.includes("'scripts/test-fix83-manifest-contract-fix86.mjs'"));
});
console.log(`FIX86 DIRECT UPLOAD PRODUCTION: ${checks.length}/${checks.length} PASS`);
