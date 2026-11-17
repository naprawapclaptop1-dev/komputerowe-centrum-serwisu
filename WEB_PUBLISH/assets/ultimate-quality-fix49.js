/* NAUKA OD A DO Z — FIX49 Ultimate Quality & Knowledge Center
 * Local-first QA, diagnostics, release contracts and safe operational plans.
 * No Cloudflare deploy, D1 mutation, production rollback or user-data upload.
 */
(() => {
  'use strict';
  const BUILD = '6.8.0-fix49';
  const STORE = 'npNaukaUltimateQualityFix49';
  const ERROR_STORE = 'npNaukaErrorCenterFix49';
  const PAGE = document.getElementById('view-fix49');
  const STAGE = document.getElementById('f49Stage');
  const STATUS = document.getElementById('f49Status');
  if (!PAGE || !STAGE) return;
  const $ = (selector, root = PAGE) => root?.querySelector(selector) || null;
  const $$ = (selector, root = PAGE) => Array.from(root?.querySelectorAll(selector) || []);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const clean = (value, max = 220) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/https?:\/\/[^\s)]+/g, '[URL]').replace(/(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]{12,})/gi, '[SECRET]').trim().slice(0, max);
  const now = () => new Date().toISOString();
  const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  function getStorage(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
  function setStorage(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
  function setStatus(text, bad = false) { if (!STATUS) return; STATUS.textContent = text; STATUS.classList.toggle('is-error', bad); STATUS.classList.toggle('is-good', !bad); }
  const state = parse(getStorage(STORE, ''), { audits: [], rooms: [], stagingPlans: [], rollbackPlans: [] });
  state.audits = Array.isArray(state.audits) ? state.audits.slice(0, 25) : [];
  state.rooms = Array.isArray(state.rooms) ? state.rooms.slice(0, 25) : [];
  state.stagingPlans = Array.isArray(state.stagingPlans) ? state.stagingPlans.slice(0, 15) : [];
  state.rollbackPlans = Array.isArray(state.rollbackPlans) ? state.rollbackPlans.slice(0, 15) : [];
  let activeTab = 'overview';
  let lastBrowserAudit = null;
  let lastReleaseAudit = null;
  let lastSecurityAudit = null;
  let lastMigrationAudit = null;

  function persist() { return setStorage(STORE, JSON.stringify(state)); }
  function getErrorLog() { return parse(getStorage(ERROR_STORE, '[]'), []).slice(0, 80); }
  function recordError(type, message, source = '') {
    const rows = getErrorLog();
    rows.unshift({ id: uid('ERR'), type: clean(type, 32), message: clean(message, 220), source: clean(String(source).split(/[?#]/)[0].split('/').pop(), 80), createdAt: now() });
    setStorage(ERROR_STORE, JSON.stringify(rows.slice(0, 80)));
  }
  // Capture browser errors without persisting query strings, stacks or arbitrary page content.
  window.addEventListener('error', event => recordError('error', event.message || 'Błąd JavaScript', event.filename || ''));
  window.addEventListener('unhandledrejection', event => recordError('unhandledrejection', event.reason?.message || String(event.reason || 'Odrzucona obietnica')));

  function runBrowserSmoke(doc = document) {
    const checks = [];
    const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: clean(detail, 260) });
    const ids = Array.from(doc.querySelectorAll('[id]')).map(node => node.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    add('Brak powtórzonych identyfikatorów HTML', duplicates.length === 0, duplicates.length ? duplicates.slice(0, 8).join(', ') : `${ids.length} unikalnych identyfikatorów`);
    const views = Array.from(doc.querySelectorAll('.view-section[id]'));
    const nav = Array.from(doc.querySelectorAll('.nav-item[data-view]'));
    const missingViews = nav.map(node => node.dataset.view).filter(id => !doc.getElementById(`view-${id}`));
    add('Każda pozycja nawigacji prowadzi do widoku', missingViews.length === 0, missingViews.length ? missingViews.join(', ') : `${nav.length} pozycji menu; ${views.length} widoków`);
    const deadButtons = Array.from(doc.querySelectorAll('button')).filter(node => !clean(node.textContent || node.getAttribute('aria-label') || node.getAttribute('title'), 4));
    add('Przyciski mają nazwę dostępną', deadButtons.length === 0, deadButtons.length ? `${deadButtons.length} przycisków bez etykiety` : `${doc.querySelectorAll('button').length} przycisków`);
    const unlabeled = Array.from(doc.querySelectorAll('input:not([type="hidden"]),select,textarea')).filter(node => !(node.labels?.length) && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby'));
    add('Pola formularzy mają etykiety', unlabeled.length === 0, unlabeled.length ? `${unlabeled.length} pól bez label/aria-label` : 'Wszystkie pola mają etykiety');
    const unsafeExternal = Array.from(doc.querySelectorAll('a[target="_blank"]')).filter(node => !/\bnoopener\b/i.test(node.rel) || !/\bnoreferrer\b/i.test(node.rel));
    add('Linki otwierane w nowej karcie mają rel ochronny', unsafeExternal.length === 0, `${unsafeExternal.length} linków wymagających poprawy`);
    const dangerousLinks = Array.from(doc.querySelectorAll('a[href]')).filter(node => /^\s*javascript:/i.test(node.getAttribute('href') || ''));
    add('Brak linków javascript:', dangerousLinks.length === 0, `${dangerousLinks.length} podejrzanych linków`);
    add('Meta build ID jest obecne', !!doc.querySelector('meta[name="academy-build"]')?.content, doc.querySelector('meta[name="academy-build"]')?.content || 'brak');
    add('Przeglądarka obsługuje fetch i Promise', typeof fetch === 'function' && typeof Promise === 'function', 'Wymagane przez audyt zasobów');
    return checks;
  }

  async function auditAssets() {
    const urls = [...new Set([
      ...Array.from(document.querySelectorAll('script[src]'), node => node.src),
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'), node => node.href)
    ].filter(url => { try { return new URL(url).origin === location.origin; } catch { return false; } }))];
    const issues = [];
    let checked = 0;
    const inspect = async url => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), 4000) : null;
      try {
        let response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller?.signal });
        if (response.status === 405) response = await fetch(url, { method: 'GET', cache: 'no-store', headers: { Range: 'bytes=0-0' }, signal: controller?.signal });
        if (!response.ok) issues.push({ url: new URL(url).pathname, status: response.status });
      } catch (error) { issues.push({ url: new URL(url).pathname, status: clean(error.message, 80) }); }
      finally { if (timeout) clearTimeout(timeout); checked++; }
    };
    for (let i = 0; i < urls.length; i += 10) await Promise.all(urls.slice(i, i + 10).map(inspect));
    return { checked, issues };
  }

  async function runReleaseGate() {
    const checks = [];
    const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: clean(detail, 240) });
    const meta = document.querySelector('meta[name="academy-build"]')?.content || '';
    let release = null, contract = null, swText = '';
    try { const response = await fetch('/release.json', { cache: 'no-store' }); if (!response.ok) throw new Error(`release.json HTTP ${response.status}`); release = await response.json(); } catch (error) { add('release.json dostępny', false, error.message); }
    try { const response = await fetch('/release-contract-fix49.json', { cache: 'no-store' }); if (!response.ok) throw new Error(`manifest HTTP ${response.status}`); contract = await response.json(); } catch (error) { add('Wspólny manifest wydania dostępny', false, error.message); }
    try { const response = await fetch('/service-worker.js', { cache: 'no-store' }); if (!response.ok) throw new Error(`Service Worker HTTP ${response.status}`); swText = await response.text(); } catch (error) { add('Service Worker dostępny', false, error.message); }
    if (release) add('HTML i release.json wskazują ten sam build', release.build === meta, `HTML=${meta || 'brak'}; release=${release.build || 'brak'}`);
    if (contract) add('release.json zgadza się z manifestem', release?.build === contract.build && contract.fix === 'FIX49', `${contract.fix || 'brak'} / ${contract.build || 'brak'}`);
    if (contract && swText) {
      const match = swText.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)/i);
      const assets = contract.assets || {};
      add('Cache PWA zawiera FIX49', !!match?.[1]?.includes(contract.cacheMarker) && swText.includes(assets.runtime || 'missing') && swText.includes(assets.styles || 'missing'), match?.[1] || 'CACHE_NAME nie znaleziony');
    }
    const assetResult = await auditAssets();
    add('Zasoby JS/CSS odpowiadają', assetResult.issues.length === 0 && assetResult.checked > 0, `${assetResult.checked} sprawdzonych; ${assetResult.issues.length} błędów`);
    const result = { checks, assets: assetResult, passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok).length, createdAt: now() };
    lastReleaseAudit = result;
    state.audits.unshift({ id: uid('REL'), type: 'release', passed: result.passed, failed: result.failed, createdAt: result.createdAt }); state.audits = state.audits.slice(0, 25); persist();
    return result;
  }

  function analyzeMigrationSql(sql) {
    const cleaned = String(sql || '').replace(/--[^\r\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const statements = cleaned.split(';').map(x => x.trim()).filter(Boolean);
    const findings = [];
    statements.forEach((statement, index) => {
      const add = (rule, severity, explanation) => findings.push({ statement: index + 1, rule, severity, explanation });
      if (/\bDROP\s+TABLE\b/i.test(statement)) add('DROP TABLE', 'critical', 'Może bezpowrotnie usunąć tabelę.');
      if (/\bTRUNCATE\s+TABLE\b/i.test(statement)) add('TRUNCATE', 'critical', 'Usuwa wszystkie rekordy tabeli.');
      if (/\bDELETE\s+FROM\b/i.test(statement) && !/\bWHERE\b/i.test(statement)) add('DELETE bez WHERE', 'critical', 'Może usunąć wszystkie rekordy.');
      if (/\bUPDATE\b/i.test(statement) && !/\bWHERE\b/i.test(statement)) add('UPDATE bez WHERE', 'high', 'Może zmienić wszystkie rekordy.');
      if (/\bALTER\s+TABLE\b[\s\S]*\bDROP\s+COLUMN\b/i.test(statement)) add('DROP COLUMN', 'critical', 'Usuwa wartości z kolumny.');
      if (/\bALTER\s+TABLE\b[\s\S]*\bADD\s+COLUMN\b/i.test(statement)) add('ADD COLUMN', 'info', 'Addytywna zmiana — sprawdź DEFAULT i kompatybilność.');
    });
    return { statementCount: statements.length, findings, safeForAutomaticApply: !findings.some(x => ['critical','high'].includes(x.severity)), executed: false };
  }

  async function runSecurityAudit() {
    const checks = [];
    const html = document.documentElement.outerHTML;
    const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: clean(detail, 220) });
    const externalUnsafe = $$('a[target="_blank"]').filter(a => !/noopener/i.test(a.rel) || !/noreferrer/i.test(a.rel));
    add('Linki zewnętrzne target=_blank są chronione', externalUnsafe.length === 0, `${externalUnsafe.length} wymagających poprawy`);
    const passwordFields = $$('input[type="password"]');
    const unsafeAutocomplete = passwordFields.filter(input => !['current-password','new-password','off'].includes(input.autocomplete));
    add('Pola haseł mają jawny autocomplete', unsafeAutocomplete.length === 0, `${passwordFields.length} pól hasła; ${unsafeAutocomplete.length} bez jawnej polityki`);
    const inlineHandlers = $$('script:not([src])').filter(script => /\bon(?:click|error|load)\s*=/i.test(script.textContent));
    add('Inline event handlers are not used in inline scripts', inlineHandlers.length === 0, `${inlineHandlers.length} skryptów inline wymaga przeglądu`);
    add('Brak prywatnego klucza PEM w DOM', !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(html), 'Kontrola tylko aktualnego DOM; pełny audyt źródeł wykonuje skrypt Node.js.');
    const report = { checks, passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok).length, createdAt: now(), scope: 'audyt DOM; nie zastępuje skanu repozytorium, SAST ani testu penetracyjnego' };
    lastSecurityAudit = report;
    return report;
  }

  function createStagingPlan(input = {}) {
    const branch = String(input.branch || 'staging-fix49').trim();
    if (!/^[a-z0-9][a-z0-9._/-]{1,62}$/i.test(branch) || branch === 'main') throw new Error('Podaj bezpieczną nazwę gałęzi staging (nie main).');
    const isolatedD1 = input.isolatedD1 === true;
    const previewSecrets = input.previewSecrets === true;
    const plan = { id: uid('STAGE'), branch, isolatedD1, previewSecrets, ready: isolatedD1 && previewSecrets, steps: ['Utwórz gałąź preview w istniejącym projekcie Pages.', 'Skonfiguruj oddzielne sekrety preview; nigdy nie kopiuj tokenów do repozytorium.', 'Utwórz lub wskaż oddzielną bazę D1 testową i osobny binding DB.', 'Wykonaj migracje wyłącznie na bazie testowej po backupie.', 'Opublikuj preview ręcznie i uruchom testy Playwright.', 'Nie promuj do main, dopóki wszystkie testy i ręczna akceptacja nie przejdą.'], createdAt: now() };
    state.stagingPlans.unshift(plan); state.stagingPlans = state.stagingPlans.slice(0, 15); persist();
    return plan;
  }

  function createRollbackPlan(input = {}) {
    const deployment = String(input.deployment || '').trim();
    if (!deployment || deployment.length > 300 || /[\r\n]/.test(deployment)) throw new Error('Podaj identyfikator lub URL poprzedniego deploymentu.');
    const plan = { id: uid('ROLLBACK'), deployment: clean(deployment, 300), scope: input.scope === 'data' ? 'code-and-data' : 'code-only', steps: ['Zatrzymaj obserwatora, aby nie uruchomił kolejnej publikacji.', 'Zweryfikuj, że wskazany deployment jest poprzednią sprawdzoną wersją.', 'Przywróć/promuj ten deployment w Cloudflare Pages.', 'Sprawdź stronę, logowanie, API i krytyczne moduły.', 'Nie cofaj D1 dla problemu dotyczącego tylko kodu.', 'Jeśli konieczny jest rollback danych, najpierw wykonaj dodatkowy backup i sprawdź zgodność schematu.'], createdAt: now(), executed: false };
    state.rollbackPlans.unshift(plan); state.rollbackPlans = state.rollbackPlans.slice(0, 15); persist();
    return plan;
  }

  function runReleaseGateSummary(browserResult, releaseResult, securityResult, migrationResult) {
    const checks = [
      { name: 'Audyt DOM', ok: !!browserResult && browserResult.every(x => x.ok) },
      { name: 'Zasoby i release', ok: !!releaseResult && releaseResult.failed === 0 },
      { name: 'Audyt bezpieczeństwa DOM', ok: !!securityResult && securityResult.failed === 0 },
      { name: 'Analiza migracji', ok: !!migrationResult && migrationResult.safeForAutomaticApply }
    ];
    return { ready: checks.every(x => x.ok), checks, message: checks.every(x => x.ok) ? 'Wszystkie kontrole lokalne PASS. Wymagana jest jeszcze akceptacja operatora i E2E na staging.' : 'Wydanie nie jest gotowe. Usuń statusy CHECK przed publikacją.', createdAt: now() };
  }

  function buildDiagnosticBundle() {
    const releaseMeta = document.querySelector('meta[name="academy-build"]')?.content || '';
    return {
      generatedAt: now(), app: 'NAUKA OD A DO Z', fix: 'FIX49', build: releaseMeta,
      browser: { userAgent: clean(navigator.userAgent, 180), online: navigator.onLine, language: clean(navigator.language, 20) },
      page: { path: location.pathname, viewCount: $$('.view-section').length, navCount: $$('.nav-item[data-view]').length },
      errors: getErrorLog().slice(0, 40), audits: state.audits.slice(0, 15),
      scope: 'Bez haseł, tokenów, zawartości formularzy, danych klientów, D1 i plików użytkownika.'
    };
  }

  function createPracticeRoom(input = {}) {
    const topic = clean(input.topic, 120);
    if (!topic) throw new Error('Wpisz temat wspólnego ćwiczenia.');
    const room = { id: uid('ROOM'), code: Math.random().toString(36).slice(2, 8).toUpperCase(), topic, mode: 'shared-code-local-plan', createdAt: now(), note: 'Kod można przekazać zespołowi, ale bieżąca synchronizacja wielu osób wymaga osobnego backendu.' };
    state.rooms.unshift(room); state.rooms = state.rooms.slice(0, 25); persist(); return room;
  }

  function downloadJSON(value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function card(title, body, wide = false) { return `<section class="f49-card${wide ? ' wide' : ''}"><h3>${esc(title)}</h3>${body}</section>`; }
  function button(label, action, primary = false) { return `<button type="button" class="f49-btn${primary ? ' primary' : ''}" data-f49-action="${esc(action)}">${esc(label)}</button>`; }
  const TABS = ['overview','browser','errors','release','staging','rollback','migrations','security','bundle','practice'];
  function overview() {
    const errors = getErrorLog();
    return `<div class="f49-hero"><div><span class="f49-kicker">ULTIMATE QUALITY & KNOWLEDGE CENTER</span><h2>Jeden silnik. Jedna kontrola. Bezpieczne wydania.</h2><p>FIX49 łączy audyt strony, rejestr błędów, manifest wydania, migracje, staging, rollback i diagnostykę. Nie wykonuje zmian produkcyjnych samodzielnie.</p><div class="f49-actions">${button('Uruchom kontrolę lokalną','run-all',true)}${button('Pobierz diagnostykę','download-bundle')}</div></div><div class="f49-mark"><b>49</b><span>QUALITY</span></div></div><div class="f49-stats"><div><b>${$$('.view-section').length}</b><span>widoków</span></div><div><b>${errors.length}</b><span>lokalnych błędów</span></div><div><b>${state.audits.length}</b><span>audytów zapisanych</span></div><div><b>${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</b><span>stan połączenia</span></div></div><div class="f49-grid">${card('Nowy wspólny kontrakt wydania', `<p>Build: <strong>${esc(document.querySelector('meta[name="academy-build"]')?.content || 'brak')}</strong></p><p>Źródło reguł: <strong>FIX49_RELEASE_MANIFEST.json</strong></p><p class="f49-note">OneClick i Auto-Watcher korzystają ze wspólnego helpera Service Worker / CACHE_NAME. Zmniejsza to ryzyko rozbieżności i błędów TDZ.</p>`, true)}${card('Zakres automatyzacji', '<ul><li>DOM, etykiety, nawigacja, linki i odpowiedzi zasobów.</li><li>Rejestrowanie błędów JS bez stacków i query stringów.</li><li>Audyt ryzyk SQL — bez wykonywania SQL.</li><li>Audyt źródeł i konfiguracji przez skrypt Node.js.</li><li>Staging i rollback jako plany operatora.</li></ul>')}${card('Ostatnie audyty', state.audits.slice(0, 6).map(x => `<div class="f49-row"><b>${esc(x.type)}</b><span>${x.passed} PASS / ${x.failed} CHECK</span><small>${esc(x.createdAt)}</small></div>`).join('') || '<p class="f49-muted">Nie wykonano jeszcze audytu.</p>')}</div>`;
  }
  function browserPane() { return `<div class="f49-grid">${card('Real Browser Testing PRO', '<p>Test w przeglądarce sprawdza identyfikatory, widoki, nawigację, nazwy przycisków, etykiety pól i bezpieczne linki. Pełne E2E Playwright uruchom skryptem Windows po zainstalowaniu Playwright.</p>'+button('Uruchom test DOM','browser-smoke',true)+'<div id="f49BrowserResults" class="f49-check-list"></div>', true)}${card('Test zasobów', '<p>Żądania HEAD/Range wykonywane są do zasobów tej samej domeny, z limitem równoległości i timeoutem.</p>'+button('Sprawdź JS/CSS/manifest','asset-audit'))}</div>`; }
  function errorsPane() { const rows = getErrorLog(); return `<div class="f49-grid">${card(`Universal Error Center (${rows.length})`, rows.map(x => `<article class="f49-error-row"><b>${esc(x.type)}</b><small>${esc(x.createdAt)} · ${esc(x.source)}</small><p>${esc(x.message)}</p></article>`).join('') || '<p class="f49-muted">Nie zarejestrowano błędów w tej przeglądarce.</p>'+button('Eksportuj diagnostykę','download-bundle'))}${card('Zasady prywatności', '<p>Rejestrowane są krótkie komunikaty błędów, bez stacków, zawartości formularzy, query stringów i tokenów. Dane pozostają w tej przeglądarce do czasu eksportu lub wyczyszczenia.</p>'+button('Wyczyść lokalny dziennik','clear-errors'))}</div>`; }
  function releasePane() { return `<div class="f49-grid">${card('Release Pipeline MASTER', '<p>Manifest jest jedynym źródłem build ID, wersji assetów, znacznika cache i wymaganych testów. OneClick i watcher odczytują ten sam kontrakt.</p>'+button('Uruchom bramkę wydania','release-gate',true)+'<div id="f49ReleaseResults" class="f49-check-list"></div>', true)}${card('Test Playwright', '<p>Test przeglądarkowy jest opcjonalny i wymaga Playwright oraz działającego adresu strony.</p><code>ACADEMY_E2E_URL=https://adres-preview node scripts/run-browser-e2e-fix49.mjs</code><p class="f49-note">Brak Playwright oznacza SKIP, a nie PASS.</p>')}</div>`; }
  function stagingPane() { return `<div class="f49-grid">${card('Cloudflare Staging PRO', '<form id="f49StagingForm" class="f49-form"><label>Gałąź preview<input name="branch" value="staging-fix49" maxlength="63" required></label><label class="f49-checkline"><input name="isolatedD1" type="checkbox"> Mam oddzielną bazę D1 dla preview</label><label class="f49-checkline"><input name="previewSecrets" type="checkbox"> Sekrety preview są skonfigurowane osobno</label><button class="f49-btn primary" type="submit">Przygotuj plan staging</button></form><div id="f49StagingResult"></div>', true)}${card('Warunek bezpieczeństwa', '<p>Nie publikuj preview, które ma binding do produkcyjnej D1. Nie kopiuj sekretów do repozytorium ani do plików JSON. Panel nie tworzy projektu, bazy ani deploymentu.</p>')}</div>`; }
  function rollbackPane() { return `<div class="f49-grid">${card('Automatic Rollback PRO', '<form id="f49RollbackForm" class="f49-form"><label>Poprzedni deployment ID / URL<input name="deployment" maxlength="300" required placeholder="deployment-id lub https://…"></label><label>Zakres<select name="scope"><option value="code">Tylko kod Pages (zalecane)</option><option value="data">Kod i dane (wymaga osobnej procedury)</option></select></label><button class="f49-btn primary" type="submit">Przygotuj plan rollbacku</button></form><div id="f49RollbackResult"></div>', true)}${card('Ważne', '<p>Przywrócenie kodu Pages nie powinno automatycznie przywracać D1. Cofnięcie schematu lub danych może utracić nowsze rekordy i wymaga ręcznej oceny zgodności.</p>')}</div>`; }
  function migrationsPane() { return `<div class="f49-grid">${card('Database Migration Simulator', '<p>Wklej treść migracji SQL. Analizator wykrywa potencjalnie destrukcyjne operacje i klasyfikuje ryzyko. SQL nie jest wykonywany i nie łączy się z D1.</p><form id="f49MigrationForm" class="f49-form"><label class="full">SQL<textarea name="sql" rows="9" required placeholder="CREATE TABLE…"></textarea></label><button class="f49-btn primary" type="submit">Przeanalizuj migrację</button></form><div id="f49MigrationResult"></div>', true)}${card('Reguły', '<ul><li>DROP TABLE / TRUNCATE / DELETE bez WHERE: krytyczne.</li><li>UPDATE bez WHERE / DROP COLUMN: wysokie lub krytyczne.</li><li>ADD COLUMN / CREATE TABLE: informacyjne, wymagają sprawdzenia kompatybilności.</li><li>Każda migracja produkcyjna nadal wymaga backupu D1.</li></ul>')}</div>`; }
  function securityPane() { return `<div class="f49-grid">${card('Security Audit PRO', '<p>Audyt DOM analizuje pola haseł, linki zewnętrzne, niebezpieczne linki i potencjalny klucz PEM. Pełny skan źródeł i konfiguracji wykonuje skrypt Node.js.</p>'+button('Uruchom audyt DOM','security-audit',true)+'<div id="f49SecurityResults" class="f49-check-list"></div>', true)}${card('Audyt repozytorium', '<code>node scripts/security-audit-fix49.mjs</code><p class="f49-note">Wyniki podają plik, linię i regułę, ale nigdy nie wypisują wartości sekretu. Skan nie jest testem penetracyjnym ani SAST klasy enterprise.</p>')}</div>`; }
  function bundlePane() { return `<div class="f49-grid">${card('Diagnostic Bundle', '<p>Eksportuje build ID, liczbę widoków, błędy przeglądarki i historię audytów. Nie eksportuje haseł, tokenów, formularzy, danych klientów ani plików użytkownika.</p>'+button('Pobierz JSON diagnostyczny','download-bundle',true), true)}${card('Pełny pakiet lokalny', '<code>node scripts/diagnostic-bundle-fix49.mjs</code><p>Tworzy manifest diagnostyczny z odciskami SHA-256 kluczowych plików projektu. Nie dołącza backupów D1 ani sekretów środowiskowych.</p>')}</div>`; }
  function practicePane() { return `<div class="f49-grid">${card('Repair Academy Multiplayer', '<form id="f49PracticeForm" class="f49-form"><label>Temat ćwiczenia<input name="topic" maxlength="120" required placeholder="np. diagnoza braku zasilania"></label><button class="f49-btn primary" type="submit">Utwórz kod sesji</button></form><div id="f49PracticeResult"></div>', true)}${card('Ograniczenia sesji', '<p>W tej wersji sesja generuje kod i plan wspólnego ćwiczenia. Nie synchronizuje na żywo wielu osób — to wymaga osobnego backendu, kont i kontroli dostępu. Nie wpisuj danych klienta.</p>')}</div>`; }

  const templates = { overview, browser: browserPane, errors: errorsPane, release: releasePane, staging: stagingPane, rollback: rollbackPane, migrations: migrationsPane, security: securityPane, bundle: bundlePane, practice: practicePane };
  function render() {
    STAGE.innerHTML = (templates[activeTab] || overview)();
    $$('.f49-tab').forEach(tab => { const selected = tab.dataset.f49Tab === activeTab; tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); });
  }
  function showChecks(target, checks) {
    const host = $(target); if (!host) return;
    host.innerHTML = checks.map(row => `<div class="f49-check ${row.ok ? 'ok' : 'warn'}"><b>${row.ok ? 'PASS' : 'CHECK'}</b><span>${esc(row.name)}</span><small>${esc(row.detail)}</small></div>`).join('');
  }
  function showFindings(target, findings, emptyText) {
    const host = $(target); if (!host) return;
    host.innerHTML = findings.length ? findings.map(row => `<div class="f49-check ${row.severity === 'critical' || row.severity === 'high' ? 'warn' : 'ok'}"><b>${esc(row.severity)}</b><span>${esc(row.rule)}</span><small>${esc(row.explanation)}</small></div>`).join('') : `<p class="f49-good">${esc(emptyText)}</p>`;
  }

  PAGE.addEventListener('click', async event => {
    const tab = event.target.closest('[data-f49-tab]');
    if (tab) { activeTab = tab.dataset.f49Tab; if (TABS.includes(activeTab)) render(); return; }
    const action = event.target.closest('[data-f49-action]')?.dataset.f49Action;
    if (!action) return;
    try {
      if (action === 'run-audit' || action === 'browser-smoke') {
        const checks = runBrowserSmoke(); lastBrowserAudit = checks; showChecks('#f49BrowserResults', checks); showChecks('#f49AuditSummary', checks); setStatus(`Audyt DOM: ${checks.filter(x => x.ok).length}/${checks.length} PASS.`);
      } else if (action === 'asset-audit') {
        const result = await auditAssets(); const checks = [{ name: 'Zasoby same-origin', ok: result.checked > 0 && result.issues.length === 0, detail: `${result.checked} sprawdzonych; ${result.issues.length} problemów` }]; showChecks('#f49BrowserResults', checks); setStatus(checks[0].detail, !checks[0].ok);
      } else if (action === 'release-gate' || action === 'run-all') {
        if (action === 'run-all') activeTab = 'release';
        const browser = runBrowserSmoke(); lastBrowserAudit = browser;
        const [release, security] = await Promise.all([runReleaseGate(), runSecurityAudit()]);
        const gate = runReleaseGateSummary(browser, release, security, lastMigrationAudit);
        if (STAGE) { render(); showChecks('#f49ReleaseResults', [...browser, ...release.checks, ...security.checks, { name: 'Bramka zbiorcza', ok: gate.ready, detail: gate.message }]); }
        setStatus(gate.message, !gate.ready);
      } else if (action === 'security-audit') {
        const result = await runSecurityAudit(); showChecks('#f49SecurityResults', result.checks); setStatus(`Audyt DOM: ${result.passed}/${result.checks.length} PASS, ${result.failed} CHECK.`, result.failed > 0);
      } else if (action === 'download-bundle') {
        const data = buildDiagnosticBundle(); downloadJSON(data, `NAUKA_FIX49_DIAGNOSTICS_${new Date().toISOString().slice(0,10)}.json`); setStatus('Pobrano bezpieczny pakiet diagnostyczny JSON.');
      } else if (action === 'clear-errors') {
        setStorage(ERROR_STORE, '[]'); render(); setStatus('Lokalny dziennik błędów wyczyszczony.');
      }
    } catch (error) { recordError('panel-action', error.message); setStatus(clean(error.message), true); }
  });

  PAGE.addEventListener('submit', event => {
    event.preventDefault(); const form = event.target;
    try {
      if (form.id === 'f49StagingForm') {
        const data = new FormData(form); const plan = createStagingPlan({ branch: data.get('branch'), isolatedD1: data.has('isolatedD1'), previewSecrets: data.has('previewSecrets') });
        $('#f49StagingResult').innerHTML = `<div class="f49-check ${plan.ready ? 'ok' : 'warn'}"><b>${plan.ready ? 'READY FOR MANUAL REVIEW' : 'BLOCKED'}</b><span>${plan.ready ? 'Warunki staging spełnione' : 'Staging zablokowany: wymagana oddzielna D1 i osobne sekrety preview.'}</span><small>${esc(plan.steps.join(' · '))}</small></div>`;
        setStatus(plan.ready ? 'Plan staging zapisany — wymagana ręczna publikacja.' : 'Plan staging zapisany, ale warunki bezpieczeństwa nie są spełnione.', !plan.ready);
      } else if (form.id === 'f49RollbackForm') {
        const data = new FormData(form); const plan = createRollbackPlan({ deployment: data.get('deployment'), scope: data.get('scope') });
        $('#f49RollbackResult').innerHTML = `<div class="f49-check ok"><b>PLAN ZAPISANY — NIE WYKONANO</b><span>${esc(plan.deployment)}</span><small>${esc(plan.steps.join(' · '))}</small></div>`; setStatus('Plan rollbacku przygotowany. Nic nie zostało przywrócone.');
      } else if (form.id === 'f49MigrationForm') {
        const data = new FormData(form); lastMigrationAudit = analyzeMigrationSql(data.get('sql'));
        showFindings('#f49MigrationResult', lastMigrationAudit.findings, `PASS — ${lastMigrationAudit.statementCount} instrukcji; nie wykryto destrukcyjnych operacji.`);
        setStatus(lastMigrationAudit.safeForAutomaticApply ? 'Analiza SQL bez wykrytych operacji wysokiego ryzyka. SQL nie został wykonany.' : 'Migracja wymaga ręcznej kontroli. SQL nie został wykonany.', !lastMigrationAudit.safeForAutomaticApply);
      } else if (form.id === 'f49PracticeForm') {
        const data = new FormData(form); const room = createPracticeRoom({ topic: data.get('topic') });
        $('#f49PracticeResult').innerHTML = `<div class="f49-room"><b>KOD: ${esc(room.code)}</b><p>${esc(room.topic)}</p><small>${esc(room.note)}</small><button type="button" class="f49-btn" data-f49-action="copy-room" data-room-code="${esc(room.code)}">Kopiuj kod</button></div>`;
        setStatus('Utworzono lokalny kod sesji ćwiczeniowej.');
      }
    } catch (error) { setStatus(clean(error.message), true); }
  });
  PAGE.addEventListener('click', async event => {
    const copy = event.target.closest('[data-f49-action="copy-room"]');
    if (copy) { const text = copy.dataset.roomCode || ''; try { await navigator.clipboard.writeText(text); setStatus('Kod sesji skopiowany.'); } catch { setStatus(`Kod sesji: ${text}`); } }
  });

  const api = {
    build: BUILD, tabs: TABS.slice(), runBrowserSmoke, auditAssets, getErrorLog,
    analyzeMigrationSql, runSecurityAudit, createStagingPlan, createRollbackPlan,
    runReleaseGate, runReleaseGateSummary, buildDiagnosticBundle, createPracticeRoom,
    getState: () => JSON.parse(JSON.stringify(state))
  };
  window.NP_NAUKA_FIX49 = api;
  render();
  setStatus('FIX49 gotowy. Audyty działają lokalnie; staging, migracje i rollback wymagają ręcznej akceptacji.');
})();
