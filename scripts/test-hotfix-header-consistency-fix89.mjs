import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const html=read('WEB_PUBLISH/index.html');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
const hotfix=String(release.latestHotfix||'');
const hotfixBuild=String(release.latestHotfixBuild||'');
check('FIX89 release metadata keeps product 6.8.0 and declares a valid hotfix build',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(hotfix,'FIX89');
  assert.equal(hotfixBuild,'6.8.0-fix89-production-header-contract-20261106');
});
check('FIX89 is consistent in HTML, OneClick output and Watcher header',()=>{
  assert.ok(html.includes(`<meta name="academy-hotfix" content="${hotfix}">`));
  assert.ok(html.includes(`6.8.0 ${hotfix} | GLOBAL ACADEMY PRO`));
  assert.ok(one.includes(`6.8.0 ${hotfix} — GLOBAL ACADEMY + REPAIR VISUALS`));
  assert.ok(watcher.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix}`));
});
check('FIX89 watcher commit message and deployment status identify current release',()=>{
  assert.ok(watcher.includes(`Nauka od A do Z 6.8.0 ${hotfix} — Direct Upload production`));
  assert.ok(watcher.includes('remoteRelease?.latestHotfix === EXPECTED_HOTFIX'));
  assert.ok(watcher.includes('remoteRelease?.latestHotfixBuild === EXPECTED_HOTFIX_BUILD'));
});
check('FIX89 remains wired into both publication preflights',()=>{
  assert.ok(one.includes("'scripts/test-hotfix-header-consistency-fix89.mjs'"));
  assert.ok(watcher.includes("'scripts/test-hotfix-header-consistency-fix89.mjs'"));
  assert.ok(release.publicationGuard.includes('FIX89_RELEASE_HEADER_CONSISTENCY'));
});
console.log(`FIX89 HOTFIX HEADER CONSISTENCY: ${checks.length}/${checks.length} PASS`);
