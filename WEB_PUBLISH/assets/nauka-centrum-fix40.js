/* NAUKA OD A DO Z — CENTRUM NAUKI PRO FIX40
 * Lokalny pulpit, wyszukiwanie wiedzy, symulator, certyfikaty QR, atlas, pakiet offline i raporty.
 * Nie steruje rzeczywistym sprzętem. Dane użytkownika pozostają w tej przeglądarce.
 */
(() => {
  'use strict';
  const ROOT = document.getElementById('view-learnpro');
  if (!ROOT || ROOT.dataset.fix40Ready === '1') return;
  ROOT.dataset.fix40Ready = '1';

  const STORE = 'npNaukaCentrumFix40';
  const SCHEMA = 'NAUKA_OD_A_DO_Z_FIX40_OFFLINE';
  const MAX_IMPORT = 25 * 1024 * 1024;
  const $ = (selector, root = ROOT) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clean = (value, max = 1200) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  const norm = value => clean(value, 10000).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fmt = value => new Intl.NumberFormat('pl-PL').format(Number(value || 0));
  const now = () => new Date().toISOString();
  const safeJson = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
  const emptyState = () => ({ version: 1, lastLesson: null, started: [], bookmarks: [], practiceRuns: [], examAttempts: [], certificates: [], boards: [], reports: [], lastOfflineImport: null });
  let state = (() => {
    try {
      const raw = localStorage.getItem(STORE);
      const parsed = raw ? safeJson(raw, null) : null;
      if (!parsed || parsed.version !== 1 || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyState();
      const base = emptyState();
      for (const key of Object.keys(base)) if (key in parsed) base[key] = parsed[key];
      for (const key of ['started','bookmarks','practiceRuns','examAttempts','certificates','boards','reports']) if (!Array.isArray(base[key])) base[key] = [];
      return base;
    } catch { return emptyState(); }
  })();

  function persist() {
    try {
      // Ogranicznik rozmiaru zabezpiecza localStorage przed przypadkowym zapełnieniem.
      for (const key of ['started','bookmarks','practiceRuns','examAttempts','certificates','boards','reports']) state[key] = state[key].slice(-500);
      localStorage.setItem(STORE, JSON.stringify(state));
      return true;
    } catch (error) {
      say(`Nie zapisano zmian lokalnych: ${error?.message || 'brak miejsca w przeglądarce'}. Wyeksportuj kopię danych.`, true);
      return false;
    }
  }
  function say(message, bad = false) {
    const node = $('#l40Status');
    if (node) { node.textContent = message; node.classList.toggle('is-error', !!bad); node.classList.toggle('is-good', !bad); }
  }
  function download(name, content, type = 'application/octet-stream') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function lessons() { return Array.isArray(window.ACADEMY_DATA?.courseLessons) ? window.ACADEMY_DATA.courseLessons : []; }
  function faults() { return Array.isArray(window.ACADEMY_DATA?.faults) ? window.ACADEMY_DATA.faults : []; }
  function methods() { return Array.isArray(window.ACADEMY_REPAIR_METHODS) ? window.ACADEMY_REPAIR_METHODS : []; }
  function components() { return Array.isArray(window.ACADEMY_COMPONENTS?.components) ? window.ACADEMY_COMPONENTS.components : []; }
  function libraryDocs() { return Array.isArray(window.ACADEMY_DATA?.library) ? window.ACADEMY_DATA.library : []; }
  function getCompleted() {
    try { const list = safeJson(localStorage.getItem('academyCompletedLessons') || '[]', []); return Array.isArray(list) ? list : []; }
    catch { return []; }
  }
  function lessonById(id) { return lessons().find(item => String(item.id) === String(id)); }
  function titleOf(item) { return item?.title || item?.name || item?.term || item?.id || 'Materiał edukacyjny'; }
  function rememberLesson(id) {
    const item = lessonById(id); if (!item) return;
    state.lastLesson = { id: String(id), title: clean(titleOf(item), 180), updatedAt: now() };
    const old = state.started.findIndex(x => x && String(x.id) === String(id));
    if (old >= 0) state.started.splice(old, 1);
    state.started.unshift(state.lastLesson);
    persist(); renderDashboard();
  }
  function openLesson(id) {
    const item = lessonById(id); if (!item) { say('Nie znaleziono lekcji w aktualnym katalogu.', true); return; }
    rememberLesson(id);
    if (typeof window.ACADEMY_OPEN_SOURCE === 'function') window.ACADEMY_OPEN_SOURCE('courseLessons', String(id));
    else { window.ACADEMY_SHOW_VIEW?.('courses'); say('Otwórz lekcję w katalogu kursów.'); }
  }
  function mergeLegacyBookmarks() {
    let legacy = [];
    try { const value = safeJson(localStorage.getItem('academyBookmarks') || '[]', []); if (Array.isArray(value)) legacy = value.filter(x => typeof x === 'string' || typeof x === 'number').map(String); } catch {}
    const merged = [...new Set([...legacy, ...state.bookmarks.filter(x => typeof x === 'string' || typeof x === 'number').map(String)])].slice(-500);
    state.bookmarks = merged;
    try { localStorage.setItem('academyBookmarks', JSON.stringify(merged)); } catch {}
    persist();
    return merged;
  }
  function toggleBookmark(id) {
    const key = String(id);
    const exists = state.bookmarks.includes(key);
    state.bookmarks = exists ? state.bookmarks.filter(x => x !== key) : [key, ...state.bookmarks];
    try { localStorage.setItem('academyBookmarks', JSON.stringify(state.bookmarks)); } catch {}
    persist(); renderDashboard();
    say(exists ? 'Usunięto zakładkę.' : 'Dodano lekcję do zakładek.');
  }
  function completeLesson(id) {
    const key = `lessons:${id}`;
    const list = getCompleted();
    if (!list.includes(key)) list.push(key);
    try { localStorage.setItem('academyCompletedLessons', JSON.stringify(list)); }
    catch { say('Nie udało się zapisać postępu kursów. Zwolnij miejsce w pamięci przeglądarki.', true); return; }
    renderDashboard(); say('Postęp lekcji zapisany w głównym rejestrze Akademii.');
    window.dispatchEvent(new StorageEvent('storage', { key: 'academyCompletedLessons' }));
  }
  function renderDashboard() {
    const all = lessons();
    const done = getCompleted();
    const completedIds = new Set(all.filter(x => done.includes(`lessons:${x.id}`)).map(x => String(x.id)));
    const progress = all.length ? Math.round(completedIds.size / all.length * 100) : 0;
    const stats = [['l40StatCourses', all.length], ['l40StatCompleted', completedIds.size], ['l40StatBookmarks', state.bookmarks.length], ['l40StatCases', state.practiceRuns.length]];
    stats.forEach(([id, value]) => { const node = document.getElementById(id); if (node) node.textContent = fmt(value); });
    const pct = document.getElementById('l40ProgressPct'); if (pct) pct.textContent = `${progress}%`;
    const bar = document.getElementById('l40ProgressBar'); if (bar) bar.style.width = `${progress}%`;
    const continueNode = document.getElementById('l40ContinueCard');
    if (continueNode) {
      const item = state.lastLesson && lessonById(state.lastLesson.id);
      continueNode.innerHTML = item
        ? `<div class="l40-continue-copy"><span class="l40-kicker">OSTATNIO OTWIERANA LEKCJA</span><h3>${esc(titleOf(item))}</h3><p>${esc(item.category || 'Kurs praktyczny')} · ${esc(item.level || 'Materiał edukacyjny')} ${item.minutes ? `· ${Number(item.minutes)} min` : ''}</p><div class="l40-actions"><button type="button" class="l40-btn primary" data-open-lesson="${esc(item.id)}">Kontynuuj lekcję →</button><button type="button" class="l40-btn soft" data-complete-lesson="${esc(item.id)}">Oznacz jako ukończoną</button></div></div>`
        : `<div class="l40-continue-copy"><span class="l40-kicker">TWOJA ŚCIEŻKA</span><h3>Rozpocznij pierwszą lekcję</h3><p>Otwórz katalog kursów lub wybierz jedną z propozycji poniżej. Ostatnio otwierany temat będzie zapamiętany na tym urządzeniu.</p><button type="button" class="l40-btn primary" data-open-first-lesson>Wybierz lekcję →</button></div>`;
    }
    const recent = document.getElementById('l40RecentLessons');
    if (recent) {
      const picks = state.started.slice(0, 5).map(x => lessonById(x.id)).filter(Boolean);
      recent.innerHTML = picks.length ? picks.map(item => `<article class="l40-list-card"><div><b>${esc(titleOf(item))}</b><small>${esc(item.category || 'Kurs')} · ${completedIds.has(String(item.id)) ? 'Ukończona' : 'W toku'}</small></div><div class="l40-mini-actions"><button type="button" data-open-lesson="${esc(item.id)}">Otwórz</button><button type="button" data-toggle-bookmark="${esc(item.id)}" aria-label="Dodaj zakładkę">${state.bookmarks.includes(String(item.id)) ? '★' : '☆'}</button></div></article>`).join('') : '<p class="l40-muted">Tutaj pojawią się lekcje otwierane z tego pulpitu.</p>';
    }
    const marks = document.getElementById('l40BookmarkList');
    if (marks) {
      const saved = state.bookmarks.map(id => lessonById(id)).filter(Boolean).slice(0, 12);
      marks.innerHTML = saved.length ? saved.map(item => `<article class="l40-list-card"><div><b>${esc(titleOf(item))}</b><small>${esc(item.category || 'Kurs')}</small></div><div class="l40-mini-actions"><button type="button" data-open-lesson="${esc(item.id)}">Otwórz</button><button type="button" data-toggle-bookmark="${esc(item.id)}" aria-label="Usuń zakładkę">★</button></div></article>`).join('') : '<p class="l40-muted">Nie masz jeszcze zakładek. Dodaj gwiazdką ważne lekcje z wyszukiwarki.</p>';
    }
    const summary = document.getElementById('l40DashboardSummary');
    if (summary) summary.textContent = `${completedIds.size} z ${all.length} lekcji ukończonych · ${state.started.length} ostatnio otwieranych · zapis lokalny`;
  }

  function switchTab(tab) {
    const allowed = ['dashboard','search','bench','exams','atlas','offline','reports','academy41','workshop42'];
    if (!allowed.includes(tab)) return;
    ROOT.querySelectorAll('[data-l40-tab]').forEach(button => {
      const active = button.dataset.l40Tab === tab;
      button.classList.toggle('active', active); button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    ROOT.querySelectorAll('[data-l40-pane]').forEach(pane => { const active = pane.dataset.l40Pane === tab; pane.hidden = !active; pane.classList.toggle('active', active); });
    persist();
  }

  function sendToChat(question) {
    const input = document.getElementById('cloudChatQuestion');
    if (input) input.value = clean(question, 2500);
    window.ACADEMY_SHOW_VIEW?.('cloudchat');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    say('Kontekst został przeniesiony do czatu. Wiadomość nie została wysłana — zatwierdź ją samodzielnie.');
  }
  function renderSearch(query) {
    const target = document.getElementById('l40SearchResults');
    const count = document.getElementById('l40SearchCount');
    if (!target) return;
    const q = clean(query, 240);
    if (!q) { target.innerHTML = '<p class="l40-muted">Wpisz objaw, nazwę elementu, model albo kod usterki. Wyszukiwanie korzysta z lokalnego indeksu Akademii.</p>'; if (count) count.textContent = '0 wyników'; return; }
    let found = [];
    try { found = window.ACADEMY_FREE_CHAT?.search(q) || []; } catch { found = []; }
    if (!found.length) {
      target.innerHTML = '<div class="l40-empty"><b>Brak bliskiego dopasowania.</b><p>Dodaj dokładny model, Board ID, rewizję PCB i objawy. Możesz przekazać opis do czatu AI.</p><button type="button" class="l40-btn primary" data-send-chat>Przekaż pytanie do czatu AI →</button></div>';
      if (count) count.textContent = '0 wyników'; return;
    }
    target.innerHTML = found.map((entry, index) => {
      const doc = entry.doc || {}; const excerpt = clean(doc.text || '', 700);
      const type = ({faults:'Baza przypadków',courseLessons:'Lekcja',beginnerLessons:'Podstawy',courseTopics:'Temat kursu',components:'Element',methods:'Procedura',library:'Biblioteka',sources:'Źródło'})[doc.group] || doc.group || 'Materiał';
      const action = doc.group === 'courseLessons' || doc.group === 'beginnerLessons' ? `data-search-open="${esc(doc.group)}" data-search-id="${esc(doc.id)}"` : doc.group === 'faults' ? `data-search-open="faults" data-search-id="${esc(doc.id)}"` : '';
      const actionHtml = action ? `<button type="button" class="l40-btn soft" ${action}>Otwórz źródło →</button>` : '';
      const bookmark = doc.group === 'courseLessons' ? `<button type="button" class="l40-btn ghost" data-toggle-bookmark="${esc(doc.id)}">${state.bookmarks.includes(String(doc.id)) ? '★ W zakładkach' : '☆ Dodaj zakładkę'}</button>` : '';
      return `<article class="l40-result-card"><div class="l40-result-meta"><span>${esc(type)}</span><span>Dopasowanie ${index + 1}</span></div><h3>${esc(doc.title || 'Materiał Akademii')}</h3><p>${esc(doc.category || '')}</p><div class="l40-result-excerpt">${esc(excerpt.slice(0, 420))}${excerpt.length > 420 ? '…' : ''}</div><div class="l40-actions">${actionHtml}${bookmark}<button type="button" class="l40-btn ghost" data-result-chat="${esc(doc.title || q)}">Omów z AI →</button></div></article>`;
    }).join('');
    if (count) count.textContent = `${found.length} najlepszych dopasowań`;
    const status = document.getElementById('l40SearchMode');
    if (status) status.textContent = `Indeks lokalny: ${window.ACADEMY_FREE_CHAT?.stats?.indexed || 0} dokumentów · wyniki nie stanowią potwierdzonej diagnozy.`;
  }

  const BENCH = {
    power: { title:'Brak reakcji na przycisk Power', symptom:'Laptop nie reaguje na przycisk. Ćwiczenie prowadzi przez izolację objawu i identyfikację toru wejściowego.', board:'EDU-LAPTOP-PWR-01', point:'TP-EDU-01 / obwód treningowy bez zasilania', unit:'kΩ', reference:1.2, min:0.9, max:1.5, steps:['Zapisz dokładny model i oznaczenie płyty, bez zgadywania rewizji.','Oceń stan zasilacza i gniazda bez otwierania zasilacza sieciowego.','W modelu treningowym odłączono wszystkie źródła energii; wybierz pomiar rezystancji.','Porównaj wynik wyłącznie z podanym zakresem fikcyjnego obwodu EDU.'], prompt:'Jaki krok powinien poprzedzać pomiar rezystancji na wejściu płyty?', options:['Mierzyć na podłączonej baterii','Odłączyć wszystkie źródła energii i wykonać procedurę bezpiecznego rozładowania','Zewrzeć bezpiecznik, aby sprawdzić start'], answer:1, explanation:'Rezystancję i ciągłość mierzy się wyłącznie w odłączonym, bezpiecznie rozładowanym obwodzie. Nie zwiera się bezpiecznika.' },
    ram: { title:'Brak POST / kontrolka DRAM', symptom:'Komputer nie przechodzi POST. Kontrolka DRAM świeci, ale nie wiadomo, czy winny jest moduł, slot, ustawienia czy kontroler.', board:'EDU-DESKTOP-RAM-02', point:'Konfiguracja testowa EDU / moduł RAM', unit:'szt.', reference:1, min:1, max:1, steps:['Zapisz kod POST, sygnały LED/beep i konfigurację pamięci.','Potwierdź typ DDR i obsługiwane moduły w dokumentacji płyty.','Odłącz energię zgodnie z instrukcją; testuj pojedynczy znany sprawny moduł.','Zapisz wynik każdej kombinacji slot/moduł i przywróć ustawienia fabryczne.'], prompt:'Która metoda daje najbardziej użyteczne porównanie modułów i slotów?', options:['Włożyć wszystkie moduły naraz i zmienić napięcia','Testować pojedynczy znany sprawny moduł w zalecanym slocie i zapisywać wyniki','Od razu wymienić procesor'], answer:1, explanation:'Kontrolowana konfiguracja minimalna i pojedyncze zmiany pozwalają odróżnić moduł, slot, ustawienia i kontroler.' },
    nvme: { title:'Dysk NVMe znika z systemu', symptom:'Nośnik okresowo znika lub powoduje zawieszanie. Priorytetem jest ochrona danych, nie test obciążeniowy.', board:'EDU-NVME-STORAGE-03', point:'Ćwiczenie ochrony danych / liczba kopii', unit:'kopie', reference:1, min:1, max:2, steps:['Ogranicz dalsze zapisy na niestabilnym nośniku i oceń ważność danych.','Zapisz model dysku, temperaturę, SMART i komunikaty systemu bez forsowania testów.','Gdy nośnik jest stabilny, wykonaj kopię najważniejszych danych na inny nośnik.','Dopiero po zabezpieczeniu danych porównuj gniazdo, firmware i zachowanie w znanym dobrym systemie.'], prompt:'Co jest pierwszym priorytetem przy znikającym dysku z ważnymi danymi?', options:['Długi test zapisu i benchmark','Ograniczenie zapisów i zabezpieczenie kopii danych','Formatowanie partycji'], answer:1, explanation:'Dalsze zapisy i testy mogą pogorszyć stan nośnika. Najpierw zabezpiecza się dane i dokumentuje objawy.' }
  };
  let activeBench = 'power';
  let benchAnswered = false;
  function renderBench() {
    const item = BENCH[activeBench]; if (!item) return;
    const caseNode = document.getElementById('l40BenchCase'); if (!caseNode) return;
    caseNode.innerHTML = `<div class="l40-case-heading"><span class="l40-kicker">SYMULACJA EDU / ${esc(item.board)}</span><h3>${esc(item.title)}</h3><p>${esc(item.symptom)}</p></div><ol class="l40-step-list">${item.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol><div class="l40-sim-measure"><div><small>WARTOŚĆ REFERENCYJNA SYMULACJI</small><b>${item.reference} ${esc(item.unit)}</b><span>${esc(item.point)}</span></div><label>Wpisz wynik z ćwiczenia<input id="l40BenchValue" inputmode="decimal" type="number" min="0" step="any" placeholder="np. ${item.reference}"></label></div><div class="l40-quiz-box"><b>${esc(item.prompt)}</b><div class="l40-option-grid">${item.options.map((option, index) => `<button type="button" class="l40-option" data-bench-option="${index}">${esc(option)}</button>`).join('')}</div><p id="l40BenchFeedback" class="l40-feedback" aria-live="polite">Wybierz odpowiedź i sprawdź wynik symulacji.</p><button type="button" class="l40-btn primary" id="l40BenchSave">Zapisz wynik ćwiczenia</button></div>`;
    benchAnswered = false;
  }
  function runBenchCheck() {
    const item = BENCH[activeBench]; const input = document.getElementById('l40BenchValue');
    const val = input && input.value !== '' ? Number(input.value) : NaN;
    const measurement = Number.isFinite(val) && val >= 0;
    const within = measurement && val >= item.min && val <= item.max;
    const feedback = document.getElementById('l40BenchFeedback');
    if (!measurement) { if (feedback) { feedback.textContent = 'Wpisz nieujemną wartość liczbową, aby ocenić ćwiczenie.'; feedback.classList.add('is-error'); } return; }
    const selectedRaw = caseNodeSelected();
    if (selectedRaw === null) { if (feedback) { feedback.textContent = 'Najpierw wybierz odpowiedź dotyczącą kolejności diagnostyki.'; feedback.classList.add('is-error'); } return null; }
    const selected = Number(selectedRaw);
    const choiceOk = selected === item.answer;
    benchAnswered = choiceOk && within;
    if (feedback) {
      feedback.textContent = `${choiceOk ? 'Poprawna kolejność rozumowania.' : 'Sprawdź kolejność diagnostyki.'} ${within ? 'Wartość mieści się w zakresie ćwiczenia EDU.' : `Wartość poza zakresem ćwiczenia (${item.min}–${item.max} ${item.unit}).`} ${item.explanation} Dane są sztuczne i dotyczą wyłącznie symulacji.`;
      feedback.classList.toggle('is-error', !benchAnswered); feedback.classList.toggle('is-good', benchAnswered);
    }
    return { choiceOk, within, value: val };
  }
  function caseNodeSelected() { const selected = $('.l40-option.selected'); return selected ? selected.dataset.benchOption : null; }
  function saveBench() {
    const result = runBenchCheck(); if (!result) return;
    const item = BENCH[activeBench];
    const run = { id:`SIM-${Date.now().toString(36).toUpperCase()}`, scenario:activeBench, title:item.title, boardId:clean($('#l40BoardId')?.value || item.board, 80), revision:clean($('#l40Revision')?.value || 'EDU', 40), value:result.value, unit:item.unit, choiceCorrect:result.choiceOk, measurementInRange:result.within, passed:result.choiceOk && result.within, completedAt:now(), educationalOnly:true };
    state.practiceRuns.unshift(run); persist(); renderDashboard(); renderPracticeHistory();
    say(run.passed ? 'Ćwiczenie zapisane — zaliczone.' : 'Ćwiczenie zapisane. Sprawdź informację zwrotną i spróbuj ponownie.');
  }
  function renderPracticeHistory() {
    const node = document.getElementById('l40PracticeHistory'); if (!node) return;
    node.innerHTML = state.practiceRuns.slice(0, 8).map(x => `<article class="l40-list-card"><div><b>${esc(x.title)}</b><small>${esc(x.boardId)} · ${new Date(x.completedAt).toLocaleString('pl-PL')} · ${esc(x.value)} ${esc(x.unit)}</small></div><span class="l40-status-pill ${x.passed ? 'good' : 'warn'}">${x.passed ? 'ZALICZONE' : 'DO POWTÓRKI'}</span></article>`).join('') || '<p class="l40-muted">Nie zapisano jeszcze żadnych ćwiczeń.</p>';
  }

  const EXAMS = [
    { id:'safe-service', title:'Bezpieczeństwo i ESD', questions:[
      ['Kiedy wolno mierzyć rezystancję obwodu?', ['Gdy urządzenie jest uruchomione','Po odłączeniu wszystkich źródeł energii i bezpiecznym rozładowaniu','Gdy zasilacz jest tylko w trybie uśpienia'],1,'Rezystancja i ciągłość wymagają obwodu bez zasilania.'],
      ['Co zrobić przy spuchniętej baterii?', ['Przerwać pracę i zastosować procedurę producenta','Docisnąć obudowę','Przebić ogniwo, aby spuścić gaz'],0,'Spuchnięta bateria stanowi zagrożenie; nie wolno jej naciskać ani przebijać.'],
      ['Czy opaska ESD chroni przed porażeniem sieciowym?', ['Tak','Tylko w gumowych rękawicach','Nie'],2,'Ochrona ESD nie jest ochroną przed porażeniem elektrycznym.'],
      ['Jak dokumentować demontaż?', ['Pamięcią','Zdjęciami i mapą śrub/przewodów','Zostawiając wszystko luzem'],1,'Dokumentacja ułatwia bezpieczny montaż i audyt.'],
      ['Co zrobić przy dymie lub iskrzeniu?', ['Kontynuować, jeśli komputer działa','Zwiększyć obciążenie','Natychmiast przerwać i odłączyć energię, jeśli jest to bezpieczne'],2,'Dym i iskrzenie to warunki natychmiastowego przerwania pracy.'],
      ['Czy wolno mostkować przepalony bezpiecznik?', ['Nie — najpierw ustalić przyczynę i dobrać właściwy element','Tak, cienkim drutem','Tak, na krótki test'],0,'Bezpiecznik jest elementem ochronnym i nie wolno go mostkować.'],
      ['Jaki schemat wybrać?', ['Dowolny podobny model','Dokładny model i rewizję płyty','Pierwszy plik z forum'],1,'Rewizja PCB i wariant urządzenia są krytyczne dla dokumentacji.'],
      ['Co jest ważne przed aktualizacją firmware?', ['Stabilne zasilanie, zgodność i instrukcja OEM','Wyłączyć kopię zapasową','Wybrać plik z podobnej serii'],0,'Firmware musi być zgodny z dokładnym wariantem i zasilanie stabilne.'] ]},
    { id:'pc-diagnostics', title:'Diagnostyka PC i laptopów', questions:[
      ['Brak POST i kontrolka DRAM — od czego zacząć?', ['Zmienić napięcia RAM','Zapis kodu POST i konfiguracji, potem test pojedynczego modułu','Wymienić płytę'],1,'Najpierw zapis objawu i test kontrolowanej konfiguracji minimalnej.'],
      ['Dysk znika, a dane są ważne. Co najpierw?', ['Benchmark zapisu','Formatowanie','Ograniczenie zapisów i kopia danych'],2,'Ochrona danych ma pierwszeństwo przed testami wydajnościowymi.'],
      ['Laptop nie reaguje na Power. Który podział diagnostyczny jest przydatny?', ['Wejście, standby, reakcja EC i POST','Tylko temperatura GPU','Wyłącznie sterownik grafiki'],0,'Rozdzielenie etapów startu zawęża obszar problemu.'],
      ['Wysoka temperatura CPU i spadek taktowania?', ['Podniesienie napięcia','Sprawdzenie chłodzenia, docisku i przepływu powietrza','Wyłączenie monitoringu'],1,'Thermal throttling wymaga najpierw kontroli układu chłodzenia.'],
      ['Brak obrazu po aktualizacji sterownika?', ['Od razu wymienić GPU','Formatować wszystkie dyski','Sprawdzić tryb odzyskiwania, poprzedni sterownik i logi'],2,'Najpierw odwracalne kroki programowe i zabezpieczenie danych.'],
      ['Jak ustalić zgodność części?', ['Porównać P/N, rewizję, interfejs i specyfikację OEM','Ocenić po kolorze','Zakładać, że podobny rozmiar wystarczy'],0,'Zgodność nie wynika z samego wyglądu.'],
      ['Test obciążeniowy jest dozwolony, gdy?', ['Chłodzenie i zasilanie są sprawdzone, a warunki kontrolowane','Wentylator nie działa','Dysk zgłasza krytyczne błędy'],0,'Test obciążeniowy wykonuje się po kontroli bezpieczeństwa.'],
      ['Po naprawie należy?', ['Sprawdzić tylko, czy dioda się świeci','Powtórzyć test pierwotnego objawu i testy funkcjonalne','Nie zapisywać wyników'],1,'Weryfikacja musi odnosić się do pierwotnego problemu.'] ]},
    { id:'pcb-basics', title:'Elektronika PCB i pomiary', questions:[
      ['Niski opór do masy zawsze oznacza zwarcie?', ['Tak','Nie — niektóre linie rdzeni naturalnie mają małą rezystancję','Tylko na laptopach'],1,'Odczyt trzeba porównać z topologią, schematem i znanym dobrym egzemplarzem.'],
      ['Do czego służy Board ID?', ['Do wskazania numeru telefonu serwisu','Do identyfikacji platformy/laminatu płyty','Do pomiaru temperatury'],1,'Board ID pomaga dobrać właściwy schemat i rewizję.'],
      ['Kiedy pomiar napięcia ma sens?', ['Gdy znany jest punkt, odniesienie, tryb i bezpieczna procedura','Na chybił trafił','Między sąsiednimi pinami sondą bez izolacji'],0,'Pomiar wymaga zidentyfikowanego punktu i właściwego przygotowania.'],
      ['Co oznacza sygnał Power Good?', ['Potwierdzenie gotowości określonej szyny/układu według projektu','Zawsze obecność obrazu','Status dysku SSD'],0,'Power Good ma znaczenie w sekwencji zasilania konkretnej platformy.'],
      ['Czy zamiennik MOSFET dobiera się tylko po obudowie?', ['Tak','Nie — potrzebne są parametry, pinout, charakterystyki i warunki pracy','Tak, jeśli producent jest ten sam'],1,'Obudowa nie potwierdza parametrów elektrycznych i termicznych.'],
      ['Co sprawdzić przed BGA rework?', ['Profil termiczny, stan PCB, układ i kwalifikację procesu','Tylko kolor topnika','Nie trzeba przygotowania'],0,'BGA to proces ekspercki; reflow na próbę może zniszczyć płytę.'],
      ['Jak zapisać pomiar?', ['Tylko wartość','Punkt, jednostka, tryb, stan zasilania, model/rev i źródło','Bez warunków'],1,'Bez kontekstu pomiar nie jest powtarzalny ani wiarygodny.'],
      ['Jak rozpoznać poprawną procedurę?', ['Sprawdzić źródło i dokładny wariant urządzenia','Kopiować post z forum bez weryfikacji','Przenieść napięcia z innej płyty'],0,'Wyniki i procedury trzeba weryfikować dla dokładnego modelu/rewizji.'] ]}
  ];
  let activeExam = 'safe-service';
  let answers = {};
  let examSubmitted = false;
  function evaluateExam(examId, submittedAnswers) {
    const exam = EXAMS.find(x => x.id === examId);
    if (!exam) return { complete:false, answered:0, total:0, correct:0, percent:0, passed:false };
    const valid = exam.questions.map((q, i) => {
      const value = Number(submittedAnswers?.[i]);
      return Number.isInteger(value) && value >= 0 && value < q[1].length ? value : null;
    });
    const answered = valid.filter(value => value !== null).length;
    if (answered !== exam.questions.length) return { complete:false, answered, total:exam.questions.length, correct:0, percent:0, passed:false };
    const correct = exam.questions.reduce((sum, q, i) => sum + (valid[i] === q[2] ? 1 : 0), 0);
    const percent = Math.round(correct / exam.questions.length * 100);
    return { complete:true, answered, total:exam.questions.length, correct, percent, passed:percent >= 75 };
  }
  function renderExams() {
    const picker = document.getElementById('l40ExamPicker'); if (!picker) return;
    picker.innerHTML = EXAMS.map(exam => `<button type="button" class="l40-exam-choice ${exam.id === activeExam ? 'active' : ''}" data-select-exam="${exam.id}"><b>${esc(exam.title)}</b><span>8 pytań · próg 75%</span></button>`).join('');
    renderExamHistory(); renderCertificates();
  }
  function startExam() {
    const exam = EXAMS.find(x => x.id === activeExam); if (!exam) return;
    answers = {}; examSubmitted = false;
    const stage = document.getElementById('l40ExamStage'); if (!stage) return;
    stage.hidden = false;
    stage.innerHTML = `<div class="l40-section-head"><div><span class="l40-kicker">EGZAMIN / 8 PYTAŃ</span><h3>${esc(exam.title)}</h3><p>Wybierz jedną odpowiedź w każdym pytaniu. Wynik i certyfikat są przechowywane lokalnie.</p></div></div>${exam.questions.map((q, index) => `<fieldset class="l40-question"><legend>${index + 1}. ${esc(q[0])}</legend><div class="l40-question-options">${q[1].map((option, choice) => `<label><input type="radio" name="l40q${index}" value="${choice}" data-exam-answer="${index}" /><span>${esc(option)}</span></label>`).join('')}</div></fieldset>`).join('')}<button type="button" class="l40-btn primary" id="l40SubmitExam">Zakończ egzamin i sprawdź wynik</button><p id="l40ExamFeedback" class="l40-feedback" aria-live="polite"></p>`;
    stage.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  function submitExam() {
    if (examSubmitted) return;
    const exam = EXAMS.find(x => x.id === activeExam); if (!exam) return;
    const score = evaluateExam(activeExam, answers);
    if (!score.complete) { const feedback = document.getElementById('l40ExamFeedback'); if (feedback) feedback.textContent = `Odpowiedz na wszystkie pytania (${score.answered}/${score.total}).`; return; }
    const { correct, percent, passed } = score;
    examSubmitted = true;
    const certId = passed ? createCertificateId() : null;
    const attempt = { id:`EX-${Date.now().toString(36).toUpperCase()}`, examId:exam.id, title:exam.title, correct, total:exam.questions.length, percent, passed, completedAt:now(), certificateId:certId, answers:{...answers} };
    state.examAttempts.unshift(attempt);
    if (passed) state.certificates.unshift({ id:certId, examId:exam.id, title:exam.title, score:percent, issuedAt:attempt.completedAt, localOnly:true, issuer:'NAUKA OD A DO Z' });
    persist(); renderExamHistory(); renderCertificates();
    const submitButton = document.getElementById('l40SubmitExam'); if (submitButton) submitButton.disabled = true;
    const feedback = document.getElementById('l40ExamFeedback');
    if (feedback) feedback.innerHTML = `<strong>${passed ? 'ZALICZONO' : 'DO POWTÓRKI'} · ${percent}% (${correct}/${exam.questions.length})</strong><p>${passed ? `Utworzono lokalny certyfikat ${esc(certId)}. Poniżej znajdziesz kod QR.` : 'Wymagane minimum to 75%. Przejrzyj wyjaśnienia i spróbuj ponownie.'}</p>${exam.questions.map((q,i)=>`<div class="l40-review-item"><b>${i + 1}. ${esc(q[0])}</b><span class="${Number(answers[i]) === q[2] ? 'ok' : 'bad'}">${Number(answers[i]) === q[2] ? 'Poprawnie' : `Poprawna: ${esc(q[1][q[2]])}`}</span><small>${esc(q[3])}</small></div>`).join('')}${passed ? `<div class="l40-qr-card"><div><b>Certyfikat edukacyjny</b><span>${esc(attempt.title)} · ${percent}% · ${esc(certId)}</span><small>QR zawiera identyfikator do lokalnej weryfikacji w tym module.</small></div>${qrSvg(certId, 5)}</div><button type="button" class="l40-btn primary" data-print-certificate="${esc(certId)}">Drukuj certyfikat / Zapisz jako PDF</button>` : ''}`;
    say(passed ? 'Egzamin zaliczony. Certyfikat edukacyjny został zapisany lokalnie.' : 'Egzamin niezaliczony. Wynik zapisano w historii.');
  }
  function createCertificateId() {
    const bytes = new Uint8Array(6);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes); else for (let i=0;i<bytes.length;i++) bytes[i] = Math.floor(Math.random()*256);
    return `AZ40${Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('').toUpperCase()}`;
  }
  function renderExamHistory() {
    const node = document.getElementById('l40ExamHistory'); if (!node) return;
    node.innerHTML = state.examAttempts.slice(0, 10).map(x => `<article class="l40-list-card"><div><b>${esc(x.title)}</b><small>${new Date(x.completedAt).toLocaleString('pl-PL')} · ${x.correct}/${x.total} odpowiedzi</small></div><span class="l40-status-pill ${x.passed ? 'good' : 'warn'}">${x.percent}%</span></article>`).join('') || '<p class="l40-muted">Historia egzaminów jest pusta.</p>';
  }
  function renderCertificates() {
    const node = document.getElementById('l40CertificateList'); if (!node) return;
    node.innerHTML = state.certificates.slice(0, 10).map(x => `<article class="l40-certificate-mini"><div><b>${esc(x.title)}</b><small>${esc(x.id)} · ${x.score}% · ${new Date(x.issuedAt).toLocaleDateString('pl-PL')}</small></div><button type="button" class="l40-btn soft" data-print-certificate="${esc(x.id)}">Certyfikat</button></article>`).join('') || '<p class="l40-muted">Certyfikaty pojawią się po zaliczeniu egzaminu (minimum 75%).</p>';
  }
  function verifyCertificate(code) {
    const cleanCode = clean(code, 40).toUpperCase().replace(/\s/g, '');
    const node = document.getElementById('l40VerifyResult'); if (!node) return;
    const cert = state.certificates.find(x => String(x.id).toUpperCase() === cleanCode);
    node.innerHTML = cert
      ? `<div class="l40-verify-good"><b>REKORD ZNALEZIONY W TEJ PRZEGLĄDARCE</b><span>${esc(cert.title)} · ${esc(cert.score)}% · ${new Date(cert.issuedAt).toLocaleString('pl-PL')}</span><code>${esc(cert.id)}</code><small>To lokalne potwierdzenie rekordu edukacyjnego. Nie jest podpisem kryptograficznym ani certyfikatem państwowym/akredytowanym. Rekord może nie być dostępny na innym urządzeniu.</small></div>`
      : `<div class="l40-verify-miss">Nie znaleziono takiego certyfikatu w lokalnych danych tej przeglądarki. Sprawdź kod lub zaimportuj kopię postępu z urządzenia, na którym zdano egzamin.</div>`;
  }
  function printCertificate(id) {
    const cert = state.certificates.find(x => x.id === id); if (!cert) { say('Nie znaleziono certyfikatu.', true); return; }
    const qr = qrSvg(id, 7);
    const html = `<!doctype html><html lang="pl"><meta charset="utf-8"><title>Certyfikat ${esc(cert.id)}</title><style>body{font:16px/1.5 Arial,sans-serif;color:#102033;margin:0;padding:32px;background:#eef4f9}.sheet{max-width:900px;margin:0 auto;background:white;border:10px double #176c91;padding:50px;text-align:center}.mark{font-size:13px;letter-spacing:.18em;color:#176c91;font-weight:bold}.title{font:700 42px Georgia,serif;margin:35px 0 10px}.course{font-size:26px;color:#176c91;margin:25px}.score{font-size:20px;font-weight:bold}.code{font:700 16px monospace;letter-spacing:.1em}.foot{font-size:12px;color:#566b7e;margin-top:24px}.qr{margin:20px auto;width:150px}.actions{text-align:center;margin:20px}@media print{body{padding:0;background:white}.sheet{border-color:#176c91;max-width:none;margin:12mm;padding:30mm 15mm}.actions{display:none}}</style><div class="sheet"><div class="mark">NAUKA OD A DO Z · AKADEMIA WIEDZY I PRAKTYKI</div><h1 class="title">Certyfikat ukończenia egzaminu</h1><p>Potwierdza się zapisanie osiągnięcia edukacyjnego</p><h2 class="course">${esc(cert.title)}</h2><p class="score">Wynik: ${esc(cert.score)}%</p><p>Data: ${new Date(cert.issuedAt).toLocaleString('pl-PL')}</p><p class="code">${esc(cert.id)}</p><div class="qr">${qr}</div><p class="foot">Osiągnięcie edukacyjne platformy. Rekord i identyfikator są weryfikowane lokalnie w module „Egzaminy i certyfikaty QR”. Dokument nie jest państwowym ani akredytowanym uprawnieniem. QR zawiera lokalny identyfikator rekordu.</p></div><div class="actions"><button onclick="window.print()">Drukuj / Zapisz jako PDF</button></div></html>`;
    const win = window.open('', '_blank');
    if (!win) { download(`certyfikat-${id}.html`, html, 'text/html;charset=utf-8'); say('Przeglądarka zablokowała okno wydruku. Pobrano samodzielny certyfikat HTML.'); return; }
    win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();
  }

  // Generator QR Code Model 2, wersja 1-L, maska 0. Identyfikator ma 16 bajtów ASCII.
  function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); if ((y >>> i) & 1) z ^= x; } return z; }
  function rsRemainder(data, degree) {
    let generator = [1];
    const mul = (a,b) => { let result=0; while(b){if(b&1)result^=a;a<<=1;if(a&0x100)a^=0x11d;b>>=1;} return result; };
    let root = 1;
    for (let i=0;i<degree;i++) { const next = new Array(generator.length+1).fill(0); generator.forEach((v,j)=>{next[j]^=v;next[j+1]^=mul(v,root);}); generator=next; root=mul(root,2); }
    const work = data.concat(new Array(degree).fill(0));
    for (let i=0;i<data.length;i++) { const factor=work[i]; if(factor) for(let j=0;j<generator.length;j++) work[i+j]^=mul(generator[j],factor); }
    return work.slice(data.length);
  }
  function qrSvg(text, scale = 4) {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    if (bytes.length > 17) return '<span>QR: kod za długi</span>';
    const bits=[]; const push=(value,length)=>{for(let i=length-1;i>=0;i--)bits.push((value>>>i)&1);};
    push(4,4); push(bytes.length,8); bytes.forEach(byte=>push(byte,8));
    for(let i=0;i<Math.min(4,152-bits.length);i++)bits.push(0);
    while(bits.length%8)bits.push(0);
    const data=[]; for(let i=0;i<bits.length;i+=8){let v=0;for(let j=0;j<8;j++)v=(v<<1)|bits[i+j];data.push(v);}
    let pad=0;while(data.length<19)data.push((pad++%2)===0?0xec:0x11);
    const codewords=data.concat(rsRemainder(data,7));
    const matrix=Array.from({length:21},()=>Array(21).fill(null));
    const reserve=(r,c,v=false)=>{if(r>=0&&r<21&&c>=0&&c<21)matrix[r][c]=v;};
    const finder=(r0,c0)=>{for(let r=-1;r<=7;r++)for(let c=-1;c<=7;c++){const rr=r0+r,cc=c0+c;if(rr<0||rr>=21||cc<0||cc>=21)continue;const inside=r>=0&&r<=6&&c>=0&&c<=6;const black=inside&&(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4));reserve(rr,cc,black);}};
    finder(0,0);finder(0,14);finder(14,0);
    for(let i=8;i<13;i++){reserve(6,i,i%2===0);reserve(i,6,i%2===0);}
    const formatData=(1<<3)|0; let rem=formatData<<10; for(let bit=14;bit>=10;bit--) if((rem>>>bit)&1) rem^=0x537<<(bit-10); const format=((formatData<<10)|rem)^0x5412;
    const a=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    const b=[[20,8],[19,8],[18,8],[17,8],[16,8],[15,8],[14,8],[8,13],[8,14],[8,15],[8,16],[8,17],[8,18],[8,19],[8,20]];
    for(let i=0;i<15;i++){const bit=((format>>>(14-i))&1)!==0;reserve(a[i][0],a[i][1],bit);reserve(b[i][0],b[i][1],bit);} reserve(13,8,true);
    const stream=[];codewords.forEach(byte=>pushBits(stream,byte,8));
    let index=0, upward=true;
    for(let right=20;right>=1;right-=2){if(right===6)right=5;for(let step=0;step<21;step++){const row=upward?20-step:step;for(let k=0;k<2;k++){const col=right-k;if(matrix[row][col]!==null)continue;let bit=index<stream.length?stream[index++]===1:false;if((row+col)%2===0)bit=!bit;matrix[row][col]=bit;}}upward=!upward;}
    const quiet=4, dimension=29, rects=[];for(let r=0;r<21;r++)for(let c=0;c<21;c++)if(matrix[r][c])rects.push(`<rect x="${c+quiet}" y="${r+quiet}" width="1" height="1"/>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="${dimension*scale}" height="${dimension*scale}" role="img" aria-label="Kod QR certyfikatu"><rect width="${dimension}" height="${dimension}" fill="#fff"/><g fill="#071522">${rects.join('')}</g></svg>`;
  }
  function pushBits(target, value, length) { for(let i=length-1;i>=0;i--)target.push((value>>>i)&1); }

  function staticModels() {
    const catalog = window.ACADEMY_DEVICE_CATALOG?.brands || [];
    return catalog.flatMap(brand => [
      ...(brand.models || []).map(model => ({ brand:brand.brand, series:model[0], model:model[1], type:model[2] || 'laptop', exact:true })),
      ...(brand.families || []).map(family => ({ brand:brand.brand, series:family[0], model:family[1], type:'family', exact:false }))
    ]);
  }
  function searchAtlas(query) {
    const target = document.getElementById('l40AtlasResults'); if (!target) return;
    const q = norm(query); const models = staticModels().filter(x => !q || norm([x.brand,x.series,x.model,x.type].join(' ')).includes(q)).slice(0, 50);
    const local = state.boards.filter(x => !q || norm([x.brand,x.model,x.boardId,x.revision,x.chipset,x.components,x.source].join(' ')).includes(q));
    const html = [
      ...local.map(x=>`<article class="l40-atlas-card own"><span class="l40-status-pill warn">WPIS LOKALNY · NIEZWERYFIKOWANY</span><h3>${esc(x.brand)} ${esc(x.model)}</h3><dl><dt>Board ID</dt><dd>${esc(x.boardId)}</dd><dt>Rewizja</dt><dd>${esc(x.revision || 'Nie podano')}</dd><dt>Chipset / platforma</dt><dd>${esc(x.chipset || 'Nie podano')}</dd><dt>Elementy / układy</dt><dd>${esc(x.components || 'Nie podano')}</dd><dt>Źródło</dt><dd>${esc(x.source)}</dd></dl></article>`),
      ...models.map(x=>`<article class="l40-atlas-card"><span class="l40-status-pill ${x.exact?'good':'neutral'}">${x.exact?'MODEL REFERENCYJNY':'RODZINA PRODUKTOWA'}</span><h3>${esc(x.brand)} · ${esc(x.series)}</h3><p>${esc(x.model)}</p><small>Wpis katalogowy nie potwierdza Board ID ani rewizji konkretnego egzemplarza. Sprawdź nadruk na PCB i dokumentację OEM.</small></article>`)
    ];
    target.innerHTML = html.join('') || '<p class="l40-muted">Brak dopasowania. Dodaj własny wpis z dokładnym Board ID, rewizją i źródłem.</p>';
    const count = document.getElementById('l40AtlasCount'); if (count) count.textContent = `${local.length} wpisów lokalnych · ${models.length} pozycji katalogowych`;
  }
  function renderComponents(query) {
    const target = document.getElementById('l40ComponentResults'); if (!target) return;
    const q = clean(query, 200);
    if (!q) { target.innerHTML = '<p class="l40-muted">Wpisz oznaczenie układu, np. MOSFET, EC, charger, SPI flash lub kontroler USB-C.</p>'; return; }
    const exact = components().filter(x => norm([x.name,x.english,x.ref,x.category,x.role,x.symptoms,x.diagnosis,x.repair].join(' ')).includes(norm(q))).slice(0, 24);
    const found = exact.map(x=>`<article class="l40-component-card"><b>${esc(x.name || x.term || 'Element')}</b><small>${esc(x.category || x.ref || 'Komponent')}</small><p>${esc(clean(x.role || x.description || x.symptoms, 500))}</p>${x.diagnosis ? `<p><b>Diagnostyka:</b> ${esc(clean(x.diagnosis, 360))}</p>` : ''}${x.risk ? `<p class="l40-safety-line">${esc(clean(x.risk, 300))}</p>` : ''}</article>`).join('');
    target.innerHTML = found || '<p class="l40-muted">Nie znaleziono elementu w lokalnej encyklopedii. Sprawdź pełne oznaczenie układu i rodzinę komponentów.</p>';
  }
  function saveBoard(event) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form).entries());
    const record = { id:`BOARD-${Date.now().toString(36).toUpperCase()}`, brand:clean(values.brand,80), model:clean(values.model,140), boardId:clean(values.boardId,100), revision:clean(values.revision,50), chipset:clean(values.chipset,120), components:clean(values.components,500), source:clean(values.source,240), createdAt:now(), verified:false };
    if (!record.brand || !record.model || !record.boardId || !record.source) { say('Uzupełnij producenta, model, Board ID i źródło wpisu.', true); return; }
    state.boards.unshift(record); persist(); form.reset(); searchAtlas($('#l40AtlasSearch')?.value || ''); say('Dodano lokalny wpis atlasu. Nie jest on publikowany ani automatycznie uznawany za zweryfikowany.');
  }

  function makeOfflinePackage() {
    const data = window.ACADEMY_DATA || {};
    const pack = {
      schema:SCHEMA, schemaVersion:1, app:'NAUKA OD A DO Z', release:'6.8.0 FIX40', exportedAt:now(),
      lessons:lessons().map(x=>({id:x.id,title:x.title,category:x.category,level:x.level,minutes:x.minutes,description:x.description,body:x.body,step:x.step,symptoms:x.symptoms,diagnosis:x.diagnosis,repair:x.repair,tests:x.tests,verify:x.verify,warning:x.warning})),
      faults:faults().map(x=>({id:x.id,title:x.title,category:x.category,symptom:x.symptom,causes:x.causes,checks:x.checks,steps:x.steps,tests:x.tests,repair:x.repair,verify:x.verify,stop:x.stop,refs:x.refs})),
      methods:methods().map(x=>({id:x.id,name:x.name,category:x.category,diagnosis:x.diagnosis,procedure:x.procedure,verification:x.verification,risk:x.risk,tools:x.tools})),
      components:components().map(x=>({id:x.id,name:x.name,english:x.english,ref:x.ref,category:x.category,role:x.role,symptoms:x.symptoms,diagnosis:x.diagnosis,repair:x.repair,risk:x.risk})),
      boards:[...staticModels().map(x=>({brand:x.brand,series:x.series,model:x.model,type:x.type,exact:x.exact,recordType:'catalog-model'})),...state.boards.map(x=>({...x,recordType:'local-board',verified:false}))],
      documents:libraryDocs().map(x=>({id:x.id,title:x.title,category:x.category,type:x.type,path:x.path,bytes:x.bytes,description:x.description})),
      disclaimer:'Pakiet edukacyjny. Wpisy katalogowe i symulacje nie potwierdzają zgodności ani naprawy. Sprawdź dokładny model, Board ID, rewizję oraz dokumentację producenta.'
    };
    return pack;
  }
  function validateOfflinePackage(input) {
    let data; try { data = typeof input === 'string' ? JSON.parse(input) : input; } catch { throw new Error('Plik nie jest poprawnym JSON.'); }
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.schema !== SCHEMA || data.schemaVersion !== 1) throw new Error('Nieobsługiwany format pakietu OFFLINE PRO FIX40.');
    for (const key of ['lessons','faults','methods','components','boards','documents']) if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error(`Nieprawidłowa lista ${key}.`);
    const count = ['lessons','faults','methods','components','boards','documents'].reduce((n,k)=>n+(Array.isArray(data[k])?data[k].length:0),0);
    if (count < 1 || count > 10000) throw new Error('Pakiet ma nieprawidłową liczbę rekordów.');
    const safe = { schema:SCHEMA, schemaVersion:1, app:'NAUKA OD A DO Z', release:'6.8.0 FIX40', exportedAt:clean(data.exportedAt,40), lessons:[], faults:[], methods:[], components:[], boards:[], documents:[], disclaimer:clean(data.disclaimer,1000) };
    const sanitizeValue = (value, depth = 0) => {
      if (depth > 5) return null;
      if (typeof value === 'string') return clean(value, 5000);
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      if (typeof value === 'boolean' || value === null) return value;
      if (Array.isArray(value)) return value.slice(0, 500).map(item => sanitizeValue(item, depth + 1));
      if (value && typeof value === 'object') {
        const result = {};
        for (const [key, nested] of Object.entries(value).slice(0, 200)) {
          if (!/^[a-zA-Z0-9_]{1,40}$/.test(key) || ['__proto__','prototype','constructor'].includes(key)) continue;
          result[key] = sanitizeValue(nested, depth + 1);
        }
        return result;
      }
      return null;
    };
    for (const key of ['lessons','faults','methods','components','boards','documents']) safe[key] = (data[key] || []).slice(0,5000).filter(x=>x && typeof x==='object' && !Array.isArray(x)).map(x=>sanitizeValue(x));
    if (!safe.lessons.length && !safe.faults.length && !safe.methods.length && !safe.components.length && !safe.boards.length && !safe.documents.length) throw new Error('Pakiet nie zawiera poprawnych rekordów.');
    return safe;
  }
  function buildOfflineHtml(pack) {
    const data = JSON.stringify(pack).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NAUKA OD A DO Z — pakiet offline</title><style>*{box-sizing:border-box}body{margin:0;background:#071323;color:#e6f3ff;font:15px/1.55 Arial,sans-serif}header{padding:32px max(20px,5vw);background:linear-gradient(120deg,#0a3150,#101b35);border-bottom:1px solid #1b5878}h1{margin:0 0 8px;font-size:28px}header p,.muted{color:#9eb6c9}main{max-width:1100px;margin:25px auto;padding:0 18px}input,select{width:100%;padding:13px;border:1px solid #28506c;border-radius:10px;background:#0d1c30;color:#fff;margin:12px 0 20px}details{background:#102239;border:1px solid #204965;border-radius:12px;margin:10px 0;padding:15px}summary{cursor:pointer;font-weight:bold;color:#8ee7ff}small{color:#9eb6c9}.tag{font-size:11px;color:#73dfc5;text-transform:uppercase}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#d7e7f5}.entry{padding:8px 0;border-bottom:1px solid #29435c}.hidden{display:none!important}</style><header><h1>NAUKA OD A DO Z — OFFLINE PRO</h1><p>Samodzielny pakiet edukacyjny FIX40 · działa bez Internetu</p><small id="stats"></small></header><main><label for="q">Szukaj lekcji, usterki, komponentu lub Board ID</label><input id="q" type="search" placeholder="Wpisz frazę…"><div id="content"></div><p class="muted">Materiały edukacyjne nie zastępują dokumentacji OEM. Weryfikuj dokładny model i rewizję płyty.</p></main><script>const P=${data};const all=[...P.lessons.map(x=>({...x,_type:'Lekcja'})),...P.faults.map(x=>({...x,_type:'Przypadek'})),...P.methods.map(x=>({...x,_type:'Procedura'})),...P.components.map(x=>({...x,_type:'Element'})),...P.boards.map(x=>({...x,_type:'Model / Board ID'})),...(P.documents||[]).map(x=>({...x,_type:'Dokument biblioteczny'}))];const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const text=x=>Object.entries(x).filter(([k,v])=>!k.startsWith('_')&&v!=null).map(([k,v])=>k+': '+(typeof v==='string'?v:JSON.stringify(v))).join('\\n');function render(){const q=document.getElementById('q').value.toLocaleLowerCase('pl-PL');const rows=all.filter(x=>!q||text(x).toLocaleLowerCase('pl-PL').includes(q)).slice(0,250);document.getElementById('stats').textContent=all.length+' materiałów · '+rows.length+' widocznych';document.getElementById('content').innerHTML=rows.map(x=>'<details><summary>'+esc(x._type+' · '+(x.title||x.name||x.model||x.id))+'</summary><div class="tag">'+esc(x.category||x.brand||'')+'</div><pre>'+esc(text(x))+'</pre></details>').join('')||'<p>Brak wyników.</p>'}document.getElementById('q').addEventListener('input',render);render();</script></html>`;
  }
  function downloadOfflineHtml(pack, fileName = 'NAUKA_OD_A_DO_Z_OFFLINE_PRO_FIX40.html') {
    const html = buildOfflineHtml(pack); download(fileName, html, 'text/html;charset=utf-8');
    const summary = { exportedAt:now(), counts:Object.fromEntries(['lessons','faults','methods','components','boards','documents'].map(k=>[k,(pack[k]||[]).length])), fileName };
    state.lastOfflineImport = summary; persist();
    const node = document.getElementById('l40OfflineSummary'); if (node) node.textContent = `${fileName}: ${Object.values(summary.counts).reduce((a,b)=>a+b,0)} rekordów. Plik HTML działa samodzielnie bez sieci.`;
    say('Wygenerowano samodzielny podręcznik HTML do pracy offline.');
  }
  function exportOfflineJson() {
    const pack = makeOfflinePackage(); download('NAUKA_OD_A_DO_Z_PAKIET_OFFLINE_PRO_FIX40.json', JSON.stringify(pack,null,2), 'application/json;charset=utf-8');
    const total = Object.values(pack).filter(Array.isArray).reduce((n,x)=>n+x.length,0);
    const node = document.getElementById('l40OfflineSummary'); if (node) node.textContent = `Pakiet JSON: ${fmt(total)} rekordów. Możesz zaimportować go na innym urządzeniu i utworzyć samodzielny HTML.`;
    say('Eksport pakietu offline JSON zakończony.');
  }
  async function importOffline(file) {
    if (!file) return;
    try {
      if (file.size <= 0 || file.size > MAX_IMPORT) throw new Error('Plik pusty lub większy niż 25 MB.');
      const raw = await file.text(); const pack = validateOfflinePackage(raw);
      downloadOfflineHtml(pack, `NAUKA_OD_A_DO_Z_IMPORT_OFFLINE_${new Date().toISOString().slice(0,10)}.html`);
      const node = document.getElementById('l40OfflineImportStatus'); if (node) node.textContent = `Zaimportowano i zweryfikowano pakiet: ${pack.lessons.length} lekcji, ${pack.faults.length} przypadków, ${pack.methods.length} procedur, ${pack.components.length} komponentów, ${pack.documents.length} opisów dokumentów.`;
    } catch (error) { const node = document.getElementById('l40OfflineImportStatus'); if (node) node.textContent = `Import nieudany: ${error.message}`; say(`Nie zaimportowano pakietu: ${error.message}`, true); }
    finally { const input = document.getElementById('l40OfflineImport'); if (input) input.value = ''; }
  }


  async function cacheLibraryForOffline() {
    const button = document.getElementById('l40CacheDocuments');
    const status = document.getElementById('l40OfflineDocsStatus');
    const docs = libraryDocs().filter(x => typeof x.path === 'string' && x.path.replace(/\\/g,'/').startsWith('Biblioteka/'));
    if (!docs.length) { if (status) status.textContent = 'Nie znaleziono lokalnych dokumentów biblioteki.'; return; }
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      if (status) status.textContent = 'Pamięć offline PWA nie jest jeszcze aktywna. Otwórz aplikację online, odśwież stronę po pierwszym uruchomieniu i spróbuj ponownie.';
      say('Najpierw aktywuj Service Worker i odśwież aplikację.', true); return;
    }
    const expectedBytes = docs.reduce((sum, x) => sum + Math.max(0, Number(x.bytes) || 0), 0);
    try {
      const estimate = await navigator.storage?.estimate?.();
      if (estimate?.quota && estimate?.usage != null && estimate.quota - estimate.usage < expectedBytes * 1.05) {
        throw new Error(`Za mało wolnego miejsca. Dokumenty zajmują około ${(expectedBytes/1048576).toFixed(1)} MB; wolne miejsce przeglądarki: ${((estimate.quota-estimate.usage)/1048576).toFixed(1)} MB.`);
      }
    } catch (error) {
      if (status) status.textContent = error.message;
      say(error.message, true); return;
    }
    if (button) button.disabled = true;
    let saved = 0; const failed = [];
    try {
      for (let index=0; index<docs.length; index++) {
        const doc = docs[index];
        if (status) status.textContent = `Pobieranie dokumentacji offline: ${index+1}/${docs.length} — ${clean(doc.title,100)}.`;
        try {
          const url = new URL('/' + doc.path.replace(/\\/g,'/').replace(/^\/+/,''), location.origin);
          const response = await fetch(url.href, { credentials:'same-origin', cache:'reload' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          if (!blob.size) throw new Error('pusty plik');
          saved++;
        } catch (error) { failed.push(`${clean(doc.title,80)} (${error.message})`); }
      }
      const message = `Zapisano offline ${saved}/${docs.length} dokumentów (${(expectedBytes/1048576).toFixed(1)} MB wg katalogu).` + (failed.length ? ` Nieudane: ${failed.join('; ')}` : ' Dokumenty są gotowe do otwierania bez Internetu w tej przeglądarce.');
      if (status) status.textContent = message;
      say(failed.length ? `Pobrano ${saved}/${docs.length} dokumentów. Sprawdź listę błędów.` : `Biblioteka offline gotowa: ${saved} dokumentów.` , failed.length > 0);
    } finally { if (button) button.disabled = false; }
  }

  function fillReportFromLastPractice() {
    const run = state.practiceRuns[0];
    const form = document.getElementById('l40ReportForm');
    if (!run || !form) { say('Najpierw zapisz wynik ćwiczenia na wirtualnym stole diagnostycznym.', true); return; }
    const set = (name, value) => { const field = form.elements.namedItem(name); if (field && value != null) field.value = String(value); };
    set('kind', 'Raport ćwiczenia');
    set('title', `Raport ćwiczenia — ${run.title}`);
    set('device', clean($('#l40BenchModel')?.value || 'Urządzenie treningowe EDU', 160));
    set('boardId', run.boardId);
    set('revision', run.revision);
    set('symptom', `${run.title}. Scenariusz: ${run.scenario}. Dane są fikcyjne i służą wyłącznie do nauki.`);
    set('procedure', `Wykonano ćwiczenie symulacyjne ${run.id}.
Wynik zadania: ${run.passed ? 'zaliczone' : 'do powtórki'}.
Odpowiedź diagnostyczna: ${run.choiceCorrect ? 'poprawna' : 'niepoprawna'}.
Zakres pomiaru: ${run.measurementInRange ? 'w zakresie symulacji' : 'poza zakresem symulacji'}.`);
    set('measurements', `Wartość wprowadzona: ${run.value} ${run.unit}.
Board ID EDU: ${run.boardId}; rewizja treningowa: ${run.revision}.`);
    set('conclusion', `${run.passed ? 'Ćwiczenie zaliczone.' : 'Ćwiczenie wymaga powtórki.'} Symulacja nie jest pomiarem rzeczywistego urządzenia.`);
    set('source', 'Scenariusz szkoleniowy NAUKA OD A DO Z FIX40; wartości fikcyjne EDU. Dla prawdziwego urządzenia należy użyć dokumentacji OEM właściwej rewizji.');
    say('Wstawiono ostatni zapisany przebieg ćwiczenia do formularza raportu. Sprawdź i uzupełnij dane przed wydrukiem.');
  }

  function makeReportData() {
    const form = document.getElementById('l40ReportForm'); const fields = Object.fromEntries(new FormData(form).entries());
    const report = { id:`PDF-${Date.now().toString(36).toUpperCase()}`, createdAt:now(), kind:clean(fields.kind,70), title:clean(fields.title,160), device:clean(fields.device,160), boardId:clean(fields.boardId,100), revision:clean(fields.revision,50), symptom:clean(fields.symptom,1200), procedure:clean(fields.procedure,3000), measurements:clean(fields.measurements,2000), conclusion:clean(fields.conclusion,1800), source:clean(fields.source,500), disclaimer:'Dokument edukacyjny wygenerowany lokalnie. Wnioski należy potwierdzić w dokumentacji OEM i powtarzalnym teście.' };
    if (!report.title || !report.device || !report.symptom || !report.procedure || !report.source) throw new Error('Uzupełnij tytuł, urządzenie, objaw, procedurę i źródło odniesienia.');
    return report;
  }
  function reportHtml(r) {
    const sections = [['Urządzenie',r.device],['Board ID',r.boardId],['Rewizja PCB',r.revision],['Objaw / cel ćwiczenia',r.symptom],['Przebieg procedury',r.procedure],['Pomiary i wyniki',r.measurements],['Wniosek / test końcowy',r.conclusion],['Źródło odniesienia',r.source]];
    return `<!doctype html><html lang="pl"><meta charset="utf-8"><title>${esc(r.title)}</title><style>body{font:14px/1.55 Arial,sans-serif;color:#152435;margin:28px}header{border-bottom:3px solid #157a9c;padding-bottom:15px}h1{font-size:25px;color:#0c526e}h2{font-size:14px;color:#0b6781;margin:22px 0 5px;text-transform:uppercase;letter-spacing:.06em}.meta{color:#597084;font-size:12px}.value{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f7fa;padding:12px;border-radius:7px}.warn{margin-top:25px;padding:12px;border:1px solid #d2a24e;background:#fff9ed}.sign{display:flex;gap:60px;margin-top:55px}.sign div{border-top:1px solid #718393;flex:1;padding-top:8px;font-size:12px}@page{margin:18mm}@media print{body{margin:0}.no-print{display:none}}</style><header><div class="meta">NAUKA OD A DO Z · RAPORT EDUKACYJNY / FIX40</div><h1>${esc(r.title)}</h1><div class="meta">${esc(r.kind)} · ${new Date(r.createdAt).toLocaleString('pl-PL')} · ${esc(r.id)}</div></header>${sections.map(([label,value])=>`<section><h2>${esc(label)}</h2><div class="value">${esc(value || 'Nie podano')}</div></section>`).join('')}<div class="warn">${esc(r.disclaimer)}<br>Nie wpisuj haseł, kluczy BitLocker, numerów seryjnych klientów ani danych osobowych.</div><div class="sign"><div>Wykonał / uczestnik</div><div>Data / podpis</div></div><p class="meta no-print">Użyj funkcji drukowania przeglądarki i wybierz „Zapisz jako PDF”.</p></html>`;
  }
  function printReport(report) {
    const html = reportHtml(report); const win = window.open('', '_blank');
    if (!win) { download(`${report.id}.html`,html,'text/html;charset=utf-8'); say('Okno wydruku zablokowane; pobrano raport HTML do wydruku.',true); return; }
    win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();
  }
  function saveReport() {
    try {
      const report = makeReportData(); state.reports.unshift(report); persist(); renderReportHistory(); printReport(report); say('Raport przygotowany. W oknie drukowania wybierz „Zapisz jako PDF”.');
    } catch (error) { say(error.message, true); }
  }
  function renderReportHistory() {
    const node = document.getElementById('l40ReportHistory'); if (!node) return;
    node.innerHTML = state.reports.slice(0,10).map(x=>`<article class="l40-list-card"><div><b>${esc(x.title)}</b><small>${esc(x.id)} · ${new Date(x.createdAt).toLocaleDateString('pl-PL')}</small></div><button type="button" class="l40-btn soft" data-print-report="${esc(x.id)}">Otwórz PDF / drukuj</button></article>`).join('') || '<p class="l40-muted">Nie zapisano jeszcze żadnych raportów.</p>';
  }

  function init() {
    ROOT.querySelectorAll('[data-l40-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.l40Tab)));
    ROOT.addEventListener('click', event => {
      const open = event.target.closest('[data-open-lesson]'); if (open) { openLesson(open.dataset.openLesson); return; }
      const complete = event.target.closest('[data-complete-lesson]'); if (complete) { completeLesson(complete.dataset.completeLesson); return; }
      const first = event.target.closest('[data-open-first-lesson]'); if (first) { if (lessons()[0]) openLesson(lessons()[0].id); else say('Katalog lekcji nie jest dostępny.', true); return; }
      const bookmark = event.target.closest('[data-toggle-bookmark]'); if (bookmark) { toggleBookmark(bookmark.dataset.toggleBookmark); return; }
      const tab = event.target.closest('[data-open-tab]'); if (tab) { switchTab(tab.dataset.openTab); return; }
      const openResult = event.target.closest('[data-search-open]'); if (openResult) {
        if (openResult.dataset.searchOpen === 'courseLessons' || openResult.dataset.searchOpen === 'beginnerLessons') {
          if (openResult.dataset.searchOpen === 'courseLessons') openLesson(openResult.dataset.searchId);
          else { window.ACADEMY_OPEN_SOURCE?.('beginnerLessons', openResult.dataset.searchId); say('Materiał otwarto w katalogu kursów.'); }
        } else { window.ACADEMY_OPEN_SOURCE?.('faults', openResult.dataset.searchId); }
        return;
      }
      const chat = event.target.closest('[data-result-chat]'); if (chat) { sendToChat(`Przeanalizuj materiał „${chat.dataset.resultChat}”. Podaj bezpieczną kolejność weryfikacji i źródła dla dokładnego modelu/revizji.`); return; }
      const send = event.target.closest('[data-send-chat]'); if (send) { sendToChat($('#l40SearchInput')?.value || 'Pomóż znaleźć procedurę diagnostyczną.'); return; }
      const option = event.target.closest('[data-bench-option]'); if (option) { ROOT.querySelectorAll('.l40-option').forEach(x=>x.classList.remove('selected')); option.classList.add('selected'); return; }
      if (event.target.closest('#l40BenchSave')) { saveBench(); return; }
      const examChoice = event.target.closest('[data-select-exam]'); if (examChoice) { activeExam = examChoice.dataset.selectExam; answers = {}; examSubmitted = false; renderExams(); $('#l40ExamStage').hidden = true; return; }
      if (event.target.closest('#l40StartExam')) { startExam(); return; }
      if (event.target.closest('#l40SubmitExam')) { submitExam(); return; }
      const printCert = event.target.closest('[data-print-certificate]'); if (printCert) { printCertificate(printCert.dataset.printCertificate); return; }
      if (event.target.closest('#l40VerifyButton')) { verifyCertificate($('#l40VerifyCode')?.value || ''); return; }
      const print = event.target.closest('[data-print-report]'); if (print) { const report=state.reports.find(x=>x.id===print.dataset.printReport); if(report)printReport(report); return; }
    });
    ROOT.addEventListener('change', event => {
      const answer = event.target.closest('[data-exam-answer]'); if (answer) answers[answer.dataset.examAnswer] = Number(answer.value);
      const scenario = event.target.closest('#l40BenchScenario'); if (scenario) { activeBench = scenario.value; renderBench(); }
      const file = event.target.closest('#l40OfflineImport'); if (file?.files?.[0]) importOffline(file.files[0]);
    });
    $('#l40SearchForm')?.addEventListener('submit', event => { event.preventDefault(); renderSearch($('#l40SearchInput')?.value || ''); });
    $('#l40SearchInput')?.addEventListener('input', event => { if (event.target.value.trim().length >= 3 || !event.target.value.trim()) renderSearch(event.target.value); });
    $('#l40SearchToChat')?.addEventListener('click', () => sendToChat($('#l40SearchInput')?.value || 'Pomóż mi zdiagnozować usterkę.'));
    $('#l40AtlasSearch')?.addEventListener('input', event => searchAtlas(event.target.value));
    $('#l40ComponentSearch')?.addEventListener('input', event => renderComponents(event.target.value));
    $('#l40BoardForm')?.addEventListener('submit', saveBoard);
    $('#l40ExportOfflineJson')?.addEventListener('click', exportOfflineJson);
    $('#l40CacheDocuments')?.addEventListener('click', cacheLibraryForOffline);
    $('#l40ExportOfflineHtml')?.addEventListener('click', () => downloadOfflineHtml(makeOfflinePackage()));
    $('#l40ReportForm')?.addEventListener('submit', event => { event.preventDefault(); saveReport(); });
    $('#l40ReportFromPractice')?.addEventListener('click', fillReportFromLastPractice);
    const courseContent = document.getElementById('courseContent');
    courseContent?.addEventListener('click', event => { const card=event.target.closest('[data-course-id]'); if(card) rememberLesson(card.dataset.courseId); }, true);
    const originalOpen = window.ACADEMY_OPEN_SOURCE;
    if (typeof originalOpen === 'function' && !originalOpen.__fix40Wrapped) {
      const wrapped = function(group,id) { if (group === 'courseLessons') rememberLesson(id); return originalOpen.apply(this, arguments); };
      wrapped.__fix40Wrapped = true; window.ACADEMY_OPEN_SOURCE = wrapped;
    }
    mergeLegacyBookmarks();
    renderDashboard(); renderBench(); renderExams(); renderPracticeHistory(); renderReportHistory(); searchAtlas('');
    const online = document.getElementById('l40OfflineStatus'); if (online) online.textContent = navigator.onLine ? 'Połączenie online: aplikacja może pobrać aktualizacje. Pakiet offline działa niezależnie.' : 'Tryb offline: korzystasz z lokalnie zapisanej aplikacji i danych.';
    window.addEventListener('online', () => { if (online) online.textContent = 'Połączenie online przywrócone.'; });
    window.addEventListener('offline', () => { if (online) online.textContent = 'Brak Internetu: lokalne lekcje i pakiety nadal są dostępne.'; });
    const summary = document.getElementById('l40OfflineSummary'); if (summary && state.lastOfflineImport?.fileName) summary.textContent = `Ostatni pakiet: ${state.lastOfflineImport.fileName} · utworzony ${new Date(state.lastOfflineImport.exportedAt).toLocaleString('pl-PL')}`;
    say('Centrum Nauki FIX40 gotowe. Dane postępu i atlas własny zapisują się lokalnie.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
  window.NP_NAUKA_FIX40 = Object.freeze({ schema:SCHEMA, getState:()=>JSON.parse(JSON.stringify(state)), makeOfflinePackage, validateOfflinePackage, qrSvg, evaluateExam, mergeLegacyBookmarks, renderDashboard, renderSearch, openLesson, switchTab });
})();
