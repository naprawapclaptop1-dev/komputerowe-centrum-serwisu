import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publisher = fs.readFileSync(path.join(root, 'ONECLICK_AKADEMIA.js'), 'utf8');
const webAssets = path.join(root, 'WEB_PUBLISH', 'assets');
const studioCss = path.join(webAssets, 'advanced-learning-studio-620.css');
const homeCss = path.join(webAssets, 'home-refresh-fix30.css');
const photoJs = path.join(webAssets, 'photo-unique-thumbnails-fix30.js');

for (const asset of [studioCss, homeCss, photoJs]) {
  assert.ok(fs.existsSync(asset), `Required asset must exist: ${path.basename(asset)}`);
}
assert.match(publisher,
  /const studioCss\s*=\s*fs\.readFileSync\(path\.join\(WEB\s*,\s*'assets'\s*,\s*'advanced-learning-studio-620\.css'\)\s*,\s*'utf8'\)\s*;/,
  'Publisher must read the advanced learning studio CSS as its own file');
assert.match(publisher,
  /const photoLockScript\s*=\s*fs\.readFileSync\(path\.join\(WEB\s*,\s*'assets'\s*,\s*'photo-unique-thumbnails-fix30\.js'\)\s*,\s*'utf8'\)\s*;/,
  'Publisher must read the photo uniqueness JS as its own file');
assert.match(publisher,
  /const homeRefreshCss\s*=\s*fs\.readFileSync\(path\.join\(WEB\s*,\s*'assets'\s*,\s*'home-refresh-fix30\.css'\)\s*,\s*'utf8'\)\s*;/,
  'Publisher must read the home refresh CSS as its own file');
assert.doesNotMatch(publisher,
  /path\.join\(WEB\s*,\s*'assets'\s*,\s*'advanced-learning-studio-620\.css'\s*,\s*'home-refresh-fix30\.css'\s*,\s*'photo-unique-thumbnails-fix30\.js'/,
  'The former combined non-existent path must not return');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'index.html'), 'utf8');
const statusApi = fs.readFileSync(path.join(root, 'functions', 'api', 'auth', 'status.js'), 'utf8');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';
assert.equal(release.build, expectedBuild, 'release.json must identify FIX36');
assert.ok(html.includes(expectedBuild), 'HTML build metadata must match FIX36');
assert.ok(statusApi.includes(expectedBuild), 'Account status API build must match FIX36');
assert.ok(watcher.includes('release.json') && watcher.includes('EXPECTED_BUILD'), 'Watcher must derive its build guard from release.json');
console.log('PASS: FIX31 publisher reads all three CSS/JS assets separately; build guards are aligned for FIX35.');
