import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { buildProductionBranchArgs, assertProductionBranchArgs, extractDeploymentUrl, validateBranch } = require('./pages-production-branch-fix85.cjs');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const oneclick = read('ONECLICK_AKADEMIA.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const currentHotfix = String(release.latestHotfix || '');
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
const directory=path.join(ROOT,'WEB_PUBLISH');
const projectName='naprawa-pc-akademia-serwisu-pro';
const branch='main';
const args=buildProductionBranchArgs({directory,projectName,productionBranch:branch,commitMessage:'Nauka od A do Z 6.8.0 FIX85 — archiwalny helper Preview'});

check('FIX85 historyczny helper --branch pozostaje zachowany jako narzędzie Preview',()=>{
  assert.equal(args[0],'pages');assert.equal(args[1],'deploy');
  assert.equal(args[args.indexOf('--project-name')+1],projectName);
  assert.equal(args[args.indexOf('--branch')+1],branch);
  assertProductionBranchArgs(args,branch);
});
check('Historyczny walidator odrzuca brak gałęzi, gałąź roboczą i inną gałąź',()=>{
  assert.throws(()=>assertProductionBranchArgs(args.filter((x,i)=>i!==args.indexOf('--branch')&&i!==args.indexOf('--branch')+1),branch),/Production Branch/);
  assert.throws(()=>assertProductionBranchArgs(args.map(x=>x==='main'?'feature/fix85-test':x),branch),/Production Branch/);
  assert.throws(()=>assertProductionBranchArgs([...args,'--branch','preview'],branch),/wyłącznie/);
});
check('Historyczny walidator odrzuca niebezpieczne nazwy gałęzi i środowisko preview',()=>{
  for(const invalid of ['', '  ', '-main', 'main branch', 'main\n', '../prod']) assert.throws(()=>validateBranch(invalid));
  assert.throws(()=>assertProductionBranchArgs([...args,'--env','preview'],branch),/preview/);
});
check('Ekstraktor zachowuje wykrywanie adresu pojedynczego deploymentu',()=>{
  assert.equal(extractDeploymentUrl('Deployment complete! https://48d81e66.naprawa-pc-akademia-serwisu-pro.pages.dev',projectName),'https://48d81e66.naprawa-pc-akademia-serwisu-pro.pages.dev');
  assert.equal(extractDeploymentUrl('Deployment complete! https://other-project.pages.dev',projectName),'');
});
check('Aktywny watcher FIX86 nie używa historycznego helpera --branch',()=>{
  assert.ok(watcher.includes("buildDirectUploadProductionArgs({"));
  assert.ok(!watcher.includes("buildProductionBranchArgs({"));
  assert.ok(watcher.includes("pomijam --branch i --env"));
});
check('Aktywny watcher wymaga trybu Direct Upload oraz potwierdzonej domyślnej gałęzi',()=>{
  assert.ok(watcher.includes("PAGES_PROJECT_MODE !== 'DIRECT_UPLOAD'"));
  assert.ok(watcher.includes("if (!BRANCH)"));
  assert.ok(watcher.includes("domyślnej Production Branch"));
});
check('Watcher nadal wymaga potwierdzenia stałej domeny produkcyjnej',()=>{
  assert.ok(watcher.includes('extractDeploymentUrl(deploymentResult.stdout, PROJECT)'));
  assert.ok(watcher.includes('await verifyPublishedRelease()'));
});
check('OneClick i watcher uruchamiają testy produkcyjnego Direct Upload FIX86 pod bieżącym hotfixem release.json',()=>{
  assert.ok(currentHotfix);
  assert.ok(oneclick.includes(`6.8.0 ${currentHotfix} — LOCAL HOME PHOTOGRAPHY + PHOTO COUNTER`) || oneclick.includes(`6.8.0 ${currentHotfix} — REAL PHOTO GUARDS + DIRECT IMAGE LOAD`) || oneclick.includes(`6.8.0 ${currentHotfix} — GLOBAL ACADEMY + PHOTO PAGINATION`) || oneclick.includes(`6.8.0 ${currentHotfix} — HOME PHOTO PUBLICATION VALIDATOR`) || oneclick.includes(`6.8.0 ${currentHotfix}`));
  assert.ok(oneclick.includes("'scripts/test-pages-production-direct-upload-fix86.mjs'"));
  assert.ok(watcher.includes("'scripts/test-pages-production-direct-upload-fix86.mjs'"));
});
console.log(`FIX85 HISTORICAL BRANCH HELPER: ${checks.length}/${checks.length} PASS`);
