import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/assets/global-academy-suite-manifest-fix60.json'), 'utf8'));
const port = 19000 + (process.pid % 1000);
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(root, 'scripts/serve-fix51-preview.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
  windowsHide: true
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ready = false;
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(`preview exited with ${server.exitCode}`);
    try {
      const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await pause(100);
  }
  assert.ok(ready, 'lokalny preview nie uruchomił się');
  const files = manifest.assets.visualFiles;
  assert.equal(files.length, 45, 'manifest musi zawierać dokładnie 45 plików wizualnych');
  const results = await Promise.all(files.map(async asset => {
    const response = await fetch(`${origin}/${asset}`, { signal: AbortSignal.timeout(8000) });
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    assert.equal(response.status, 200, `${asset}: HTTP ${response.status}`);
    assert.ok(body.length > 100, `${asset}: pusty lub zbyt mały plik`);
    if (asset.endsWith('.jpg')) {
      assert.match(contentType, /image\/jpeg/i, `${asset}: nieprawidłowy Content-Type`);
      assert.deepEqual([...body.subarray(0, 3)], [0xff, 0xd8, 0xff], `${asset}: nieprawidłowy nagłówek JPEG`);
    } else {
      assert.match(contentType, /image\/svg\+xml/i, `${asset}: nieprawidłowy Content-Type`);
      assert.match(body.toString('utf8').slice(0, 1000), /<svg[\s>]/i, `${asset}: brak elementu SVG`);
    }
    return asset;
  }));
  console.log(`[PASS] Lokalny serwer zwrócił HTTP 200 dla ${results.length}/45 zasobów wizualnych.`);
  console.log('[PASS] JPEG mają prawidłowy nagłówek i Content-Type; SVG mają XML/SVG i prawidłowy Content-Type.');
  console.log('VISUAL ASSETS HTTP FIX54: 2/2 PASS');
} finally {
  try { server.kill(); } catch {}
}
