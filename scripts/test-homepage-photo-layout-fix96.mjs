import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix98.js');
const uniquenessRuntime = read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const registry = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const uniqueness = JSON.parse(read('WEB_PUBLISH/assets/photo-uniqueness-manifest-fix77.json'));
const require = createRequire(import.meta.url);
const { verifyHomepageShowcase } = require('./homepage-showcase-guard.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }
const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]+)"`, 'i'))?.[1] || '';

const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
const photoTags = imageTags.filter(tag => /^home-card-\d+$/.test(attr(tag, 'data-photo-unique')));
const ids = photoTags.map(tag => attr(tag, 'data-photo-unique'));
const paths = photoTags.map(tag => attr(tag, 'src').split(/[?#]/)[0]);
const manifestById = new Map(uniqueness.photos.map(photo => [photo.id, photo]));

check('manifest FIX96 zachowuje układ 3 + 6 + 4 i 13 fotografii', () => {
  assert.equal(uniqueness.layoutHotfix, 'FIX96_HOME_LOCAL_PHOTOGRAPHY');
  assert.deepEqual(uniqueness.layoutSlots, { hero: 3, showcaseSlides: 6, homeModuleCards: 4, totalUniqueLocalPhotos: 13 });
  assert.equal(photoTags.length, 13);
  assert.equal(new Set(ids).size, 13);
  assert.equal(new Set(paths).size, 13);
});

check('baner główny ma trzy różne fotografie lokalne: USB-C, GPU i RAM', () => {
  const hero = photoTags.filter(tag => ['home-card-01','home-card-02','home-card-03'].includes(attr(tag, 'data-photo-unique')));
  assert.equal(hero.length, 3);
  assert.ok(hero.some(tag => attr(tag, 'data-photo-id') === 'home-hero-usbc-main' && /usb-c/i.test(attr(tag, 'data-photo-title'))));
  assert.ok(hero.some(tag => attr(tag, 'data-photo-id') === 'home-hero-gpu' && /gpu|grafik/i.test(attr(tag, 'data-photo-title'))));
  assert.ok(hero.some(tag => attr(tag, 'data-photo-id') === 'home-hero-ram' && /ram|pamięci/i.test(attr(tag, 'data-photo-title'))));
});

check('każdy z sześciu slajdów używa osobnego zdjęcia JPG zamiast ilustracji SVG', () => {
  const section = html.match(/<section\b[^>]*id="np640Showcase"[^>]*>([\s\S]*?)<\/section>/i)?.[1] || '';
  const slides = [...section.matchAll(/<article\b[^>]*class="[^"]*\bnp640-slide[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)];
  assert.equal(slides.length, 6);
  const slideImages = slides.map(match => match[1].match(/<img\b[^>]*>/i)?.[0] || '');
  assert.ok(slideImages.every(Boolean));
  assert.equal(new Set(slideImages.map(tag => attr(tag, 'src'))).size, 6);
  assert.equal(new Set(slideImages.map(tag => attr(tag, 'data-visual-unique'))).size, 6);
  assert.ok(slideImages.every(tag => /^media\/[a-z0-9-]+\.jpg$/i.test(attr(tag, 'src'))));
  assert.equal(slideImages.filter(tag => /^home-card-0[4-9]$/.test(attr(tag, 'data-photo-unique'))).length, 6);
});

check('cztery wybrane kafelki mają oddzielne zdjęcia lokalne, pozostałe zachowują ilustracje tematyczne', () => {
  assert.deepEqual(new Set(ids.filter(id => /^home-card-1[0-3]$/.test(id))), new Set(['home-card-10','home-card-11','home-card-12','home-card-13']));
  for (const moduleId of ['home-module-repairmaster','home-module-components','home-module-ultimate3d','home-module-labplus','home-module-courses','home-module-checklists','home-module-modelcenter','home-module-knowledge','home-module-cloudchat']) {
    assert.ok(html.includes(moduleId) || html.includes(`data-photo-id="${moduleId}"`) || html.includes(`data-nav="${moduleId.replace('home-module-','')}"`), `Brak modułu ${moduleId} lub jego karty`);
  }
});

check('każde przypisanie jest zgodne z manifestem SHA-256 i poprawnym plikiem JPEG', () => {
  for (const tag of photoTags) {
    const id = attr(tag, 'data-photo-unique');
    const src = attr(tag, 'src').split(/[?#]/)[0];
    const expected = manifestById.get(id);
    assert.ok(expected, `Brak wpisu manifestu ${id}`);
    assert.equal(src, expected.path, `Zły plik przypisany do ${id}`);
    const abs = path.resolve(WEB, src);
    assert.ok(abs.startsWith(WEB + path.sep));
    const bytes = fs.readFileSync(abs);
    assert.ok(bytes.length > 10000, `${src} jest zbyt mały/pusty`);
    assert.equal(bytes[0], 0xff, `${src} nie jest JPEG`);
    assert.equal(bytes[1], 0xd8, `${src} nie jest JPEG`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected.sha256, `SHA-256 mismatch ${src}`);
  }
});

check('reguła unikalności globalnej nie pozwala na ponowne wykorzystanie zdjęć w kolejnych sekcjach', () => {
  assert.ok(uniquenessRuntime.includes('photosAcrossHomeHeroSlidesAndCards:true'));
  assert.ok(uniquenessRuntime.includes('global-single-photo-assignment'));
  const duplicate = html.replace('data-photo-unique="home-card-05"', 'data-photo-unique="home-card-04"').replace('media/motherboard-multimeter-test.jpg', 'media/laptop-board-inspection.jpg');
  assert.throws(() => verifyHomepageShowcase(duplicate, read('WEB_PUBLISH/assets/homepage-showcase-640.js'), read('WEB_PUBLISH/assets/homepage-showcase-640.css'), ROOT), /powtórzony identyfikator lub plik fotografii/);
});

check('licznik pokazuje lokalne zdjęcia i osobno zdjęcia online po dekodowaniu obrazu', () => {
  assert.ok(runtime.includes('function renderedLocalPhotoCount()'));
  assert.ok(runtime.includes('img.naturalWidth >= 320 && img.naturalHeight >= 180'));
  assert.ok(runtime.includes('const localDisplayed = renderedLocalPhotoCount()'));
  assert.ok(runtime.includes('const onlineDisplayed = renderedOnlinePhotoCount()'));
  assert.ok(runtime.includes('${localDisplayed} lokalnych + ${onlineDisplayed} online'));
  assert.ok(runtime.includes('displayedPhotos: displayed'));
  assert.ok(runtime.includes('FIX96_HOME_LOCAL_PHOTOGRAPHY'));
});

check('podstawowe fotografie są w lokalnym pre-cache PWA, bez zależności od API online', () => {
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  for (const src of paths) assert.ok(sw.includes(`'/` + src + `'`), `Brak w cache PWA: ${src}`);
  assert.ok(sw.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.ok(sw.includes('photo-catalog-fix109.css?v=6.8.0-fix109'));
});

check('release, HTML i manifest źródeł są zgodne z FIX99 bez zmiany wersji produktu ani D1', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX111');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix111-active-view-photo-queue-20261109');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix111-active-view-photo-queue-20261109');
  assert.equal(release.photoCatalog.runtime, 'assets/photo-catalog-fix109.js?v=6.8.0-fix109');
  assert.equal(release.photoCatalog.stylesheet, 'assets/photo-catalog-fix109.css?v=6.8.0-fix109');
  assert.ok(release.photoCatalog.displayedPhotoCounter.includes('local homepage photographs'));
  assert.equal(release.photoCatalog.requiresBrowserOnline, false);
  assert.equal(registry.hotfix, 'FIX94');
  assert.equal(registry.runtimeHotfix, 'FIX109');
  assert.equal(registry.onlinePhotoRuntime, 'assets/photo-catalog-fix109.js?v=6.8.0-fix109');
  assert.ok(html.includes('content="FIX96"'));
  assert.ok(html.includes('content="FIX97"'));
  assert.ok(html.includes('content="FIX106"'));
  assert.ok(html.includes('content="FIX107"'));
  assert.ok(html.includes('6.8.0 FIX109 | GLOBAL ACADEMY PRO'));
  assert.ok(html.includes('content="FIX106"'));
  assert.ok(html.includes('content="FIX107"'));
});

check('OneClick i Watcher blokują publikację bez testu układu 13 lokalnych zdjęć', () => {
  for (const file of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']) {
    const source = read(file);
    assert.ok(source.includes("'scripts/test-homepage-photo-layout-fix96.mjs'"), `${file} nie uruchamia regresji FIX96`);
    assert.ok(source.includes("'scripts/test-homepage-static-photo-publication-fix97.mjs'"), `${file} nie uruchamia regresji FIX97`);
    assert.ok(source.includes('verifyHomepageShowcase'), `${file} nie używa wspólnego walidatora galerii`);
  }
});

console.log(`FIX96 HOMEPAGE PHOTO LAYOUT SUMMARY: ${checks.length}/${checks.length} PASS`);
