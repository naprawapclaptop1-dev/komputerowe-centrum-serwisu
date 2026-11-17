// FIX131 — fixed allowlist for same-origin equipment-photo delivery.
// URLs come only from the curated, licence-checked FIX129 manifest. No user-supplied URL is fetched.
export const PHOTO_SOURCES_FIX131 = Object.freeze({
  "multimeter-bench": "https://images.pexels.com/photos/7639432/pexels-photo-7639432.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "ram-modules": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/SK_hynix_8GB_DDR4_SO-DIMM_laptop_RAM_module_%28Model_HMA81GS6AFR8N-UH%29_001.jpg/1280px-SK_hynix_8GB_DDR4_SO-DIMM_laptop_RAM_module_%28Model_HMA81GS6AFR8N-UH%29_001.jpg",
  "motherboard-closeup": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Computer_Motherboard_Closeup.jpg/1280px-Computer_Motherboard_Closeup.jpg",
  "electronics-circuit-macro-40342987": "https://images.pexels.com/photos/40342987/pexels-photo-40342987.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  "data-storage": "https://images.pexels.com/photos/35147150/pexels-photo-35147150/free-photo-of-modern-and-vintage-data-storage-solutions.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "gpu-cooling-heatsink-fans": "https://upload.wikimedia.org/wikipedia/commons/c/c6/ARCTIC_Accelero_Xtreme_Plus_II.JPG",
  "pc-hardware": "https://images.pexels.com/photos/33792050/pexels-photo-33792050/free-photo-of-close-up-of-computer-hardware-components-for-high-performance.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "vram-qimonda-gddr3-chip": "https://upload.wikimedia.org/wikipedia/commons/d/dd/64MBQimondaGDDR3Memory.jpg",
  "board-motherboard-black-14887694": "https://images.pexels.com/photos/14887694/pexels-photo-14887694.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  "ram-desktop-dimm-corsair": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Corsair_CM2X1024-6400C5DHX_20080221.jpg/1280px-Corsair_CM2X1024-6400C5DHX_20080221.jpg",
  "vram-samsung-gddr3-chip": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/SAMSUNG%40QDDR3-SDRAM%40256MBit%40K5J55323QF-GC16_Stack-DSC01234-DSC01284_-_ZS-retouched.jpg/1280px-SAMSUNG%40QDDR3-SDRAM%40256MBit%40K5J55323QF-GC16_Stack-DSC01234-DSC01284_-_ZS-retouched.jpg",
  "gpu-msi-geforce-rtx3070": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/MSI_GeForce_RTX_3070_VENTUS_3X_OC.jpg/1280px-MSI_GeForce_RTX_3070_VENTUS_3X_OC.jpg",
  "board-motherboard-microchips-6755074": "https://images.pexels.com/photos/6755074/pexels-photo-6755074.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  "usb-c-laptop-port": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/USB-C_connector_on_a_laptop.jpg/1280px-USB-C_connector_on_a_laptop.jpg",
  "cpu-ram-modules-37113174": "https://images.pexels.com/photos/37113174/pexels-photo-37113174.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  "laptop-motherboard": "https://images.pexels.com/photos/32602486/pexels-photo-32602486/free-photo-of-opened-laptop-motherboard-close-up-view.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "bios-chips-pair-commons": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Pair_of_BIOS_chips.jpg/1280px-Pair_of_BIOS_chips.jpg",
  "network-switch-ethernet-6466143": "https://images.pexels.com/photos/6466143/pexels-photo-6466143.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
  "network-switch-ethernet-cable-2881224": "https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200"
});

const ALLOWED_HOSTS = new Set(['images.pexels.com','thumb.wikimedia.org','upload.wikimedia.org']);
const IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp','image/avif']);
const REDIRECT_STATUSES = new Set([301,302,303,307,308]);
const MAX_SAFE_REDIRECTS = 4;

function responseHeaders(sourceUrl, finalUrl, type, extra={}) {
  return {
    'Content-Type': type,
    'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Photo-Delivery': 'FIX131-SAME-ORIGIN',
    'X-Photo-Proxy-Fix': 'FIX134-SAFE-REDIRECTS',
    'X-Photo-Source-Host': new URL(sourceUrl).hostname,
    'X-Photo-Final-Host': new URL(finalUrl).hostname,
    'Access-Control-Allow-Origin': '*',
    ...extra
  };
}

function safeRedirectTarget(location, currentUrl) {
  let next;
  try { next = new URL(location, currentUrl); } catch { return null; }
  if (next.protocol !== 'https:' || next.username || next.password || !ALLOWED_HOSTS.has(next.hostname)) return null;
  return next;
}

