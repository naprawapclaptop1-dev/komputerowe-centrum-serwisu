import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.resolve(ROOT, 'WEB_PUBLISH');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
  } catch {
    res.writeHead(400);
    res.end('bad request');
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  const fullPath = path.resolve(WEB, relativePath);
  const relativeCheck = path.relative(WEB, fullPath);
  if (relativeCheck === '..' || relativeCheck.startsWith(`..${path.sep}`) || path.isAbsolute(relativeCheck)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404);
    res.end('missing');
    return;
  }

  res.writeHead(200, {
    'content-type': mime[path.extname(fullPath).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
    'content-length': stat.size
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = fs.createReadStream(fullPath);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end('read error');
  });
  stream.pipe(res);
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
assert.ok(address && typeof address === 'object', 'Lokalny serwer nie zwrócił adresu TCP.');
const port = address.port;
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, `Nieprawidłowy port lokalnego serwera: ${String(port)}.`);

// Używamy bezpośredniego http.request() dla połączenia lokalnego.
// Test jest lokalny i nie może zależeć od HTTP_PROXY/HTTPS_PROXY/NODE_USE_ENV_PROXY.
function request(method, requestPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      method,
      path: requestPath,
      agent: false,
      headers: { connection: 'close' }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.on('end', () => resolve({
        status: response.statusCode,
        body: Buffer.concat(chunks)
      }));
    });
    req.setTimeout(10000, () => req.destroy(new Error(`Timeout lokalnego HTTP ${method} ${requestPath}`)));
    req.once('error', reject);
    req.end();
  });
}

const urls = [
  '/index.html',
  '/assets/global-academy-expansion-fix73.js',
  '/assets/global-academy-fix77.css',
  '/assets/photo-uniqueness-fix77.js',
  '/assets/photo-uniqueness-manifest-fix77.json',
  ...Array.from({ length: 6 }, (_, i) => `/assets/artwork-fix77/module-${i + 14}.svg`),
  ...Array.from({ length: 8 }, (_, i) => `/assets/artwork-fix77/gax-media-${String(i + 1).padStart(2, '0')}.svg`),
  ...Array.from({ length: 13 }, (_, i) => `/assets/artwork-fix77/gax-visual-index-${String(i + 1).padStart(2, '0')}.svg`)
];

let passed = 0;
try {
  const head = await request('HEAD', '/index.html');
  assert.equal(head.status, 200, 'HEAD /index.html musi zwrócić 200.');
  assert.equal(head.body.byteLength, 0, 'HEAD nie może zwracać treści.');

  for (const requestPath of urls) {
    const response = await request('GET', requestPath);
    assert.equal(response.status, 200, `${requestPath}: ${response.status}`);
    assert.ok(response.body.byteLength > 100, `${requestPath}: pusty lub niepełny zasób`);
    passed++;
  }

  const traversal = await request('GET', '/%2e%2e/ONECLICK_AKADEMIA.js');
  assert.ok([403, 404].includes(traversal.status), `Path traversal nie został zablokowany: ${traversal.status}`);
  console.log(`[PASS] FIX77 HTTP/FIX112: ${passed}/${urls.length} zasobów, HEAD, port ${port}, path traversal zablokowany; bez global fetch/proxy.`);
} finally {
  await new Promise(resolve => server.close(resolve));
}
