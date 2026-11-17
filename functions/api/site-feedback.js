import { CONSENT_VERSION, dbRequired, getSession, hashedClientRateKey, json, nowIso, readJson, rateLimit, sameOrigin, text } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env);
  if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  let body;
  try { body = await readJson(request, 9000); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  if (body.consent !== true) return json({ error: 'CONSENT_REQUIRED', message: 'Wymagana jest świadoma zgoda na przekazanie opinii.' }, 400);
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'INVALID_RATING' }, 400);
  const whatAdd = text(body.whatAdd, 1500);
  const whatChange = text(body.whatChange, 1500);
  const whatBroken = text(body.whatBroken, 1500);
  const details = text(body.details, 1500);
  const route = text(body.route, 220);
  if (![whatAdd, whatChange, whatBroken, details].some(Boolean)) return json({ error: 'EMPTY_FEEDBACK' }, 400);
  const ipBucket = await hashedClientRateKey(request, 'site-feedback-fix43');
  if (!await rateLimit(env, ipBucket, 8, 3600)) return json({ error: 'RATE_LIMIT', message: 'Limit zgłoszeń został osiągnięty. Spróbuj później.' }, 429);
  const session = await getSession(request, env);
  // Account association is optional and only included when an account has current, explicit consent.
  const userId = session?.consent_at && session?.consent_version === CONSENT_VERSION ? session.id : null;
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  await env.DB.prepare(`INSERT INTO academy_site_feedback
    (id,user_id,rating,what_add,what_change,what_broken,details,route,status,created_at)
    VALUES(?,?,?,?,?,?,?,?, 'new', ?)`)
    .bind(id, userId, rating, whatAdd, whatChange, whatBroken, details, route, createdAt).run();
  return json({ ok: true, id, status: 'new', createdAt }, 201);
}
