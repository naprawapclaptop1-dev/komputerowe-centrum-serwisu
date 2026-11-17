/* NAUKA OD A DO Z — FIX41 / AKADEMIA SERWISANTA PRO
 * Unified launchpad + PC assembly simulator + randomized repair fault generator.
 * Integrates existing FIX14–FIX40 labs instead of duplicating them.
 * All new measurements/parts/faults are educational simulations, not live hardware control.
 */
(() => {
  'use strict';
  const ROOT = document.getElementById('f41Stage');
  const HOST = document.getElementById('f41Academy') || document.querySelector('[data-l40-pane="academy41"]');
  if (!ROOT || !HOST || HOST.dataset.f41Ready === '1') return;
  HOST.dataset.f41Ready = '1';

  const STORE = 'npNaukaAkademiaSerwisantaFix41';
  const $ = (selector, scope = HOST) => scope.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clean = (value, max = 1200) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  const norm = value => clean(value, 10000).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const now = () => new Date().toISOString();
  const fmt = value => new Intl.NumberFormat('pl-PL').format(Number(value || 0));
  const safeParse = (raw, fallback) => { try { return JSON.parse(raw); } catch { return fallback; } };

  const DEFAULT_STATE = Object.freeze({ version: 1, xp: 0, builds: [], faultRuns: [], labRuns: [], skillChecks: [], lessonLaunches: [], challengeLaunches: [], savedBoard: { boardId:'EDU-NB-041', revision:'A1', selectedPart:'VRM', layer:'components' }, lastFaultId: '' });
  function normalizeState(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const array = (key, max = 200) => Array.isArray(source[key]) ? source[key].filter(x => x && typeof x === 'object' && !Array.isArray(x)).slice(0, max) : [];
    const board = source.savedBoard && typeof source.savedBoard === 'object' ? source.savedBoard : {};
    return {
      version: 1,
      xp: Number.isSafeInteger(source.xp) && source.xp >= 0 ? Math.min(source.xp, 10000000) : 0,
      builds: array('builds', 100), faultRuns: array('faultRuns', 250), labRuns: array('labRuns', 200),
      skillChecks: array('skillChecks', 100), lessonLaunches: array('lessonLaunches', 250), challengeLaunches: array('challengeLaunches', 250),
      savedBoard: { boardId: clean(board.boardId || 'EDU-NB-041', 80), revision: clean(board.revision || 'A1', 40), selectedPart: ['DCIN','FUSE','VRM','RAM','BIOS','EC','GPU','NVME'].includes(board.selectedPart) ? board.selectedPart : 'VRM', layer: ['power','signal','components'].includes(board.layer) ? board.layer : 'components' },
      lastFaultId: clean(source.lastFaultId || '', 80)
    };
  }
  let state = (() => {
    try { return normalizeState(safeParse(localStorage.getItem(STORE) || '{}', {})); }
    catch { return normalizeState({}); }
  })();
  let activeTab = 'overview';
  let activeFault = null;
  let challengeTimer = null;
  let challengeSession = null;
  let searchResults = [];

  function persist() {
    state.builds = state.builds.slice(0, 100);
    state.faultRuns = state.faultRuns.slice(0, 250);
    state.labRuns = state.labRuns.slice(0, 200);
    state.skillChecks = state.skillChecks.slice(0, 100);
    state.lessonLaunches = state.lessonLaunches.slice(0, 250);
    state.challengeLaunches = state.challengeLaunches.slice(0, 250);
    try { localStorage.setItem(STORE, JSON.stringify(state)); return true; }
    catch (error) { status(`Nie udało się zapisać postępu: ${error?.message || 'brak miejsca'}. Wyeksportuj kopię danych.`, true); return false; }
  }
  function status(message, bad = false) {
    const node = document.getElementById('f41Status');
    if (node) { node.textContent = message; node.classList.toggle('is-error', !!bad); node.classList.toggle('is-good', !bad); }
  }
  function addXp(points, reason) {
    const amount = Math.max(0, Math.min(500, Number(points) || 0));
    state.xp = Math.min(10000000, state.xp + amount);
    persist(); renderStats();
    status(`+${amount} XP · ${reason}`);
  }
  function renderStats() {
    const values = {
      f41Xp: state.xp,
      f41Builds: state.builds.length,
      f41Faults: state.faultRuns.length,
      f41Skills: state.skillChecks.length + state.labRuns.filter(x => x.passed).length + state.challengeLaunches.filter(x => x.passed).length
    };
    Object.entries(values).forEach(([id, value]) => { const node = document.getElementById(id); if (node) node.textContent = fmt(value); });
  }

  const CPU = {
    i5_12400: { label:'Intel Core i5-12400', socket:'LGA1700', tdp:65, memory:['DDR4','DDR5'], family:'Intel Core 12. gen.' },
    i5_13600k: { label:'Intel Core i5-13600K', socket:'LGA1700', tdp:125, memory:['DDR4','DDR5'], family:'Intel Core 13. gen.' },
    r5_5600: { label:'AMD Ryzen 5 5600', socket:'AM4', tdp:65, memory:['DDR4'], family:'AMD Ryzen 5000' },
    r7_7800x3d: { label:'AMD Ryzen 7 7800X3D', socket:'AM5', tdp:120, memory:['DDR5'], family:'AMD Ryzen 7000' }
  };
  const BOARD = {
    b660_d4: { label:'B660 / LGA1700 / DDR4', socket:'LGA1700', memory:'DDR4', slots:4, m2:2 },
    b760_d5: { label:'B760 / LGA1700 / DDR5', socket:'LGA1700', memory:'DDR5', slots:4, m2:2 },
    b550: { label:'B550 / AM4 / DDR4', socket:'AM4', memory:'DDR4', slots:4, m2:2 },
    b650: { label:'B650 / AM5 / DDR5', socket:'AM5', memory:'DDR5', slots:4, m2:2 }
  };
  const RAM = {
    ddr4_16: { label:'16 GB DDR4 (2×8)', type:'DDR4', capacity:16 },
    ddr4_32: { label:'32 GB DDR4 (2×16)', type:'DDR4', capacity:32 },
    ddr5_32: { label:'32 GB DDR5 (2×16)', type:'DDR5', capacity:32 },
    ddr5_64: { label:'64 GB DDR5 (2×32)', type:'DDR5', capacity:64 }
  };
  const GPU = {
    none: { label:'Zintegrowana / brak osobnej GPU', tdp:0, suggestedPsu:0 },
    rtx4060: { label:'NVIDIA GeForce RTX 4060 (klasa EDU)', tdp:115, suggestedPsu:550 },
    rtx4070s: { label:'NVIDIA GeForce RTX 4070 SUPER (klasa EDU)', tdp:220, suggestedPsu:650 },
    rx7600: { label:'AMD Radeon RX 7600 (klasa EDU)', tdp:165, suggestedPsu:550 },
    rx7900xtx: { label:'AMD Radeon RX 7900 XTX (klasa EDU)', tdp:355, suggestedPsu:800 }
  };
  const PSU = { p450:450, p550:550, p650:650, p750:750, p850:850, p1000:1000 };
  const STORAGE = { nvme1:'NVMe PCIe 4.0 · 1 TB', nvme2:'NVMe PCIe 4.0 · 2 TB', sata:'SATA SSD · 1 TB' };
  const DEFAULT_BUILD = Object.freeze({ cpu:'i5_12400', board:'b660_d4', ram:'ddr4_32', gpu:'rtx4060', psu:'p650', storage:'nvme1' });
  function calculateAssembly(input = {}) {
    const selected = { ...DEFAULT_BUILD, ...(input && typeof input === 'object' ? input : {}) };
    const cpu = CPU[selected.cpu], board = BOARD[selected.board], ram = RAM[selected.ram], gpu = GPU[selected.gpu], psu = PSU[selected.psu];
    if (!cpu || !board || !ram || !gpu || !Number.isFinite(psu) || !STORAGE[selected.storage]) throw new Error('Wybierz poprawne pozycje katalogu symulatora.');
    const issues = [];
    if (cpu.socket !== board.socket) issues.push(`Niezgodne gniazdo: CPU ${cpu.socket}, płyta ${board.socket}.`);
    if (ram.type !== board.memory) issues.push(`Niezgodna generacja RAM: moduły ${ram.type}, płyta ${board.memory}.`);
    if (!cpu.memory.includes(board.memory)) issues.push(`Kontroler pamięci procesora nie obsługuje ${board.memory} w tym profilu.`);
    const estimate = Math.ceil((cpu.tdp + gpu.tdp + 120) / 50) * 50;
    const recommended = Math.max(gpu.suggestedPsu || 0, estimate);
    if (psu < recommended) issues.push(`Moc PSU ${psu} W jest poniżej uproszczonego budżetu treningowego ${recommended} W.`);
    const warnings = [
      'To uproszczony model edukacyjny, a nie certyfikacja kompatybilności.',
      'Przed zakupem sprawdź listę CPU Support/QVL, wersję BIOS, format płyty, chłodzenie, długość GPU, złącza i wymagania producentów.',
      'Szacowanie PSU nie zastępuje kalkulacji producenta ani oceny jakości konkretnego zasilacza.'
    ];
    return { selected, cpu:cpu.label, board:board.label, ram:ram.label, gpu:gpu.label, psu, estimate, recommended, issues, warnings, compatible:issues.length===0 };
  }

  const FAULTS = [
    { id:'no-post-ram', title:'Brak POST — kontrolka DRAM', category:'RAM / POST', symptoms:'Komputer zatrzymuje się na etapie pamięci. Nie ma jeszcze potwierdzenia uszkodzenia modułu.', options:['Zmienić napięcie RAM na maksymalne','Zapisać kod POST i testować jeden znany sprawny moduł w zalecanym slocie','Od razu wymienić CPU','Wgrać przypadkowy BIOS'], answer:1, first:'Zapisz kod POST, konfigurację oraz dokładny model i rewizję płyty.', steps:['Zapis kodu POST/LED i konfiguracji DIMM.','Sprawdzenie typu DDR i obsługi modułów w dokumentacji płyty.','Test pojedynczego modułu w zalecanym slocie, bez zmieniania wielu parametrów naraz.','Zapis porównania slot/moduł i kontrola ustawień bazowych.'], why:'Pojedyncza znana konfiguracja pozwala odróżnić moduł, slot, ustawienia i kontroler pamięci.' },
    { id:'usb-c-charge', title:'Laptop nie ładuje przez USB-C', category:'USB-C / ładowanie', symptoms:'Zasilacz USB-C jest wykrywany niestabilnie. Brak potwierdzonego profilu PD i dokładnego modelu.', options:['Zewrzeć linie CC, aby wymusić ładowanie','Ustalić model zasilacza, kabel, profil PD i stan portu według dokumentacji','Wymienić kontroler bez pomiarów','Podłączyć zasilacz o dowolnie wyższym napięciu'], answer:1, first:'Zidentyfikuj model laptopa, zasilacz, kabel i obsługiwane profile USB Power Delivery.', steps:['Zapisanie objawu i konfiguracji zasilacz/kabel/port.','Oględziny portu i ocena ryzyka mechanicznego lub zalania.','Weryfikacja obsługiwanych profili PD i procedury OEM.','Dopiero potem kontrolowane testy zgodne z dokumentacją.'], why:'USB-C PD negocjuje profile. Nie wolno wymuszać napięcia przez zwieranie linii ani dobierać go na chybił trafił.' },
    { id:'nvme-drop', title:'Dysk NVMe znika z systemu', category:'SSD / dane', symptoms:'Nośnik okresowo znika, a na nim mogą znajdować się ważne dane.', options:['Uruchomić długi test zapisu','Sformatować partycję','Ograniczyć zapisy i zabezpieczyć dane na innym nośniku','Zaktualizować firmware bez backupu'], answer:2, first:'Zabezpiecz dane i ogranicz zbędne operacje na źródłowym nośniku.', steps:['Ustalenie wartości danych i przerwanie niepotrzebnych zapisów.','Zapis modelu, temperatury, SMART i zdarzeń bez wymuszania obciążenia.','Wykonanie kopii/obrazu odpowiednią metodą, jeśli nośnik pozwala.','Dalsza analiza na kopii oraz porównanie gniazda i firmware według OEM.'], why:'Ochrona danych ma pierwszeństwo. Intensywne testy i zapisy mogą pogorszyć stan nośnika.' },
    { id:'thermal', title:'Laptop przegrzewa się i zwalnia', category:'Chłodzenie / throttling', symptoms:'Temperatura rośnie, a taktowanie spada. Nie ustalono jeszcze, czy problem dotyczy przepływu powietrza, wentylatora, czy czujnika.', options:['Podnieść napięcie CPU','Sprawdzić logi, warunki obciążenia, wentylator, drożność i docisk zgodnie z serwisówką','Wyłączyć zabezpieczenia termiczne','Wymienić płytę główną'], answer:1, first:'Zapisz model, profil obciążenia, temperatury i zachowanie wentylatorów.', steps:['Porównanie temperatur w spoczynku i pod powtarzalnym, kontrolowanym obciążeniem.','Inspekcja drożności układu chłodzenia i pracy wentylatora.','Weryfikacja montażu, materiałów termicznych i serwisówki modelu.','Test końcowy oraz porównanie z warunkami początkowymi.'], why:'Najpierw potwierdź przyczynę i warunki pomiaru. Nie wyłączaj ochrony termicznej i nie dobieraj padów bez danych modelu.' },
    { id:'gpu-artifacts', title:'Artefakty obrazu w grach', category:'GPU / obraz', symptoms:'Pojawiają się kolorowe piksele lub migotanie. Nie wiadomo, czy źródłem jest GPU, kabel, monitor, sterownik czy niestabilne ustawienia.', options:['Od razu wykonać reballing GPU','Zacząć od kabla, portu, monitora, ustawień fabrycznych i logów sterownika','Maksymalnie zwiększyć taktowanie VRAM','Wyłączyć wentylatory'], answer:1, first:'Sprawdź tor wyświetlania i zapisz, czy objaw występuje także poza systemem/gra.', steps:['Zapis warunków: aplikacja, rozdzielczość, odświeżanie i czas wystąpienia.','Kontrolowany test innego kabla/portu/wyświetlacza.','Powrót do ustawień fabrycznych i sprawdzenie sterownika/logów.','Test sprzętu wyłącznie według procedury producenta, jeśli objaw pozostaje.'], why:'Najpierw wyklucz tor sygnałowy i ustawienia. Artefakty nie są same w sobie dowodem uszkodzenia VRAM.' },
    { id:'no-power', title:'Laptop bez reakcji na przycisk Power', category:'Zasilanie / start', symptoms:'Brak widocznej reakcji po wciśnięciu przycisku. Brakuje pomiarów i identyfikacji rewizji płyty.', options:['Wymienić układ EC bez sprawdzenia','Potwierdzić model, zasilacz, gniazdo i objaw; udokumentować inspekcję','Zewrzeć losowe punkty na płycie','Wykonać pomiar rezystancji przy podłączonej baterii'], answer:1, first:'Zapisz dokładny model, adapter i objaw. Zanim mierzysz rezystancję — odłącz wszystkie źródła energii zgodnie z OEM.', steps:['Identyfikacja urządzenia, adaptera i rewizji płyty.','Oględziny złącza, przewodów i śladów cieczy/termiki.','Kontrola bezpieczników i obwodów tylko według schematu dokładnej płyty.','Porównanie pomiarów z dokumentacją i zapis w raporcie.'], why:'Bez dokładnego Board ID i warunków zasilania nie można przypisywać napięć ani wskazywać uszkodzonego układu.' },
    { id:'usb-overcurrent', title:'Port USB wyłącza komputer', category:'USB / zabezpieczenie', symptoms:'Po podłączeniu jednego urządzenia system zgłasza błąd portu lub wyłącza zasilanie portu.', options:['Wielokrotnie podłączać urządzenie, aby odtworzyć błąd','Odłączyć urządzenie, sprawdzić uszkodzenia mechaniczne i logi, a następnie postępować według OEM','Mostkować zabezpieczenie prądowe','Zwiększyć limit prądu bez dokumentacji'], answer:1, first:'Odłącz podejrzane urządzenie i nie powtarzaj prób, dopóki nie oceniono portu.', steps:['Zapis komunikatu i urządzenia peryferyjnego.','Oględziny portu bez podawania zasilania i kontrola obcych przedmiotów.','Porównanie zachowania z bezpiecznym, znanym sprawnym urządzeniem po inspekcji.','Weryfikacja zabezpieczenia i dokumentacji płyty.'], why:'Zabezpieczenia chronią port i płytę. Nie wolno ich mostkować ani wymuszać większego prądu.' },
    { id:'bios-boot', title:'Komputer nie startuje po aktualizacji BIOS', category:'BIOS / UEFI', symptoms:'Brak prawidłowego startu po aktualizacji. Nie wiadomo, czy obraz był zgodny i czy zapis zakończył się poprawnie.', options:['Wgrać dowolny plik o tym samym rozmiarze','Najpierw ustalić model/Board ID/rewizję i zachować oryginalny backup oraz logi','Zmienić regiony firmware ręcznie bez analizy','Powtarzać flashowanie bez sprawdzenia zasilania'], answer:1, first:'Zidentyfikuj dokładny wariant płyty i zachowaj oryginalny odczyt oraz informacje o przebiegu aktualizacji.', steps:['Identyfikacja platformy, Board ID, rewizji i kości.','Zachowanie oryginalnego pliku i policzenie SHA-256.','Porównanie pliku i regionów bez modyfikacji.','Wybór wyłącznie oficjalnej procedury odzyskiwania producenta.'], why:'Nazwa, rozmiar i hash nie potwierdzają zgodności. FIX41 nie wykonuje programowania ani modyfikacji wsadu.' }
  ];

  function evaluateFault(faultId, chosenIndex) {
    const item = FAULTS.find(x => x.id === faultId);
    if (!item) throw new Error('Nieznany scenariusz generatora usterek.');
    const index = Number(chosenIndex);
    if (!Number.isInteger(index) || index < 0 || index >= item.options.length) return { complete:false, correct:false, score:0, explanation:'Wybierz jedną odpowiedź przed oceną.' };
    const correct = index === item.answer;
    return { complete:true, correct, score:correct ? 100 : 0, explanation:item.why, nextStep:item.first, steps:item.steps };
  }

  function evaluateMeasurement({ scenario = 'adapter', mode = 'voltage', value, powerState = 'isolated' } = {}) {
    const profiles = {
      adapter: { title:'Wejście adaptera — scenariusz EDU', mode:'voltage', unit:'V', expected:19.5, min:19, max:20, requiredState:'powered', label:'Przykładowe wejście DC' },
      standby: { title:'Linia standby — scenariusz EDU', mode:'voltage', unit:'V', expected:3.3, min:3.2, max:3.4, requiredState:'powered', label:'Przykładowa linia standby' },
      resistance: { title:'Rezystancja odłączonego obwodu — EDU', mode:'resistance', unit:'Ω', expected:14, min:10, max:18, requiredState:'isolated', label:'Obwód treningowy bez zasilania' },
      continuity: { title:'Ciągłość obwodu — EDU', mode:'continuity', unit:'Ω', expected:0.4, min:0, max:0.8, requiredState:'isolated', label:'Tor treningowy bez zasilania' }
    };
    const item = profiles[scenario];
    if (!item) throw new Error('Nieznany profil pomiarowy.');
    if (mode !== item.mode) return { complete:false, safe:false, passed:false, message:`Dla tego ćwiczenia wybierz tryb ${item.mode}.` };
    if ((mode === 'resistance' || mode === 'continuity') && powerState !== 'isolated') return { complete:false, safe:false, passed:false, message:'STOP: rezystancję i ciągłość ćwicz wyłącznie na odłączonym, bezpiecznie rozładowanym obwodzie.' };
    if (mode === 'voltage' && powerState !== 'powered') return { complete:false, safe:false, passed:false, message:'Dla tego symulowanego pomiaru napięcia wybierz stan „zasilany”. Nie wykonuj tego na prawdziwym urządzeniu bez właściwej procedury.' };
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return { complete:false, safe:true, passed:false, message:'Wpisz poprawną, nieujemną wartość.' };
    const passed = numeric >= item.min && numeric <= item.max;
    return { complete:true, safe:true, passed, expected:item.expected, min:item.min, max:item.max, unit:item.unit, message:passed ? `Wynik mieści się w przedziale symulacji EDU ${item.min}–${item.max} ${item.unit}.` : `Wynik poza przedziałem symulacji EDU ${item.min}–${item.max} ${item.unit}.` };
  }

  function searchKnowledge(query, limit = 12) {
    const q = norm(query);
    if (q.length < 2) return [];
    const data = window.ACADEMY_DATA || {};
    const sources = [];
    const add = (group, items, titleKey = 'title') => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const title = clean(item[titleKey] || item.name || item.term || item.id || 'Materiał', 180);
        const body = [item.description, item.text, item.content, item.symptom, item.solution, item.procedure, item.steps, item.category, item.tags, item.boardId, item.model].flat(Infinity).filter(Boolean).join(' ');
        const haystack = norm(`${title} ${body}`);
        const score = q.split(/\s+/).reduce((total, part) => total + (haystack.includes(part) ? (title.toLowerCase().includes(part) ? 4 : 1) : 0), 0);
        if (score > 0) sources.push({ group, id:String(item.id ?? title), title, category:clean(item.category || group,80), excerpt:clean(body,650), score });
      });
    };
    add('courseLessons', data.courseLessons);
    add('beginnerLessons', data.beginnerLessons);
    add('faults', data.faults);
    add('methods', window.ACADEMY_REPAIR_METHODS);
    add('components', window.ACADEMY_COMPONENTS?.components);
    add('models', (window.ACADEMY_DEVICE_CATALOG?.brands || []).flatMap(brand => (brand.models || []).map(model => ({ id:`${brand.brand || brand.name || 'brand'}-${model[1] || model[0]}`, title:`${brand.brand || brand.name || ''} ${model[1] || model[0]}`, category:'Model / producent', description:`Rodzina: ${model[0] || ''}; typ: ${model[2] || ''}` }))));
    const unique = new Map();
    sources.sort((a,b) => b.score-a.score || a.title.localeCompare(b.title,'pl'));
    for (const item of sources) { const key=`${item.group}:${item.id}`; if (!unique.has(key)) unique.set(key,item); if (unique.size>=limit) break; }
    return [...unique.values()];
  }

  function evaluateChallenge(answers, correct) {
    if (!Array.isArray(answers) || !Array.isArray(correct) || answers.length !== correct.length || !answers.length) return { complete:false, score:0, percent:0, passed:false };
    const score = answers.reduce((sum,value,index) => sum + (Number(value) === Number(correct[index]) ? 1 : 0), 0);
    const percent = Math.round(score / correct.length * 100);
    return { complete:true, score, total:correct.length, percent, passed:percent >= 75 };
  }

  function dashboardTemplate() {
    return `<div class="f41-overview-grid">
      <article class="f41-welcome"><span class="f41-kicker">TWOJA ŚCIEŻKA TECHNIKA</span><h3>Od pierwszego pomiaru do diagnozy płyty.</h3><p>Wybierz moduł. Nowe symulatory zapisują postęp lokalnie, a laboratoria z wcześniejszych wersji pozostają dostępne bez ich kopiowania.</p><div class="f41-button-row"><button type="button" class="f41-btn primary" data-f41-tab-go="assembly">Złóż komputer →</button><button type="button" class="f41-btn secondary" data-f41-tab-go="faults">Wylosuj usterkę →</button></div></article>
      <article class="f41-card f41-card-focus"><span class="f41-kicker">NOWY SYMULATOR / PC BUILD</span><b>Konfigurator komputera</b><p>Socket, generacja RAM, szacowany budżet mocy i ostrzeżenia zgodności.</p><button class="f41-btn secondary" data-f41-tab-go="assembly">Otwórz konfigurator ↗</button></article>
      <article class="f41-card"><span class="f41-kicker">NOWY SYSTEM / FAULT ENGINE</span><b>Generator przypadków</b><p>Losowe objawy, wybór pierwszego kroku, uzasadnienie i wynik punktowy.</p><button class="f41-btn secondary" data-f41-tab-go="faults">Rozpocznij diagnozę ↗</button></article>
      </div>
      <div class="f41-section-title"><div><span class="f41-kicker">ZINTEGROWANE LABORATORIA FIX14–FIX40</span><h3>Otwórz istniejące moduły akademii</h3><p>Każdy skrót przechodzi do wcześniejszego, pełnego modułu — bez zdublowanych atrap.</p></div></div>
      <div class="f41-launch-grid">
        ${[['pcb','▦','3D Motherboard Lab','Interaktywna mapa PCB, obrót, warstwy, komponenty i inspektor.','pcb'],['schematic','⌘','Schematy / BoardView','Własne dokumenty PDF i obrazy, znaczniki oraz notatki.','schematic'],['electronics','⚗','Laboratorium elektroniki','Multimetr, oscyloskop, laboratoria pomiarowe, ESD i lutowanie.','electronics'],['bios','▣','Akademia BIOS / UEFI','Odczyt tylko do odczytu, SHA-256, porównanie wsadów i procedury.','bios'],['challenge','⚒','Repair Challenge','Scenariusze diagnostyczne, decyzje, wynik i historia lokalna.','challenge'],['solder','⌁','SMD / BGA / reballing','Ćwiczenia, procedury, jakość lutowania i bezpieczeństwo.','solder'],['exams','✓','Egzaminy / certyfikaty','Testy, próg zaliczenia, lokalne certyfikaty i weryfikacja.','exams'],['courses','A–Z','Kursy i lekcje','Pełny katalog kursów, ścieżki od podstaw po zaawansowane naprawy.','courses'],['repair-ai','✦','Repair Master AI','Przekazanie kontekstu diagnostycznego do istniejącego asystenta.','repairAi'],['components','◈','Atlas komponentów','Encyklopedia układów, oznaczeń, funkcji i objawów.','components']].map(([id,icon,title,desc,route])=>`<article class="f41-launch-card"><span class="f41-launch-icon">${icon}</span><div><b>${title}</b><p>${desc}</p></div><button type="button" class="f41-btn secondary" data-f41-go="${route}">Otwórz ↗</button></article>`).join('')}
      </div>
      <div class="f41-progress-strip"><div><span class="f41-kicker">TWOJE OSIĄGNIĘCIA</span><b>${fmt(state.xp)} XP</b><p>Poziom ${Math.floor(state.xp / 250) + 1} · każdy poprawny przypadek, ćwiczenie i zapis konfiguracji rozwija profil nauki.</p></div><button type="button" class="f41-btn secondary" data-f41-go="reports">Otwórz raporty / PDF ↗</button></div>`;
  }

  function assemblyTemplate() {
    const opts = (items, selected) => Object.entries(items).map(([id,item]) => `<option value="${id}" ${selected===id?'selected':''}>${esc(item.label || item)}</option>`).join('');
    const previous = state.builds[0]?.config || DEFAULT_BUILD;
    return `<div class="f41-section-title"><div><span class="f41-kicker">PC ASSEMBLY SIMULATOR / COMPATIBILITY TRAINING</span><h3>Zbuduj komputer krok po kroku</h3><p>Dobierz procesor, płytę, RAM, kartę graficzną, zasilacz i nośnik. Sprawdź logiczne konflikty oraz uproszczony budżet mocy.</p></div></div>
      <div class="f41-safety compact"><b>Ważne:</b> symulator obejmuje ograniczony katalog szkoleniowy. Nie zastępuje QVL, listy obsługi CPU, wymagań BIOS, wymiarów obudowy ani zaleceń producentów.</div>
      <form id="f41AssemblyForm" class="f41-form-grid">
        <label>Procesor<select name="cpu">${opts(CPU, previous.cpu)}</select><small>Socket i TDP z profilu EDU.</small></label>
        <label>Płyta główna<select name="board">${opts(BOARD, previous.board)}</select><small>Socket / rodzaj pamięci / liczba gniazd.</small></label>
        <label>Pamięć RAM<select name="ram">${opts(RAM, previous.ram)}</select><small>Generacja musi odpowiadać płycie.</small></label>
        <label>Karta graficzna<select name="gpu">${opts(GPU, previous.gpu)}</select><small>Uproszczony pobór mocy w profilu.</small></label>
        <label>Zasilacz<select name="psu">${Object.entries(PSU).map(([id,w])=>`<option value="${id}" ${previous.psu===id?'selected':''}>${w} W</option>`).join('')}</select><small>Wartość nominalna — jakość i linie wymagają osobnej oceny.</small></label>
        <label>Nośnik<select name="storage">${opts(STORAGE, previous.storage)}</select><small>Przed zakupem potwierdź obsługiwany interfejs i format.</small></label>
        <div class="f41-actions full"><button type="submit" class="f41-btn primary">Sprawdź kompatybilność →</button><button type="button" id="f41SaveBuild" class="f41-btn secondary">Zapisz konfigurację</button><button type="button" id="f41ResetBuild" class="f41-btn ghost">Przywróć przykład</button></div>
      </form><div id="f41AssemblyResult" class="f41-result" aria-live="polite">Zmień elementy lub uruchom kontrolę, aby zobaczyć wynik.</div>
      <div class="f41-build-history"><h4>Ostatnie zapisane konfiguracje</h4>${state.builds.slice(0,8).map(b=>`<div class="f41-history-row"><span><b>${esc(b.title || b.config?.cpu || 'Konfiguracja')}</b><small>${new Date(b.createdAt).toLocaleString('pl-PL')} · ${b.result?.compatible?'bez konfliktów w modelu EDU':'wymaga poprawy'}</small></span><strong>${b.result?.recommended || '—'} W</strong></div>`).join('') || '<p class="l40-muted">Nie zapisano konfiguracji.</p>'}</div>`;
  }

  function faultTemplate() {
    const item = activeFault || FAULTS[0];
    return `<div class="f41-section-title"><div><span class="f41-kicker">FAULT GENERATOR PRO / RANDOM CASE</span><h3>Wylosuj realistyczny przypadek diagnostyczny</h3><p>Każdy scenariusz uczy bezpiecznej kolejności, a nie przypadkowej wymiany części.</p></div><button type="button" class="f41-btn primary" id="f41NewFault">Losuj kolejną usterkę ↻</button></div>
      <div class="f41-fault-layout"><article class="f41-fault-card"><div class="f41-fault-meta"><span>${esc(item.category)}</span><span>PRZYPADEK EDU · ${esc(item.id.toUpperCase())}</span></div><h4>${esc(item.title)}</h4><p>${esc(item.symptoms)}</p><div class="f41-first-step"><b>Pierwsza wskazówka</b><p>Przed rozpoczęciem zapisz model urządzenia, dokładny objaw i dostępne źródła dokumentacji.</p></div><h5>Wybierz najlepszy następny krok</h5><div class="f41-choice-list">${item.options.map((option,index)=>`<label class="f41-choice"><input type="radio" name="f41FaultChoice" value="${index}"><span>${esc(option)}</span></label>`).join('')}</div><button type="button" class="f41-btn primary" id="f41CheckFault">Sprawdź diagnozę →</button><div id="f41FaultFeedback" class="f41-feedback" aria-live="polite"></div></article><aside class="f41-fault-aside"><span class="f41-kicker">HISTORIA GENERATORA</span><h4>Twoje wyniki</h4><div class="f41-big-number">${state.faultRuns.length}</div><p>rozwiązanych prób</p><div class="f41-history-list">${state.faultRuns.slice(0,8).map(run=>`<div><b>${esc(run.title)}</b><small>${run.correct?'Poprawna odpowiedź':'Do powtórki'} · ${new Date(run.at).toLocaleDateString('pl-PL')}</small></div>`).join('') || '<p class="l40-muted">Brak prób — zacznij od nowego przypadku.</p>'}</div></aside></div>`;
  }

  function knowledgeTemplate() {
    return `<div class="f41-section-title"><div><span class="f41-kicker">KNOWLEDGE CENTER 360°</span><h3>Jedna wyszukiwarka całej Akademii</h3><p>Przeszukuj lokalne lekcje, przypadki, procedury napraw, komponenty oraz katalog modeli.</p></div></div>
      <form id="f41KnowledgeForm" class="f41-search-form"><input id="f41KnowledgeQuery" type="search" maxlength="180" placeholder="np. MOSFET, brak POST, BIOS, USB-C, NVMe…" aria-label="Szukaj w bazie wiedzy"><button class="f41-btn primary" type="submit">Szukaj →</button></form>
      <div id="f41KnowledgeCount" class="f41-search-count">Lokalne źródła Akademii. Wyszukanie nie potwierdza diagnozy ani kompatybilności.</div>
      <div id="f41KnowledgeResults" class="f41-knowledge-results"><p class="l40-muted">Wpisz minimum dwa znaki, aby zobaczyć dopasowania.</p></div>
      <div class="f41-launch-strip"><button type="button" class="f41-btn secondary" data-f41-go="courses">Pełny katalog kursów ↗</button><button type="button" class="f41-btn secondary" data-f41-go="components">Encyklopedia komponentów ↗</button><button type="button" class="f41-btn secondary" data-f41-go="masterSearch">Centrum Praktyki / wyszukiwarka ↗</button></div>`;
  }

  function challengeTemplate() {
    const recent = state.challengeLaunches.slice(0,5);
    return `<div class="f41-section-title"><div><span class="f41-kicker">REPAIR CHALLENGE / PRACTICAL EXAM</span><h3>Wirtualna sala napraw</h3><p>Rozwiązuj scenariusze diagnostyczne pod presją czasu. Oceniana jest kolejność decyzji, bezpieczeństwo oraz ochrona danych — nie szybkość zgadywania.</p></div><button type="button" class="f41-btn primary" id="f41ChallengeStart">Rozpocznij wyzwanie 90 s →</button></div>
      <div class="f41-safety compact"><b>Zasada:</b> wszystkie scenariusze są edukacyjne i używają danych przykładowych. W realnym serwisie zawsze sprawdzaj procedurę i dokumentację dokładnego modelu.</div>
      <div id="f41ChallengeStage" class="f41-challenge-stage"><div class="f41-empty"><b>Gotowy na zadanie?</b><p>Masz 90 sekund na trzy decyzje diagnostyczne. Możesz przerwać i wrócić później — wynik zostanie zapisany po zakończeniu próby.</p></div></div>
      <div class="f41-history-list"><h4>Ostatnie wyzwania</h4>${recent.map(item=>`<div><b>${esc(item.title)}</b><small>${item.score}/${item.total} · ${item.percent}% · ${item.passed?'zaliczone':'do powtórki'} · ${new Date(item.at).toLocaleString('pl-PL')}</small></div>`).join('') || '<p class="l40-muted">Nie rozegrano jeszcze wyzwań.</p>'}</div>`;
  }

  function progressTemplate() {
    const target = Math.max(250, (Math.floor(state.xp / 250) + 1) * 250);
    const level = Math.floor(state.xp / 250) + 1;
    const progress = Math.min(100, Math.round((state.xp % 250) / 250 * 100));
    const recent = [
      ...state.faultRuns.slice(0,4).map(x=>({title:`Usterka: ${x.title}`,detail:x.correct?'poprawna diagnoza':'do powtórki',at:x.at})),
      ...state.labRuns.slice(0,4).map(x=>({title:`Pomiar: ${x.title}`,detail:x.passed?'zaliczony':'do powtórki',at:x.at})),
      ...state.challengeLaunches.slice(0,4).map(x=>({title:`Wyzwanie: ${x.title}`,detail:`${x.percent}%`,at:x.at})),
      ...state.builds.slice(0,4).map(x=>({title:`Konfiguracja: ${x.title}`,detail:x.result?.compatible?'bez konfliktów w modelu EDU':'wymaga korekty',at:x.createdAt}))
    ].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,10);
    return `<div class="f41-section-title"><div><span class="f41-kicker">STUDENT DEVELOPMENT / SKILL TREE</span><h3>Centrum rozwoju ucznia</h3><p>Wyniki nowych ćwiczeń FIX41 zapisują się lokalnie w tej przeglądarce. Starsze kursy nadal przechowują swoje postępy we własnych modułach.</p></div></div>
      <div class="f41-progress-panel"><div><span class="f41-kicker">POZIOM TECHNIKA</span><strong>${level}</strong><p>${fmt(state.xp)} XP · ${Math.max(0,target-state.xp)} XP do następnego poziomu</p><div class="f41-progress-track"><i style="width:${progress}%"></i></div></div><div class="f41-progress-metrics"><span><b>${state.builds.length}</b> konfiguracje PC</span><span><b>${state.faultRuns.length}</b> diagnozy</span><span><b>${state.labRuns.length}</b> pomiary</span><span><b>${state.challengeLaunches.length}</b> wyzwania</span><span><b>${state.skillChecks.length}</b> checklisty / lekcje</span></div></div>
      <div class="f41-section-title"><div><span class="f41-kicker">HISTORIA PRAKTYKI</span><h3>Ostatnie aktywności</h3></div></div>
      <div class="f41-history-list">${recent.map(item=>`<div><b>${esc(item.title)}</b><small>${esc(item.detail)} · ${item.at?new Date(item.at).toLocaleString('pl-PL'):'—'}</small></div>`).join('') || '<p class="l40-muted">Rozpocznij pierwszą lekcję, pomiar lub diagnozę, aby zobaczyć tu historię.</p>'}</div>
      <div class="f41-launch-strip"><button class="f41-btn secondary" type="button" data-f41-tab-go="faults">Wylosuj usterkę</button><button class="f41-btn secondary" type="button" data-f41-tab-go="lab">Wykonaj pomiar EDU</button><button class="f41-btn secondary" type="button" data-f41-tab-go="challenge">Rozpocznij wyzwanie</button><button class="f41-btn secondary" type="button" data-f41-go="reports">Utwórz raport PDF</button></div>`;
  }

  function teacherTemplate() {
    return `<div class="f41-section-title"><div><span class="f41-kicker">ADAPTIVE TECHNICIAN / LOCAL KNOWLEDGE + CHAT BRIDGE</span><h3>Nauczyciel AI i plan następnego kroku</h3><p>Najpierw szuka w lokalnej bazie, pokazuje materiał źródłowy i wskazuje brakujące dane. Dopiero po Twoim kliknięciu przekazuje opis do istniejącego czatu AI.</p></div></div>
      <div class="f41-teacher-layout"><section class="f41-teacher-card"><label>Opisz problem lub temat<input id="f41TeacherQuestion" maxlength="240" placeholder="Np. laptop nie reaguje na Power, świeci LED ładowania…"></label><label>Poziom nauki<select id="f41TeacherLevel"><option value="beginner">Początkujący</option><option value="intermediate">Średniozaawansowany</option><option value="advanced">Zaawansowany</option></select></label><button type="button" class="f41-btn primary" id="f41AskTeacher">Przygotuj lekcję i plan →</button><div id="f41TeacherAnswer" class="f41-teacher-answer" aria-live="polite">Nauczyciel przeanalizuje opis względem lokalnej bazy materiałów. Bez dopasowania poprosi o model, Board ID, rewizję i źródło.</div></section>
      <aside class="f41-teacher-card"><span class="f41-kicker">INDYWIDUALNA ŚCIEŻKA</span><h4>Co warto zrobić dalej</h4><ol><li>Najpierw zidentyfikuj urządzenie i rewizję płyty.</li><li>Oddziel potwierdzone fakty od hipotez.</li><li>Wybierz odwracalny test o najmniejszym ryzyku.</li><li>Zapisz warunki i źródło każdego pomiaru.</li><li>Potwierdź wynik testem końcowym.</li></ol><p class="f41-note">Tryb lokalny nie jest generatywnym modelem AI. Generatywny czat otwiera się tylko na wyraźne żądanie.</p></aside></div>`;
  }

  function setTab(tab) {
    const allowed = ['overview','assembly','faults','board','lab','challenge','bios','solder','knowledge','teacher','progress'];
    if (!allowed.includes(tab)) return;
    activeTab = tab;
    HOST.querySelectorAll('[data-f41-tab]').forEach(button => {
      const active = button.dataset.f41Tab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    render();
  }

  function renderKnowledge(query) {
    const target = document.getElementById('f41KnowledgeResults');
    const count = document.getElementById('f41KnowledgeCount');
    if (!target) return;
    const found = searchKnowledge(query, 16);
    searchResults = found;
    if (count) count.textContent = `${fmt(found.length)} dopasowań · dane z lokalnych katalogów · wynik nie jest potwierdzeniem diagnozy`;
    target.innerHTML = found.length ? found.map((item,index)=>`<article class="f41-knowledge-card"><div class="f41-fault-meta"><span>${esc(item.category)}</span><span>${index+1} / ${found.length}</span></div><b>${esc(item.title)}</b><p>${esc(item.excerpt || 'Otwórz materiał, aby zobaczyć szczegóły.')}</p><button type="button" class="f41-btn secondary" data-f41-open-result="${index}">Otwórz źródło ↗</button></article>`).join('') : '<div class="f41-empty"><b>Brak dopasowania w lokalnym indeksie.</b><p>Dodaj dokładny model, Board ID, rewizję i objawy. Możesz też przejść do pełnej wyszukiwarki Akademii.</p><button class="f41-btn secondary" type="button" data-f41-go="masterSearch">Otwórz Centrum Praktyki ↗</button></div>';
  }

  const PARTS = {
    DCIN:{ title:'Wejście zasilania DC-IN', role:'Punkt wejścia energii do platformy. Konkretny układ i elementy ochronne zależą od projektu płyty.', checks:['Identyfikacja gniazda i adaptera','Oględziny mechaniczne oraz kontrola dokumentacji','Porównanie bezpieczników i ochrony wejścia według schematu'], warning:'Nie wykonuj pomiarów po stronie sieciowej zasilacza.' },
    FUSE:{ title:'Bezpiecznik wejściowy', role:'Element ochronny. Przepalenie jest objawem, a nie zgodą na jego mostkowanie.', checks:['Dokumentacja dokładnego Board ID','Kontrola obwodu po odłączeniu zasilania','Ustalenie przyczyny uszkodzenia przed wymianą'], warning:'Nigdy nie zwieraj ani nie zastępuj bezpiecznika elementem o przypadkowych parametrach.' },
    VRM:{ title:'Sekcja VRM', role:'Przetwarza i reguluje energię dla głównych domen zasilania.', checks:['Rozpoznaj kontroler i fazy w dokumentacji','Zidentyfikuj cewki i elementy mocy','Weryfikuj sygnały według serwisówki'], warning:'Nie przypisuj uniwersalnych napięć do nieznanej płyty.' },
    RAM:{ title:'Gniazda i kanały RAM', role:'Interfejs pamięci zależny od CPU, topologii, typu DDR i projektu płyty.', checks:['Potwierdź DDR i listę obsługiwanych modułów','Zapisz konfigurację slotów','Testuj znany sprawny moduł według instrukcji'], warning:'Nie mieszaj generacji DDR i nie wymuszaj napięć.' },
    BIOS:{ title:'Pamięć SPI / BIOS', role:'Przechowuje część firmware platformy. Zawartość bywa zależna od Board ID i regionów.', checks:['Potwierdź wariant płyty i kość','Zachowaj niezmieniony oryginalny odczyt','Porównaj hash i różnice na kopii'], warning:'Moduł FIX41 nie programuje układów i nie modyfikuje wsadów.' },
    EC:{ title:'Kontroler EC / KBC', role:'Obsługuje wybrane funkcje niskiego poziomu, przyciski, sekwencję startową i urządzenia pomocnicze.', checks:['Zapisz objaw i stan platformy','Sprawdź sygnały w źródle OEM','Porównuj sekwencję wyłącznie dla danej rewizji'], warning:'Nie zwieraj sygnałów startowych na ślepo.' },
    GPU:{ title:'Układ GPU', role:'Procesor graficzny współpracuje z pamięcią, zasilaniem, chłodzeniem i firmware.', checks:['Wyklucz kabel, port i monitor','Zapisz temperatury i logi','Użyj procedury testowej producenta'], warning:'Artefakty nie potwierdzają samodzielnie uszkodzenia GPU.' },
    NVME:{ title:'Gniazdo M.2 / NVMe', role:'Interfejs nośnika. Znikanie dysku może mieć wiele przyczyn, a ochrona danych ma pierwszeństwo.', checks:['Zapisz objawy i model nośnika','Ogranicz zbędne zapisy','Zabezpiecz dane przed testami obciążeniowymi'], warning:'Nie benchmarkuj niestabilnego nośnika z ważnymi danymi.' }
  };
  function boardTemplate() {
    const selected = PARTS[state.savedBoard.selectedPart] ? state.savedBoard.selectedPart : 'VRM';
    const part = PARTS[selected];
    return `<div class="f41-section-title"><div><span class="f41-kicker">BOARD ID / REVISION / COMPONENT INSPECTOR</span><h3>Interaktywny atlas płyty treningowej</h3><p>Wybierz blok, poznaj jego rolę i bezpieczną ścieżkę nauki. To poglądowa płyta EDU, nie schemat konkretnego modelu.</p></div><button type="button" class="f41-btn secondary" data-f41-go="pcb">Otwórz pełny model 3D ↗</button></div>
      <div class="f41-board-fields"><label>Board ID treningowy<input id="f41BoardId" maxlength="80" value="${esc(state.savedBoard.boardId)}"></label><label>Rewizja treningowa<input id="f41BoardRevision" maxlength="40" value="${esc(state.savedBoard.revision)}"></label><button class="f41-btn secondary" id="f41SaveBoard">Zapisz opis płyty</button></div>
      <div class="f41-board-layout"><div class="f41-board-stage"><div class="f41-board-toolbar"><span>WARSTWA: ${esc(state.savedBoard.layer || 'ELEMENTY')}</span><button type="button" data-f41-layer="power">Zasilanie</button><button type="button" data-f41-layer="signal">Sygnały</button><button type="button" data-f41-layer="components">Elementy</button></div>
      <div class="f41-board-3d"><svg viewBox="0 0 760 470" role="img" aria-label="Izometryczny, edukacyjny model płyty z interaktywnymi blokami"><defs><linearGradient id="f41pcb" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#145d67"/><stop offset=".55" stop-color="#0b3149"/><stop offset="1" stop-color="#071a31"/></linearGradient><linearGradient id="f41metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bcecf2"/><stop offset="1" stop-color="#4c849e"/></linearGradient><filter id="f41shadow"><feGaussianBlur stdDeviation="9"/></filter></defs><ellipse cx="378" cy="368" rx="300" ry="55" fill="#000" opacity=".35" filter="url(#f41shadow)"/><path d="M75 135 L572 40 Q603 34 626 62 L704 290 Q718 326 680 340 L183 438 Q150 447 136 414 L49 184 Q37 151 75 135Z" fill="#071a2b" stroke="#0a0e1d" stroke-width="15"/><path d="M75 119 L572 24 Q603 18 626 46 L704 274 Q718 310 680 324 L183 422 Q150 431 136 398 L49 168 Q37 135 75 119Z" fill="url(#f41pcb)" stroke="#55d5de" stroke-width="4"/><path d="M120 128 L570 43 M145 185 L620 94 M178 245 L648 155 M211 307 L674 218" stroke="#73d7ce" stroke-width="2" opacity=".17"/>
      <g class="f41-board-traces ${esc(state.savedBoard.layer || 'components')}"><path d="M145 151 L260 131 L324 198 L444 171 L560 113"/><path d="M200 318 L317 279 L405 325 L565 275 L660 286"/><path d="M390 120 L420 220 L510 250 L590 318"/><path d="M130 240 L250 218 L300 290 L420 340"/></g>
      <g class="f41-board-chip" data-f41-part="DCIN" tabindex="0" role="button" aria-label="DC-IN"><path d="M84 245 l54 -11 18 42 -54 11Z"/><text x="118" y="263">DC-IN</text></g>
      <g class="f41-board-chip" data-f41-part="FUSE" tabindex="0" role="button" aria-label="Bezpiecznik"><path d="M184 196 l65 -13 14 35 -65 13Z"/><text x="224" y="213">FUSE</text></g>
      <g class="f41-board-chip" data-f41-part="VRM" tabindex="0" role="button" aria-label="VRM"><path d="M315 132 l113 -22 37 76 -113 23Z"/><path d="M329 120 l113 -22 37 76 -113 23Z" fill="url(#f41metal)"/><text x="390" y="151">VRM</text></g>
      <g class="f41-board-chip" data-f41-part="RAM" tabindex="0" role="button" aria-label="RAM"><path d="M495 73 l28 -5 54 136 -28 5Z"/><path d="M533 65 l28 -5 54 136 -28 5Z"/><text x="550" y="156">RAM</text></g>
      <g class="f41-board-chip" data-f41-part="BIOS" tabindex="0" role="button" aria-label="BIOS"><path d="M594 205 l48 -10 15 36 -48 10Z"/><text x="627" y="221">BIOS</text></g>
      <g class="f41-board-chip" data-f41-part="EC" tabindex="0" role="button" aria-label="EC"><path d="M470 265 l61 -12 20 43 -61 12Z"/><text x="503" y="284">EC</text></g>
      <g class="f41-board-chip" data-f41-part="GPU" tabindex="0" role="button" aria-label="GPU"><path d="M302 280 l105 -21 39 81 -105 21Z"/><path d="M315 268 l105 -21 39 81 -105 21Z" fill="url(#f41metal)"/><text x="367" y="305">GPU</text></g>
      <g class="f41-board-chip" data-f41-part="NVME" tabindex="0" role="button" aria-label="NVMe"><path d="M114 333 l145 -29 14 33 -145 29Z"/><text x="184" y="345">M.2 NVMe</text></g>
      </svg></div><p class="f41-note">Model 2.5D/izometryczny i warstwy są ilustracją szkoleniową. Do rzeczywistej naprawy potrzebny jest schemat i BoardView właściwej rewizji.</p></div>
      <aside class="f41-part-inspector"><span class="f41-kicker">INSPEKTOR ELEMENTU</span><h4>${esc(part.title)}</h4><p>${esc(part.role)}</p><b>Plan nauki / weryfikacji</b><ol>${part.checks.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="f41-safety compact">${esc(part.warning)}</div><div class="f41-part-list">${Object.entries(PARTS).map(([id,p])=>`<button type="button" data-f41-part-select="${id}" class="${selected===id?'active':''}">${esc(id)}</button>`).join('')}</div></aside></div>`;
  }

  function labTemplate() {
    const run = state.labRuns[0];
    return `<div class="f41-section-title"><div><span class="f41-kicker">ELECTRONICS LAB / SYNTHETIC INSTRUMENTS</span><h3>Laboratorium pomiarowe EDU</h3><p>Multimetr, test ciągłości i podgląd przebiegu oscyloskopu na wartościach syntetycznych.</p></div><button type="button" class="f41-btn secondary" data-f41-go="electronics">Pełne Laboratorium PRO ↗</button></div>
      <div class="f41-safety compact"><b>Wyłącznie symulacja:</b> żaden odczyt nie pochodzi z fizycznego miernika ani płyty. Rezystancję i ciągłość wolno mierzyć tylko w obwodzie odłączonym i bezpiecznie rozładowanym.</div>
      <div class="f41-lab-grid"><section class="f41-lab-card"><span class="f41-kicker">MULTIMETR EDU</span><form id="f41MeasureForm" class="f41-form-grid"><label>Profil pomiaru<select name="scenario"><option value="adapter">Wejście adaptera — napięcie</option><option value="standby">Linia standby — napięcie</option><option value="resistance">Rezystancja — obwód odłączony</option><option value="continuity">Ciągłość — obwód odłączony</option></select></label><label>Tryb miernika<select name="mode"><option value="voltage">V DC</option><option value="resistance">Ω</option><option value="continuity">Ciągłość</option></select></label><label>Stan obwodu<select name="powerState"><option value="powered">Zasilany (ćwiczenie napięcia)</option><option value="isolated">Odłączony / bezpiecznie rozładowany</option></select></label><label>Wartość wpisana przez ucznia<input name="value" type="number" min="0" step="any" required placeholder="Wpisz wartość EDU"></label><div class="f41-actions full"><button type="submit" class="f41-btn primary">Oceń pomiar →</button></div></form><div id="f41MeasureFeedback" class="f41-feedback" aria-live="polite">Wybierz scenariusz i wprowadź przykładowy odczyt.</div><div class="f41-history-list"><b>Ostatnie ćwiczenie</b>${run?`<p>${esc(run.title)} · ${esc(run.value)} ${esc(run.unit)} · ${run.passed?'zaliczone':'do powtórki'}</p>`:'<p>Brak zapisanych pomiarów EDU.</p>'}</div></section>
      <section class="f41-lab-card"><span class="f41-kicker">OSCILLOSCOPE / WAVEFORM VIEW</span><h4>Podgląd przebiegu szkoleniowego</h4><svg class="f41-scope" viewBox="0 0 560 190" role="img" aria-label="Syntetyczny przebieg oscyloskopu"><defs><pattern id="f41scopeGrid" width="28" height="19" patternUnits="userSpaceOnUse"><path d="M28 0H0V19" fill="none" stroke="#2c5067" stroke-width="1"/></pattern></defs><rect width="560" height="190" fill="#061626"/><rect width="560" height="190" fill="url(#f41scopeGrid)"/><path d="M0 95H560 M280 0V190" stroke="#57748b" stroke-dasharray="4 5"/><path d="M0 95 C18 18 38 18 56 95 S94 172 112 95 S150 18 168 95 S206 172 224 95 S262 18 280 95 S318 172 336 95 S374 18 392 95 S430 172 448 95 S486 18 504 95 S542 172 560 95" fill="none" stroke="#5fe4d5" stroke-width="3"/></svg><div class="f41-instrument-readings"><span><b>CH1</b> przebieg przykładowy</span><span><b>Źródło</b> generator EDU</span><span><b>Stan</b> offline / symulacja</span></div><div class="f41-psu-sim"><h4>Zasilacz laboratoryjny — model matematyczny</h4><div class="f41-form-grid"><label>Napięcie (V)<input id="f41PsuV" type="number" min="0" max="24" step="0.1" value="5"></label><label>Limit prądu (A)<input id="f41PsuA" type="number" min="0" max="3" step="0.1" value="1"></label></div><button type="button" class="f41-btn secondary" id="f41PsuCalc">Oblicz moc modelu</button><p id="f41PsuResult" class="f41-feedback">Moc: 5 W · wynik matematyczny, bez fizycznego wyjścia.</p></div></section></div>`;
  }

  function biosChecklistTemplate() {
    const tasks = [
      ['model','Potwierdź producenta, pełny model, Board ID i rewizję PCB.'],
      ['backup','Zachowaj niezmieniony oryginalny odczyt i wykonaj kopię.'],
      ['hash','Policz SHA-256 i porównaj niezależne odczyty.'],
      ['regions','Zidentyfikuj regiony i dane unikalne dla urządzenia.'],
      ['oem','Zdobądź oficjalną procedurę odzyskiwania dla dokładnego wariantu.']
    ];
    const done = new Set(state.skillChecks.filter(x=>x.kind==='bios').map(x=>x.id));
    return `<div class="f41-section-title"><div><span class="f41-kicker">BIOS / UEFI TRAINING CHECKLIST</span><h3>Procedura bezpiecznej analizy firmware</h3><p>Przećwicz kolejność pracy. Pełny inspektor BIOS FIX15 znajduje się w Laboratoriach PRO.</p></div><button class="f41-btn secondary" type="button" data-f41-go="bios">Otwórz Laboratorium BIOS / UEFI ↗</button></div><div class="f41-checklist">${tasks.map(([id,label])=>`<label><input type="checkbox" data-f41-skill="bios:${id}" ${done.has(id)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div><button type="button" class="f41-btn primary" id="f41SaveBiosSkill">Zapisz checklistę BIOS</button><div class="f41-safety compact">Nie wgrywaj przypadkowych wsadów. Ten panel nie wykonuje flashowania, nie zmienia regionów i nie obchodzi zabezpieczeń sprzętowych.</div>`;
  }

  function solderChecklistTemplate() {
    const tasks = [
      ['esd','Przygotuj stanowisko ESD i sprawdź stan wyposażenia.'],
      ['microscope','Wykonaj inspekcję pod mikroskopem i udokumentuj stan początkowy.'],
      ['identify','Zidentyfikuj część, footprint, warstwy i wymagania dokumentacji.'],
      ['process','Dobierz proces wyłącznie z danych producenta materiału i urządzenia.'],
      ['inspect','Oceń mostki, zwilżenie, pady i czystość połączenia.'],
      ['verify','Wykonaj kontrolę elektryczną i test funkcjonalny zgodnie z procedurą.']
    ];
    const done = new Set(state.skillChecks.filter(x=>x.kind==='solder').map(x=>x.id));
    return `<div class="f41-section-title"><div><span class="f41-kicker">SMD / BGA / MICROSOLDERING</span><h3>Trener jakości lutowania</h3><p>Checklisty jakości i bezpieczeństwa dla ćwiczeń SMD/BGA. Procesy termiczne zależą od konkretnej części, płyty, stopu, stacji i dokumentacji.</p></div><button type="button" class="f41-btn secondary" data-f41-go="solder">Pełne laboratorium lutowania ↗</button></div><div class="f41-checklist">${tasks.map(([id,label])=>`<label><input type="checkbox" data-f41-skill="solder:${id}" ${done.has(id)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div><button type="button" class="f41-btn primary" id="f41SaveSolderSkill">Zapisz checklistę jakości</button><div class="f41-safety compact">Nie ma jednej uniwersalnej temperatury lub profilu BGA. Nie podajemy nastaw bez danych dla konkretnego procesu i komponentu.</div>`;
  }

  function render() {
    if (activeTab === 'overview') ROOT.innerHTML = dashboardTemplate();
    else if (activeTab === 'assembly') ROOT.innerHTML = assemblyTemplate();
    else if (activeTab === 'faults') ROOT.innerHTML = faultTemplate();
    else if (activeTab === 'board') ROOT.innerHTML = boardTemplate();
    else if (activeTab === 'lab') ROOT.innerHTML = labTemplate();
    else if (activeTab === 'challenge') ROOT.innerHTML = challengeTemplate();
    else if (activeTab === 'bios') ROOT.innerHTML = biosChecklistTemplate();
    else if (activeTab === 'solder') ROOT.innerHTML = solderChecklistTemplate();
    else if (activeTab === 'knowledge') ROOT.innerHTML = knowledgeTemplate();
    else if (activeTab === 'teacher') ROOT.innerHTML = teacherTemplate();
    else if (activeTab === 'progress') ROOT.innerHTML = progressTemplate();
    renderStats();
  }

  function navigate(target) {
    const routes = {
      pcb: ['ultimate3d', []], schematic: ['practicepro', ['[data-p27-tab="schematic"]']], electronics: ['labplus', []],
      bios: ['masterworkshop', ['[data-nwm-tab="ultimate"]','[data-m64-tab="bios"]']], biosTrainer: ['masterworkshop', ['[data-nwm-tab="ultimate"]','[data-m64-tab="trainer"]']],
      challenge: ['practicepro', ['[data-p27-tab="challenge"]']], repairChallenge: ['practicepro', ['[data-p27-tab="challenge"]']],
      solder: ['labplus', []], methods: ['methods', []], exams: ['learnpro', ['[data-l40-tab="exams"]']],
      courses: ['courses', []], components: ['components', []], repairAi: ['repairmaster', []],
      masterSearch: ['practicepro', ['[data-p27-tab="search"]']], reports: ['learnpro', ['[data-l40-tab="reports"]']]
    };
    const route = routes[target];
    if (!route) { status('Nieznany moduł akademii.', true); return; }
    const [view, selectors] = route;
    if (typeof window.ACADEMY_SHOW_VIEW === 'function') window.ACADEMY_SHOW_VIEW(view);
    else document.querySelector(`[data-view="${view}"]`)?.click();
    if (target === 'exams' || target === 'reports') document.querySelector(`[data-l40-tab="${target==='exams'?'exams':'reports'}"]`)?.click();
    if (selectors.length) {
      window.setTimeout(() => {
        selectors.forEach(selector => document.querySelector(selector)?.click());
        
      }, 80);
    }
    if (['pcb','schematic','electronics','bios','biosTrainer','challenge','repairChallenge','solder','methods','exams','courses','components','repairAi','masterSearch','reports'].includes(target)) {
      state.lessonLaunches.unshift({ target, at:now() }); state.lessonLaunches = state.lessonLaunches.slice(0,250); persist();
    }
  }

  function renderFaultFeedback(result, item) {
    const target = document.getElementById('f41FaultFeedback'); if (!target) return;
    target.className = `f41-feedback ${result.correct?'is-good':'is-error'}`;
    target.innerHTML = `<b>${result.correct?'Dobrze! +25 XP':'To nie jest najlepszy pierwszy krok.'}</b><p>${esc(result.explanation)}</p><p><b>Pierwszy krok:</b> ${esc(result.nextStep)}</p><details><summary>Pełna ścieżka diagnostyczna</summary><ol>${result.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></details>`;
  }

  function startFault() {
    let next = FAULTS[Math.floor(Math.random() * FAULTS.length)];
    if (FAULTS.length > 1 && next.id === state.lastFaultId) next = FAULTS[(FAULTS.findIndex(x=>x.id===next.id)+1) % FAULTS.length];
    state.lastFaultId = next.id; activeFault = next; persist(); render();
    status(`Nowy przypadek: ${next.title}. Przeczytaj objawy i wybierz pierwszy krok.`);
  }

  function startChallenge() {
    const scenarios = [
      { title:'Brak reakcji na przycisk Power', questions:[
        { q:'Co należy ustalić przed pomiarami?', options:['Dokładny model, Board ID, rewizję i objaw','Dowolne napięcie z innej płyty','Od razu wymienić EC'], answer:0, why:'Identyfikacja i objaw są podstawą bezpiecznej diagnostyki.' },
        { q:'Jaki warunek musi być spełniony przed pomiarem rezystancji?', options:['Laptop podłączony do adaptera','Odłączenie wszystkich źródeł energii i bezpieczne rozładowanie','Włączenie trybu pracy'], answer:1, why:'Rezystancję mierzy się tylko w odłączonym i bezpiecznie rozładowanym obwodzie.' },
        { q:'Skąd wziąć wartość odniesienia?', options:['Z pierwszego forum','Z dokumentacji dokładnego modelu i rewizji','Z uniwersalnej tabeli dla laptopów'], answer:1, why:'Nie ma uniwersalnych wartości dla nieznanej rewizji płyty.' }
      ]},
      { title:'Dysk NVMe znika z systemu', questions:[
        { q:'Co jest priorytetem?', options:['Benchmark zapisu','Zabezpieczenie danych i ograniczenie zapisów','Formatowanie'], answer:1, why:'Ochrona danych ma pierwszeństwo przed testami.' },
        { q:'Co dokumentujesz przed dalszą analizą?', options:['Model, SMART, temperaturę i logi bez forsowania obciążenia','Tylko kolor etykiety','Tylko wynik benchmarku'], answer:0, why:'Dane źródłowe pomagają oszacować ryzyko i przyczynę.' },
        { q:'Gdzie prowadzić dalsze testy, gdy dane są zabezpieczone?', options:['Na oryginale bez kopii','Na kopii/obrazie, zgodnie z procedurą','Na losowym innym dysku z danymi klienta'], answer:1, why:'Oryginał należy chronić, a analizę prowadzić na kopii.' }
      ]}
    ];
    challengeSession = { ...scenarios[Math.floor(Math.random()*scenarios.length)], index:0, answers:[], startedAt:Date.now(), seconds:90 };
    if (challengeTimer) window.clearInterval(challengeTimer);
    renderChallengeQuestion();
    challengeTimer = window.setInterval(() => {
      if (!challengeSession) return;
      const elapsed = Math.floor((Date.now()-challengeSession.startedAt)/1000);
      const left = Math.max(0, 90-elapsed);
      const timer = document.getElementById('f41ChallengeTimer'); if (timer) timer.textContent = `Pozostało: ${left} s`;
      if (left <= 0) finishChallenge(true);
    }, 1000);
  }
  function renderChallengeQuestion() {
    const stage = document.getElementById('f41ChallengeStage'); if (!stage || !challengeSession) return;
    const q = challengeSession.questions[challengeSession.index];
    stage.innerHTML = `<div class="f41-fault-meta"><span>REPAIR CHALLENGE / EDU</span><span id="f41ChallengeTimer">Pozostało: 90 s</span></div><h4>${esc(challengeSession.title)}</h4><div class="f41-progress-mini"><i style="width:${challengeSession.index/challengeSession.questions.length*100}%"></i></div><p><b>Etap ${challengeSession.index+1}/${challengeSession.questions.length}:</b> ${esc(q.q)}</p><div class="f41-choice-list">${q.options.map((op,i)=>`<label class="f41-choice"><input type="radio" name="f41ChallengeChoice" value="${i}"><span>${esc(op)}</span></label>`).join('')}</div><button type="button" class="f41-btn primary" id="f41ChallengeNext">Zatwierdź etap →</button><div id="f41ChallengeFeedback" class="f41-feedback"></div>`;
  }
  function finishChallenge(timedOut = false) {
    if (!challengeSession) return;
    if (challengeTimer) { window.clearInterval(challengeTimer); challengeTimer = null; }
    const answers = challengeSession.answers;
    const result = evaluateChallenge(answers, challengeSession.questions.map(q=>q.answer));
    state.challengeLaunches.unshift({ title:challengeSession.title, at:now(), ...result, timedOut });
    state.challengeLaunches = state.challengeLaunches.slice(0,250); persist();
    const stage = document.getElementById('f41ChallengeStage');
    if (stage) stage.innerHTML = `<div class="f41-result ${result.passed?'good':'warn'}"><h4>${timedOut?'Czas minął':result.passed?'Wyzwanie zaliczone':'Warto powtórzyć'}</h4><b>${result.score}/${result.total} · ${result.percent}%</b><p>${result.passed?'Dobra kolejność decyzji diagnostycznych.':'Przejrzyj uzasadnienia i wróć do ćwiczenia.'}</p><button type="button" class="f41-btn primary" id="f41ChallengeAgain">Nowe wyzwanie ↻</button></div>`;
    if (result.passed) { state.xp += 40; persist(); }
    renderStats(); status(`Repair Challenge: ${result.percent}%${timedOut?' · limit czasu':''}.`);
    challengeSession = null;
  }
  function submitChallenge() {
    if (!challengeSession) return;
    const selected = $('input[name="f41ChallengeChoice"]:checked');
    if (!selected) { status('Wybierz odpowiedź, zanim zatwierdzisz etap.', true); return; }
    const question = challengeSession.questions[challengeSession.index];
    const answer = Number(selected.value);
    challengeSession.answers.push(answer);
    const feedback = document.getElementById('f41ChallengeFeedback');
    if (feedback) { feedback.textContent = answer===question.answer ? `Poprawnie. ${question.why}` : `Niepoprawnie. ${question.why}`; feedback.className = `f41-feedback ${answer===question.answer?'is-good':'is-error'}`; }
    challengeSession.index++;
    if (challengeSession.index >= challengeSession.questions.length) { window.setTimeout(()=>finishChallenge(false), 600); }
    else window.setTimeout(renderChallengeQuestion, 550);
  }

  function openTeacherAnswer() {
    const question = clean($('#f41TeacherQuestion')?.value || '', 240);
    if (question.length < 3) { status('Opisz problem lub temat — minimum 3 znaki.', true); return; }
    const level = $('#f41TeacherLevel')?.value || 'beginner';
    const matches = searchKnowledge(question, 5);
    const node = document.getElementById('f41TeacherAnswer'); if (!node) return;
    const plan = level === 'beginner'
      ? ['Nazwij objaw własnymi słowami i zapisz dokładny model.','Sprawdź podstawy: zasilanie, przewody, stan wizualny i komunikaty.','Nie wykonuj pomiaru, jeśli nie znasz trybu i warunków bezpieczeństwa.']
      : level === 'advanced'
        ? ['Zbuduj hipotezy i opisz dowody za/przeciw każdej.','Dobierz test rozróżniający hipotezy, z podanym stanem zasilania i źródłem referencyjnym.','Zapisz warunki odtwarzalności oraz kryteria testu końcowego.']
        : ['Potwierdź konfigurację i warunki wystąpienia.','Wybierz test o niskim ryzyku, który oddziela możliwe przyczyny.','Zapisz wynik i porównaj go ze źródłem dla dokładnej rewizji.'];
    const matchesHtml = matches.length ? `<h5>Materiały znalezione w lokalnej bazie</h5><ul>${matches.map(x=>`<li><b>${esc(x.title)}</b> <small>(${esc(x.category)})</small></li>`).join('')}</ul>` : '<p>Nie znaleziono bezpośredniego dopasowania w lokalnym indeksie. Potrzebne będą: pełny model, Board ID, rewizja, dokładny objaw i źródło dokumentacji.</p>';
    node.innerHTML = `<h4>Plan nauki / diagnostyki</h4><ol>${plan.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${matchesHtml}<p class="f41-note">To lokalne dopasowanie i plan edukacyjny, nie automatyczna diagnoza ani odpowiedź generatywnego AI.</p><button type="button" class="f41-btn primary" id="f41TeacherToChat">Przekaż opis do czatu AI →</button>`;
    state.skillChecks.unshift({ kind:'teacher', id:`teacher-${Date.now()}`, at:now() }); state.skillChecks=state.skillChecks.slice(0,100); persist(); renderStats();
  }

  function saveSkill(kind) {
    const prefix = `${kind}:`;
    const previousComplete = state.skillChecks.filter(x=>x.kind===kind).length >= (kind==='bios' ? 5 : 6);
    const checked = [...HOST.querySelectorAll(`[data-f41-skill^="${prefix}"]:checked`)].map(x=>x.dataset.f41Skill.slice(prefix.length));
    const total = HOST.querySelectorAll(`[data-f41-skill^="${prefix}"]`).length;
    const id = `${kind}-${Date.now()}`;
    state.skillChecks = state.skillChecks.filter(x=>x.kind!==kind);
    checked.forEach(skill=>state.skillChecks.unshift({kind,id:skill,at:now()}));
    persist(); renderStats();
    status(`Zapisano checklistę ${kind==='bios'?'BIOS/UEFI':'SMD/BGA'}: ${checked.length}/${total} punktów.`);
    if (total && checked.length===total && !previousComplete) addXp(20, 'kompletna checklista');
  }

  function init() {
    HOST.querySelectorAll('[data-f41-tab]').forEach(button => button.addEventListener('click', () => setTab(button.dataset.f41Tab)));
    HOST.addEventListener('click', event => {
      const tabGo = event.target.closest('[data-f41-tab-go]'); if (tabGo) { setTab(tabGo.dataset.f41TabGo); return; }
      const go = event.target.closest('[data-f41-go]'); if (go) { navigate(go.dataset.f41Go); return; }
      const part = event.target.closest('[data-f41-part],[data-f41-part-select]');
      if (part) { const id = part.dataset.f41Part || part.dataset.f41PartSelect; if (PARTS[id]) { state.savedBoard.selectedPart=id; persist(); ROOT.innerHTML=boardTemplate(); } return; }
      const layer = event.target.closest('[data-f41-layer]'); if (layer) { state.savedBoard.layer=layer.dataset.f41Layer; persist(); ROOT.innerHTML=boardTemplate(); return; }
      if (event.target.closest('#f41NewFault')) { startFault(); return; }
      if (event.target.closest('#f41CheckFault')) {
        const selected = $('input[name="f41FaultChoice"]:checked');
        if (!selected) { status('Wybierz odpowiedź przed oceną przypadku.', true); return; }
        const result = evaluateFault(activeFault.id, selected.value);
        const item = activeFault;
        const checkButton = document.getElementById('f41CheckFault'); if (checkButton) checkButton.disabled = true;
        state.faultRuns.unshift({ id:`${item.id}-${Date.now()}`, faultId:item.id, title:item.title, correct:result.correct, at:now() });
        state.faultRuns = state.faultRuns.slice(0,250); persist();
        renderFaultFeedback(result,item); renderStats(); if (result.correct) addXp(25,'poprawna diagnoza'); else status('Przypadek zapisany. Przejrzyj uzasadnienie i ścieżkę diagnostyczną.'); return;
      }
      if (event.target.closest('#f41SaveBuild')) {
        try { const form=$('#f41AssemblyForm'); const config=Object.fromEntries(new FormData(form).entries()); const result=calculateAssembly(config); const item={id:`BUILD-${Date.now()}`,title:`${CPU[config.cpu].label} + ${BOARD[config.board].label}`,config,result,createdAt:now()}; state.builds.unshift(item); state.builds=state.builds.slice(0,100); persist(); addXp(10,'zapis konfiguracji PC'); setTab('assembly'); const box=document.getElementById('f41AssemblyResult'); if(box) box.innerHTML=assemblyResultHtml(result); return; } catch(error) { status(error.message,true); return; }
      }
      if (event.target.closest('#f41ResetBuild')) { setTab('assembly'); return; }
      if (event.target.closest('#f41PsuCalc')) {
        const v=Number($('#f41PsuV')?.value), a=Number($('#f41PsuA')?.value), result=document.getElementById('f41PsuResult');
        if(!Number.isFinite(v)||!Number.isFinite(a)||v<0||v>24||a<0||a>3){if(result)result.textContent='Zakres symulatora: 0–24 V i 0–3 A.';return;}
        if(result)result.textContent=`Moc modelu: ${(v*a).toFixed(1)} W · symulacja matematyczna, brak fizycznego wyjścia.`; return;
      }
      if (event.target.closest('#f41SaveBoard')) {
        state.savedBoard.boardId=clean($('#f41BoardId')?.value||'EDU-NB-041',80); state.savedBoard.revision=clean($('#f41BoardRevision')?.value||'A1',40); persist(); status('Zapisano identyfikator płyty treningowej i rewizję.'); return;
      }
      if (event.target.closest('#f41SaveBiosSkill')) { saveSkill('bios'); return; }
      if (event.target.closest('#f41SaveSolderSkill')) { saveSkill('solder'); return; }
      if (event.target.closest('#f41AskTeacher')) { openTeacherAnswer(); return; }
      if (event.target.closest('#f41TeacherToChat')) {
        const question=clean($('#f41TeacherQuestion')?.value||'',240);
        const prompt=`Jestem uczniem Akademii Serwisanta. Proszę o bezpieczne wyjaśnienie tematu: ${question}. Najpierw oddziel fakty, hipotezy i brakujące dane. Nie zgaduj napięć, pinów ani kompatybilności. Poproś o pełny model, Board ID, rewizję i dokumentację, gdy ich brakuje. Uwzględnij bezpieczeństwo danych, ESD i stan zasilania.`;
        const input=document.getElementById('cloudChatQuestion'); if(input)input.value=prompt; window.ACADEMY_SHOW_VIEW?.('cloudchat'); status('Opis przeniesiono do istniejącego czatu. Wiadomość nie została wysłana — zatwierdź ją samodzielnie.'); return;
      }
      const openResult = event.target.closest('[data-f41-open-result]'); if (openResult) {
        const item=searchResults[Number(openResult.dataset.f41OpenResult)]; if(!item)return;
        if(item.group==='courseLessons'||item.group==='beginnerLessons'||item.group==='faults') window.ACADEMY_OPEN_SOURCE?.(item.group,item.id);
        else if(item.group==='components') window.ACADEMY_SHOW_VIEW?.('components');
        else if(item.group==='methods') window.ACADEMY_SHOW_VIEW?.('methods');
        else window.ACADEMY_SHOW_VIEW?.('knowledge'); return;
      }
      if (event.target.closest('#f41ChallengeStart')) { startChallenge(); return; }
      if (event.target.closest('#f41ChallengeNext')) { submitChallenge(); return; }
      if (event.target.closest('#f41ChallengeAgain')) { startChallenge(); return; }
    });
    HOST.addEventListener('submit', event => {
      if (event.target.id === 'f41AssemblyForm') {
        event.preventDefault();
        try { const result=calculateAssembly(Object.fromEntries(new FormData(event.target).entries())); const box=document.getElementById('f41AssemblyResult'); if(box)box.innerHTML=assemblyResultHtml(result); if(result.compatible)status('Brak konfliktów w uproszczonym modelu EDU. Sprawdź jeszcze listy producentów.'); else status('Wykryto konflikty konfiguracji — popraw wskazane elementy.',true); } catch(error) { status(error.message,true); }
      }
      if (event.target.id === 'f41KnowledgeForm') { event.preventDefault(); renderKnowledge($('#f41KnowledgeQuery')?.value||''); }
      if (event.target.id === 'f41MeasureForm') {
        event.preventDefault(); const values=Object.fromEntries(new FormData(event.target).entries()); const result=evaluateMeasurement(values); const target=document.getElementById('f41MeasureFeedback');
        if(target){target.className=`f41-feedback ${result.passed?'is-good':result.safe?'is-error':'is-error'}`;target.textContent=result.message;}
        if(result.complete){const item={id:`LAB-${Date.now()}`,title:values.scenario,value:Number(values.value),unit:result.unit,passed:result.passed,at:now()};state.labRuns.unshift(item);state.labRuns=state.labRuns.slice(0,200);persist();renderStats();if(result.passed)addXp(10,'zaliczone ćwiczenie pomiarowe');}
      }
    });
    HOST.addEventListener('keydown', event => {
      if ((event.key==='Enter'||event.key===' ') && event.target.matches('[data-f41-part]')) { event.preventDefault(); event.target.dispatchEvent(new MouseEvent('click',{bubbles:true})); }
    });
    render();
    status('Akademia Serwisanta FIX41 gotowa. Nowe moduły i wcześniejsze laboratoria są zintegrowane.');
  }

  function assemblyResultHtml(result) {
    return `<div class="f41-result ${result.compatible?'good':'warn'}"><div class="f41-result-top"><div><span class="f41-kicker">WYNIK KONTROLI EDU</span><h4>${result.compatible?'Brak konfliktów wykrytych w modelu':'Wykryto niezgodności'}</h4></div><b>${result.compatible?'OK':'SPRAWDŹ'}</b></div><div class="f41-build-specs"><span><small>Procesor</small><b>${esc(result.cpu)}</b></span><span><small>Płyta</small><b>${esc(result.board)}</b></span><span><small>Pamięć</small><b>${esc(result.ram)}</b></span><span><small>GPU</small><b>${esc(result.gpu)}</b></span><span><small>Szacowany PSU</small><b>${result.recommended} W lub więcej</b></span></div>${result.issues.length?`<h5>Wykryte konflikty</h5><ul>${result.issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Nie wykryto konfliktu socket/RAM/uprośćonego budżetu PSU w dostępnym profilu.</p>'}<h5>Kontrole przed zakupem</h5><ul>${result.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  }

  // Small local API for deterministic regression tests and future modules.
  const API = Object.freeze({
    schema:'NAUKA_OD_A_DO_Z_FIX41',
    getState:()=>JSON.parse(JSON.stringify(state)),
    normalizeState,
    calculateAssembly,
    evaluateFault,
    evaluateMeasurement,
    evaluateChallenge,
    searchKnowledge,
    faultIds:()=>FAULTS.map(x=>x.id),
    componentIds:()=>Object.keys(PARTS),
    render:()=>render(),
    setTab
  });
  window.NP_NAUKA_FIX41 = API;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
