import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'WEB_PUBLISH/assets');
const files = [
  'academy-data.js',
  'academy-expansion.js',
  'academy-ultra-lessons.js',
  'academy-ultra-lessons-2.js',
  'academy-ultra-lessons-3.js',
  'academy-ultimate-lessons-600.js',
  'academy-master-lessons-610.js'
];
const window = {};
const context = { window, Math, Date, JSON, Object, Array, String, Number, RegExp, Set, Map, console };
for (const file of files) {
  vm.runInNewContext(fs.readFileSync(path.join(assets, file), 'utf8'), context, { filename: file });
}
const data = window.ACADEMY_DATA;
assert.ok(data && Array.isArray(data.courseLessons), 'academy data or courseLessons missing');
assert.equal(data.courseLessons.length, 1060, 'full expanded course catalogue must contain 1060 lessons');

const duplicates = (items, keyFn) => {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.values()].filter(group => group.length > 1);
};
const unique = values => new Set(values).size === values.length;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pl-PL');
const lessons = data.courseLessons;

assert.ok(unique(lessons.map(x => x.id)), 'course lesson IDs must be unique');
assert.equal(duplicates(lessons, x => norm(x.title)).length, 0, 'Polish course titles must be unique');
assert.equal(duplicates(lessons, x => norm(x.titleEn)).length, 0, 'English course titles must be unique');
for (const lesson of lessons) {
  assert.ok(lesson.id && lesson.title && lesson.category, `lesson metadata missing for ${lesson.id || 'unknown'}`);
  assert.ok(Array.isArray(lesson.steps) && lesson.steps.length >= 4, `Polish procedure too short for ${lesson.id}`);
  assert.ok(lesson.steps.every(x => typeof x === 'string' && x.trim()), `empty Polish step in ${lesson.id}`);
  if (lesson.stepsEn !== undefined) {
    assert.ok(Array.isArray(lesson.stepsEn) && lesson.stepsEn.length >= 4, `English procedure too short for ${lesson.id}`);
    assert.ok(lesson.stepsEn.every(x => typeof x === 'string' && x.trim()), `empty English step in ${lesson.id}`);
  }
}
const allPolishSteps = lessons.flatMap(x => x.steps || []).map(norm);
const allEnglishSteps = lessons.flatMap(x => x.stepsEn || []).map(norm);
assert.ok(unique(allPolishSteps), 'individual Polish step text must not be repeated across the course catalogue');
assert.ok(unique(allEnglishSteps), 'individual English step text must not be repeated across the course catalogue');

for (const [field, label] of [
  ['steps', 'Polish procedure sequences'],
  ['stepsEn', 'English procedure sequences'],
  ['verify', 'Polish verification procedures'],
  ['verifyEn', 'English verification procedures'],
  ['diagnosis', 'diagnosis blocks'],
  ['symptomsEn', 'English symptom summaries'],
  ['bodyEn', 'English lesson overviews']
]) {
  assert.equal(duplicates(lessons, x => typeof x[field] === 'string' ? norm(x[field]) : Array.isArray(x[field]) ? x[field].map(norm).join('\n---\n') : '').length, 0, `${label} must not be duplicated`);
}
for (const collection of ['faults', 'beginnerLessons', 'courseTopics', 'htmlArticles', 'manualChapters']) {
  const items = Array.isArray(data[collection]) ? data[collection] : [];
  const ids = items.filter(x => x.id).map(x => x.id);
  assert.ok(unique(ids), `${collection} IDs must be unique`);
  assert.equal(duplicates(items, x => norm(x.title)).length, 0, `${collection} titles must be unique within their own collection`);
}

// Repeated warning text is intentionally retained where it expresses the same electrical, ESD or battery-safety rule.
const warningRepeatGroups = duplicates(lessons, x => norm(x.warning)).length;
const warningEnRepeatGroups = duplicates(lessons, x => norm(x.warningEn)).length;
assert.ok(warningRepeatGroups > 0, 'shared safety warnings should remain available');

const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'WEB_PUBLISH/service-worker.js'), 'utf8');
for (const file of files) {
  assert.ok(html.includes(`assets/${file}?v=6.8.0-fix28-catalog`), `index.html must cache-bust ${file}`);
  assert.ok(sw.includes(`/assets/${file}?v=6.8.0-fix28-catalog`), `Service Worker core must preload ${file}`);
}
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/release.json'), 'utf8'));
assert.equal(release.release, '6.8.0');
assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.equal(release.fix28_quality_audit.production_published, false);
assert.match(release.fix28_quality_audit.content_catalogue, /1060/);

console.log(`PASS: ${lessons.length} course lessons; unique Polish/English titles and IDs; no repeated individual steps or full sequences, diagnoses or verification text; safety warnings remain shared (${warningRepeatGroups} PL and ${warningEnRepeatGroups} EN duplicate groups); 7 cache-busted source files.`);
