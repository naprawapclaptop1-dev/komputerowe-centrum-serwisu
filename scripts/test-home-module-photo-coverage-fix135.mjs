#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const html = read('WEB_PUBLISH/index.html');
const catalog = read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const prime = read('WEB_PUBLISH/assets/homepage-photo-prime-fix118.js');
const sw = read('WEB_PUBLISH/service-worker.js');
const sources = json('WEB_PUBLISH/media/photo-sources-online.json');
const library = json('WEB_PUBLISH/media/home-photo-library-fix118.json');
const release = json('WEB_PUBLISH/release.json');
const oneClick = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const proxyHelperText = read('functions/_photo-proxy-fix131.js');
const helper = await import(`data:text/javascript;base64,${Buffer.from(proxyHelperText, 'utf8').toString('base64')}`);

const expected = {
  'home-module-repairmaster': ['multimeter-bench','meter'],
  'home-module-components': ['ram-modules','ram'],
  'home-module-ultimate3d': ['motherboard-closeup','board'],
  'home-module-labplus': ['electronics-circuit-macro-40342987','electronics'],
  'home-tech-slot-14': ['data-storage','storage'],
  'home-tech-slot-15': ['gpu-cooling-heatsink-fans','cooling'],
  'home-module-courses': ['pc-hardware','gpu'],
  'home-module-checklists': ['vram-qimonda-gddr3-chip','vram'],
  'home-module-modelcenter': ['board-motherboard-black-14887694','board'],
  'home-tech-slot-19': ['cpu-ram-modules-37113174','ram'],
  'home-module-knowledge': ['ram-desktop-dimm-corsair','ram'],
  'home-module-cloudchat': ['vram-samsung-gddr3-chip','vram'],
  'home-tech-slot-22': ['bios-chips-pair-commons','bios'],
  'home-module-14': ['gpu-msi-geforce-rtx3070','gpu'],
  'home-module-15': ['usb-c-laptop-port','port'],
  'home-module-16': ['board-motherboard-microchips-6755074','board'],
  'home-module-17': ['network-switch-ethernet-6466143','network'],
  'home-module-18': ['laptop-motherboard','laptop'],
  'home-module-19': ['network-switch-ethernet-cable-2881224','network']
};
const byId = new Map(sources.photos.map(photo => [photo.id, photo]));
const entries = new Map(library.entries.map(entry => [entry.slotId, entry]));
let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`[PASS] ${label}`); };

check('FIX135 assigns exactly 19 unique curated seeds to the 19 homepage module image IDs', () => {
  assert.deepEqual(sources.homepageSlotSeedMap, Object.fromEntries(Object.entries(expected).map(([slot, pair]) => [slot, pair[0]])));
  assert.equal(Object.keys(sources.homepageSlotSeedMap).length, 19);
  assert.equal(new Set(Object.values(sources.homepageSlotSeedMap)).size, 19);
  assert.equal(library.entries.length, 19);
  assert.equal(library.uniqueSeeds, 19);
  assert.equal(library.moduleSlotCount, 19);
  assert.deepEqual([...entries.keys()], Object.keys(expected));
});

check('all 19 HTML module images carry the exact category of their assigned photo', () => {
  for (const [slot, [seed, category]] of Object.entries(expected)) {
    const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]).filter(tag => tag.includes(`data-photo-id="${slot}"`));
    assert.equal(tags.length, 1, `${slot} HTML image count`);
    assert.ok(tags[0].includes(`data-photo-kind="${category}"`), `${slot} should declare category ${category}`);
    assert.equal(sources.homepageSlotSeedMap[slot], seed);
    assert.equal(byId.get(seed)?.category, category);
  }
});

