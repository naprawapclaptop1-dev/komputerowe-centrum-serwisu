/* NAUKA OD A DO Z — FIX47 MASTER CONTROL CENTER
 * Local-first workspace: platform QA, feedback triage, practical projects,
 * compatibility estimates, service workflow, learning plans and release guardian.
 * No production deploy, D1 mutation, firmware write or physical hardware control.
 */
(() => {
  'use strict';
  const BUILD = '6.8.0-fix47';
  const STORE = 'npNaukaMasterControlFix47';
  const FEEDBACK_STORE = 'npNaukaSiteFeedbackFix43';
  const PAGE = document.getElementById('view-fix47');
  const STAGE = document.getElementById('f47Stage');
  const STATUS = document.getElementById('f47Status');
  const $ = (selector, root = PAGE) => root?.querySelector(selector) || null;
  const $$ = (selector, root = PAGE) => Array.from(root?.querySelectorAll(selector) || []);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const clean = (value, max = 500) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  const now = () => new Date().toISOString();
  const uid = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const parse = (raw, fallback) => { if (raw == null || raw === '') return fallback; try { return JSON.parse(raw); } catch { return fallback; } };
  const storageGet = (key, fallback = null) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
  const bounded = (list, max, normalize) => Array.isArray(list) ? list.slice(0, max).map(normalize).filter(Boolean) : [];
  const blank = () => ({ version: 1, orders: [], projects: [], coursePlans: [], qaRuns: [], events: [], updatedAt: now() });
  function normalize(input) {
    const out = blank();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
    out.orders = bounded(input.orders, 300, row => {
      if (!row || typeof row !== 'object') return null;
      const status = ['Nowe', 'W diagnozie', 'Oczekuje na część', 'Do testów', 'Zakończone', 'Wstrzymane'].includes(row.status) ? row.status : 'Nowe';
      return { id: clean(row.id, 80) || uid('JOB'), ref: clean(row.ref, 80), device: clean(row.device, 140), issue: clean(row.issue, 600), status, estimate: Math.max(0, Math.min(1000000, Number(row.estimate) || 0)), createdAt: clean(row.createdAt, 40) || now(), updatedAt: clean(row.updatedAt, 40) || now() };
    }).filter(row => row.device && row.issue);
    out.projects = bounded(input.projects, 100, row => ({ id: clean(row?.id, 100), done: !!row?.done, score: Math.max(0, Math.min(100, Number(row?.score) || 0)), updatedAt: clean(row?.updatedAt, 40) || now() }));
    out.coursePlans = bounded(input.coursePlans, 100, row => ({ id: clean(row?.id, 90) || uid('PLAN'), kind: row?.kind === 'group' ? 'group' : 'plan', title: clean(row?.title, 140), target: clean(row?.target, 140), level: ['Początkujący', 'Średni', 'Zaawansowany'].includes(row?.level) ? row.level : 'Początkujący', participants: Math.max(0, Math.min(500, Math.floor(Number(row?.participants) || 0))), createdAt: clean(row?.createdAt, 40) || now() })).filter(row => row.title);
    out.qaRuns = bounded(input.qaRuns, 30, row => ({ id: clean(row?.id, 80) || uid('QA'), passed: Math.max(0, Number(row?.passed) || 0), failed: Math.max(0, Number(row?.failed) || 0), total: Math.max(0, Number(row?.total) || 0), createdAt: clean(row?.createdAt, 40) || now() }));
    out.events = bounded(input.events, 120, row => ({ id: clean(row?.id, 80) || uid('EVT'), label: clean(row?.label, 140), createdAt: clean(row?.createdAt, 40) || now() })).filter(row => row.label);
    out.updatedAt = clean(input.updatedAt, 40) || now();
    return out;
  }
  let state = normalize(parse(storageGet(STORE), null));
  let activeTab = 'overview';
  let adminToken = '';
  let remoteFeedback = [];
  let lastAudit = [];
  function persist() {
    state.updatedAt = now();
    try { if (!storageSet(STORE, JSON.stringify(state))) throw new Error('localStorage niedostępny'); return true; }
    catch (error) { setStatus(`Nie udało się zapisać lokalnych danych: ${clean(error.message, 140)}`, true); return false; }
  }
  function log(label) { state.events.unshift({ id: uid('EVT'), label: clean(label, 140), createdAt: now() }); state.events = state.events.slice(0, 120); persist(); }
  function setStatus(message, error = false) {
    if (!STATUS) return;
    STATUS.textContent = message;
    STATUS.classList.toggle('is-error', !!error);
    STATUS.classList.toggle('is-good', !error);
  }
  const PROJECTS = [
    { id: 'pc-intake', title: 'Przyjęcie i oględziny komputera', level: 'Początkujący', desc: 'Zbierz objawy, warunki wystąpienia i bezpiecznie opisz stan urządzenia.', steps: ['Zapisz model i konfigurację.', 'Zbierz objawy bez rozkręcania urządzenia.', 'Zabezpiecz dane i uzyskaj zgodę na diagnostykę.'] },
    { id: 'no-power', title: 'Laptop nie uruchamia się', level: 'Średni', desc: 'Ułóż bezpieczną kolejność weryfikacji wejścia zasilania i sygnałów.', steps: ['Zweryfikuj zasilacz i przewód.', 'Sprawdź oględziny przy odłączonym zasilaniu.', 'Odnajdź właściwy schemat płyty i rewizji.'] },
    { id: 'black-screen', title: 'Czarny ekran po uruchomieniu', level: 'Średni', desc: 'Rozdziel problem obrazu, POST, pamięci i toru wyświetlania.', steps: ['Sprawdź diody i sygnały startowe.', 'Porównaj obraz na zewnętrznym ekranie.', 'Sprawdź konfigurację pamięci i dokumentację panelu.'] },
    { id: 'overheat', title: 'Przegrzewanie i throttling', level: 'Początkujący', desc: 'Zbierz temperatury, obciążenie i stan układu chłodzenia.', steps: ['Zapisz temperaturę otoczenia.', 'Oceń przepływ powietrza i wentylatory.', 'Po serwisie wykonaj kontrolowany test.'] },
    { id: 'nvme', title: 'Dysk NVMe niewykrywany', level: 'Zaawansowany', desc: 'Pracuj na kopii lub trybie tylko do odczytu; nie inicjalizuj nośnika.', steps: ['Zabezpiecz nośnik i dane.', 'Sprawdź protokół, klucz i obsługę gniazda.', 'Zapisz SMART oraz logi przed działaniem.'] },
    { id: 'ram', title: 'Diagnostyka pamięci RAM', level: 'Początkujący', desc: 'Przygotuj kontrolowany plan testów pamięci i modułów.', steps: ['Ustal obsługiwaną generację i konfigurację.', 'Testuj pojedyncze moduły w zalecanych slotach.', 'Zapisz wynik i konfigurację testu.'] },
    { id: 'usb-c', title: 'Problem z ładowaniem USB-C', level: 'Zaawansowany', desc: 'Rozpoznaj przewód, zasilacz, profil PD i układ wejściowy.', steps: ['Sprawdź certyfikowany przewód i źródło.', 'Ustal obsługiwane profile PD z dokumentacji.', 'Nie sonduj linii danych bez procedury i sprzętu.'] },
    { id: 'post-repair', title: 'Kontrola po naprawie', level: 'Średni', desc: 'Udokumentuj funkcje, temperatury i wynik testów końcowych.', steps: ['Sprawdź wszystkie porty i peryferia.', 'Wykonaj testy stabilności w bezpiecznych granicach.', 'Zapisz raport i ograniczenia wykonanych testów.'] }
  ];
  const TOPIC_RULES = [
    { keys: ['bios', 'uefi', 'firmware'], title: 'BIOS / UEFI', nav: 'fix44', tasks: ['Zidentyfikuj dokładny model płyty i rewizję.', 'Wykonaj kopię wsadu tylko do odczytu.', 'Porównaj regiony i sprawdź sumy kontrolne.'] },
    { keys: ['zasil', 'power', 'nie start', 'urucham'], title: 'Diagnostyka zasilania', nav: 'fix43', tasks: ['Zbierz objawy oraz warunki startu.', 'Znajdź schemat właściwej rewizji.', 'Porównaj sekwencję ze znanymi pomiarami.'] },
    { keys: ['dysk', 'nvme', 'ssd', 'hdd', 'dane'], title: 'Nośniki i odzyskiwanie danych', nav: 'fix44', tasks: ['Zabezpiecz nośnik i nie zapisuj na nim.', 'Pracuj na obrazie lub kopii.', 'Sprawdź system plików i logi.'] },
    { keys: ['ram', 'pamięć', 'pamiec'], title: 'Pamięć RAM', nav: 'fix45', tasks: ['Ustal generację i obsługę przez płytę.', 'Testuj moduły pojedynczo.', 'Dokumentuj slot, moduł i wynik.'] },
    { keys: ['sieć', 'siec', 'router', 'wifi', 'dns'], title: 'Sieci komputerowe', nav: 'fix44', tasks: ['Sprawdź adresację i bramę.', 'Zweryfikuj DNS i DHCP.', 'Testuj połączenie bez skanowania cudzych sieci.'] },
    { keys: ['temper', 'chłod', 'chlod', 'wentyl'], title: 'Termika i chłodzenie', nav: 'fix45', tasks: ['Zapisz temperaturę otoczenia.', 'Sprawdź drożność chłodzenia.', 'Zweryfikuj montaż radiatora i wentylatory.'] }
  ];
  function compatibility(input = {}) {
    const cpuSocket = clean(input.cpuSocket, 30).toUpperCase();
    const boardSocket = clean(input.boardSocket, 30).toUpperCase();
    const ramType = clean(input.ramType, 20).toUpperCase();
    const boardRamType = clean(input.boardRamType, 20).toUpperCase();
    const requiredW = Math.max(0, Number(input.estimatedW) || 0);
    const psuW = Math.max(0, Number(input.psuW) || 0);
    const socketKnown = !!(cpuSocket && boardSocket);
    const ramKnown = !!(ramType && boardRamType);
    const items = [
      { key: 'socket', label: 'Socket CPU / płyta', status: !socketKnown ? 'unknown' : cpuSocket === boardSocket ? 'pass' : 'fail', detail: !socketKnown ? 'Uzupełnij oba pola.' : cpuSocket === boardSocket ? 'Oznaczenia są zgodne; nadal sprawdź listę obsługiwanych CPU i BIOS.' : 'Różne oznaczenia socketu — konfiguracja niezgodna.' },
      { key: 'ram', label: 'Typ RAM / płyta', status: !ramKnown ? 'unknown' : ramType === boardRamType ? 'pass' : 'fail', detail: !ramKnown ? 'Uzupełnij oba pola.' : ramType === boardRamType ? 'Typ pamięci jest zgodny; sprawdź taktowanie, pojemność i QVL.' : 'Różne generacje/typy pamięci — konfiguracja niezgodna.' },
      { key: 'psu', label: 'Moc zasilacza', status: !requiredW || !psuW ? 'unknown' : psuW >= Math.ceil(requiredW * 1.25) ? 'pass' : 'warn', detail: !requiredW || !psuW ? 'Podaj szacowaną moc zestawu i moc PSU.' : psuW >= Math.ceil(requiredW * 1.25) ? 'Jest co najmniej 25% zapasu w uproszczonym modelu.' : 'Zapas poniżej 25%; sprawdź pobór chwilowy, jakość PSU i wymagania GPU.' }
    ];
    const knownFailures = items.filter(x => x.status === 'fail').length;
    return { items, compatible: knownFailures === 0 && items.every(x => x.status !== 'unknown'), knownFailures, disclaimer: 'To wstępny filtr. Potwierdź dokładny model CPU, listę producenta, wersję BIOS, QVL, złącza i wymagania zasilania.' };
  }
  function mentorPlan(input = {}) {
    const topic = clean(input.topic, 300).toLowerCase();
    if (!topic) throw new Error('Wpisz temat lub problem, który chcesz opanować.');
    const level = ['Początkujący', 'Średni', 'Zaawansowany'].includes(input.level) ? input.level : 'Początkujący';
    const rule = TOPIC_RULES.find(item => item.keys.some(key => topic.includes(key)));
    return { title: rule?.title || 'Podstawy diagnostyki serwisowej', level, steps: rule?.tasks || ['Opisz objaw i warunki wystąpienia.', 'Zbierz dokumentację dla konkretnego modelu.', 'Zbuduj plan testów od najmniej inwazyjnych.', 'Zapisz wynik i źródło każdego pomiaru.'], nav: rule?.nav || 'courses', disclaimer: 'Plan jest oparty na lokalnych regułach nauki, a nie na odpowiedzi generatywnego modelu AI.' };
  }
  function addOrder(input = {}) {
    const row = { id: uid('JOB'), ref: clean(input.ref, 80), device: clean(input.device, 140), issue: clean(input.issue, 600), status: 'Nowe', estimate: Math.max(0, Math.min(1000000, Number(input.estimate) || 0)), createdAt: now(), updatedAt: now() };
    if (!row.device) throw new Error('Podaj model lub typ urządzenia.');
    if (!row.issue) throw new Error('Opisz zgłoszony objaw.');
    state.orders.unshift(row); state.orders = state.orders.slice(0, 300); persist(); log(`Dodano lokalne zlecenie ${row.ref || row.id}`); return row;
  }
  function updateOrder(id, status) {
    if (!['Nowe', 'W diagnozie', 'Oczekuje na część', 'Do testów', 'Zakończone', 'Wstrzymane'].includes(status)) throw new Error('Nieprawidłowy status.');
    const row = state.orders.find(item => item.id === id); if (!row) throw new Error('Nie znaleziono zlecenia.');
    row.status = status; row.updatedAt = now(); persist(); log(`Zlecenie ${row.ref || row.id}: ${status}`); return row;
  }
  function completeProject(id, score) {
    if (!PROJECTS.some(item => item.id === id)) throw new Error('Nieznany projekt praktyczny.');
    const row = state.projects.find(item => item.id === id) || { id, done: false, score: 0, updatedAt: now() };
    row.done = true; row.score = Math.max(0, Math.min(100, Number(score) || 0)); row.updatedAt = now();
    state.projects = [row, ...state.projects.filter(item => item.id !== id)].slice(0, 100); persist(); log(`Ukończono projekt ${id} (${row.score}%)`); return row;
  }
  function addCoursePlan(input = {}) {
    const row = { id: uid(input.kind === 'group' ? 'GROUP' : 'PLAN'), kind: input.kind === 'group' ? 'group' : 'plan', title: clean(input.title, 140), target: clean(input.target, 140), level: ['Początkujący', 'Średni', 'Zaawansowany'].includes(input.level) ? input.level : 'Początkujący', participants: input.kind === 'group' ? Math.max(0, Math.min(500, Math.floor(Number(input.participants) || 0))) : 0, createdAt: now() };
    if (!row.title) throw new Error('Podaj nazwę planu lub grupy nauki.');
    state.coursePlans.unshift(row); state.coursePlans = state.coursePlans.slice(0, 100); persist(); log(`Dodano ${row.kind === 'group' ? 'grupę' : 'plan nauki'}: ${row.title}`); return row;
  }
  function runStaticChecks(doc = document) {
    const checks = [];
    const add = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });
    const views = Array.from(doc.querySelectorAll('.view-section'));
    const viewIds = views.map(node => node.id).filter(Boolean);
    add('Widoki mają unikalne identyfikatory', viewIds.length > 0 && new Set(viewIds).size === viewIds.length, `${viewIds.length} widoków`);
    const navButtons = Array.from(doc.querySelectorAll('.nav-item[data-view], [data-nav]'));
    const invalidNav = navButtons.filter(node => { const key = node.dataset?.view || node.dataset?.nav; return key && !doc.getElementById(`view-${key}`); });
    add('Nawigacja nie wskazuje brakujących widoków', invalidNav.length === 0, invalidNav.length ? invalidNav.map(x => x.dataset?.view || x.dataset?.nav).join(', ') : `${navButtons.length} pozycji nawigacji`);
    const controls = Array.from(doc.querySelectorAll('button, input, select, textarea'));
    const noLabel = controls.filter(node => {
      if (node.tagName === 'BUTTON') return !clean(node.textContent, 120) && !node.getAttribute('aria-label') && !node.title;
      if (node.type === 'hidden') return false;
      const id = node.id;
      return !node.getAttribute('aria-label') && !(id && doc.querySelector(`label[for="${id}"]`)) && !node.closest('label');
    });
    add('Kontrolki formularzy mają etykiety lub nazwy', noLabel.length === 0, noLabel.length ? `${noLabel.length} kontrolek bez nazwy` : `${controls.length} kontrolek`);
    const externalUnsafe = Array.from(doc.querySelectorAll('a[target="_blank"]')).filter(node => !String(node.rel || '').includes('noopener'));
    add('Linki otwierane w nowej karcie mają noopener', externalUnsafe.length === 0, `${externalUnsafe.length} naruszeń`);
    const fix47 = doc.getElementById('view-fix47');
    add('Master Control Center FIX47 istnieje', !!fix47, fix47?.dataset?.sectionLabel || 'Brak widoku');
    add('Główne panele FIX40–FIX46 są zachowane', ['learnpro', 'fix43', 'feedback', 'fix44', 'fix45'].every(key => !!doc.getElementById(`view-${key}`)), 'Kontrola kluczowych modułów');
    let storageOk = false;
    try { const key = `${STORE}:probe`; localStorage.setItem(key, '1'); storageOk = localStorage.getItem(key) === '1'; localStorage.removeItem(key); } catch { storageOk = false; }
    add('Lokalny zapis jest dostępny', storageOk, storageOk ? 'localStorage działa' : 'Sprawdź tryb prywatny lub limit pamięci');
    add('Bieżąca wersja aplikacji 6.8.0 jest oznaczona', /^6\.8\.0-/.test(doc.querySelector('meta[name="academy-build"]')?.content || ''), doc.querySelector('meta[name="academy-build"]')?.content || 'Brak academy-build');
    return checks;
  }
  async function runAssetAudit() {
    const checks = runStaticChecks();
    const assetRefs = [...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(node => node.src || node.href).filter(url => { try { return new URL(url, location.href).origin === location.origin; } catch { return false; } });
    const unique = [...new Set(assetRefs)].slice(0, 120);
    let checked = 0, missing = [];
    if (typeof fetch === 'function') {
      const inspectAsset = async url => {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
        try {
          const response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller?.signal });
          if (!response.ok && response.status !== 405) missing.push(`${new URL(url).pathname} (${response.status})`);
        } catch (error) { missing.push(`${new URL(url).pathname} (${clean(error.message, 90)})`); }
        finally { if (timer) clearTimeout(timer); checked++; }
      };
      // Bounded concurrency prevents a long serial audit from freezing the tab.
      for (let offset = 0; offset < unique.length; offset += 12) {
        await Promise.all(unique.slice(offset, offset + 12).map(inspectAsset));
      }
    }
    const releaseCheck = await (async () => {
      try { const response = await fetch('release.json', { cache: 'no-store' }); if (!response.ok) return { ok: false, detail: `release.json HTTP ${response.status}` }; const release = await response.json(); const meta = document.querySelector('meta[name="academy-build"]')?.content; return { ok: !!release.build && release.build === meta, detail: `release.json: ${release.build || 'brak'}; HTML: ${meta || 'brak'}` }; }
      catch (error) { return { ok: false, detail: clean(error.message, 120) }; }
    })();
    checks.push({ name: 'HTML i release.json wskazują ten sam build', ok: releaseCheck.ok, detail: releaseCheck.detail });
    checks.push({ name: 'Lokalne zasoby WWW odpowiadają', ok: checked > 0 && missing.length === 0, detail: `${checked} sprawdzonych, ${missing.length} problemów${missing.length ? ': ' + missing.slice(0, 5).join('; ') : ''}` });
    checks.push({ name: 'Service Worker jest obsługiwany przez przeglądarkę', ok: 'serviceWorker' in navigator, detail: 'API przeglądarki; aktywacja zależy od HTTPS i rejestracji' });
    let storage = null;
    try { if (navigator.storage && typeof navigator.storage.estimate === 'function') storage = await navigator.storage.estimate(); } catch { storage = null; }
    checks.push({ name: 'Szacowanie pamięci przeglądarki', ok: !!storage, detail: storage ? `${Math.round((storage.usage || 0) / 1048576)} MiB zajęte / ${Math.round((storage.quota || 0) / 1048576)} MiB dostępne` : 'API Storage Estimate niedostępne' });
    lastAudit = checks; state.qaRuns.unshift({ id: uid('QA'), passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok).length, total: checks.length, createdAt: now() }); state.qaRuns = state.qaRuns.slice(0, 30); persist();
    return { checks, checkedAssets: checked, missingAssets: missing };
  }
  function exportBackupObject() { return { app: 'NAUKA OD A DO Z', build: BUILD, exportedAt: now(), scope: 'FIX47 lokalne dane panelu; bez haseł, tokenów i sekretów', data: normalize(state) }; }
  function downloadJSON(value, name) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }
  function card(title, body, extra = '') { return `<section class="f47-card ${extra}"><h3>${esc(title)}</h3>${body}</section>`; }
  function button(label, action, primary = false) { return `<button type="button" class="f47-btn${primary ? ' primary' : ''}" data-f47-action="${esc(action)}">${esc(label)}</button>`; }
  function projectRows() {
    return PROJECTS.map(item => { const row = state.projects.find(x => x.id === item.id); return `<article class="f47-project"><div><span class="f47-tag">${esc(item.level)}</span><h4>${esc(item.title)}</h4><p>${esc(item.desc)}</p><small>${item.steps.length} etapy · ${row?.done ? `ukończono, wynik ${row.score}%` : 'w toku / nie rozpoczęto'}</small></div><button class="f47-btn ${row?.done ? '' : 'primary'}" type="button" data-f47-project="${item.id}">${row?.done ? 'Zmień wynik' : 'Oznacz po wykonaniu'}</button></article>`; }).join('');
  }
  function orderRows() {
    return state.orders.slice(0, 12).map(row => `<article class="f47-row"><div><b>${esc(row.ref || row.id)}</b><strong>${esc(row.device)}</strong><p>${esc(row.issue)}</p><small>${esc(row.createdAt)} · ${row.estimate ? `${row.estimate.toFixed(2)} zł szacunkowo` : 'bez wyceny'}</small></div><select data-f47-order-status="${esc(row.id)}" aria-label="Status zlecenia ${esc(row.ref || row.id)}">${['Nowe','W diagnozie','Oczekuje na część','Do testów','Zakończone','Wstrzymane'].map(status => `<option ${row.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></article>`).join('') || '<p class="f47-muted">Brak lokalnych zleceń.</p>';
  }
  function overview() {
    const done = state.projects.filter(x => x.done).length;
    const open = state.orders.filter(x => x.status !== 'Zakończone').length;
    const latest = state.qaRuns[0];
    const feedback = parse(storageGet(FEEDBACK_STORE, '[]'), []);
    return `<div class="f47-hero"><div><span class="f47-kicker">MASTER CONTROL CENTER / FIX47</span><h2>Wszystko pod kontrolą.</h2><p>Jeden panel do sprawdzania platformy, zbierania sugestii, ćwiczeń praktycznych, zleceń i przygotowania bezpiecznego wydania. Dane tego centrum są lokalne; audyt nie zmienia produkcji.</p><div class="f47-actions">${button('Uruchom pełny audyt','run-audit',true)}${button('Otwórz zgłoszenia','tab-inbox')}</div></div><div class="f47-hero-mark"><b>47</b><span>CONTROL</span></div></div><div class="f47-stats"><div><b>${state.qaRuns.length ? `${latest.passed}/${latest.total}` : '—'}</b><span>ostatni audyt</span></div><div><b>${open}</b><span>otwarte zlecenia lokalne</span></div><div><b>${done}/${PROJECTS.length}</b><span>projekty ukończone</span></div><div><b>${feedback.length}</b><span>opinie na tym urządzeniu</span></div></div><div class="f47-grid">${card('Stan platformy', `<p>Build: <strong>${esc(document.querySelector('meta[name="academy-build"]')?.content || 'nieznany')}</strong></p><p>Połączenie: <strong>${navigator.onLine ? 'online' : 'offline'}</strong></p><p>Service Worker: <strong>${'serviceWorker' in navigator ? 'API dostępne' : 'brak API'}</strong></p><p class="f47-note">Sam status API nie potwierdza wdrożenia ani poprawności konta Cloudflare.</p>`, 'wide')}${card('Szybki dostęp', `<div class="f47-shortcuts"><button data-f47-tab="quality">Kontrola jakości</button><button data-f47-tab="projects">Projekty praktyczne</button><button data-f47-tab="compatibility">Kompatybilność PC</button><button data-f47-tab="service">Zlecenia serwisowe</button><button data-f47-tab="guardian">Strażnik publikacji</button></div>`)}${card('Ostatnia aktywność', state.events.slice(0, 6).map(x => `<p class="f47-event"><b>${esc(x.label)}</b><small>${esc(x.createdAt)}</small></p>`).join('') || '<p class="f47-muted">Tutaj pojawi się historia działań.</p>')}${card('Ostatni audyt', latest ? `<div class="f47-kpi"><b>${latest.passed}/${latest.total}</b><span>${latest.failed ? `${latest.failed} problemów` : 'bez wykrytych problemów'}</span></div><small>${esc(latest.createdAt)}</small>` : '<p class="f47-muted">Nie uruchomiono jeszcze audytu.</p>')}</div>`;
  }
  function qualityPane() {
    const checks = lastAudit.length ? lastAudit : runStaticChecks();
    return `<div class="f47-grid"><section class="f47-card wide"><span class="f47-kicker">QUALITY GATE</span><h3>Automatyczna kontrola platformy</h3><p>Kontrola obejmuje strukturę DOM, nawigację, nazwy kontrolek, bezpieczeństwo linków, zgodność build ID, odpowiedzi lokalnych zasobów oraz dostępne API przeglądarki. Nie zastępuje testów logowania, testów E2E ani kontroli zdalnej po publikacji.</p>${button('Uruchom audyt DOM + zasoby','run-audit',true)}<div id="f47AuditResults" class="f47-check-list">${checks.map(x => `<div class="f47-check ${x.ok ? 'ok' : 'fail'}"><b>${x.ok ? 'PASS' : 'CHECK'}</b><span>${esc(x.name)}</span><small>${esc(x.detail)}</small></div>`).join('')}</div></section>${card('Historia audytów', state.qaRuns.slice(0, 10).map(x => `<div class="f47-row"><div><b>${x.passed}/${x.total} PASS</b><small>${x.failed} statusów CHECK · ${esc(x.createdAt)}</small></div></div>`).join('') || '<p class="f47-muted">Brak wcześniejszych audytów.</p>')}</div>`;
  }
  function inboxPane() {
    const local = parse(localStorage.getItem(FEEDBACK_STORE), []);
    const localMarkup = local.slice(0, 12).map(row => `<article class="f47-feedback-row"><b>Ocena ${Number(row.rating) || '?'} / 5 · ${row.sent ? 'wysłano' : 'lokalnie'}</b><small>${esc(row.createdAt || '')} · ${esc(row.route || '')}</small>${row.whatAdd ? `<p><strong>Dodać:</strong> ${esc(row.whatAdd)}</p>` : ''}${row.whatChange ? `<p><strong>Zmienić:</strong> ${esc(row.whatChange)}</p>` : ''}${row.whatBroken ? `<p><strong>Nie działa:</strong> ${esc(row.whatBroken)}</p>` : ''}${row.details ? `<p>${esc(row.details)}</p>` : ''}</article>`).join('') || '<p class="f47-muted">Brak lokalnych opinii.</p>';
    const localCardBody = `${localMarkup}${button('Eksportuj lokalne opinie','export-feedback')}`;
    return `<div class="f47-grid"><section class="f47-card wide"><span class="f47-kicker">FEEDBACK OPERATIONS</span><h3>Centrum zgłoszeń i sugestii</h3><p>Opinie lokalne z formularza FIX43 oraz opcjonalna kolejka serwerowa. Token administratora pozostaje tylko w pamięci tej zakładki i nie jest zapisywany.</p><div class="f47-form"><label>Token administratora (tylko na czas sesji)<input id="f47AdminToken" type="password" autocomplete="off" maxlength="500" placeholder="Bearer token"></label>${button('Pobierz kolejkę serwerową','load-feedback',true)}</div><div id="f47RemoteFeedback">${remoteFeedback.length ? renderRemoteFeedback() : '<p class="f47-muted">Kolejka serwerowa nie została jeszcze pobrana.</p>'}</div></section>${card(`Opinie lokalne (${local.length})`, localCardBody)}</div>`;
  }
  function renderRemoteFeedback() {
    return remoteFeedback.map(row => `<article class="f47-feedback-row"><b>${Number(row.rating) || '?'} / 5 · ${esc(row.status)}</b><small>${esc(row.created_at)} · ${esc(row.route)}</small>${row.what_add ? `<p><strong>Dodać:</strong> ${esc(row.what_add)}</p>` : ''}${row.what_change ? `<p><strong>Zmienić:</strong> ${esc(row.what_change)}</p>` : ''}${row.what_broken ? `<p><strong>Nie działa:</strong> ${esc(row.what_broken)}</p>` : ''}${row.details ? `<p>${esc(row.details)}</p>` : ''}<div class="f47-actions"><button class="f47-btn" data-f47-feedback-status="in_review" data-f47-feedback-id="${esc(row.id)}">W trakcie</button><button class="f47-btn primary" data-f47-feedback-status="fixed" data-f47-feedback-id="${esc(row.id)}">Naprawione</button><button class="f47-btn" data-f47-feedback-status="wont_fix" data-f47-feedback-id="${esc(row.id)}">Odrzuć</button></div></article>`).join('') || '<p class="f47-muted">Brak zgłoszeń w kolejce serwerowej.</p>';
  }
  function projectsPane() { return `<div class="f47-card wide"><span class="f47-kicker">REPAIR ACADEMY / PRACTICAL PATHS</span><h3>Kompletne projekty praktyczne</h3><p>Każdy projekt prowadzi od opisu problemu do dokumentacji wyniku. Ukończenie zapisuje lokalny rezultat; nie jest formalnym certyfikatem zawodowym.</p><div class="f47-project-list">${projectRows()}</div></div>`; }
  function compatibilityPane() { return `<div class="f47-grid"><section class="f47-card"><span class="f47-kicker">HARDWARE COMPATIBILITY</span><h3>Wstępny kalkulator zgodności</h3><form id="f47CompatForm" class="f47-form"><label>Socket procesora<input name="cpuSocket" placeholder="np. AM5" required></label><label>Socket płyty<input name="boardSocket" placeholder="np. AM5" required></label><label>Typ pamięci<input name="ramType" placeholder="np. DDR5" required></label><label>Typ RAM płyty<input name="boardRamType" placeholder="np. DDR5" required></label><label>Szacowany pobór zestawu (W)<input name="estimatedW" type="number" min="1" max="5000" value="450" required></label><label>Moc PSU (W)<input name="psuW" type="number" min="1" max="5000" value="750" required></label><button class="f47-btn primary" type="submit">Sprawdź wstępnie</button></form><div id="f47CompatResult" aria-live="polite"></div></section>${card('Co trzeba jeszcze sprawdzić?', '<ul class="f47-list"><li>Dokładny model i lista obsługiwanych procesorów.</li><li>Minimalna wersja BIOS i wersja mikrokodu.</li><li>QVL pamięci, pojemność i taktowanie.</li><li>Wymiary GPU, chłodzenia i obudowy.</li><li>Złącza ATX/EPS/PCIe/12V-2x6 i jakość PSU.</li><li>Limity slotów M.2/SATA i współdzielenie linii PCIe.</li></ul><p class="f47-note">Zgodność socketu i DDR nie gwarantuje pełnej kompatybilności. Ten kalkulator nie zastępuje specyfikacji producenta.</p>')}</div>`; }
  function mentorPane() { return `<div class="f47-grid"><section class="f47-card"><span class="f47-kicker">AI LEARNING COACH</span><h3>Twój plan nauki</h3><form id="f47MentorForm" class="f47-form"><label>Temat lub problem<textarea name="topic" rows="3" required maxlength="300" placeholder="np. laptop nie uruchamia się, diagnostyka BIOS, dysk NVMe…"></textarea></label><label>Poziom<select name="level"><option>Początkujący</option><option>Średni</option><option>Zaawansowany</option></select></label><button class="f47-btn primary" type="submit">Przygotuj plan nauki</button></form><div id="f47MentorResult" aria-live="polite"></div></section>${card('Dalsza nauka', '<p>Plan lokalny prowadzi do istniejących modułów akademii. W razie potrzeby możesz otworzyć istniejący czat AI, ale odpowiedź generatywna wymaga aktywnej konfiguracji usługi.</p><button type="button" class="f47-btn" data-f47-action="open-chat">Otwórz czat AI</button>')}</div>`; }
  function servicePane() { return `<div class="f47-grid"><section class="f47-card"><span class="f47-kicker">SERVICE DESK — LOCAL ONLY</span><h3>Nowe zlecenie szkoleniowe / robocze</h3><form id="f47OrderForm" class="f47-form"><label>Referencja bez danych osobowych<input name="ref" maxlength="80" placeholder="np. SRV-2026-001"></label><label>Urządzenie / model<input name="device" maxlength="140" required placeholder="np. Lenovo ThinkPad T14 Gen 2"></label><label class="full">Objaw / zakres prac<textarea name="issue" maxlength="600" required rows="3" placeholder="Opisz zgłoszony problem…"></textarea></label><label>Szacunkowy koszt (PLN)<input name="estimate" type="number" min="0" max="1000000" step="0.01" value="0"></label><button class="f47-btn primary" type="submit">Zapisz lokalne zlecenie</button></form><p class="f47-note">Nie wpisuj nazwisk, numerów telefonu, adresów, haseł ani danych klienta. Zlecenia są przechowywane wyłącznie w localStorage tej przeglądarki, nie w D1.</p></section>${card(`Zlecenia (${state.orders.length})`, orderRows(), 'wide')}</div>`; }
  function coursesPane() { return `<div class="f47-grid"><section class="f47-card"><span class="f47-kicker">LEARNING MANAGEMENT</span><h3>Plany nauki i grupy szkoleniowe</h3><form id="f47CourseForm" class="f47-form"><label>Rodzaj wpisu<select name="kind"><option value="plan">Indywidualny plan nauki</option><option value="group">Grupa szkoleniowa</option></select></label><label>Nazwa planu / grupy<input name="title" maxlength="140" required placeholder="np. Podstawy diagnostyki laptopów"></label><label>Cel nauki<input name="target" maxlength="140" placeholder="np. samodzielna diagnostyka zasilania"></label><label>Poziom<select name="level"><option>Początkujący</option><option>Średni</option><option>Zaawansowany</option></select></label><label>Liczba uczestników (bez danych osobowych)<input name="participants" type="number" min="0" max="500" value="0"></label><button type="submit" class="f47-btn primary">Dodaj plan / grupę</button></form><p class="f47-note">To lokalny rejestr planów i liczebności grup. Nie przechowuje danych uczniów ani nie tworzy kont użytkowników.</p></section>${card(`Plany i grupy (${state.coursePlans.length})`, state.coursePlans.map(row => `<article class="f47-row"><div><b>${row.kind === 'group' ? 'Grupa: ' : 'Plan: '}${esc(row.title)}</b><small>${esc(row.target)} · ${esc(row.level)}${row.kind === 'group' ? ` · Uczestnicy: ${row.participants}` : ''} · ${esc(row.createdAt)}</small></div></article>`).join('') || '<p class="f47-muted">Nie utworzono jeszcze planów ani grup.</p>')}</div>`; }
  function updatesPane() { return `<div class="f47-grid"><section class="f47-card wide"><span class="f47-kicker">RELEASE / UPDATE CENTER</span><h3>Kontrola wersji i zasobów</h3><p>Moduł sprawdza zgodność metadanych oraz dostępność plików. Nie pobiera ani nie instaluje aktualizacji automatycznie i nie wysyła niczego do Cloudflare.</p>${button('Sprawdź build i zasoby','check-release',true)}<div id="f47ReleaseResult" class="f47-result">Build lokalny: ${esc(document.querySelector('meta[name="academy-build"]')?.content || 'brak')}</div></section>${card('Zasady aktualizacji', '<ul class="f47-list"><li>Przygotuj kopię folderu projektu.</li><li>Uruchom pełny runner testów.</li><li>Weryfikuj sumę SHA-256 archiwum.</li><li>Sprawdź backup D1 przed migracją.</li><li>Wdrażaj świadomie, do istniejącego projektu.</li><li>Po wdrożeniu wykonaj testy zewnętrzne.</li></ul>')}</div>`; }
  function guardianPane() { return `<div class="f47-grid"><section class="f47-card wide"><span class="f47-kicker">PRODUCTION GUARDIAN</span><h3>Bezpieczna bramka przed publikacją</h3><p>To lista kontrolna i lokalny raport. Nie potwierdza konta Cloudflare, nie robi backupu D1 i nie uruchamia rollbacku. Wdrażanie i przywracanie wersji wykonuj istniejącymi, zweryfikowanymi narzędziami po zatwierdzeniu raportu.</p><div class="f47-check-list">${['Kopia folderu projektu została wykonana i można ją otworzyć.','Wszystkie testy regresji zakończyły się PASS.','Weryfikacja build ID w HTML, release.json i API jest zgodna.','Service Worker zawiera nowe assety i świeży cache name.','Backup produkcyjnej D1 istnieje i ma znaną lokalizację.','Binding D1 wskazuje istniejącą bazę produkcyjną.','Migracje zostały sprawdzone pod kątem operacji destrukcyjnych.','Testy logowania i API wykonano na środowisku docelowym.','Po wdrożeniu sprawdzono stronę w rzeczywistej przeglądarce.','Plan rollbacku i poprzedni artefakt są dostępne.'].map((text, i) => `<label class="f47-guardian-check"><input type="checkbox" data-f47-guardian="${i}"><span>${esc(text)}</span></label>`).join('')}</div><div class="f47-actions">${button('Eksportuj raport bramki','export-guardian',true)}${button('Eksportuj dane FIX47','export-backup')}</div><p class="f47-note">Zaznaczenia checklisty nie stanowią automatycznego dowodu wykonania czynności. Raport zaznacza je jako deklaracje operatora.</p></section>${card('Powrót do poprzedniej wersji', '<ol class="f47-list"><li>Zatrzymaj obserwator, aby nie ponawiał deployu.</li><li>Wybierz wcześniej zweryfikowany deployment w Cloudflare Pages.</li><li>Wykonaj rollback/promocję poprzedniego deploymentu zgodnie z procedurą Cloudflare.</li><li>Sprawdź build ID, API, logowanie i widoki.</li><li>Nie przywracaj backupu D1, jeśli problem dotyczy wyłącznie plików WWW.</li></ol><p class="f47-note">Panel nie wykonuje operacji Cloudflare ani poleceń Wrangler.</p>')}</div>`; }
  const tabs = ['overview', 'quality', 'inbox', 'projects', 'compatibility', 'mentor', 'service', 'courses', 'updates', 'guardian'];
  function setTab(tab) {
    if (!tabs.includes(tab)) return;
    activeTab = tab;
    $$('.f47-tab').forEach(node => { const selected = node.dataset.f47Tab === tab; node.classList.toggle('active', selected); node.setAttribute('aria-selected', String(selected)); });
    render();
  }
  function render() {
    if (!STAGE) return;
    const templates = { overview, quality: qualityPane, inbox: inboxPane, projects: projectsPane, compatibility: compatibilityPane, mentor: mentorPane, service: servicePane, courses: coursesPane, updates: updatesPane, guardian: guardianPane };
    STAGE.innerHTML = (templates[activeTab] || overview)();
    if (activeTab === 'quality' && lastAudit.length) renderAuditResults({ checks: lastAudit });
  }
  function renderAuditResults(result) {
    const host = $('#f47AuditResults', STAGE); if (!host) return;
    host.innerHTML = result.checks.map(row => `<div class="f47-check ${row.ok ? 'ok' : 'fail'}"><b>${row.ok ? 'PASS' : 'CHECK'}</b><span>${esc(row.name)}</span><small>${esc(row.detail)}</small></div>`).join('');
  }
  async function loadRemoteFeedback() {
    const tokenField = $('#f47AdminToken'); adminToken = clean(tokenField?.value, 500);
    if (!adminToken) throw new Error('Wpisz token administratora.');
    const response = await fetch('/api/admin/site-feedback', { headers: { authorization: `Bearer ${adminToken}` }, credentials: 'same-origin', cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    remoteFeedback = Array.isArray(data.items) ? data.items.slice(0, 200) : [];
    const host = $('#f47RemoteFeedback'); if (host) host.innerHTML = renderRemoteFeedback();
    setStatus(`Pobrano ${remoteFeedback.length} zgłoszeń z kolejki administratora.`);
    return remoteFeedback;
  }
  async function updateFeedbackStatus(id, status) {
    if (!adminToken) throw new Error('Najpierw pobierz kolejkę z tokenem administratora.');
    const response = await fetch('/api/admin/site-feedback', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` }, credentials: 'same-origin', body: JSON.stringify({ id, status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    remoteFeedback = remoteFeedback.map(row => row.id === id ? { ...row, status } : row);
    const host = $('#f47RemoteFeedback'); if (host) host.innerHTML = renderRemoteFeedback();
    return data;
  }
  async function checkRelease() {
    const host = $('#f47ReleaseResult'); if (host) host.textContent = 'Sprawdzanie…';
    const meta = document.querySelector('meta[name="academy-build"]')?.content || '';
    const rows = [];
    const response = await fetch('release.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`release.json HTTP ${response.status}`);
    const release = await response.json();
    rows.push(`Build HTML: ${meta}`, `Build release.json: ${release.build || 'brak'}`, `Zgodność build ID: ${release.build === meta ? 'PASS' : 'FAIL'}`, `Wersja aplikacji: ${release.release || 'brak'}`);
    for (const path of ['assets/master-control-fix47.js?v=6.8.0-fix47', 'assets/master-control-fix47.css?v=6.8.0-fix47', 'assets/professional-service-fix45.js?v=6.8.0-fix45']) {
      const check = await fetch(path, { method: 'HEAD', cache: 'no-store' }); rows.push(`${path.split('?')[0]}: ${check.ok || check.status === 405 ? 'PASS' : `HTTP ${check.status}`}`);
    }
    if (host) host.textContent = rows.join('\n');
    return { buildMatches: release.build === meta, lines: rows };
  }
  async function handleAction(action, target) {
    if (action.startsWith('tab-')) {
      setTab(action.slice(4));
      return;
    }
    if (action === 'run-audit') {
      setStatus('Audyt trwa — sprawdzam DOM, build i lokalne zasoby…');
      try { const result = await runAssetAudit(); if (activeTab === 'quality') renderAuditResults(result); setStatus(`Audyt zakończony: ${result.checks.filter(x => x.ok).length}/${result.checks.length} PASS; ${result.missingAssets.length} problemów zasobów.`, result.checks.some(x => !x.ok)); }
      catch (error) { setStatus(`Audyt nie został ukończony: ${clean(error.message, 180)}`, true); }
    } else if (action === 'load-feedback') {
      try { await loadRemoteFeedback(); } catch (error) { setStatus(`Nie pobrano kolejki: ${clean(error.message, 180)}`, true); }
    } else if (action === 'export-feedback') {
      downloadJSON(parse(storageGet(FEEDBACK_STORE, '[]'), []), 'nauka-od-a-do-z-opinie-lokalne.json'); setStatus('Wyeksportowano lokalne opinie.');
    } else if (action === 'export-backup') {
      downloadJSON(exportBackupObject(), 'nauka-od-a-do-z-fix47-backup.json'); setStatus('Wyeksportowano dane panelu FIX47. Backup nie zawiera danych innych modułów.');
    } else if (action === 'export-guardian') {
      const checklist = $$('[data-f47-guardian]').map(node => ({ item: node.nextElementSibling?.textContent || '', declaredDone: node.checked }));
      downloadJSON({ app: 'NAUKA OD A DO Z', build: BUILD, generatedAt: now(), checklist, note: 'Deklaracje operatora, nie automatyczny dowód backupu, migracji ani publikacji.' }, 'nauka-od-a-do-z-production-guardian.json'); setStatus('Wyeksportowano checklistę Production Guardian.');
    } else if (action === 'check-release') {
      try { const result = await checkRelease(); setStatus(result.buildMatches ? 'Build i lokalne zasoby są zgodne.' : 'Build ID nie zgadza się z release.json.', !result.buildMatches); } catch (error) { setStatus(`Kontrola wydania nie powiodła się: ${clean(error.message, 160)}`, true); }
    } else if (action === 'open-chat') {
      if (typeof window.ACADEMY_SHOW_VIEW === 'function') window.ACADEMY_SHOW_VIEW('cloudchat'); else window.ACADEMY_BOOTSTRAP_NAV?.('cloudchat');
    }
  }
  function handleSubmit(event) {
    const form = event.target;
    if (form.id === 'f47CompatForm') {
      event.preventDefault(); const result = compatibility(Object.fromEntries(new FormData(form).entries()));
      const host = $('#f47CompatResult'); if (host) host.innerHTML = `<div class="f47-result"><strong>${result.compatible ? 'Wstępna zgodność znanych pól' : result.knownFailures ? 'Wykryto konflikt' : 'Wymagane dodatkowe dane'}</strong>${result.items.map(item => `<div class="f47-check ${item.status === 'pass' ? 'ok' : item.status === 'fail' ? 'fail' : 'warn'}"><b>${item.status.toUpperCase()}</b><span>${esc(item.label)}</span><small>${esc(item.detail)}</small></div>`).join('')}<p>${esc(result.disclaimer)}</p></div>`;
      setStatus('Zakończono wstępne sprawdzenie kompatybilności.');
    } else if (form.id === 'f47MentorForm') {
      event.preventDefault(); const plan = mentorPlan(Object.fromEntries(new FormData(form).entries()));
      const host = $('#f47MentorResult'); if (host) host.innerHTML = `<div class="f47-result"><h4>${esc(plan.title)} · ${esc(plan.level)}</h4><ol>${plan.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><p>${esc(plan.disclaimer)}</p><button type="button" class="f47-btn primary" data-f47-nav="${esc(plan.nav)}">Otwórz powiązany moduł</button></div>`;
      setStatus('Przygotowano lokalny plan nauki.');
    } else if (form.id === 'f47OrderForm') {
      event.preventDefault(); try { addOrder(Object.fromEntries(new FormData(form).entries())); render(); setStatus('Zlecenie zapisano lokalnie. Nie wysłano go do Cloudflare.'); } catch (error) { setStatus(clean(error.message, 160), true); }
    } else if (form.id === 'f47CourseForm') {
      event.preventDefault(); try { addCoursePlan(Object.fromEntries(new FormData(form).entries())); render(); setStatus('Dodano lokalny plan nauki lub grupę szkoleniową.'); } catch (error) { setStatus(clean(error.message, 160), true); }
    }
  }
  if (PAGE && STAGE) {
    PAGE.addEventListener('click', event => {
      const tab = event.target.closest('[data-f47-tab]'); if (tab) { setTab(tab.dataset.f47Tab); return; }
      const action = event.target.closest('[data-f47-action]'); if (action) { handleAction(action.dataset.f47Action, action); return; }
      const project = event.target.closest('[data-f47-project]'); if (project) { const score = Number(window.prompt('Podaj wynik ukończonego ćwiczenia (0–100):', '100')); if (Number.isFinite(score) && score >= 0 && score <= 100) { completeProject(project.dataset.f47Project, score); render(); setStatus('Zapisano wynik projektu praktycznego.'); } return; }
      const feedback = event.target.closest('[data-f47-feedback-status]'); if (feedback) { updateFeedbackStatus(feedback.dataset.f47FeedbackId, feedback.dataset.f47FeedbackStatus).then(() => setStatus('Zmieniono status zgłoszenia.')).catch(error => setStatus(clean(error.message, 180), true)); return; }
      const nav = event.target.closest('[data-f47-nav]'); if (nav) { const key = nav.dataset.f47Nav; if (typeof window.ACADEMY_SHOW_VIEW === 'function') window.ACADEMY_SHOW_VIEW(key); else window.ACADEMY_BOOTSTRAP_NAV?.(key); }
    });
    PAGE.addEventListener('change', event => {
      const select = event.target.closest('[data-f47-order-status]'); if (select) { try { updateOrder(select.dataset.f47OrderStatus, select.value); setStatus('Zaktualizowano status zlecenia.'); } catch (error) { setStatus(clean(error.message, 160), true); } }
    });
    PAGE.addEventListener('submit', handleSubmit);
    render();
  }
  window.NP_NAUKA_FIX47 = {
    build: BUILD, tabs: [...tabs], getState: () => normalize(state), normalize, compatibility, mentorPlan,
    addOrder, updateOrder, completeProject, addCoursePlan, runStaticChecks, runAssetAudit,
    exportBackupObject, projectCatalog: () => PROJECTS.map(row => ({ id: row.id, title: row.title, level: row.level, steps: [...row.steps] })),
    loadRemoteFeedback, updateFeedbackStatus
  };
})();
