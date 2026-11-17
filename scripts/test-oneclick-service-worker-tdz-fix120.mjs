import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(ROOT, 'ONECLICK_AKADEMIA.js'), 'utf8');
const verifyStart = source.indexOf('async function verifyWeb() {');
assert.notEqual(verifyStart, -1, 'verifyWeb() must exist');
const mainStart = source.indexOf('async function main()', verifyStart);
assert.notEqual(mainStart, -1, 'main() must follow verifyWeb()');
const verifySource = source.slice(verifyStart, mainStart);
const declaration = verifySource.indexOf("const serviceWorkerVisualSource = fs.readFileSync(path.join(WEB, 'service-worker.js'), 'utf8');");
assert.notEqual(declaration, -1, 'Service Worker source must be loaded inside verifyWeb()');
const firstReference = verifySource.indexOf('serviceWorkerVisualSource.includes(');
assert.notEqual(firstReference, -1, 'FIX119 guards must validate Service Worker contents');
assert.ok(declaration < firstReference, 'Service Worker const must be initialized before the first read (no TDZ)');
assert.equal((verifySource.match(/const serviceWorkerVisualSource\s*=/g) || []).length, 1, 'Service Worker source must be declared exactly once');
console.log('ONECLICK FIX120 TDZ REGRESSION: 4/4 PASS — Service Worker source is initialized before FIX119 validation.');
