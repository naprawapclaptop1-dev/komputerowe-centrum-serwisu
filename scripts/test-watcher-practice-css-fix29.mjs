import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'service-worker.js'), 'utf8');

assert.match(watcher, /practiceAssetResponse,\s*practiceCssResponse,\s*supportVideoCheck\]\s*=\s*await Promise\.all/,
  'Promise.all must bind the practice CSS Response under practiceCssResponse');
assert.match(watcher, /practiceCssResponse\.ok\s*&&\s*remotePracticeCss\.includes\('\.p27-hero'\)/,
  'Practice CSS validation must use the actual bound Response variable');
assert.doesNotMatch(watcher, /remotePracticeCssResponse/,
  'The old undefined identifier must not return');
assert.match(watcher, /if\s*\(!response\.ok\)\s*throw new Error\(`HTTP \$\{response\.status\}/,
  'A non-200 stable page must be reported before asset validation');
assert.equal(release.release, '6.8.0', 'Application semantic version must remain unchanged');
assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.match(sw, /fix39-support-community-guard-20261104/, 'Service Worker cache namespace must be new for FIX39');
console.log('PASS: watcher CSS response binding, HTTP status guard, release id and PWA cache FIX37.');
