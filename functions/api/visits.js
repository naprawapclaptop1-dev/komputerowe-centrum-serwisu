import { dbRequired, json, nowIso, readJson, sameOrigin, text } from '../_lib.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest = async value => {
  const bytes = new TextEncoder().encode(value);
  const result = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(result)].map(x => x.toString(16).padStart(2, '0')).join('');
};
const dayString = date => date.toISOString().slice(0, 10);

async function summary(env) {
  const today = dayString(new Date());
  const weekDate = new Date();
  weekDate.setUTCDate(weekDate.getUTCDate() - 6);
  const weekStart = dayString(weekDate);
  const monthStart = `${today.slice(0, 7)}-01`;
  const totals = await env.DB.prepare(`
    SELECT
      COALESCE(SUM(visits),0) AS total_visits,
      COALESCE(SUM(page_views),0) AS total_page_views,
      COALESCE(SUM(CASE WHEN visit_day=? THEN visits ELSE 0 END),0) AS today_visits,
      COALESCE(SUM(CASE WHEN visit_day=? THEN page_views ELSE 0 END),0) AS today_page_views,
      COALESCE(SUM(CASE WHEN visit_day>=? THEN visits ELSE 0 END),0) AS week_visits,
      COALESCE(SUM(CASE WHEN visit_day>=? THEN page_views ELSE 0 END),0) AS week_page_views,
      COALESCE(SUM(CASE WHEN visit_day>=? THEN visits ELSE 0 END),0) AS month_visits
    FROM academy_site_daily_visits
  `).bind(today, today, weekStart, weekStart, monthStart).first();
  const [days, platform] = await Promise.all([
    env.DB.prepare(`
      SELECT visit_day AS day, visits, page_views
      FROM academy_site_daily_visits WHERE visit_day>=? ORDER BY visit_day ASC
    `).bind(weekStart).all(),
    env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM academy_site_unique_visitors) AS unique_visitors,
        (SELECT COUNT(*) FROM academy_users) AS registered_profiles,
        (SELECT COUNT(*) FROM academy_users WHERE email_normalized IS NOT NULL) AS email_accounts,
        (SELECT COUNT(*) FROM academy_users WHERE last_seen_at >= datetime('now','-30 days')) AS active_profiles_30d,
        (SELECT COUNT(*) FROM academy_knowledge_approved) AS approved_repair_cases,
        (SELECT COUNT(*) FROM academy_device_models) AS approved_device_models,
        (SELECT COUNT(*) FROM academy_device_model_submissions WHERE status='pending') AS pending_device_models,
        (SELECT COUNT(*) FROM academy_lesson_progress WHERE status='completed') AS completed_lesson_records,
        (SELECT COUNT(DISTINCT user_id) FROM academy_lesson_progress) AS learners_with_progress,
        (SELECT COUNT(*) FROM academy_events WHERE event_type='lesson_open') AS tracked_lesson_opens,
        (SELECT COUNT(*) FROM academy_events WHERE event_type='video_open') AS tracked_video_opens,
        (SELECT COUNT(*) FROM academy_events WHERE event_type='lesson_complete') AS tracked_lesson_completions
    `).first()
  ]);
  return json({
    ok: true,
    scope: 'all_public_visitors',
    metrics: { ...(totals || {}), ...(platform || {}) },
    days: days.results || [],
    updatedAt: nowIso(),
    privacy: 'Aggregate counts only. Visit totals represent anonymous browser sessions, not verified real-world persons. A random session identifier is SHA-256 hashed before D1 storage. No raw IP, user-agent or browser fingerprint is stored. Learning-event counts only include profiles that opted into cloud history sync.'
  });
}

export async function onRequestGet({ env }) {
  const missing = dbRequired(env);
  if (missing) return missing;
  try { return await summary(env); }
  catch (error) { return json({ error: 'VISITS_READ_FAILED', message: 'Nie udało się odczytać globalnych statystyk.' }, 503); }
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env);
  if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  let body;
  try { body = await readJson(request, 1200); }
  catch (error) { return json({ error: 'INVALID_BODY', message: error.message }, 400); }
  const sessionId = text(body.sessionId, 64);
  const pageViewId = text(body.pageViewId, 64);
  if (!UUID.test(sessionId) || !UUID.test(pageViewId)) return json({ error: 'INVALID_EVENT_ID' }, 400);
  const visitDay = dayString(new Date());
  const createdAt = nowIso();
  try {
    const [sessionHash, pageViewHash] = await Promise.all([digest(sessionId), digest(pageViewId)]);
    await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO academy_site_visit_sessions (session_hash,visit_day,created_at) VALUES (?,?,?)`).bind(sessionHash, visitDay, createdAt),
      env.DB.prepare(`INSERT OR IGNORE INTO academy_site_page_views (page_view_hash,visit_day,created_at) VALUES (?,?,?)`).bind(pageViewHash, visitDay, createdAt),
      env.DB.prepare(`INSERT INTO academy_site_unique_visitors (visitor_hash,first_seen_at,last_seen_at) VALUES (?,?,?)
        ON CONFLICT(visitor_hash) DO UPDATE SET last_seen_at=excluded.last_seen_at`).bind(sessionHash, createdAt, createdAt)
    ]);
    // Run retention cleanup at most once per UTC day; daily aggregates remain permanently.
    const cleanup = await env.DB.prepare(`SELECT maintenance_value FROM academy_site_maintenance WHERE maintenance_key='analytics_cleanup_day'`).first();
    if (cleanup?.maintenance_value !== visitDay) {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO academy_site_maintenance (maintenance_key,maintenance_value) VALUES ('analytics_cleanup_day',?) ON CONFLICT(maintenance_key) DO UPDATE SET maintenance_value=excluded.maintenance_value`).bind(visitDay),
        env.DB.prepare(`DELETE FROM academy_site_visit_sessions WHERE created_at < datetime('now','-90 days')`),
        env.DB.prepare(`DELETE FROM academy_site_page_views WHERE created_at < datetime('now','-30 days')`)
      ]);
    }
    return await summary(env);
  } catch (error) {
    return json({ error: 'VISITS_WRITE_FAILED', message: 'Nie udało się zapisać globalnej wizyty.' }, 503);
  }
}
