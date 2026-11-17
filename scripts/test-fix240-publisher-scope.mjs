import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const one = fs.readFileSync('ONECLICK_AKADEMIA.js', 'utf8');
const watcher = fs.readFileSync('AUTO_PUBLISH_WATCHER.js', 'utf8');
const release = JSON.parse(fs.readFileSync('WEB_PUBLISH/release.json', 'utf8'));
const oneStart = one.indexOf('// FIX231–FIX239:');
const oneEnd = one.indexOf('const fix176Meta', oneStart);
assert.ok(oneStart >= 0 && oneEnd > oneStart, 'nie znaleziono zakresu FIX231–FIX239 w OneClick');
const oneGuard = one.slice(oneStart, oneEnd);
assert.ok(oneGuard.includes('{html:indexHtml,serviceWorker:sw,webRoot:WEB,assets:fix231239Assets}'), 'OneClick musi używać indexHtml i sw zadeklarowanych w verifyWeb');
assert.ok(oneGuard.includes('indexHtml.includes(\'platform-enhancements-fix231-239.js?v=6.8.0-fix239\')'), 'OneClick musi sprawdzać indexHtml');
assert.ok(!oneGuard.includes('{html:html,'), 'nie wolno używać niezadeklarowanej zmiennej html w verifyWeb');
assert.ok(!/\bhtml\.includes\(/.test(oneGuard), 'nie wolno odwoływać się do niezadeklarowanej zmiennej html');

const watchStart = watcher.indexOf('// FIX231–FIX239:');
const watchEnd = watcher.indexOf('const fix176Meta', watchStart);
assert.ok(watchStart >= 0 && watchEnd > watchStart, 'nie znaleziono zakresu FIX231–FIX239 w watcherze');
const watchGuard = watcher.slice(watchStart, watchEnd);
assert.ok(watchGuard.includes('{html,serviceWorker:sw,webRoot:WEB,assets:fix231239Assets}'), 'watcher ma używać własnych html i sw');
assert.ok(watchGuard.includes("html.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239')"), 'watcher ma sprawdzać własne html');
assert.equal(release.academyFix240?.hotfix, 'FIX240');
assert.equal(release.academyFix240?.productVersion, '6.8.0');
assert.equal(release.academyFix240?.productionDeployPerformed, false);

for (const file of ['ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js']) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(check.status, 0, `${file}: ${check.stderr || check.stdout}`);
}
console.log('[PASS] OneClick FIX231–FIX239 uses declared indexHtml and sw aliases');
console.log('[PASS] watcher FIX231–FIX239 uses its local html and sw aliases');
console.log('[PASS] release metadata FIX240 retains product version 6.8.0');
console.log('[PASS] both publishers pass node --check');
console.log('FIX240 PUBLISHER SCOPE: 4/4 PASS');
