import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=[
  'scripts/test-oneclick-service-worker-tdz-fix120.mjs',
  'scripts/test-electronics-simulators-fix119.mjs',
  'scripts/test-visual-academy-fix51.mjs',
  'scripts/test-preview-server-fix51.mjs',
  'scripts/test-release-contract-fix51.mjs',
  'scripts/test-pages-production-direct-upload-fix86.mjs',
  'scripts/test-fix83-manifest-contract-fix86.mjs',
  'scripts/test-fix83-visual-library-guard-fix88.mjs',
  'scripts/test-repair-photo-layout-fix87.mjs',
  'scripts/test-photo-method-renderer-fix106.mjs',
  'scripts/test-photo-catalog-publication-contract-fix115.mjs',
  'scripts/test-photo-topic-quality-fix115.mjs',
  'scripts/test-home-specialist-containment-fix115.mjs',
  'scripts/test-homepage-photo-library-fix118.mjs',
  'scripts/test-oneclick-release-scope-fix115.mjs',
  'scripts/test-photo-provider-recovery-fix111.mjs',
  'scripts/test-active-view-photo-queue-fix111.mjs',
  'scripts/test-fix110-service-worker-publication-guard.mjs',
  'scripts/test-node-runtime-discovery-fix101.mjs',
  'scripts/test-startup-window-guard-fix102.mjs',
  'scripts/test-node-resolver-fix103.mjs',
  'scripts/test-release-contract-fix49.mjs',
  'scripts/test-release-contract-fix50.mjs',
  'scripts/test-photo-reliability-fix50.mjs',
  'scripts/test-watcher-fix51-asset-count-fix53.mjs',
  'scripts/test-global-academy-suite-fix60.mjs',
  'scripts/test-global-academy-expansion-fix73.mjs',
  'scripts/test-global-academy-http-fix73.mjs',
  'scripts/test-home-learning-fix77.mjs',
  'scripts/test-photo-uniqueness-fix77.mjs',
  'scripts/test-global-academy-fix77.mjs',
  'scripts/test-global-academy-http-fix77.mjs',
  'scripts/test-global-academy-http-proxy-fix113.mjs',
  'scripts/test-oneclick-fix77.mjs',
  'scripts/test-fix78-photo-manifest-guard.mjs',
  'scripts/test-service-worker-fix79.mjs',
  'scripts/test-fix82-global-academy-marker.mjs',
  'scripts/test-fix83-unique-visuals.mjs',
  'scripts/test-fix84-node-crypto.mjs',
  'scripts/test-homepage-showcase-fix80.mjs',
  'scripts/test-watcher-homepage-showcase-fix32.mjs',
  'scripts/test-homepage-showcase-fix8.js',
  'scripts/test-syntax-root-fix74.mjs',
  'scripts/test-syntax-fix64-fix73.mjs',
  'scripts/test-migration-inventory-compat-fix62.mjs',
  'scripts/test-visual-assets-http-fix54.mjs',
  'scripts/test-production-branch-guard-fix54.mjs',
  'scripts/test-pages-branch-discovery-fix63.mjs',
  'scripts/test-view-count-fix61.mjs',
  'scripts/security-audit-fix51.mjs',
  'scripts/migration-audit-fix51.mjs',
  'scripts/test-ultimate-quality-fix49.mjs',
  'scripts/test-pending-migration-guard-fix49.mjs',
  'scripts/security-audit-fix49.mjs',
  'scripts/migration-audit-fix49.mjs'
];
const syntaxFiles=['WEB_PUBLISH/assets/electronics-simulator-fix119.js','WEB_PUBLISH/assets/master-workshop-630-extension.js','WEB_PUBLISH/assets/global-academy-expansion-fix73.js','WEB_PUBLISH/assets/knowledge-suite-fix43.js','WEB_PUBLISH/assets/homepage-photo-prime-fix118.js','WEB_PUBLISH/assets/photo-catalog-fix115.js','WEB_PUBLISH/service-worker.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','scripts/test-oneclick-service-worker-tdz-fix120.mjs','scripts/test-homepage-photo-library-fix118.mjs','scripts/run-tests-fix119.mjs','scripts/photo-catalog-publication-contract-fix115.cjs','scripts/test-home-learning-fix77.mjs','scripts/test-fix110-service-worker-publication-guard.mjs','scripts/test-electronics-simulators-fix119.mjs'];
const run=args=>spawnSync(process.execPath,args,{cwd:ROOT,encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024,windowsHide:true});
let output=[];let passed=0;
for(const file of tests){
  if(!fs.existsSync(path.join(ROOT,file))){const report=`FIX119 PREFLIGHT FAILED — missing ${file}\n${output.join('\n\n')}`;fs.writeFileSync(path.join(ROOT,'RAPORT_FIX119_TESTY.log'),report);process.stderr.write(report);process.exit(1);}
  const r=run([file]);output.push(`$ node ${file}\n${r.stdout||''}${r.stderr||''}`);
  if(r.error||r.status!==0){const report=`FIX119 PREFLIGHT FAILED — ${file} (exit ${r.status})\n${output.join('\n\n')}`;fs.writeFileSync(path.join(ROOT,'RAPORT_FIX119_TESTY.log'),report);process.stderr.write(report);process.exit(r.status||1);}
  passed++;
}
for(const file of syntaxFiles){const r=run(['--check',file]);output.push(`$ node --check ${file}\n${r.stdout||''}${r.stderr||''}`);if(r.error||r.status!==0){const report=`FIX119 SYNTAX FAILED — ${file}\n${output.join('\n\n')}`;fs.writeFileSync(path.join(ROOT,'RAPORT_FIX119_TESTY.log'),report);process.stderr.write(report);process.exit(1);}}
for(const file of ['WEB_PUBLISH/release.json','WEB_PUBLISH/media/photo-sources-online.json','WEB_PUBLISH/media/home-photo-library-fix118.json','WEB_PUBLISH/assets/electronics-simulator-fix119-manifest.json'])JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const report=`NAUKA OD A DO Z 6.8.0 FIX119 — TEST REPORT\n\n${output.join('\n\n')}\n\n[PASS] Full OneClick/Watcher preflight: ${passed}/${tests.length} scripts.\n[PASS] Syntax: ${syntaxFiles.length}/${syntaxFiles.length} JS files.\n[PASS] JSON: 4/4 manifests parsed.\n[PASS] No production publication or D1 migrations performed by this test runner.\n`;
fs.writeFileSync(path.join(ROOT,'RAPORT_FIX119_TESTY.log'),report);
console.log(`FIX119 FULL PREFLIGHT: ${passed}/${tests.length} PASS; syntax ${syntaxFiles.length}/${syntaxFiles.length}; JSON 4/4.`);
