function response(status, body, headers = {}) {
  return new Response(body, { status, headers: new Headers(headers) });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return response(204, null, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, If-Range, If-None-Match",
      "Access-Control-Max-Age": "86400"
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return response(405, "Method Not Allowed", { "Allow": "GET, HEAD, OPTIONS" });
  }

  if (!env.UPDATES) {
    return response(503, "Cloudflare R2 binding UPDATES is not configured.", {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8"
    });
  }

  let key;
  try {
    key = decodeURIComponent(url.pathname.replace(/^\/updates\/?/, ""));
  } catch {
    return response(400, "Invalid object path");
  }

  if (key === "health") {
    const checks = await Promise.all([
      env.UPDATES.head("manifest-stable.xml"),
      env.UPDATES.head("manifest-beta.xml"),
      env.UPDATES.head("releases.json")
    ]);
    let latestPackage = false;
    let latestVersion = null;
    if (checks[2] !== null) {
      const catalogObject = await env.UPDATES.get("releases.json");
      if (catalogObject !== null) {
        try {
          const catalog = JSON.parse(await catalogObject.text());
          const entries = Array.isArray(catalog) ? catalog : (Array.isArray(catalog.releases) ? catalog.releases : []);
          if (entries.length > 0) {
            latestVersion = String(entries[0].version || "");
            const packageUrl = String(entries[0].packageUrl || "");
            const packageName = packageUrl ? new URL(packageUrl).pathname.split("/").pop() : String(entries[0].packageFile || "");
            if (/^KomputeroweCentrumSerwisu_FIX\d{3,}_INSTALATOR\.exe$/i.test(packageName)) {
              latestPackage = (await env.UPDATES.head(packageName)) !== null;
            }
          }
        } catch (_) {
          latestPackage = false;
        }
      }
    }
    const result = {
      ok: true,
      service: "Komputerowe Centrum Serwisu - aktualizacje globalne",
      provider: "Cloudflare Pages + R2",
      r2Binding: true,
      stableManifest: checks[0] !== null,
      betaManifest: checks[1] !== null,
      releaseCatalog: checks[2] !== null,
      latestPackage: latestPackage,
      latestVersion: latestVersion,
      timestamp: new Date().toISOString()
    };
    return response(200, JSON.stringify(result), {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    });
  }

  const allowed =
    key === "manifest-stable.xml" ||
    key === "manifest-beta.xml" ||
    key === "releases.json" ||
    /^KomputeroweCentrumSerwisu_FIX\d{3,}_INSTALATOR\.exe$/i.test(key);

  if (!allowed || key.includes("..") || key.includes("/") || key.includes("\\")) {
    return response(404, "Not Found", { "Cache-Control": "no-store" });
  }

  const meta = await env.UPDATES.head(key);
  if (!meta) {
    return response(404, "Update object not found: " + key, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8"
    });
  }

  const headers = new Headers();
  headers.set("Accept-Ranges", "bytes");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", '"' + meta.etag + '"');
  headers.set("Content-Length", String(meta.size));

  if (key.endsWith(".xml")) {
    headers.set("Content-Type", "application/xml; charset=utf-8");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  } else if (key.endsWith(".json")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  } else {
    headers.set("Content-Type", "application/vnd.microsoft.portable-executable");
    headers.set("Content-Disposition", 'attachment; filename="' + key + '"');
    headers.set("Cache-Control", "public, max-age=86400");
  }

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader.trim());
    if (!match) {
      headers.set("Content-Range", "bytes */" + meta.size);
      return new Response(null, { status: 416, headers });
    }

    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : meta.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) ||
        start < 0 || start >= meta.size || requestedEnd < start) {
      headers.set("Content-Range", "bytes */" + meta.size);
      return new Response(null, { status: 416, headers });
    }

    const end = Math.min(requestedEnd, meta.size - 1);
    const length = end - start + 1;
    const object = await env.UPDATES.get(key, {
      range: { offset: start, length }
    });
    if (!object) return response(404, "Not Found");

    headers.set("Content-Range", "bytes " + start + "-" + end + "/" + meta.size);
    headers.set("Content-Length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  const object = await env.UPDATES.get(key);
  if (!object) return response(404, "Not Found", { "Cache-Control": "no-store" });
  return new Response(object.body, { status: 200, headers });
}
