import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix98.js');

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
    this.style = {}; this.hidden = false; this.textContent = ''; this.title = '';
    this.parentNode = null; this.parentElement = null;
  }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; this.children.push(node); } }
  appendChild(node) { this.append(node); return node; }
  prepend(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; } this.children.unshift(...nodes); }
  addEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  setAttribute() {}
}
const body = new FakeElement('body');
const document = {
  readyState: 'complete', body, documentElement: new FakeElement('html'),
  addEventListener() {}, getElementById() { return null; }, querySelector() { return null; },
  querySelectorAll() { return []; }, createElement(tag) { return new FakeElement(tag); }
};
const stored = new Map();
const localStorage = { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
const window = { ACADEMY_ART: {}, addEventListener() {}, setInterval() { return 1; } };
const fetch = async url => String(url).includes('photo-sources-online.json')
  ? { ok: true, status: 200, json: async () => manifest }
  : { ok: false, status: 404, json: async () => ({}) };
const context = {
  window, document, localStorage, navigator: { onLine: true }, location: { href: 'https://academy.example/' },
  URL, URLSearchParams, Date, Map, Set, Array, String, Number, Math, Object, JSON, RegExp, Promise,
  Float64Array, encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout, fetch,
  HTMLImageElement: class HTMLImageElement {}, console: { info() {}, warn() {}, error() {} }
};
vm.runInNewContext(runtime, context, { filename: 'photo-catalog-fix98.js', timeout: 10000 });
await new Promise(resolve => setTimeout(resolve, 0));
const api = window.NPA_PHOTO_CATALOG_FIX98;
assert.ok(api, 'FIX98 photo runtime API is available');

const slotGroups = [
  { section: 'module', slots: [
    ['home-module-repairmaster','meter'], ['home-module-components','ram'],
    ['home-module-ultimate3d','board'], ['home-module-labplus','solder'],
    ['home-module-courses','certification'], ['home-module-checklists','certification'],
    ['home-module-modelcenter','board'], ['home-module-knowledge','certification'],
    ['home-module-cloudchat','certification'], ['home-module-14','diagnostics'],
    ['home-module-15','electronics'], ['home-module-16','board'],
    ['home-module-17','ram'], ['home-module-18','laptop'], ['home-module-19','certification']
  ]},
  { section: 'specialist', slots: [
    ['home-specialist-laptop','laptop'], ['home-specialist-bios','bios'],
    ['home-specialist-storage','storage'], ['home-specialist-windows','diagnostics'],
    ['home-specialist-network','network'], ['home-specialist-cpu-ram','ram']
  ]}
];
const assignments = [];
const identitySet = new Set();
for (const group of slotGroups) {
  for (const [slotId, category] of group.slots) {
    const photo = api.takeSeed(category);
    assert.ok(photo, `${slotId}: curated seed pool is not empty for ${category}`);
    assert.equal(photo.category, category, `${slotId}: seed category matches slot`);
    assert.equal(api.isPhotoRelevant(photo, category), true, `${slotId}: photo is relevant to ${category}`);
    assert.ok(api.licenseAllowed(photo.license), `${slotId}: license is allowed`);
    assert.ok(photo.url.startsWith('https://') && photo.page.startsWith('https://'), `${slotId}: HTTPS asset and source page`);
    for (const key of api.photoIdentity(photo)) {
      assert.equal(identitySet.has(key), false, `${slotId}: duplicate global photo identity ${key}`);
      identitySet.add(key);
    }
    assignments.push({ slotId, category, providerId: photo.providerId, author: photo.author, license: photo.license, page: photo.page, url: photo.url });
  }
}
assert.equal(assignments.length, 21);
assert.equal(new Set(assignments.map(item => item.slotId)).size, 21);
assert.equal(new Set(assignments.map(item => item.page)).size, 21);
assert.equal(new Set(assignments.map(item => item.url)).size, 21);
console.log('[PASS] Wszystkie 15 kafelków modułów otrzymują zgodne, licencjonowane źródło zdjęcia.');
console.log('[PASS] Wszystkie 6 ścieżek specjalistycznych otrzymuje zgodne, licencjonowane źródło zdjęcia.');
console.log('[PASS] 21 miejsc ma 21 odrębnych URL, stron źródłowych, autorów i prawidłowych kategorii.');
console.log('FIX98 HOME PHOTO SEED QUEUE SUMMARY: 3/3 PASS');
