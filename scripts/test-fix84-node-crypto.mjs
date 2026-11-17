import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js'];
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
assert.equal(typeof crypto.createHash, 'function', 'node:crypto musi udostępniać createHash');
assert.equal(crypto.createHash('sha256').update('abc').digest('hex'), expected, 'SHA-256 musi działać w bieżącym Node.js');
for (const relative of targets) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  assert.match(source, /const\s+crypto\s*=\s*require\(['"]node:crypto['"]\)/, `${relative}: brak jawnego importu node:crypto`);
  assert.match(source, /crypto\.createHash\(['"]sha256['"]\)/, `${relative}: brak walidacji SHA-256 posterów`);
}
console.log('[PASS] FIX84 — OneClick i Auto-Watcher używają node:crypto.createHash, nie globalnego Web Crypto.');
console.log('[PASS] FIX84 — SHA-256 jest zgodny z wektorem testowym SHA-256("abc").');

const posterManifest = JSON.parse(fs.readFileSync(path.join(WEB, 'assets/video-poster-manifest-fix83.json'), 'utf8'));
assert.equal(posterManifest.posterCount, 10, 'manifest FIX83 musi zawierać 10 posterów');
for (const poster of posterManifest.files) {
  const local = path.join(WEB, poster.file.split('?')[0].replace(/^\//, ''));
  assert.ok(fs.existsSync(local), `Brak posteru ${poster.id}: ${local}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex');
  assert.equal(actual, poster.sha256, `SHA-256 posteru ${poster.id} musi zgadzać się z manifestem`);
}
console.log('[PASS] FIX84 — SHA-256 wszystkich 10 posterów jest zgodne z manifestem FIX83.');
console.log('FIX84 CRYPTO REGRESSION: 3/3 PASS');
