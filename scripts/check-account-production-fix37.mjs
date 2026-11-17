import process from 'node:process';
const BASE = String(process.env.AKADEMIA_URL || 'https://naprawa-pc-akademia-serwisu-pro.pages.dev').replace(/\/$/, '');
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';
const providers = ['google','facebook','microsoft','github','discord'];
const jsonFetch = async (url, init={}) => {
  const response = await fetch(url, { cache:'no-store', ...init, headers:{ accept:'application/json', 'cache-control':'no-cache', ...(init.headers||{}) } });
  const data = await response.json().catch(()=>({}));
  return { response, data };
};
try {
  console.log('NAUKA OD A DO Z — KONTROLA KONT FIX39 (bez tworzenia konta)');
  console.log('Adres:', BASE);
  const session = await jsonFetch(`${BASE}/api/session?check=${Date.now()}`);
  console.log('API /api/session:', session.response.status);
  console.log('Schemat kont:', session.data.accountSchemaReady ? 'GOTOWY' : 'NIEGOTOWY');
  console.log('Limiter:', session.data.accountLimiterTable || 'brak informacji');
  for (const x of session.data.accountSchemaMissing || []) console.log('  Brak:', x);
  if (!session.response.ok || !session.data.accountSchemaReady || session.data.accountLimiterTable !== 'academy_account_rate_limits_v3') throw new Error('Schemat kont/limiter v3 nie jest gotowy.');
  const auth = await jsonFetch(`${BASE}/api/auth/status?check=${Date.now()}`);
  console.log('Build API:', auth.data.build || 'brak');
  if (!auth.response.ok || auth.data.build !== expectedBuild || auth.data.accountSchemaReady !== true || auth.data.accountLimiterTable !== 'academy_account_rate_limits_v3' || (auth.data.accountSchemaMissing||[]).length) throw new Error('API nie raportuje zgodnego FIX39 i kompletnego schematu kont.');
  for (const provider of providers) console.log(`  ${provider}: ${auth.data.providers?.[provider] ? 'sekrety skonfigurowane' : 'wymaga konfiguracji'}`);
  const negative = await jsonFetch(`${BASE}/api/session`, { method:'POST', headers:{ origin:BASE, 'content-type':'application/json' }, body:JSON.stringify({ purpose:'login', email:'qa-login-check@example.invalid', password:'TestInvalidOnly-2026!' }) });
  console.log('Test negatywny (.invalid): HTTP', negative.response.status, negative.data.error || '');
  if (negative.response.status !== 401 || !['LOGIN_FAILED','INVALID_CREDENTIALS'].includes(negative.data.error)) {
    console.error('Etap diagnostyczny:', negative.data.stage || 'brak');
    console.error('Referencja:', negative.data.reference || 'brak');
    throw new Error(`Oczekiwano HTTP 401, otrzymano ${negative.response.status} ${negative.data.error||''}.`);
  }
  console.log('PASS: publiczny endpoint zwraca 401; nie utworzono konta i nie zmieniono hasła.');
} catch (error) {
  console.error('[FAIL]', error.message);
  process.exitCode = 1;
}
