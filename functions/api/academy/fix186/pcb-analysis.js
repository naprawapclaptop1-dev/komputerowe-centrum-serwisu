import { getSession, hashedClientRateKey, json, rateLimit, readJson, sameOrigin, text } from '../../../_lib.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const MAX_IMAGE_BASE64 = 6_800_000;
const SYSTEM_INSTRUCTION = `Jesteś technicznym asystentem wizualnej inspekcji płytek głównych komputerów stacjonarnych i laptopów. Analizujesz wyłącznie widoczne cechy obrazu. Nie diagnozujesz telefonów, tabletów, konsol ani innych urządzeń. Nie twierdź, że na podstawie zdjęcia można potwierdzić zwarcie, przerwę elektryczną, stan wewnętrznych warstw PCB, wartości napięć ani sprawność układu. Oddziel obserwacje widoczne od hipotez. Zwróć wyłącznie poprawny JSON: {"summary":"...","observations":[{"label":"...","region":{"x":0,"y":0,"width":0,"height":0},"confidence":"low|medium|high","visibleEvidence":"...","verification":"..."}],"notVisible":["..."],"nextSteps":["..."],"safety":"..."}. Współrzędne regionu są znormalizowane do skali 0–1000 względem obrazu. Maksymalnie 8 obserwacji, 8 elementów notVisible i 8 nextSteps. Jeżeli zdjęcie nie przedstawia wyraźnie płyty głównej komputera/laptopa lub nie pozwala na ocenę, powiedz to w summary i zwróć puste observations. Nie wymyślaj oznaczeń elementów, numerów pinów, wartości pomiarów ani przyczyn elektrycznych. Zalecaj weryfikację pod mikroskopem, dokumentacją płyty oraz pomiarami przez wykwalifikowanego technika. Odpowiedź po polsku.`;

