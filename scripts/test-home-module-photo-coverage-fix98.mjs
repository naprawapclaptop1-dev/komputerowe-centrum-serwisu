import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix98.js');
const runtimeCss = read('WEB_PUBLISH/assets/photo-catalog-fix98.css');
const homeCss = read('WEB_PUBLISH/assets/home-learning-fix75.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const one = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }
const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]+)"`, 'i'))?.[1] || '';
const stripQuery = value => String(value || '').split(/[?#]/)[0].replace(/\/$/, '').toLowerCase();
const section = html.match(/<div class="np640-module-grid[^\"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
const specialist = html.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0] || '';
const moduleButtons = [...section.matchAll(/<button\b[\s\S]*?<\/button>/gi)].map(m => m[0]);
const moduleImages = [...section.matchAll(/<img\b[^>]*data-photo-id="(home-module-[^"]+)"[^>]*>/gi)].map(m => m[0]);
const specialistImages = [...specialist.matchAll(/<img\b[^>]*data-photo-id="(home-specialist-[^"]+)"[^>]*>/gi)].map(m => m[0]);

check('FIX98 zachowuje produkt 6.8.0 i aktywny runtime fotografii', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX98');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix98-home-module-specialist-photo-coverage-20261108');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix98-all-home-modules-and-specialist-photos-20261108');
  assert.equal(release.photoCatalog.runtime, 'assets/photo-catalog-fix98.js?v=6.8.0-fix98');
  assert.equal(release.photoCatalog.stylesheet, 'assets/photo-catalog-fix98.css?v=6.8.0-fix98');
  assert.equal(manifest.runtimeHotfix, 'FIX98');
  assert.equal(manifest.hotfix, 'FIX94', 'historyczna linia kontraktu manifestu zostaje zachowana');
});

