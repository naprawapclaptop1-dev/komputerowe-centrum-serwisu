import { dbRequired, getSession, hashedClientRateKey, json, nowIso, readJson, rateLimit, safeUrls, sameOrigin, text } from '../_lib.js';

const TYPES = new Set(['laptop','desktop','workstation','all-in-one','mini-pc']);
function parseUrls(raw) { try { return JSON.parse(raw || '[]'); } catch { return []; } }

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const url = new URL(request.url);
  const q = text(url.searchParams.get('q'), 100).toLowerCase();
  const brand = text(url.searchParams.get('brand'), 60);
  const type = text(url.searchParams.get('type'), 24);
  const result = await env.DB.prepare(`SELECT id,brand,model,series,device_type,board_id,pcb_revision,cpu_platform,gpu,ram_type,storage,display_info,known_issues,repair_notes,source_urls_json,attribution,approved_at
    FROM academy_device_models ORDER BY brand COLLATE NOCASE, model COLLATE NOCASE LIMIT 500`).all();
  const items = (result.results || []).filter(x => (!brand || x.brand === brand) && (!TYPES.has(type) || x.device_type === type) && (!q || [x.brand,x.model,x.series,x.board_id,x.pcb_revision,x.cpu_platform,x.gpu,x.known_issues].join(' ').toLowerCase().includes(q)))
    .map(x => ({ ...x, sourceUrls: parseUrls(x.source_urls_json) }));
  const counts = await env.DB.prepare('SELECT brand,COUNT(*) AS count FROM academy_device_models GROUP BY brand ORDER BY brand COLLATE NOCASE').all();
  return json({ items, brands: counts.results || [], total: items.length, curatedNote: 'Wpisy społeczności są publikowane po moderacji. Rodziny produktowe w katalogu interfejsu są orientacyjne i nie zastępują dokładnego numeru modelu ani rewizji płyty.' });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const user = await getSession(request, env);
  if (!user) return json({ error: 'ACCOUNT_REQUIRED', message: 'Zaloguj się lub utwórz konto, aby dodać model do katalogu społeczności.' }, 401);
  if (!await rateLimit(env, `device-model:${user.id}`, 8, 3600)) return json({ error: 'RATE_LIMIT', message: 'Limit zgłoszeń modeli został osiągnięty. Spróbuj później.' }, 429);
  if (!await rateLimit(env, await hashedClientRateKey(request, 'device-model-submit'), 20, 3600)) return json({ error: 'NETWORK_RATE_LIMIT', message: 'Zbyt wiele zgłoszeń z tej sieci. Spróbuj później.' }, 429);
  let b; try { b = await readJson(request, 12000); } catch (e) { return json({ error: e.message }, 400); }
  const brand = text(b.brand, 70), model = text(b.model, 120), series = text(b.series, 100);
  const deviceType = TYPES.has(b.deviceType) ? b.deviceType : 'laptop';
  const boardId = text(b.boardId, 100), revision = text(b.revision, 50), cpuPlatform = text(b.cpuPlatform, 100);
  const gpu = text(b.gpu, 120), ramType = text(b.ramType, 80), storage = text(b.storage, 100), display = text(b.display, 100);
  const knownIssues = text(b.knownIssues, 1800), repairNotes = text(b.repairNotes, 2200), attribution = text(b.attribution || user.nickname, 80);
  const urls = safeUrls(b.sourceUrls);
  if (brand.length < 2 || model.length < 2) return json({ error: 'MODEL_REQUIRED', message: 'Wybierz markę i wpisz model urządzenia.' }, 400);
  if (b.rightsConfirmed !== true || b.shareConsent !== true || b.licenseAgreement !== true) return json({ error: 'MODEL_RIGHTS_REQUIRED', message: 'Potwierdź prawa do informacji i zgodę na moderację wpisu.' }, 400);
  const id = crypto.randomUUID(), at = nowIso();
  await env.DB.prepare(`INSERT INTO academy_device_model_submissions
    (id,user_id,brand,model,series,device_type,board_id,pcb_revision,cpu_platform,gpu,ram_type,storage,display_info,known_issues,repair_notes,source_urls_json,attribution,rights_confirmed_at,license_code,share_consent,status,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'pending',?)`)
    .bind(id,user.id,brand,model,series,deviceType,boardId,revision,cpuPlatform,gpu,ramType,storage,display,knownIssues,repairNotes,JSON.stringify(urls),attribution,at,'ACADEMY_DEVICE_MODEL_NONEXCLUSIVE_2026',at).run();
  await env.DB.prepare(`INSERT INTO academy_events(id,user_id,event_type,resource_id,title,details_json,created_at) VALUES(?,?, 'device_model_submit',?,?,?,?)`)
    .bind(crypto.randomUUID(), user.id, id, `${brand} ${model}`, JSON.stringify({ boardId, revision, deviceType }), at).run();
  return json({ ok: true, id, status: 'pending', message: 'Model zapisany i przekazany do moderacji. Po zatwierdzeniu pojawi się w katalogu społeczności.' }, 201);
}
