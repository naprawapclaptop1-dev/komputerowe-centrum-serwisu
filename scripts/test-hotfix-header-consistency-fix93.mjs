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
check('Produkt 6.8.0 zachowany; FIX93 jest aktywną poprawką zabezpieczenia renderowania fotografii',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(hotfix,'FIX93');
  assert.equal(hotfixBuild,'6.8.0-fix93-online-photo-guard-and-fast-render-20261107');
  assert.equal(release.photoCatalogRuntimeBuildTag,hotfixBuild);
  assert.equal(release.photoCatalog.runtime,'assets/photo-catalog-fix93.js?v=6.8.0-fix93');
});
check('HTML, OneClick i Watcher mają zgodny nagłówek FIX93',()=>{
  assert.ok(html.includes(`<meta name="academy-hotfix" content="${hotfix}">`));
  assert.ok(html.includes(`NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix} | GLOBAL ACADEMY PRO`));
  assert.ok(one.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix}`));
  assert.ok(watcher.startsWith(`// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 ${hotfix}`));
});
check('Watcher gate i commit message wskazują aktualny release FIX93',()=>{
  assert.ok(watcher.includes(`Nauka od A do Z 6.8.0 ${hotfix} — Direct Upload production`));
  assert.ok(watcher.includes('remoteRelease?.latestHotfix === EXPECTED_HOTFIX'));
  assert.ok(watcher.includes('remoteRelease?.latestHotfixBuild === EXPECTED_HOTFIX_BUILD'));
  assert.ok(watcher.includes('remotePhotoCatalogValid'));
});
check('OneClick i Auto-Watcher wymagają aktualnego cache FIX93, zachowując wszystkie media wsparcia',()=>{
  const sw=read('WEB_PUBLISH/service-worker.js');
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix93-online-photo-guard-render-20261107'"));
  assert.ok(one.includes("swCacheName.includes('fix93-online-photo-guard-render-20261107')"));
  assert.ok(watcher.includes("swCacheName.includes('fix93-online-photo-guard-render-20261107')"));
  assert.ok(watcher.includes("remoteCacheName.includes('fix93-online-photo-guard-render-20261107')"));
  for(const asset of ['akademia-dlaczego-warto-wspierac.mp4','akademia-wsparcie-poster.jpg','akademia-dlaczego-warto-wspierac.vtt']) assert.ok(sw.includes(asset),`Service Worker missing ${asset}`);
});
check('FIX93 testy zgodności obu starych bramek są uruchamiane przed publikacją',()=>{
  for (const file of ['scripts/test-hotfix-header-consistency-fix93.mjs','scripts/test-photo-catalog-fix93.mjs','scripts/test-online-photo-guards-fix93.mjs']) {
    assert.ok(one.includes(`'${file}'`), `OneClick missing ${file}`);
    assert.ok(watcher.includes(`'${file}'`), `Watcher missing ${file}`);
  }
  assert.ok(release.publicationGuard.includes('FIX93_ONLINE_PHOTO_GUARD_COMPATIBILITY_AND_DIRECT_TARGET_IMAGE_RENDER'));
});
console.log(`FIX93 HOTFIX HEADER CONSISTENCY: ${checks.length}/${checks.length} PASS`);