function validImage(value, mimeType) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return false;
  if (typeof value !== 'string' || value.length < 100 || value.length > MAX_IMAGE_BASE64) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  return true;
}
function extractTextFromSse(block) {
  const lines = block.split(/\r?\n/);
  const dataLine = lines.find(line => line.startsWith('data:'));
  if (!dataLine) return { text: '', failed: false };
  let data;
  try { data = JSON.parse(dataLine.slice(5).trim()); } catch { return { text: '', failed: false }; }
  const type = data.event_type || lines.find(line => line.startsWith('event:'))?.slice(6).trim() || '';
  if (type === 'step.delta' && data.delta?.type === 'text' && typeof data.delta.text === 'string') return { text: data.delta.text, failed: false };
  if (type === 'interaction.failed' || type === 'error') return { text: '', failed: true };
  return { text: '', failed: false };
}
function parseModelJson(raw) {
  const value = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(value); }
  catch {
    const a = value.indexOf('{'), b = value.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('MODEL_RESPONSE_NOT_JSON');
    return JSON.parse(value.slice(a, b + 1));
  }
}
function normalizeReport(input) {
  const o = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const clip = (v, n = 700) => text(v, n);
  const num = v => Math.max(0, Math.min(1000, Number.isFinite(Number(v)) ? Number(v) : 0));
  const observations = Array.isArray(o.observations) ? o.observations.slice(0, 8).map(x => ({
    label: clip(x?.label, 160),
    region: { x: num(x?.region?.x), y: num(x?.region?.y), width: num(x?.region?.width), height: num(x?.region?.height) },
    confidence: ['low', 'medium', 'high'].includes(x?.confidence) ? x.confidence : 'low',
    visibleEvidence: clip(x?.visibleEvidence, 600),
    verification: clip(x?.verification, 600)
  })).filter(x => x.label || x.visibleEvidence) : [];
  return {
    summary: clip(o.summary, 1400),
    observations,
    notVisible: Array.isArray(o.notVisible) ? o.notVisible.slice(0, 8).map(x => clip(x, 350)).filter(Boolean) : [],
    nextSteps: Array.isArray(o.nextSteps) ? o.nextSteps.slice(0, 8).map(x => clip(x, 500)).filter(Boolean) : [],
    safety: clip(o.safety, 700) || 'Przed pomiarami odłącz zasilanie i baterię, stosuj ESD oraz procedury producenta.'
  };
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED', message: 'Żądanie z obcej witryny zostało odrzucone.' }, 403);
  if (!env?.DB) return json({ error: 'DATABASE_NOT_CONFIGURED', message: 'Brak istniejącej bazy D1 wymaganej do limitowania zapytań. Nie twórz nowej bazy.' }, 503);
  const apiKey = String(env?.GEMINI_API_KEY || '').trim();
  if (!apiKey) return json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Generator obrazu wymaga istniejącego klucza Gemini po stronie serwera.' }, 503);
  let body;
  try { body = await readJson(request, 7_200_000); }
  catch (error) { return json({ error: 'INVALID_REQUEST', message: error.message }, 400); }
  if (body?.consent !== true) return json({ error: 'IMAGE_CONSENT_REQUIRED', message: 'Zaznacz zgodę na wysłanie zdjęcia do Google Gemini.' }, 400);
  const mimeType = String(body?.mimeType || '').toLowerCase();
  const imageData = body?.imageData;
  if (!validImage(imageData, mimeType)) return json({ error: 'INVALID_IMAGE', message: 'Przyjmuję wyłącznie prawidłowe dane JPEG, PNG lub WebP do około 5 MB.' }, 400);
  const user = await getSession(request, env);
  const key = user?.id ? `gemini-pcb:${user.id}` : await hashedClientRateKey(request, 'gemini-pcb');
  const minute = await rateLimit(env, `${key}:minute`, user?.id ? 6 : 3, 60);
  if (!minute) return json({ error: 'RATE_LIMIT_MINUTE', message: 'Limit analiz zdjęć został osiągnięty. Spróbuj ponownie za minutę.' }, 429);
  const day = await rateLimit(env, `${key}:day`, user?.id ? 30 : 12, 86400);
  if (!day) return json({ error: 'RATE_LIMIT_DAY', message: 'Dzienny limit analiz zdjęć został osiągnięty.' }, 429);

  const context = text(body?.context || '', 700);
  const prompt = `Przeanalizuj zdjęcie wyłącznie pod kątem widocznych cech płyty głównej komputera stacjonarnego/laptopa. Kontekst technika (może być pusty): ${context || 'brak'}. Wskaż tylko widoczne anomalie, ślady korozji, przegrzania, uszkodzeń mechanicznych, odspojenia, pęknięć lub niepewne obszary wymagające oględzin. Nie odczytuj ani nie ujawniaj danych osobowych, etykiet z numerami seryjnymi lub kodów klienta; pomiń je. Nie wyciągaj wniosków elektrycznych z samego obrazu. Współrzędne 0–1000. Zwróć JSON zgodny z systemowym schematem.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('Gemini PCB analysis timeout'), 60000);
  try {
    const upstream = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json', 'accept': 'text/event-stream' },
      body: JSON.stringify({
        model: String(env?.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim(),
        input: [ { type: 'text', text: prompt }, { type: 'image', data: imageData, mime_type: mimeType } ],
        system_instruction: SYSTEM_INSTRUCTION,
        stream: true,
        store: false,
        generation_config: { max_output_tokens: 1400, thinking_level: 'low' }
      }),
      signal: controller.signal
    });
    if (!upstream.ok) return json({ error: 'GEMINI_UPSTREAM_ERROR', message: `Gemini zwróciło HTTP ${upstream.status}. Sprawdź limit, model i konfigurację klucza.` }, 502);
    const reader = upstream.body?.getReader();
    if (!reader) return json({ error: 'GEMINI_STREAM_MISSING', message: 'Brak strumienia odpowiedzi Gemini.' }, 502);
    const decoder = new TextDecoder();
    let pending = '', raw = '', failed = false;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = pending.search(/\r?\n\r?\n/)) >= 0) {
        const separator = pending.match(/\r?\n\r?\n/);
        const block = pending.slice(0, boundary);
        pending = pending.slice(boundary + separator[0].length);
        const item = extractTextFromSse(block); raw += item.text; failed ||= item.failed;
      }
    }
    pending += decoder.decode();
    if (pending.trim()) { const item = extractTextFromSse(pending); raw += item.text; failed ||= item.failed; }
    if (failed || !raw.trim()) return json({ error: 'GEMINI_EMPTY_OR_FAILED', message: 'Gemini nie ukończyło analizy obrazu. Spróbuj ponownie.' }, 502);
    let report;
    try { report = normalizeReport(parseModelJson(raw)); }
    catch { return json({ error: 'GEMINI_INVALID_REPORT', message: 'Gemini zwróciło wynik, którego nie można bezpiecznie odczytać jako raportu. Spróbuj z innym zdjęciem.' }, 502); }
    return json({ ok: true, provider: 'gemini', model: String(env?.GEMINI_MODEL || DEFAULT_GEMINI_MODEL), stored: false, imageStored: false, report });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return json({ error: aborted ? 'GEMINI_TIMEOUT' : 'GEMINI_UNAVAILABLE', message: aborted ? 'Analiza obrazu przekroczyła limit czasu.' : 'Nie udało się połączyć z Google Gemini.' }, 503);
  } finally {
    clearTimeout(timeout);
  }
}

export const __test = { validImage, extractTextFromSse, parseModelJson, normalizeReport, MAX_IMAGE_BASE64, SYSTEM_INSTRUCTION };
