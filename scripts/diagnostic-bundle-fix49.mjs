import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')); } catch { return null; } };
const release = readJson('WEB_PUBLISH/release.json');
const manifest = readJson('FIX49_RELEASE_MANIFEST.json');
const sw = fs.readFileSync(path.join(ROOT, 'WEB_PUBLISH/service-worker.js'), 'utf8');
const cache = sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)/i)?.[1] || '';
const files = ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','WEB_PUBLISH/index.html','WEB_PUBLISH/release.json','WEB_PUBLISH/service-worker.js'];
const fingerprints = files.map(file => { const data = fs.readFileSync(path.join(ROOT, file)); return { file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') }; });
const bundle = {
  createdAt: new Date().toISOString(),
  app: 'NAUKA OD A DO Z',
  release: release?.release || null,
  build: release?.build || null,
  fix: manifest?.fix || 'unknown',
  cacheMarkerPresent: cache.includes(manifest?.cacheMarker || 'fix49-'),
  cacheName: cache,
  node: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  note: 'Local diagnostic summary. No environment variables, credentials, D1 exports, user records or secret values included.',
  fingerprints
};
const output = path.join(ROOT, 'DIAGNOSTIC_BUNDLE_FIX49.json');
fs.writeFileSync(output, JSON.stringify(bundle, null, 2) + '\n');
console.log(`Diagnostic bundle created: ${path.relative(ROOT, output)} (${fingerprints.length} fingerprints; no secrets included).`);