async function fetchCuratedSource(sourceUrl, fetchImpl) {
  let current = new URL(sourceUrl);
  const visited = new Set();
  let redirects = 0;
  while (true) {
    if (current.protocol !== 'https:' || !ALLOWED_HOSTS.has(current.hostname) || current.username || current.password) {
      return { error: 'Photo source host is not allowlisted', code: 'FIX134-REDIRECT-BLOCKED', redirects };
    }
    if (visited.has(current.href)) return { error: 'Photo source redirect loop detected', code: 'FIX134-REDIRECT-LOOP', redirects };
    visited.add(current.href);
    const response = await fetchImpl(current.href, {
      method: 'GET',
      // Follow redirects explicitly so every destination is checked against the fixed host allowlist.
      redirect: 'manual',
      headers: {
        Accept: 'image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.5',
        'User-Agent': 'NaukaOdAdoZ-FIX134/6.8.0 (+https://naprawa-pc-akademia-serwisu-pro.pages.dev/)',
        Referer: current.hostname.endsWith('wikimedia.org') ? 'https://commons.wikimedia.org/' : 'https://www.pexels.com/'
      }
    });
    if (!REDIRECT_STATUSES.has(response.status)) return { response, finalUrl: current.href, redirects };
    const location = response.headers?.get('location');
    if (!location) return { error: 'Photo source redirect did not include Location', code: 'FIX134-REDIRECT-MISSING-LOCATION', redirects };
    if (redirects >= MAX_SAFE_REDIRECTS) return { error: 'Photo source exceeded safe redirect limit', code: 'FIX134-REDIRECT-LIMIT', redirects };
    const next = safeRedirectTarget(location, current);
    if (!next) return { error: 'Photo source redirected to a non-allowlisted HTTPS host', code: 'FIX134-REDIRECT-BLOCKED', redirects };
    current = next;
    redirects++;
  }
}

export async function serveCuratedPhotoFix131({ request, id, fetchImpl = globalThis.fetch, cacheApi = globalThis.caches, waitUntil = null }) {
  const method = request?.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  const seedId = String(id || '').replace(/\.jpe?g$/i, '');
  const sourceUrl = PHOTO_SOURCES_FIX131[seedId];
  if (!sourceUrl) return new Response('Unknown curated photo', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Photo-Delivery': 'FIX131-NOT-FOUND' } });
  let parsed;
  try { parsed = new URL(sourceUrl); } catch { return new Response('Invalid photo source', { status: 500, headers: { 'Cache-Control': 'no-store' } }); }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) return new Response('Photo source is not allowlisted', { status: 500, headers: { 'Cache-Control': 'no-store' } });

  const requestUrl = new URL(request.url);
  const cacheKey = new Request(`${requestUrl.origin}/media/photos/${seedId}.jpg`, { method: 'GET' });
  const edgeCache = cacheApi?.default;
  if (method === 'GET' && edgeCache) {
    try { const cached = await edgeCache.match(cacheKey); if (cached) return cached; } catch { /* cache miss; continue to origin */ }
  }
  try {
    const result = await fetchCuratedSource(sourceUrl, fetchImpl);
    if (result.error) return new Response(result.error, { status: 502, headers: {
      'Cache-Control': 'no-store', 'X-Photo-Delivery': result.code, 'X-Photo-Proxy-Fix': 'FIX134-SAFE-REDIRECTS',
      'X-Photo-Error': result.error, 'X-Photo-Source-Host': parsed.hostname, 'X-Photo-Redirect-Count': String(result.redirects || 0)
    }});
    const upstream = result.response;
    const finalUrl = result.finalUrl || sourceUrl;
    if (!upstream.ok) return new Response(`Upstream photo source returned HTTP ${upstream.status}`, { status: 502, headers: {
      'Cache-Control': 'no-store', 'X-Photo-Delivery': 'FIX134-UPSTREAM-ERROR', 'X-Photo-Proxy-Fix': 'FIX134-SAFE-REDIRECTS',
      'X-Photo-Upstream-Status': String(upstream.status), 'X-Photo-Source-Host': parsed.hostname,
      'X-Photo-Final-Host': new URL(finalUrl).hostname, 'X-Photo-Redirect-Count': String(result.redirects || 0)
    }});
    const type = String(upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_TYPES.has(type)) return new Response('Upstream did not return a supported raster image', { status: 502, headers: {
      'Cache-Control': 'no-store', 'X-Photo-Delivery': 'FIX134-NON-IMAGE', 'X-Photo-Proxy-Fix': 'FIX134-SAFE-REDIRECTS',
      'X-Photo-Upstream-Type': type || 'missing', 'X-Photo-Source-Host': parsed.hostname,
      'X-Photo-Final-Host': new URL(finalUrl).hostname, 'X-Photo-Redirect-Count': String(result.redirects || 0)
    }});
    const len = Number(upstream.headers.get('content-length') || 0);
    if (len > 12 * 1024 * 1024) return new Response('Photo source exceeds size limit', { status: 413, headers: { 'Cache-Control': 'no-store' } });
    const headers = responseHeaders(sourceUrl, finalUrl, type, {
      'X-Photo-Redirect-Count': String(result.redirects || 0),
      ...(upstream.headers.get('etag') ? { ETag: upstream.headers.get('etag') } : {}),
      ...(upstream.headers.get('last-modified') ? { 'Last-Modified': upstream.headers.get('last-modified') } : {})
    });
    const response = new Response(method === 'HEAD' ? null : upstream.body, { status: 200, headers });
    if (method === 'GET' && edgeCache) {
      try { const copy = response.clone(); const pending = edgeCache.put(cacheKey, copy); if (typeof waitUntil === 'function') waitUntil(pending); else await pending; } catch { /* Browser Service Worker still provides local offline cache. */ }
    }
    return response;
  } catch (error) {
    const message = String(error?.message || error).replace(/[\r\n]+/g, ' ').slice(0,160);
    return new Response(`Photo source unavailable: ${message}`, { status: 502, headers: {
      'Cache-Control': 'no-store', 'X-Photo-Delivery': 'FIX134-FETCH-FAILED', 'X-Photo-Proxy-Fix': 'FIX134-SAFE-REDIRECTS',
      'X-Photo-Error': message, 'X-Photo-Source-Host': parsed.hostname
    }});
  }
}
