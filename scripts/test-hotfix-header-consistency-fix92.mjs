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
check('Wersja produktu 6.8.0 zachowana; FIX92 jest aktywną poprawką katalogu fotografii',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(hotfix,'FIX92');
  assert.equal(hotfixBuild,'6.8.0-fix92-photo-persistence-home-priority-20261107');
  assert.equal(release.photoCatalogRuntimeBuildTag,hotfixBuild);
  assert.equal(release.photoCatalog.runtime,'assets/photo-catalog-fix92.js?v=6.8.0-fix92');
});
check('HTML, OneClick i Watcher mają zgodny nagłówek FIX92',()=>{
  assert.ok(html.includes(`<meta name="academy-hotfix" content="${hotfix}">`));
  assert.ok(html.includes(`NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix} | GLOBAL ACADEMY PRO`));
  assert.ok(one.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix}`));
  assert.ok(watcher.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix}`));
});
check('Watcher commit message and deployment gate identify the active release',()=>{
  assert.ok(watcher.includes(`Nauka od A do Z 6.8.0 ${hotfix} — Direct Upload production`));
  assert.ok(watcher.includes('remoteRelease?.latestHotfix === EXPECTED_HOTFIX'));
  assert.ok(watcher.includes('remoteRelease?.latestHotfixBuild === EXPECTED_HOTFIX_BUILD'));
  assert.ok(watcher.includes('remotePhotoCatalogValid'));
});
check('FIX92 remains wired into both publication preflights and the release guard',()=>{
  assert.ok(one.includes("'scripts/test-hotfix-header-consistency-fix92.mjs'"));
  assert.ok(watcher.includes("'scripts/test-hotfix-header-consistency-fix92.mjs'"));
  assert.ok(release.publicationGuard.includes('FIX92_LICENSE_RESTORE_FULL_QUEUE_HOME_PRIORITY_RETRY_EXHAUSTED_STATE_MIGRATION'));
});
console.log(`FIX92 HOTFIX HEADER CONSISTENCY: ${checks.length}/${checks.length} PASS`);
