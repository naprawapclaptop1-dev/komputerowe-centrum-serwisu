import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publisherPath = path.join(root, 'ONECLICK_AKADEMIA.js');
let source = fs.readFileSync(publisherPath, 'utf8');
const entrypoint = /main\(\)\.catch\(error => \{[\s\S]*?\n\}\);\s*$/;
assert.match(source, entrypoint, 'Publisher main entrypoint must remain identifiable for a local, no-network verifyWeb test');
source = source.replace(entrypoint, 'module.exports = { verifyWeb };\n');

const module = { exports: {} };
const sandbox = {
  require: createRequire(publisherPath),
  module,
  exports: module.exports,
  __dirname: root,
  process,
  console,
  Buffer,
  URL,
  setTimeout,
  clearTimeout,
  Promise,
};
vm.runInNewContext(source, sandbox, { filename: publisherPath });
assert.equal(typeof module.exports.verifyWeb, 'function', 'verifyWeb must be callable in the isolated test harness');
const result = await module.exports.verifyWeb();
assert.equal(result.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.equal(result.lessons, 1060);
console.log(`PASS: pełne ONECLICK verifyWeb() przechodzi lokalnie; build=${result.build}, lekcje=${result.lessons}, karty diagnostyczne=${result.cards}. Bez Cloudflare, D1 i migracji.`);