check('all 19 selected source records have a valid same-origin raster URL, source page, author and license', () => {
  const seeds = Object.values(expected).map(pair => pair[0]);
  for (const seed of seeds) {
    const photo = byId.get(seed);
    assert.ok(photo, `missing seed ${seed}`);
    assert.equal(photo.asset, `/media/photos/${seed}.jpg`);
    assert.match(photo.sourceAsset, /^https:\/\//);
    assert.match(photo.page, /^https:\/\//);
    assert.ok(photo.author && photo.license && photo.licenseUrl);
  }
});

check('the metadata filter excludes people, faces, hands and non-photographic material from every assigned seed', () => {
  const forbidden = /\b(?:people|person|human|man|woman|hand|hands|finger|face|teacher|student|technician|worker|classroom|group|osoba|osoby|czlowiek|rece|dlonie|technik|serwisant|nauczyciel|uczen)\b/i;
  const nonPhoto = /\b(?:diagram|flowchart|schematic|infographic|illustration|vector graphic|clip art|logo|icon|poster|screenshot|blueprint|worksheet|presentation slide|topology diagram|mind map|wiring diagram|circuit diagram)\b/i;
  for (const seed of Object.values(expected).map(pair => pair[0])) {
    const photo = byId.get(seed);
    const text = [photo.topic, photo.tags, photo.description, photo.page, photo.sourceAsset].join(' ');
    assert.ok(!forbidden.test(text), `${seed} includes forbidden subject metadata`);
    assert.ok(!nonPhoto.test(text), `${seed} is a diagram/illustration rather than a photo`);
  }
});

check('offline photo library entries exactly mirror slot, seed, category, license and same-origin asset', () => {
  for (const [slot, [seed, category]] of Object.entries(expected)) {
    const entry = entries.get(slot), photo = byId.get(seed);
    assert.equal(entry.seedId, seed);
    assert.equal(entry.category, category);
    assert.equal(entry.assetUrl, `/media/photos/${seed}.jpg`);
    assert.equal(entry.sourceAsset, photo.sourceAsset);
    assert.equal(entry.sourcePage, photo.page);
    assert.equal(entry.creator, photo.author);
    assert.equal(entry.license, photo.license);
    assert.equal(entry.licenseUrl, photo.licenseUrl);
  }
  assert.equal(library.hotfix, 'FIX135');
  assert.equal(library.cacheName, 'academy-photo-library-fix135');
});

check('the live catalog seed-owner map matches the manifest and has no specialist-owned curated seeds', () => {
  for (const [slot, [seed]] of Object.entries(expected)) {
    assert.ok(catalog.includes(`'${slot}': ['${seed}']`), `${slot} runtime seed owner`);
  }
  for (const slot of ['home-specialist-laptop','home-specialist-bios','home-specialist-storage','home-specialist-windows','home-specialist-network','home-specialist-cpu-ram']) {
    assert.ok(!catalog.includes(`'${slot}': [`), `${slot} must not reserve one of the 19 module seeds`);
  }
});

check('topic validation allows the intended equipment evidence for resource, knowledge, network and GPU module cards', () => {
  assert.match(catalog, /gddr\|vram\|ram\|dimm\|ethernet\|network\|bios\|firmware\|cooling\|multimeter\|resistor\|usb\|port/);
  assert.match(catalog, /hardware\|gpu\|graphics card\|geforce\|radeon/);
  assert.ok(catalog.includes('img.dataset.photoKind || img.dataset.photoCategory'));
});

check('prime runtime, catalog runtime and Service Worker share FIX135 build/cache namespaces', () => {
  assert.ok(prime.includes(`const VERSION = '${release.latestHotfixBuild}'`));
  assert.ok(prime.includes("const MANIFEST_URL = '/media/photo-sources-online.json?v=6.8.0-fix135'"));
  assert.ok(prime.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
  assert.ok(prime.includes('EXPECTED_SLOTS = 19'));
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix135-home-module-photo-coverage-20261113'"));
  assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
  assert.ok(sw.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix135'));
  assert.ok(sw.includes('photo-catalog-fix115.js?v=6.8.0-fix135'));
  assert.ok(sw.includes("url.pathname.startsWith('/media/photos/')"));
});

check('release metadata keeps version 6.8.0, records FIX135 and does not request a D1 migration', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX135');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix135-home-module-photo-coverage-20261113');
  assert.equal(release.fix135_home_module_photo_coverage.modulePhotoSlots, 19);
  assert.equal(release.fix135_home_module_photo_coverage.uniqueCuratedSeeds, 19);
  assert.equal(release.fix135_home_module_photo_coverage.d1Migrations, false);
  assert.equal(release.fix135_home_module_photo_coverage.productionPublished, false);
});

check('OneClick and Watcher reject a partial or category-mismatched 19-card photo map', () => {
  assert.ok(oneClick.includes("releaseJson.latestHotfix !== 'FIX135'"));
  assert.ok(oneClick.includes('modulePhotoIdsFix135'));
  assert.ok(watcher.includes('modulePhotoCoverageValidFix135'));
  assert.ok(watcher.includes('expectedModulePhotoSlotsFix135'));
  assert.ok(watcher.includes('remoteModulePhotoCoverageValidFix135'));
});

check('the existing FIX131 same-origin proxy retains its fixed 19-source allowlist and FIX134 safe redirects', () => {
  assert.equal(Object.keys(helper.PHOTO_SOURCES_FIX131).length, 19);
  for (const seed of Object.values(expected).map(pair => pair[0])) {
    assert.equal(helper.PHOTO_SOURCES_FIX131[seed], byId.get(seed).sourceAsset, `proxy allowlist ${seed}`);
  }
  assert.ok(proxyHelperText.includes("redirect: 'manual'"));
  assert.ok(proxyHelperText.includes('MAX_SAFE_REDIRECTS = 4'));
  assert.ok(proxyHelperText.includes('FIX134-SAFE-REDIRECTS'));
});

console.log(`FIX135 HOMEPAGE MODULE PHOTO COVERAGE: ${passed}/${passed} PASS`);
