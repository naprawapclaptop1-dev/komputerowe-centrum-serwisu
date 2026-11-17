import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const watcher = read('AUTO_PUBLISH_WATCHER.js');
assert.equal(release.release, '6.8.0');
assert.equal(release.build, expectedBuild);
for (const [file, marker] of [
  ['WEB_PUBLISH/index.html', expectedBuild],
  ['functions/api/auth/status.js', expectedBuild],
 
  ['ONECLICK_AKADEMIA.js', "releaseVersion !== '6.8.0'"],
  ['WEB_PUBLISH/service-worker.js', 'fix39-support-community-guard-20261104'],
]) assert.ok(read(file).includes(marker), `${file} nie zawiera aktualnego build ID`);
assert.ok(watcher.includes('release.json') && watcher.includes('EXPECTED_BUILD'), 'watcher must load the authoritative build ID dynamically');
const legacy = read('scripts/test-release-620-contract.js');
assert.ok(legacy.includes(expectedBuild), 'kompatybilny test 620 musi sprawdzać aktualne wydanie');
assert.ok(!/release\.release\s*!==\s*['"]6\.2\.0['"]/.test(legacy), 'nie wolno wymagać cofnięcia release do 6.2.0');
assert.ok(fs.existsSync(path.join(root, 'WEB_PUBLISH/assets/ultimate-workshop-620.js')));
assert.ok(fs.existsSync(path.join(root, 'WEB_PUBLISH/assets/ultimate-workshop-620.css')));
assert.ok(read('ONECLICK_AKADEMIA.js').includes('expectedBuild.startsWith(`${releaseVersion}-`)'), 'publisher must validate the build prefix from release.json');
const runner = read('WYKONAJ_TESTY_FIX47.cmd');
assert.ok(runner.includes('scripts\\test-*.js') && runner.includes('scripts\\test-*.mjs') && runner.includes('FIX47') && runner.includes('node --check'));
console.log('PASS compatibility contract (FIX40): current 6.8.0 build ID aligned across release, HTML, API, publisher, watcher and PWA; stale 6.2.0 contract replaced while legacy 620 modules remain.');
