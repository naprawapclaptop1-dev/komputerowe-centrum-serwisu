'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { verifySupportViewStructure } = require('./support-view-guard-fix35');
const root = path.resolve(__dirname, '..');
const publisher = fs.readFileSync(path.join(root, 'ONECLICK_AKADEMIA.js'), 'utf8');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const htmlPath = path.join(root, 'WEB_PUBLISH', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';
assert.equal(release.build, expectedBuild, 'release.json must carry FIX36 build');
assert.ok(html.includes(expectedBuild), 'index.html must carry FIX35 academy-build');

const valid = verifySupportViewStructure(html);
assert.equal(valid.viewCount, 35, '33 legacy views plus Global Academy and FIX145 Academy PRO must remain independent');
assert.equal(valid.supportNodes, 16, 'all legacy and FIX36 support sections remain inside support tab');
assert.ok(publisher.includes("require('./scripts/support-view-guard-fix35')") && publisher.includes('verifySupportViewStructure(indexHtml)'), 'one-click publisher must enforce the support guard');
assert.ok(watcher.includes("require('./scripts/support-view-guard-fix35')") && watcher.includes('verifySupportViewStructure(html)'), 'watcher must enforce the same support guard');

const supportOpen = html.indexOf('<section class="view-section" id="view-support"');
const repairOpen = html.indexOf('<section class="view-section" id="view-repairmaster"');
assert.ok(supportOpen > 0 && repairOpen > supportOpen, 'support and Repair Master AI must be separate view roots');
const supportEnd = html.indexOf('</section>', html.indexOf('class="support-transparency"', supportOpen));
assert.ok(supportEnd > supportOpen && supportEnd < repairOpen, 'support contents must close before the next view begins');

// Re-create the previous defect: an extra closing DIV directly after the support video.
const caption = '<small>Film został przebudowany z sześciu ujęć opartych na lokalnych ilustracjach technicznych i sprzęcie komputerowym, bez widocznych osób. Oryginalna ścieżka narracji została zachowana, a polskie napisy pozostają opcjonalne.</small>';
assert.ok(html.includes(caption), 'support video caption fixture must exist');
const corrupted = html.replace(caption + '\n          </div>\n        </section>', caption + '\n          </div></div>\n        </section>');
assert.notEqual(corrupted, html, 'mutation must insert the old extra DIV');
assert.throws(() => verifySupportViewStructure(corrupted), /Nieprawidłowe zamknięcie|Nie zamknięto kontenera|poza wspólnym kontenerem/, 'guard must reject leaked support markup caused by an extra close');

// A support grid moved into the Repair Master AI view is also a release-blocking error.
const repairPos = html.indexOf('<section class="view-section" id="view-repairmaster"');
const repairOpenEnd = html.indexOf('>', repairPos) + 1;
const repairCorrupt = html.slice(0, repairOpenEnd) + '\n        <div class="support-grid"></div>' + html.slice(repairOpenEnd);
assert.throws(() => verifySupportViewStructure(repairCorrupt), /Element wsparcia|niezależnych widoków|Nieprawidłowe zamknięcie/, 'guard rejects malformed view boundaries');

console.log('PASS FIX146: 35 independent views (33 legacy + Global Academy + FIX145 Academy PRO); legacy support and FIX36 community sections remain inside #view-support; previous extra-DIV defect rejected.');
