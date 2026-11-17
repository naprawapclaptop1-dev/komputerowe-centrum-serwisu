import { dbRequired, getSession, json, readJson, sameOrigin } from '../../_lib.js';

const ALLOWED = new Set(['google', 'facebook', 'microsoft', 'github', 'discord']);

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED', message: 'Zaloguj się, aby zobaczyć połączone metody.' }, 401);
  const [identityRows, account] = await Promise.all([
    env.DB.prepare('SELECT provider, created_at FROM academy_auth_identities WHERE user_id=? ORDER BY created_at ASC').bind(user.id).all(),
    env.DB.prepare('SELECT email_normalized, password_hash FROM academy_users WHERE id=? LIMIT 1').bind(user.id).first()
  ]);
  const identities = (identityRows.results || []).filter(row => ALLOWED.has(row.provider)).map(row => ({ provider: row.provider, createdAt: row.created_at }));
  const hasPasswordLogin = !!(account?.email_normalized && account?.password_hash);
  return json({ ok: true, identities, hasPasswordLogin, canUnlink: hasPasswordLogin || identities.length > 1 });
}

export async function onRequestDelete({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const user = await getSession(request, env);
  if (!user) return json({ error: 'SESSION_REQUIRED' }, 401);
  let body; try { body = await readJson(request, 2000); } catch (error) { return json({ error: 'INVALID_JSON', message: error.message }, 400); }
  const provider = String(body.provider || '').toLowerCase();
  if (!ALLOWED.has(provider)) return json({ error: 'OAUTH_PROVIDER_INVALID' }, 400);
  const account = await env.DB.prepare('SELECT email_normalized, password_hash FROM academy_users WHERE id=? LIMIT 1').bind(user.id).first();
  const hasPasswordLogin = !!(account?.email_normalized && account?.password_hash);
  // The condition and delete run as one SQL statement, preventing two simultaneous
  // unlink requests from removing the final login identity.
  const deletion = await env.DB.prepare(`DELETE FROM academy_auth_identities
    WHERE user_id=? AND provider=? AND (
      EXISTS (SELECT 1 FROM academy_users WHERE id=? AND email_normalized IS NOT NULL AND password_hash IS NOT NULL)
      OR (SELECT COUNT(*) FROM academy_auth_identities WHERE user_id=?) > 1
    )`).bind(user.id, provider, user.id, user.id).run();
  const changes = Number(deletion?.meta?.changes ?? deletion?.changes ?? 0);
  if (!changes) {
    const exists = await env.DB.prepare('SELECT 1 AS found FROM academy_auth_identities WHERE user_id=? AND provider=? LIMIT 1').bind(user.id, provider).first();
    if (!exists) return json({ error: 'IDENTITY_NOT_FOUND', message: 'Ta metoda nie jest połączona z profilem.' }, 404);
    return json({ error: 'LAST_LOGIN_METHOD', message: 'Nie można odłączyć ostatniej metody logowania. Najpierw dodaj konto e-mail i hasło albo połącz innego dostawcę.' }, 409);
  }
  return json({ ok: true, removed: provider, message: 'Metoda została odłączona. Tokeny dostawcy nie są przechowywane przez Akademię; w razie potrzeby cofnij zgodę także w ustawieniach tego dostawcy.' });
}
