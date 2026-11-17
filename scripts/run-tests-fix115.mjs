import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=[
  'scripts/test-photo-topic-quality-fix115.mjs',
  'scripts/test-home-specialist-containment-fix115.mjs',
  'scripts/test-photo-catalog-publication-contract-fix115.mjs',
  'scripts/test-oneclick-release-scope-fix115.mjs'
];
const log=[];
for(const rel of tests){
  const result=spawnSync(process.execPath,[path.join(ROOT,rel)],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:4*1024*1024});
  if(result.stdout){process.stdout.write(result.stdout);log.push(result.stdout.trim());}
  if(result.stderr){process.stderr.write(result.stderr);log.push(result.stderr.trim());}
  if(result.error||result.status!==0){
    const report=`FIX115 TESTS FAILED\n${log.join('\n')}\n${rel}: ${result.error?.message||`exit ${result.status}`}\n`;
    fs.writeFileSync(path.join(ROOT,'RAPORT_FIX115_TESTY.log'),report);
    process.exit(result.status||1);
  }
}
const syntaxFiles=['WEB_PUBLISH/assets/photo-catalog-fix115.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','scripts/photo-catalog-publication-contract-fix115.cjs'];
for(const rel of syntaxFiles){
  const result=spawnSync(process.execPath,['--check',path.join(ROOT,rel)],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:30000});
  if(result.status!==0){const report=`FIX115 SYNTAX FAILED\n${log.join('\n')}\n${rel}\n${result.stderr||''}`;fs.writeFileSync(path.join(ROOT,'RAPORT_FIX115_TESTY.log'),report);process.stderr.write(report);process.exit(result.status||1);}
}
for(const rel of ['WEB_PUBLISH/release.json','WEB_PUBLISH/media/photo-sources-online.json']) JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const report=`NAUKA OD A DO Z 6.8.0 FIX115 — TEST REPORT\n\n${log.join('\n\n')}\n\n[PASS] Syntax: ${syntaxFiles.length}/${syntaxFiles.length} JS/CJS files.\n[PASS] JSON: 2/2 manifests parsed.\n[PASS] Existing D1 migrations were not run by this test runner.\n[PASS] Production deployment was not performed by this test runner.\n`;
fs.writeFileSync(path.join(ROOT,'RAPORT_FIX115_TESTY.log'),report);
console.log('[PASS] Syntax: 4/4. JSON: 2/2.');
console.log('FIX115 FULL LOCAL TESTS: PASS');
