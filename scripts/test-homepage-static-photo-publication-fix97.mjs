import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const require = createRequire(import.meta.url);
const { verifyHomepageStaticPhotoContractFix97 } = require('./homepage-static-photo-contract-fix97.cjs');
const html = read('WEB_PUBLISH/index.html');
const manifest = JSON.parse(read('WEB_PUBLISH/assets/photo-uniqueness-manifest-fix77.json'));
const scripts = {
  photoUniquenessScript: read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js'),
  photoLockScript: read('WEB_PUBLISH/assets/photo-unique-thumbnails-fix30.js'),
  homeRefreshCss: read('WEB_PUBLISH/assets/home-refresh-fix30.css'),
  homeShowcaseJs: read('WEB_PUBLISH/assets/homepage-showcase-640.js'),
  homeShowcaseCss: read('WEB_PUBLISH/assets/homepage-showcase-640.css')
};
const makeInput = (patch = {}) => ({
  webDir: WEB,
  indexHtml: patch.indexHtml ?? html,
  photoUniquenessManifest: patch.photoUniquenessManifest ?? structuredClone(manifest),
  ...scripts,
  ...patch
});
const run = patch => verifyHomepageStaticPhotoContractFix97(makeInput(patch));
let passed = 0;
function check(label, fn) {
  fn(); passed++; console.log(`[PASS] ${label}`);
}

check('FIX97: poprawny układ 3 + 6 + 4 przechodzi z 13 różnymi zdjęciami', () => {
  const result = run();
  assert.deepEqual(result, {
    totalUniqueLocalPhotos: 13, heroPhotos: 3, showcaseSlides: 6,
    modulePhotoCards: 4, totalModuleCards: 19, technicalIllustrationCards: 6,
    minimumPhotoHammingDistance: 24
  });
});
check('FIX97: niekompletny manifest layoutSlots blokuje publikację', () => {
  const bad = structuredClone(manifest); bad.layoutSlots.homeModuleCards = 13;
  assert.throws(() => run({ photoUniquenessManifest: bad }), /układzie 3 \+ 6 \+ 4/);
});
check('FIX97: powtórzony identyfikator zdjęcia blokuje publikację', () => {
  const bad = html.replace('data-photo-unique="home-card-05"', 'data-photo-unique="home-card-04"');
  assert.throws(() => run({ indexHtml: bad }), /identyfikatory zdjęć nie są kompletne i unikalne/);
});
check('FIX97: ponowne użycie tego samego zdjęcia blokuje publikację', () => {
  const first = html.match(/<img\b[^>]*data-photo-unique="home-card-01"[^>]*>/)?.[0];
  const second = html.match(/<img\b[^>]*data-photo-unique="home-card-02"[^>]*>/)?.[0];
  assert.ok(first && second);
  const firstSrc = first.match(/\bsrc="([^"]+)/)[1];
  const bad = html.replace(second, second.replace(/\bsrc="[^"]+/, `src="${firstSrc}`));
  assert.throws(() => run({ indexHtml: bad }), /ten sam plik fotograficzny/);
});
check('FIX97: utrata jednego zdjęcia lokalnego zatrzymuje publikację', () => {
  const bad = html.replace(' data-photo-unique="home-card-13"', '');
  assert.throws(() => run({ indexHtml: bad }), /oczekiwano 13 statycznych zdjęć/);
});
check('FIX97: podmiana pliku zdjęcia bez zgodności SHA-256 zatrzymuje publikację', () => {
  const bad = structuredClone(manifest); bad.photos[0].sha256 = '0'.repeat(64);
  assert.throws(() => run({ photoUniquenessManifest: bad }), /SHA-256 .* nie zgadza się/);
});
check('FIX97: zbyt podobne zdjęcia według pHash zatrzymują publikację', () => {
  const bad = structuredClone(manifest); bad.photos[1].perceptualHash = bad.photos[0].perceptualHash;
  assert.throws(() => run({ photoUniquenessManifest: bad }), /globalny pHash nie spełnia progu/);
});
check('FIX97: brak jednego z sześciu slajdów zatrzymuje publikację', () => {
  const bad = html.replace('class="np640-slide" data-slide="5"', 'class="np640-not-a-slide" data-slide="5"');
  assert.throws(() => run({ indexHtml: bad }), /pokaz powinien zawierać 6 slajdów/);
});
check('FIX97: zdjęcie spoza kolejności w slajdzie nie przechodzi walidacji', () => {
  const bad = html.replace('data-photo-unique="home-card-04"', 'data-photo-unique="home-card-05"');
  assert.throws(() => run({ indexHtml: bad }), /identyfikatory zdjęć nie są kompletne i unikalne/);
});
check('FIX97: siatka 19 modułów i 6 ilustracyjnych kart nadal jest wymagana', () => {
  const bad = html.replace('data-gax-open="cert"', 'data-gax-open="other"');
  assert.throws(() => run({ indexHtml: bad }), /6 dodatkowych modułów musi zachować ilustracje/);
});
check('FIX97: brak globalnej ochrony MutationObserver/pHash blokuje publikację', () => {
  const bad = scripts.photoUniquenessScript.replace('MutationObserver', 'NoObserver');
  assert.throws(() => run({ photoUniquenessScript: bad }), /globalny runtime kontroli unikalności/);
});
check('FIX97: OneClick i Watcher uruchamiają tę kontrolę przed wdrożeniem', () => {
  const one = read('ONECLICK_AKADEMIA.js');
  const watcher = read('AUTO_PUBLISH_WATCHER.js');
  for (const source of [one, watcher]) assert.ok(source.includes("'scripts/test-homepage-static-photo-publication-fix97.mjs'"));
  assert.ok(one.includes('verifyHomepageStaticPhotoContractFix97'));
  assert.ok(watcher.includes('remoteFix77PhotoLayoutValid'));
});

console.log(`FIX97 HOME PHOTO PUBLICATION GUARD: ${passed}/${passed} PASS`);
