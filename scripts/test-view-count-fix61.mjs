import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'index.html'), 'utf8');
const require = createRequire(import.meta.url);
const { verifySupportViewStructure } = require('./support-view-guard-fix35.js');
const result = verifySupportViewStructure(html);
const publisher = fs.readFileSync(path.join(root, 'ONECLICK_AKADEMIA.js'), 'utf8');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
assert.ok(publisher.includes("require('./scripts/support-view-guard-fix35')") && publisher.includes('verifySupportViewStructure(indexHtml)'), 'OneClick must enforce the expanded view guard');
assert.ok(watcher.includes("require('./scripts/support-view-guard-fix35')") && watcher.includes('verifySupportViewStructure(html)'), 'Watcher must enforce the same expanded view guard');

assert.equal(result.legacyViewCount, 33, 'all 33 historical views must remain');
assert.equal(result.viewCount, 35, '33 historical views + Global Academy + FIX145 Academy PRO');
assert.deepEqual(result.extensionViews, ['view-globalacademy', 'view-academypro']);
assert.equal(result.supportNodes, 16, 'all support subsections must remain present');
for (const [id, key] of [['view-globalacademy', 'globalacademy'], ['view-academypro', 'academypro']]) {
  assert.ok(html.includes(`id="${id}"`), `${id} must exist`);
  assert.ok(html.includes(`data-view="${key}"`), `${key} navigation must exist`);
}

function removeViewSection(source, id) {
  const startRe = new RegExp(`<section\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>`, 'i');
  const startMatch = startRe.exec(source);
  assert.ok(startMatch, `fixture must contain ${id}`);
  const start = startMatch.index;
  const tokens = /<\/?section\b[^>]*>/gi;
  tokens.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = tokens.exec(source))) {
    if (/^<\s*\//.test(token[0])) depth--;
    else if (!/\/\s*>$/.test(token[0])) depth++;
    if (depth === 0) return source.slice(0, start) + source.slice(tokens.lastIndex);
  }
  throw new Error(`Unclosed view ${id}`);
}

const withoutGlobal = removeViewSection(html, 'view-globalacademy');
assert.throws(() => verifySupportViewStructure(withoutGlobal), /Oczekiwano 33 historycznych widoków/);
const withoutHub = removeViewSection(html, 'view-academypro');
assert.throws(() => verifySupportViewStructure(withoutHub), /Oczekiwano 33 historycznych widoków/);
const duplicateHub = html.replace('<div class="toast" id="toast"', '<section class="view-section a145-view" id="view-academypro" hidden></section>\n      <div class="toast" id="toast"');
assert.throws(() => verifySupportViewStructure(duplicateHub), /unikalnymi ID|Duplikaty\/brak ID/);
const missingHubNav = html.replace(/<button\b[^>]*data-view="academypro"[^>]*>[\s\S]*?<\/button>/g, '');
assert.throws(() => verifySupportViewStructure(missingHubNav), /Brak pozycji nawigacji data-view="academypro"/);
const missingGlobalNav = html.replace(/<button\b[^>]*data-view="globalacademy"[^>]*>[\s\S]*?<\/button>/g, '');
assert.throws(() => verifySupportViewStructure(missingGlobalNav), /Brak pozycji nawigacji data-view="globalacademy"/);
console.log('FIX146 VIEW GUARD: 7/7 PASS — 33 historyczne widoki + Global Academy + Centrum Mistrza PRO; brakujące/duplikowane widoki i nawigacje są blokowane.');
