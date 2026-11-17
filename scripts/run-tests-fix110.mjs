import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(file,timeout=900000)=>spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:128*1024*1024,timeout});
console.log(`NAUKA OD A DO Z — FIX110 TEST RUNNER · Node ${process.version}`);
const base=run('scripts/run-tests-fix109.mjs');
if(base.stdout)process.stdout.write(base.stdout); if(base.stderr)process.stderr.write(base.stderr);
if(base.error||base.status!==0){console.error('[FAIL] FIX109 base regression chain');process.exit(1);}
const match=`${base.stdout||''}\n${base.stderr||''}`.match(/FIX109 FINAL SUMMARY:\s*(\d+)\/(\d+) regression PASS \+ (\d+)\/(\d+) syntax PASS/i);
if(!match||match[1]!==match[2]||match[3]!==match[4]){console.error('[FAIL] brak kompletnego podsumowania FIX109');process.exit(1);}
const focused=run('scripts/test-fix110-service-worker-publication-guard.mjs',60000);
if(focused.stdout)process.stdout.write(focused.stdout);if(focused.stderr)process.stderr.write(focused.stderr);
if(focused.error||focused.status!==0){console.error('[FAIL] FIX110 Service Worker publication guard');process.exit(1);}
const focusedMatch=`${focused.stdout||''}\n${focused.stderr||''}`.match(/FIX110 SERVICE WORKER PUBLICATION GUARD SUMMARY:\s*(\d+)\/(\d+) PASS/i);
if(!focusedMatch||focusedMatch[1]!==focusedMatch[2]){console.error('[FAIL] brak kompletnego podsumowania FIX110');process.exit(1);}
const syntax=['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','WEB_PUBLISH/service-worker.js','scripts/test-service-worker-fix79.mjs','scripts/test-fix110-service-worker-publication-guard.mjs','scripts/run-tests-fix110.mjs'];
for(const file of syntax){const r=spawnSync(process.execPath,['--check',path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',timeout:30000});if(r.status!==0){if(r.stderr)process.stderr.write(r.stderr);console.error(`[FAIL] node --check ${file}`);process.exit(1);}console.log(`[PASS] node --check ${file}`);}
const baseReg=Number(match[1]),baseSyntax=Number(match[3]),focusCount=Number(focusedMatch[1]);
console.log(`FIX110 FINAL SUMMARY: ${baseReg+focusCount}/${baseReg+focusCount} regression PASS + ${baseSyntax+syntax.length}/${baseSyntax+syntax.length} syntax PASS (FIX109 inherited ${baseReg} + FIX110 focused ${focusCount}).`);
