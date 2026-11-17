'use strict';
const BASE = String(process.env.AKADEMIA_URL || 'https://naprawa-pc-akademia-serwisu-pro.pages.dev').replace(/\/$/, '');
const NAMES = { google:'Google', microsoft:'Microsoft', facebook:'Facebook', github:'GitHub', discord:'Discord' };
// Read-only diagnostics: never reads or prints secret values; only missing variable names are shown.
(async () => {
  console.log('NAUKA OD A DO Z — DIAGNOSTYKA LOGOWANIA OAUTH');
  console.log('Adres:', BASE);
  let response;
  try { response = await fetch(`${BASE}/api/auth/status`, { headers:{ accept:'application/json' }, cache:'no-store', redirect:'manual' }); }
  catch (error) { console.error('[BŁĄD] Nie można połączyć się z endpointem /api/auth/status:', error.message); process.exitCode = 2; return; }
  if (!response.ok) { console.error(`[BŁĄD] Endpoint zwrócił HTTP ${response.status}. Sprawdź Pages Functions i wdrożenie.`); process.exitCode = 2; return; }
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) { console.error('[BŁĄD] Zamiast JSON otrzymano inną odpowiedź. Możliwe, że API nie zostało wdrożone.'); process.exitCode = 2; return; }
  const data = await response.json();
  console.log('Build HTML/API:', data.build || 'brak builda w API');
  console.log('Baza D1:', data.databaseReady ? 'DOSTĘPNA' : 'BRAK BINDINGU DB');
  console.log('Migracje OAuth + konto FIX20:', data.schemaReady ? 'GOTOWE' : 'NIEGOTOWE');
  console.log('Schemat kont FIX20:', data.accountSchemaReady ? 'GOTOWY' : 'NIEGOTOWY');
  for (const item of data.accountSchemaMissing || []) console.log('  Brak schematu kont:', item);
  if (Array.isArray(data.schemaMissing) && data.schemaMissing.length) for (const item of data.schemaMissing) console.log('  Brak:', item);
  console.log('Callback:', data.callbackUrl || `${BASE}/api/auth/callback`);
  console.log('\nDOSTAWCY:');
  for (const [key, label] of Object.entries(NAMES)) {
    const detail = data.providerDetails?.[key] || { configured:!!data.providers?.[key], missingKeys:[] };
    const active = !!data.databaseReady && !!data.schemaReady && !!detail.configured;
    console.log(`  ${active ? '[GOTOWE]' : '[NIEAKTYWNE]'} ${label}`);
    if (!detail.configured) for (const name of detail.missingKeys || []) console.log(`      brak sekretu: ${name}`);
    if (!data.databaseReady) console.log('      powód: brak produkcyjnego bindingu D1=DB');
    else if (!data.schemaReady) console.log('      powód: wymagane migracje OAuth nie są zastosowane');
  }
  console.log('\nUwaga: raport pokazuje wyłącznie nazwy sekretów, nigdy ich wartości. Metoda oznaczona GOTOWE oznacza komplet konfiguracji i schematu; prawdziwe logowanie trzeba jeszcze przetestować w przeglądarce.');
  if (!data.databaseReady || !data.schemaReady || !Object.values(data.providers || {}).some(Boolean)) process.exitCode = 1;
})().catch(error => { console.error('[BŁĄD]', error.message); process.exitCode = 2; });
