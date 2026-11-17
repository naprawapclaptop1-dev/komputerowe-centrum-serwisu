'use strict';

function declaredTotalSize(response) {
  const range = String(response.headers?.get?.('content-range') || '').match(/\bbytes\s+\d+-\d+\/(\d+|\*)/i);
  if (range && range[1] !== '*') return { known: true, bytes: Number(range[1]), source: 'content-range' };
  // A 206 Content-Length is only the returned range size, not the complete object size.
  if (response.status === 206) return { known: false, bytes: 0, source: 'range-body' };
  const length = Number(response.headers?.get?.('content-length') || 0);
  return Number.isFinite(length) && length > 0 ? { known: true, bytes: length, source: 'content-length' } : { known: false, bytes: 0, source: 'stream' };
}

async function checkPublicMediaAsset(url, fetchImpl = globalThis.fetch, minimumBytes = 1_000_001) {
  if (typeof fetchImpl !== 'function') throw new Error('Brak funkcji fetch do kontroli publicznego pliku.');
  const response = await fetchImpl(url, {
    method: 'GET',
    cache: 'no-store',
    headers: { Range: 'bytes=0-1048575', 'cache-control': 'no-cache, no-store', pragma: 'no-cache' }
  });
  const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
  const finish = async () => { try { await response.body?.cancel(); } catch { /* no-op */ } };
  if (!response.ok) {
    await finish();
    return { ok: false, status: response.status, bytes: 0, contentType, reason: `HTTP ${response.status}` };
  }
  if (contentType && !contentType.includes('video/mp4') && !contentType.includes('application/octet-stream')) {
    await finish();
    return { ok: false, status: response.status, bytes: 0, contentType, reason: `Nieprawidłowy Content-Type: ${contentType}` };
  }
  const declared = declaredTotalSize(response);
  if (declared.known) {
    await finish();
    const ok = declared.bytes >= minimumBytes;
    return { ok, status: response.status, bytes: declared.bytes, contentType, reason: ok ? `Rozmiar potwierdzony przez ${declared.source}.` : 'Cały plik jest krótszy od wymaganego limitu.' };
  }
  // Gdy serwer pomija rozmiar, odczytujemy maksymalnie około 1 MiB + 1 bajt.
  // Nie pobieramy całego filmu; liczymy bajty faktycznie odebrane z odpowiedzi.
  let bytes = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    try {
      while (bytes < minimumBytes) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value?.byteLength || 0;
      }
    } finally {
      try { await reader.cancel(); } catch { /* no-op */ }
    }
  }
  const ok = bytes >= minimumBytes;
  return { ok, status: response.status, bytes, contentType, reason: ok ? 'Rozmiar potwierdzony ograniczonym odczytem GET.' : 'Publiczny plik jest krótszy od wymaganego limitu lub nie udostępnia rozmiaru.' };
}

module.exports = { declaredTotalSize, checkPublicMediaAsset };
