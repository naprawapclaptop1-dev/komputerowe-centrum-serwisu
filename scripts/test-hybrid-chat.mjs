import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/chat.js';

function mockDb() {
  return {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() { return null; },
            async run() { return { success: true, meta: { changes: 0 } }; },
            async all() { return { results: [] }; }
          };
        }
      };
    },
    async batch() { return []; }
  };
}
function request(body) {
  return new Request('https://academy.test/api/chat', {
    method: 'POST',
    headers: {
      origin: 'https://academy.test',
      'content-type': 'application/json',
      'cf-connecting-ip': '203.0.113.20'
    },
    body: JSON.stringify(body)
  });
}
async function readSse(response) {
  const text = await response.text();
  const events = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    let event = 'message';
    const data = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) data.push(line.slice(5).trim());
    }
    if (data.length) events.push({ event, payload: JSON.parse(data.join('\n')) });
  }
  return events;
}

const originalFetch = globalThis.fetch;
const baseEnv = { DB: mockDb() };
const prompt = 'Laptop nie uruchamia się, wentylator tylko drgnie. Co sprawdzić?';
const messages = [{ role: 'user', content: prompt }];

try {
  // Public status must never disclose the API key value.
  const status = await onRequestGet({ env: { ...baseEnv, OPENAI_API_KEY: 'sk-secret-test', AI: { run() {} } } });
  const statusBody = await status.json();
  assert.equal(statusBody.openaiConfigured, true);
  assert.equal(statusBody.cloudflareConfigured, true);
  assert.equal(JSON.stringify(statusBody).includes('sk-secret-test'), false);

  // Primary: OpenAI SSE stream succeeds.
  globalThis.fetch = async () => new Response(
    'event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta","delta":"Najpierw sprawdź zasilacz i napięcie standby."}\r\n\r\nevent: response.completed\r\ndata: {"type":"response.completed"}\r\n\r\n',
    { status: 200, headers: { 'content-type': 'text/event-stream' } }
  );
  const primary = await onRequestPost({ request: request({ messages }), env: { ...baseEnv, OPENAI_API_KEY: 'sk-test', AI: { async run() { throw new Error('fallback should not run'); } } } });
  assert.equal(primary.status, 200);
  const primaryEvents = await readSse(primary);
  assert.equal(primaryEvents.find(x => x.event === 'meta')?.payload.provider, 'openai');
  assert.match(primaryEvents.filter(x => x.event === 'delta').map(x => x.payload.text).join(''), /zasilacz/);
  assert.equal(primaryEvents.at(-1)?.event, 'done');

  // Fallback: OpenAI rejects the request (e.g. quota/temporary upstream error).
  let fallbackCalls = 0;
  globalThis.fetch = async () => new Response('upstream unavailable', { status: 429 });
  const fallback = await onRequestPost({ request: request({ messages }), env: { ...baseEnv, OPENAI_API_KEY: 'sk-test', AI: { async run(model, args) { fallbackCalls++; assert.match(model, /llama-3.3-70b/); assert.equal(args.messages.at(-1).content, prompt); return { response: 'Odłącz zasilanie i sprawdź przewód oraz zasilacz zgodnie z procedurą.' }; } } } });
  assert.equal(fallback.status, 200);
  const fallbackEvents = await readSse(fallback);
  assert.equal(fallbackCalls, 1);
  assert.equal(fallbackEvents.find(x => x.event === 'meta')?.payload.provider, 'cloudflare-workers-ai');
  assert.equal(fallbackEvents.at(-1)?.event, 'done');

  // Fallback after a partial OpenAI stream failure must reset the UI transcript.
  globalThis.fetch = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Częściowa odpowiedź"}\n\n'));
      controller.error(new Error('simulated stream interruption'));
    }
  }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  const interrupted = await onRequestPost({ request: request({ messages }), env: { ...baseEnv, OPENAI_API_KEY: 'sk-test', AI: { async run() { return { response: 'Pełna odpowiedź zapasowa po przerwaniu strumienia.' }; } } } });
  const interruptedEvents = await readSse(interrupted);
  assert.ok(interruptedEvents.some(x => x.event === 'reset'));
  assert.equal(interruptedEvents.filter(x => x.event === 'meta').at(-1)?.payload.provider, 'cloudflare-workers-ai');
  assert.match(interruptedEvents.filter(x => x.event === 'delta').at(-1)?.payload.text || '', /Pełna odpowiedź zapasowa/);

  // No providers: explicit 503, not a fake AI response.
  const noProvider = await onRequestPost({ request: request({ messages }), env: baseEnv });
  assert.equal(noProvider.status, 503);
  assert.equal((await noProvider.json()).error, 'AI_PROVIDERS_UNAVAILABLE');

  console.log('PASS | status nie ujawnia klucza');
  console.log('PASS | OpenAI Responses API jako główny model');
  console.log('PASS | Cloudflare Workers AI jako fallback po błędzie OpenAI');
  console.log('PASS | fallback po przerwaniu strumienia + reset częściowego tekstu');
  console.log('PASS | bez dostawców API zwracany jest jawny HTTP 503');
} finally {
  globalThis.fetch = originalFetch;
}
