import { dbRequired, getSession, json, sameOrigin, sha256Hex, nowIso, recordSecurityEvent } from '../../_lib.js';

function currentCookie(request) {
  const raw = request.headers.get('cookie') || '';
  for (const item of raw.split(';')) {
    const index = item.indexOf('=');
    if (index < 0 || item.slice(0, index).trim() !== 'academy_sid') continue;
    try { return decodeURIComponent(item.slice(index + 1).trim()); } catch { return ''; }
  }
  return '';
}

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  const token = currentCookie(request);
  if (!token || token.length < 40 || token.length > 100) return json({ error: 'SESSION_REQUIRED' }, 401);
  const currentHash = await sha256Hex(token);
  const rows = await env.DB.prepare(`SELECT token_hash, created_at, expires_at FROM academy_sessions
    WHERE user_id=? AND expires_at>? ORDER BY created_at DESC LIMIT 25`).bind(user.id, nowIso()).all();
  const sessions = (rows.results || []).map(row => ({
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isCurrent: row.token_hash === currentHash
  }));
  return json({ ok: true, sessions, currentSessionFound: sessions.some(row => row.isCurrent), canRevokeOthers: sessions.some(row => !row.isCurrent) });
}

export async function onRequestDelete({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  const token = currentCookie(request);
  if (!token || token.length < 40 || token.length > 100) return json({ error: 'SESSION_REQUIRED' }, 401);
  const currentHash = await sha256Hex(token);
  const result = await env.DB.prepare('DELETE FROM academy_sessions WHERE user_id=? AND token_hash<>?').bind(user.id, currentHash).run();
  const revoked = Number(result?.meta?.changes ?? result?.changes ?? 0);
  if (revoked > 0) await recordSecurityEvent(env, user.id, 'sessions_revoked', { revoked });
  return json({ ok: true, revoked: revoked, message: 'Wylogowano pozostałe urządzenia. Bieżąca sesja pozostała aktywna.' });
}
