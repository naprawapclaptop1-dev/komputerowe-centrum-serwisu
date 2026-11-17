import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const start = runtime.indexOf('  // Metadata blacklist: a JPEG can still be a diagram/flowchart.');
const end = runtime.indexOf('  function photoIdentity(photo) {', start);
assert.ok(start >= 0 && end > start, 'Runtime must contain the FIX115 pure photo policy block.');
const policyBlock = runtime.slice(start, end);
const prelude = `
const clean = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\\s+/g,' ').trim().slice(0,500);
function normalizeTopicText(value){return clean(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/[_–—]/g,' ').replace(/\\s+/g,' ').trim();}
function photoTopicText(photo){return normalizeTopicText([photo.title,photo.tags,photo.description,photo.topic,photo.alt].filter(Boolean).join(' '));}
function isVramPhotoRelevant(photo){const text=photoTopicText(photo);if(/\\b(dimm|so[- ]?dimm|sodimm|udimm|desktop ram|system ram|memory module|ram stick)\\b/.test(text))return false;return /\\b(vram|gddr[3-7x]?|hbm[23e]?|graphics memory|video memory|gpu memory|video card memory|graphics card memory)\\b/.test(text);}
`;
const sandbox = {};
vm.runInNewContext(`${prelude}\n${policyBlock}\nthis.policy={isNonPhotographicVisual,isPhotoRelevant,isPhotoRelevantForSlot};`, sandbox);
const policy = sandbox.policy;
assert.ok(policy, 'Could not load FIX115 matching policy.');
const makePhoto = item => ({
  seedId: item.id, providerId: `${String(item.provider||'Pexels').toLowerCase().replace(/[^a-z0-9]+/g,'-')}:${item.id}`,
  title: item.topic, tags: `${item.tags||''} ${item.topic||''}`, description: item.description||'',
  category:item.category, url:item.asset, page:item.page, author:item.author, license:item.license
});
const seedById = new Map(manifest.photos.map(item => [item.id, item]));
for (const item of manifest.photos) {
  const photo = makePhoto(item);
  assert.equal(policy.isNonPhotographicVisual(photo), false, `Curated real photo seed wrongly rejected as non-photo: ${item.id}`);
  assert.equal(policy.isPhotoRelevant(photo, item.category), true, `Curated seed category mismatch: ${item.id}/${item.category}`);
}
for (const [slotId, seedId] of Object.entries(manifest.homepageSlotSeedMap)) {
  const item = seedById.get(seedId);
  assert.ok(item, `Missing curated seed for ${slotId}: ${seedId}`);
  const photo = makePhoto(item);
  assert.equal(policy.isPhotoRelevantForSlot(photo, item.category, slotId), true, `Seed rejected for its own homepage slot: ${slotId}/${seedId}`);
}
const diagramSamples = [
  {title:'Computer classroom training flowchart',tags:'teacher students computer lab education flow chart',description:'A training diagram for students',category:'certification'},
  {title:'Electronics schematic for technician course',tags:'electronics training classroom students schematic diagram',description:'Technical drawing',category:'certification'},
  {title:'Computer repair infographic poster',tags:'computer repair training instructor classroom infographic',description:'Poster and illustration',category:'certification'},
  {title:'Network topology diagram',tags:'router network computer ethernet diagram',description:'Vector drawing',category:'network'}
];
for (const sample of diagramSamples) {
  assert.equal(policy.isNonPhotographicVisual(sample), true, `Diagram-like media not blocked: ${sample.title}`);
  assert.equal(policy.isPhotoRelevant(sample, sample.category), false, `Diagram accepted as a photo: ${sample.title}`);
}
const staleCourse = diagramSamples[0];
assert.equal(policy.isPhotoRelevantForSlot(staleCourse, 'certification', 'home-module-courses'), false, 'Stale course diagram must be released during migration.');
const courseSeed = makePhoto(seedById.get(manifest.homepageSlotSeedMap['home-module-courses']));
assert.equal(policy.isPhotoRelevantForSlot(courseSeed, 'certification', 'home-module-courses'), true, 'The curated classroom photo must remain available to the course tile.');
assert.ok(runtime.includes("const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix115'"));
assert.ok(runtime.includes("const LEGACY_ASSIGN_KEY_FIX111 = 'academyPhotoCatalogAssignmentsFix111'"));
assert.ok(runtime.includes('isPhotoRelevantForSlot(photo, photo.category, id)'), 'Legacy assignment restore must revalidate the exact slot.');
assert.ok(runtime.includes('if (!isPhotoRelevantForSlot(photo, liveInfo.category, liveInfo.id))'), 'Final image application must reject slot mismatches.');
assert.ok(runtime.includes('takeOnline(info.category, info.id)'), 'Online candidate selection must know the destination slot.');
assert.ok(runtime.includes('function releaseReservation(photo)'), 'Invalid assignments must release global uniqueness reservations.');
console.log(`[PASS] ${manifest.photos.length}/${manifest.photos.length} curated seeds pass the stricter photo/category policy.`);
console.log(`[PASS] ${Object.keys(manifest.homepageSlotSeedMap).length}/21 homepage seed slots resolve to their own photo.`);
console.log('[PASS] Diagram, flowchart, schematic and infographic samples are rejected as photographs.');
console.log('[PASS] Stale FIX111 course diagram is rejected; the curated classroom seed remains accepted.');
console.log('[PASS] FIX111 assignment migration, slot revalidation and final apply guard are wired.');
console.log('FIX115 PHOTO TOPIC/MEDIA QUALITY: 5/5 PASS');
