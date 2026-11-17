#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import { __test, onRequestPost } from '../functions/api/academy/fix186/pcb-analysis.js';

const pass = label => console.log(`[PASS] ${label}`);

assert.equal(__test.validImage('A'.repeat(120), 'image/jpeg'), true);
assert.equal(__test.validImage('A'.repeat(120), 'image/svg+xml'), false);
assert.equal(__test.validImage('A'.repeat(__test.MAX_IMAGE_BASE64 + 1), 'image/png'), false);
assert.equal(__test.validImage('%%%'.repeat(40), 'image/png'), false);
pass('Endpoint akceptuje wyłącznie ograniczone base64 JPEG/PNG/WebP i odrzuca nieobsługiwane/za duże dane');

const report = __test.normalizeReport({
  summary: 'Widoczne ślady wymagające dalszych oględzin',
  observations: Array.from({ length: 10 }, (_, i) => ({
    label: `Obserwacja ${i + 1}`,
    region: { x: 1200, y: -20, width: 500, height: 1400 },
    confidence: 'high', visibleEvidence: 'widoczny ślad', verification: 'inspekcja pod mikroskopem'
  })),
  notVisible: Array.from({ length: 10 }, (_, i) => `Nie można ocenić ${i}`),
  nextSteps: Array.from({ length: 10 }, (_, i) => `Krok ${i}`)
});
assert.equal(report.observations.length, 8);
assert.equal(report.notVisible.length, 8);
assert.equal(report.nextSteps.length, 8);
assert.equal(report.observations[0].region.x, 1000);
assert.equal(report.observations[0].region.y, 0);
assert.equal(report.observations[0].region.height, 1000);
assert.ok(report.safety.length > 0);
pass('Endpoint normalizuje raport Gemini, ogranicza liczbę obserwacji i współrzędne 0–1000');

const parsed = __test.parseModelJson('```json\n{"summary":"PCB","observations":[]}\n```');
assert.equal(parsed.summary, 'PCB');
const delta = __test.extractTextFromSse('event: step.delta\ndata: {"event_type":"step.delta","delta":{"type":"text","text":"{\\"summary\\":\\"ok\\"}"}}');
assert.equal(delta.failed, false);
assert.ok(delta.text.includes('summary'));
const failed = __test.extractTextFromSse('event: error\ndata: {"event_type":"error"}');
assert.equal(failed.failed, true);
pass('Parser JSON/SSE obsługuje odpowiedź modelu i jawnie rozpoznaje błąd strumienia');

const foreign = new Request('https://academy.example/api/academy/fix186/pcb-analysis', {
  method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}'
});
const foreignResponse = await onRequestPost({ request: foreign, env: {} });
assert.equal(foreignResponse.status, 403);
pass('Endpoint odrzuca żądania spoza same-origin');

const sameOriginNoDb = new Request('https://academy.example/api/academy/fix186/pcb-analysis', {
  method: 'POST', headers: { origin: 'https://academy.example', 'content-type': 'application/json' }, body: '{}'
});
const noDbResponse = await onRequestPost({ request: sameOriginNoDb, env: {} });
assert.equal(noDbResponse.status, 503);
pass('Endpoint nie omija istniejącej D1 wymaganej do rate-limitów');

const noConsent = new Request('https://academy.example/api/academy/fix186/pcb-analysis', {
  method: 'POST', headers: { origin: 'https://academy.example', 'content-type': 'application/json' }, body: JSON.stringify({ consent: false, mimeType: 'image/jpeg', imageData: 'A'.repeat(120) })
});
const noConsentResponse = await onRequestPost({ request: noConsent, env: { DB: {}, GEMINI_API_KEY: 'test-only-not-used' } });
assert.equal(noConsentResponse.status, 400);
const noConsentBody = await noConsentResponse.json();
assert.equal(noConsentBody.error, 'IMAGE_CONSENT_REQUIRED');
pass('Backend wymaga jawnej zgody przed przekazaniem zdjęcia do Gemini');

const badMime = new Request('https://academy.example/api/academy/fix186/pcb-analysis', {
  method: 'POST', headers: { origin: 'https://academy.example', 'content-type': 'application/json' }, body: JSON.stringify({ consent: true, mimeType: 'image/svg+xml', imageData: 'A'.repeat(120) })
});
const badMimeResponse = await onRequestPost({ request: badMime, env: { DB: {}, GEMINI_API_KEY: 'test-only-not-used' } });
assert.equal(badMimeResponse.status, 400);
const badMimeBody = await badMimeResponse.json();
assert.equal(badMimeBody.error, 'INVALID_IMAGE');
pass('Backend odrzuca SVG i inne typy, które nie są JPEG/PNG/WebP');

console.log('\nFIX186 PCB AI ENDPOINT TESTS: 7/7 PASS');
