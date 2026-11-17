import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-manifest-fix83.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/release.json'),'utf8'));
const html=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/index.html'),'utf8');
const sw=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/service-worker.js'),'utf8');
const watcher=fs.readFileSync(path.join(ROOT,'AUTO_PUBLISH_WATCHER.js'),'utf8');
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}

check('Manifest FIX83 ma dokładnie 54 ilustracje i osobne kategorie VRAM/RAM',()=>{
  assert.equal(manifest.hotfix,'FIX83');
  assert.equal(manifest.galleryIllustrationCount,54);
  assert.ok(manifest.categories.includes('vram'));
  assert.ok(manifest.categories.includes('ram'));
});
check('Reguła VRAM jawnie wymaga GDDR/BGA i zakazuje DIMM/SO-DIMM',()=>{
  assert.ok(manifest.vramRule.includes('Separate GDDR/BGA packages on PCB'));
  assert.ok(manifest.vramRule.includes('Never use DIMM/SO-DIMM imagery'));
});
check('Watcher waliduje istniejący schemat vramRule zamiast nieistniejącego visualPolicy',()=>{
  assert.ok(watcher.includes("remoteFix83Manifest?.vramRule"));
  assert.ok(watcher.includes("fix83Categories.includes('vram')"));
  assert.ok(watcher.includes("fix83Categories.includes('ram')"));
  assert.ok(!watcher.includes("visualPolicy?.vram?.ramDimmAllowed"));
});
check('Wydanie deklaruje bieżący hotfix z release.json, zachowując FIX87 runtime ilustracji i wersję produktu 6.8.0',()=>{
  assert.equal(release.release,'6.8.0');
  assert.match(release.latestHotfix,/^FIX\d+$/);
  assert.equal(release.visualHotfix,'FIX83');
  assert.ok(release.latestHotfixBuild.startsWith('6.8.0-fix128-'));
  assert.ok(release.photoCatalogRuntimeBuildTag.startsWith('6.8.0-fix118-'));
  assert.equal(release.visualRuntimeBuildTag,'6.8.0-fix87');
  assert.equal(release.deploymentMode,'cloudflare-pages-direct-upload-production');
  assert.ok(release.publicationGuard.includes(release.latestHotfix));
});
check('HTML i PWA wskazują FIX87/FIX83, zachowują marker FIX86 i zmieniają cache',()=>{
  assert.ok(html.includes('<meta name="academy-build" content="6.8.0-fix51-visual-academy-pro-20261105">'));
  assert.ok(html.includes('<meta name="academy-hotfix" content="FIX86">'));
  assert.ok(html.includes('<meta name="academy-hotfix" content="FIX87">'));
  assert.ok(html.includes('<meta name="academy-hotfix" content="FIX88">'));
  assert.ok(html.includes(`<meta name="academy-hotfix" content="${release.latestHotfix}">`));
  assert.ok(html.includes('visual-uniqueness-fix83.js?v=6.8.0-fix87'));
  assert.ok(sw.includes('/assets/visual-uniqueness-manifest-fix83.json'));
  assert.ok(sw.includes('/assets/video-poster-manifest-fix83.json'));
  assert.ok(sw.includes('fix94-topic-verified-photo-20261107'));
  assert.ok(sw.includes('/assets/repair-photo-layout-fix87.css?v=6.8.0-fix87'));
});
console.log(`FIX83 MANIFEST + FIX87 RELEASE CONTRACT: ${checks.length}/${checks.length} PASS`);