check('Katalog strony głównej ma 19 modułów i 15 odrębnych pól dla zdjęć online', () => {
  assert.equal(moduleButtons.length, 19);
  assert.equal(moduleImages.length, 15);
  const ids = moduleImages.map(tag => attr(tag, 'data-photo-id'));
  assert.equal(new Set(ids).size, 15);
  for (const tag of moduleImages) {
    assert.ok(attr(tag, 'data-photo-kind'), 'każda karta musi mieć kategorię zdjęcia');
    assert.ok(attr(tag, 'data-photo-title'), 'każda karta musi mieć kontekst tematyczny zdjęcia');
    assert.ok(attr(tag, 'alt'), 'każda karta musi mieć tekst alternatywny');
    assert.match(attr(tag, 'src'), /\.svg(?:[?#]|$)/i, 'fallback SVG jest jawny i zastępowany dopiero po dopasowaniu fotografii');
  }
});

check('Sześć specjalizacji ma własne elementy IMG zamiast samych ikon', () => {
  assert.equal(specialistImages.length, 6);
  const ids = specialistImages.map(tag => attr(tag, 'data-photo-id'));
  assert.deepEqual(new Set(ids), new Set([
    'home-specialist-laptop','home-specialist-bios','home-specialist-storage',
    'home-specialist-windows','home-specialist-network','home-specialist-cpu-ram'
  ]));
  assert.equal(new Set(ids).size, 6);
  for (const tag of specialistImages) {
    assert.ok(attr(tag, 'data-photo-kind'));
    assert.ok(attr(tag, 'data-photo-title'));
    assert.ok(attr(tag, 'alt'));
    assert.match(attr(tag, 'src'), /assets\/artwork-fix77\/module-1[4-9]\.svg$/);
  }
});

check('Kategorie 15 modułów odpowiadają ich rzeczywistym tematom', () => {
  const categoryById = Object.fromEntries(moduleImages.map(tag => [attr(tag, 'data-photo-id'), attr(tag, 'data-photo-kind')]));
  for (const [id, category] of Object.entries({
    'home-module-repairmaster':'meter','home-module-components':'ram','home-module-ultimate3d':'board',
    'home-module-labplus':'solder','home-module-courses':'certification','home-module-checklists':'certification',
    'home-module-modelcenter':'board','home-module-knowledge':'certification','home-module-cloudchat':'certification',
    'home-module-14':'diagnostics','home-module-15':'electronics','home-module-16':'board',
    'home-module-17':'ram','home-module-18':'laptop','home-module-19':'certification'
  })) assert.equal(categoryById[id], category, `${id} category`);
});

check('Kategorie 6 specjalizacji są niezależne i precyzyjne', () => {
  const categoryById = Object.fromEntries(specialistImages.map(tag => [attr(tag, 'data-photo-id'), attr(tag, 'data-photo-kind')]));
  assert.deepEqual(categoryById, {
    'home-specialist-laptop':'laptop','home-specialist-bios':'bios','home-specialist-storage':'storage',
    'home-specialist-windows':'diagnostics','home-specialist-network':'network','home-specialist-cpu-ram':'ram'
  });
});

check('Katalog ma 37 źródeł ze spójnymi metadanymi autora, strony źródłowej i licencji', () => {
  assert.equal(manifest.photos.length, 37);
  assert.equal(manifest.seedPhotoCount, 37);
  assert.equal(manifest.manualSeedCount, 37);
  for (const photo of manifest.photos) {
    assert.ok(photo.id && photo.topic && photo.category, `${photo.id}: id/topic/category`);
    assert.match(photo.page, /^https:\/\//, `${photo.id}: HTTPS source page`);
    assert.match(photo.asset, /^https:\/\//, `${photo.id}: HTTPS photo asset`);
    assert.ok(photo.author && photo.license && photo.licenseUrl, `${photo.id}: creator/license metadata`);
  }
});

check('Żadne dwa źródła katalogowe nie wskazują tego samego zdjęcia, strony ani pliku', () => {
  for (const field of ['id','page','asset']) {
    const values = manifest.photos.map(photo => field === 'id' ? photo[field] : stripQuery(photo[field]));
    assert.equal(new Set(values).size, values.length, `duplicate ${field}`);
  }
});

check('Pięć kafelków edukacyjnych ma co najmniej pięć osobnych źródeł o tematyce szkoleniowej', () => {
  const seeds = manifest.photos.filter(photo => photo.category === 'certification');
  assert.ok(seeds.length >= 5);
  for (const photo of seeds) assert.match(`${photo.topic} ${photo.tags} ${photo.description}`.toLowerCase(), /class|teacher|student|training|education|instructor/);
});

check('BIOS / UEFI ma rzeczywiste zdjęcie kości BIOS, a nie generycznej płyty głównej', () => {
  const bios = manifest.photos.find(photo => photo.id === 'bios-chips-pair-commons');
  assert.ok(bios);
  assert.equal(bios.category, 'bios');
  assert.match(bios.page, /Pair_of_BIOS_chips/i);
  assert.match(bios.tags, /BIOS chip.*EPROM.*firmware/i);
  assert.equal(bios.license, 'CC BY-SA 4.0');
  assert.match(bios.licenseUrl, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
});

check('Sieci i CPU/RAM otrzymują fotografie właściwego typu', () => {
  const network = manifest.photos.filter(photo => photo.category === 'network');
  const memory = manifest.photos.filter(photo => photo.category === 'ram');
  assert.ok(network.some(photo => /ethernet cables|network switch/i.test(`${photo.topic} ${photo.tags}`)));
  assert.ok(memory.some(photo => /cpu.*ram|ram.*ddr/i.test(`${photo.topic} ${photo.tags}`)));
});

check('Runtime kolejkuje wszystkie moduły i specjalizacje oraz zachowuje osobny stan FIX98', () => {
  assert.ok(runtime.includes('#view-home .np30-module-photo img'));
  assert.ok(runtime.includes('#view-home .np75-specialist-photo img'));
  assert.ok(runtime.includes('FIX98_ALL_MODULE_AND_SPECIALIST_PHOTOS'));
  assert.ok(runtime.includes("const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix98'"));
  assert.ok(runtime.includes("const PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix98'"));
  assert.ok(runtime.includes('academyPhotoCatalogCandidatePoolsFix98'));
});

check('Prawdziwe fotografie zachowują globalną unikalność, a SVG pozostaje jawnie oznaczonym fallbackiem', () => {
  assert.ok(runtime.includes('function photoIdentity(photo)'));
  assert.ok(runtime.includes('function perceptualHash(image)'));
  assert.ok(runtime.includes('hamming(old, photo.hash) < 10'));
  assert.ok(runtime.includes('ILUSTRACJA TECHNICZNA OFFLINE'));
  assert.ok(runtime.includes('home-specialist'));
});

check('Karty specjalizacji mają aktywny responsywny CSS i miejsce na podpis fotografa', () => {
  assert.ok(html.includes('home-learning-fix75.css?v=6.8.0-fix75'));
  assert.ok(homeCss.includes('#view-home .np75-specialist-photo'));
  assert.ok(homeCss.includes('.np75-specialist-photo .photo-credit-fix90'));
  assert.ok(homeCss.includes('@media(max-width:620px)'));
  assert.ok(runtimeCss.includes('.photo-fix90-online'));
});

check('PWA i HTML uruchamiają FIX98, a cache ma nową nazwę', () => {
  assert.ok(html.includes('content="FIX98"'));
  const runtimeIndex = html.indexOf('assets/photo-catalog-fix98.js?v=6.8.0-fix98');
  const appIndex = html.indexOf('assets/app.js?v=6.8.0-fix87-repair-visuals');
  assert.ok(runtimeIndex >= 0 && appIndex > runtimeIndex);
  assert.ok(sw.includes('nauka-6.8.0-fix94-topic-verified-photo-20261107-fix98'));
  assert.ok(sw.includes("'/assets/photo-catalog-fix98.js?v=6.8.0-fix98'"));
  assert.ok(sw.includes("'/assets/photo-catalog-fix98.css?v=6.8.0-fix98'"));
  assert.ok(sw.includes("'/media/photo-sources-online.json'"));
});

check('Pola priorytetowe i kontrola publikacji zgadzają się z liczbą slotów zdjęć', () => {
  assert.equal(release.photoCatalog.homepagePrioritySlots, 21);
  assert.equal(release.photoCatalog.modulePhotoSlots, 19);
  assert.equal(release.photoCatalog.specialistPhotoSlots, 6);
  assert.match(release.photoCatalog.photoCoverageGuard, /19 module cards \+ 6 specialist cards/);
  assert.ok(one.includes("'scripts/test-home-module-photo-coverage-fix98.mjs'"));
  assert.ok(watcher.includes("'scripts/test-home-module-photo-coverage-fix98.mjs'"));
  assert.ok(one.includes("'scripts/test-home-photo-seed-queue-fix98.mjs'"));
  assert.ok(watcher.includes("'scripts/test-home-photo-seed-queue-fix98.mjs'"));
  assert.ok(one.includes('photoRegistry.photos?.length < 37'));
  assert.ok(watcher.includes('photoSourceManifest.photos?.length < 37'));
});

console.log(`FIX98 HOME MODULE + SPECIALIST PHOTO COVERAGE SUMMARY: ${checks.length}/${checks.length} PASS`);
