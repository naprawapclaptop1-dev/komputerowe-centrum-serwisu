/* NAUKA OD A DO Z 6.6.0 FIX17 — MASTER SERVICE CENTER
 * Local-first diagnostic workflow extension for the existing Workshop.
 * CSV/netlist imports are parsed locally; no physical hardware I/O or cloud upload is performed.
 * Work cards contain internal IDs only — do not enter customer personal data.
 */
(() => {
  'use strict';
  const STORE = 'npaMasterAcademy660Records';
  const MAX_IMPORT = 5 * 1024 * 1024;
  const MAX_ROWS = 5000;
  const MAX_RECORDS = 300;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = (value, max = 500) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const stamp = () => new Date().toISOString();
  const download = (name, content, type = 'text/plain;charset=utf-8') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const toCsv = (rows, headers) => '\uFEFF' + [headers.map(csvCell).join(';'), ...rows.map(row => headers.map(key => csvCell(row[key])).join(';'))].join('\r\n');
  const readState = () => {
    try { const value = JSON.parse(localStorage.getItem(STORE) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    catch (_) { return {}; }
  };
  let state = readState();
  for (const key of ['sequences','netlists','waveforms','diagnoses','audits','workOrders','simulatorResults']) if (!Array.isArray(state[key])) state[key] = [];
  const persist = () => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); setStatus('Zapisano lokalne dane FIX17.'); return true; }
    catch (_) { setStatus('Brak miejsca w pamięci przeglądarki. Wyeksportuj raporty lub usuń stare rekordy.', true); return false; }
  };
  const setStatus = (message, error = false) => { const node = $('n66Status'); if (node) { node.textContent = message; node.dataset.kind = error ? 'error' : 'ok'; } };

  // CSV parser supports quoted values and comma/semicolon/tab separators. No eval or formula execution.
  function parseDelimited(text) {
    const source = String(text ?? '').replace(/^\uFEFF/, '');
    const firstLine = source.split(/\r?\n/, 1)[0] || '';
    const candidates = [',', ';', '\t'];
    let delimiter = ',', best = -1;
    for (const candidate of candidates) {
      let count = 0, quoted = false;
      for (let i = 0; i < firstLine.length; i++) {
        if (firstLine[i] === '"') { if (quoted && firstLine[i + 1] === '"') i++; else quoted = !quoted; }
        else if (!quoted && firstLine[i] === candidate) count++;
      }
      if (count > best) { best = count; delimiter = candidate; }
    }
    const rows = []; let row = [], field = '', quoted = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"' && field.length === 0) quoted = true;
      else if (ch === delimiter) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && source[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
        row = [];
      } else field += ch;
      if (rows.length > MAX_ROWS + 1) throw new Error(`Limit wynosi ${MAX_ROWS} wierszy.`);
    }
    if (field.length || row.length) { row.push(field); if (row.some(cell => String(cell).trim() !== '')) rows.push(row); }
    return { delimiter, rows };
  }
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  function headerIndex(headers, names) { return headers.findIndex(header => names.includes(norm(header))); }
  function validateWorkOrder(input) {
    if (!input || typeof input !== 'object') return null;
    const item = {
      device: clean(input.device, 60), model: clean(input.model, 120), symptom: clean(input.symptom, 500),
      internalRef: clean(input.internalRef, 60), status: clean(input.status, 40),
      partsCost: Number(input.partsCost), laborCost: Number(input.laborCost), notes: clean(input.notes, 1200),
      approved: input.approved === true
    };
    if (!item.device || !item.model || !item.symptom || !Number.isFinite(item.partsCost) || !Number.isFinite(item.laborCost) || item.partsCost < 0 || item.laborCost < 0 || item.partsCost > 100000 || item.laborCost > 100000) return null;
    if (!['Nowe','Diagnoza','Oczekuje na zgodę','W naprawie','Kontrola jakości','Gotowe','Wstrzymane'].includes(item.status)) return null;
    item.total = Math.round((item.partsCost + item.laborCost) * 100) / 100;
    return item;
  }
  const sequenceStages = [
    { id:'input', name:'Wejście zasilania', detail:'Potwierdź zasilacz, przewód, złącze i warunki wejściowe według dokumentacji urządzenia.', next:'Zapisz oznaczenie adaptera, stan złącza i wynik weryfikacji zewnętrznego źródła.' },
    { id:'standby', name:'Zasilanie czuwania', detail:'Sprawdź odpowiednie linie czuwania wyłącznie w punktach określonych dla dokładnej rewizji płyty.', next:'Zweryfikuj punkt, masę, stan urządzenia, zakres przyrządu i referencję z dokumentacji.' },
    { id:'ec', name:'Kontroler EC / reset', detail:'Zweryfikuj dostępne informacje o resecie, zegarze i stanie kontrolera zgodnie ze schematem.', next:'Sprawdź sygnały i warunki startu opisane przez producenta; nie przypisuj usterki samemu kontrolerowi.' },
    { id:'button', name:'Przycisk Power', detail:'Zapisz reakcję przycisku, sygnał wejściowy oraz stan LED według instrukcji modelu.', next:'Oddziel usterkę przycisku/taśmy od braku reakcji dalszej sekwencji.' },
    { id:'sequence', name:'Warunki przejścia sekwencji', detail:'Porównaj wymagane sygnały ENABLE / SLEEP / POWER GOOD, jeżeli występują w dokumentacji płyty.', next:'Nie używaj uniwersalnych nazw ani wartości jako pinoutu — odnajdź właściwą sieć i punkt w schemacie.' },
    { id:'rails', name:'Szyny zasilające platformy', detail:'Rejestruj wyłącznie linie właściwe dla danej platformy i właściwych stanów pracy.', next:'Porównaj wyniki z dokumentacją konkretnego modelu/Board ID; nie stosuj napięć wzorcowych dla wszystkich płyt.' },
    { id:'memory', name:'Inicjalizacja pamięci', detail:'Zapisz kod POST/LED, konfigurację RAM i wynik procedury producenta.', next:'Sprawdź moduł, slot, QVL i procedurę treningu pamięci; zmieniaj jedną rzecz na raz.' },
    { id:'cpu', name:'Warunki CPU / reset / zegar', detail:'Zbierz dostępne sygnały i kody diagnostyczne dla platformy.', next:'Wymagane są właściwy schemat i wyposażenie; przerwij przy zwarciu, przegrzaniu lub nieznanym stanie.' },
    { id:'post', name:'POST / diagnostyka płyty', detail:'Zapisz kod POST, sygnały beep/LED i dokładny moment zatrzymania.', next:'Interpretuj kod z instrukcją danego producenta, modelu i wersji BIOS.' },
    { id:'os', name:'Przekazanie do systemu', detail:'Po potwierdzonym POST zweryfikuj start systemu i logi końcowe.', next:'Zapisz wersję systemu, zdarzenia, test końcowy i ograniczenia.' }
  ];
  const diagnosticRules = [
    { id:'power', match:/nie wlacza|nie uruchamia|brak reakcji|no power|power on|nie startuje/, title:'Brak reakcji / problem z zasilaniem', hypotheses:['Źródło zasilania, przewód lub adapter nie zostały potwierdzone.','Tor wejściowy lub warunki czuwania wymagają weryfikacji.','Sekwencja startowa może zatrzymywać się na jednym z etapów.'], steps:['Zapisz pełny model, Board ID i rewizję.','Sprawdź zewnętrzne źródło zasilania oraz widoczne uszkodzenia bez dalszego zasilania uszkodzonego urządzenia.','Zbierz reakcję LED/przycisku i dopasuj procedurę do dokumentacji.','Dopiero po ustaleniu bezpiecznych warunków wykonaj pomiary w punktach opisanych przez producenta.'], missing:['dokładny model/rewizja','model i parametry adaptera','reakcja LED/przycisku','schemat lub instrukcja serwisowa'] },
    { id:'post', match:/brak post|no post|brak obrazu|czarny ekran|nie daje obrazu|dram|vga led/, title:'Brak POST / brak obrazu', hypotheses:['Komputer może zatrzymywać się przed POST, podczas inicjalizacji pamięci lub grafiki.','Kod LED/beep może wskazywać etap diagnostyki, ale jego znaczenie zależy od producenta.','Problem może dotyczyć konfiguracji, firmware, pamięci, grafiki lub płyty.'], steps:['Zapisz kod POST/beep/LED dokładnie i podaj model płyty/urządzenia.','Sprawdź minimalną konfigurację zgodną z instrukcją i znany sprawny ekran/kabel.','Zapisz pojedyncze testy RAM/slotów bez zmieniania wielu elementów równocześnie.','Porównaj wyniki z instrukcją producenta i zebranymi logami.'], missing:['kod POST/beep/LED','konfiguracja RAM i GPU','wynik testu na znanym sprawnym ekranie','wersja BIOS i rewizja'] },
    { id:'charge', match:/nie laduje|brak ladowania|charging|usb.?c|pd|zasilacz/, title:'Problem z ładowaniem / USB-C', hypotheses:['Źródło, kabel lub profil zasilania nie są zgodne.','Negocjacja USB-C PD lub tor wejściowy wymaga potwierdzenia.','Port, kontroler lub przewody mogą wymagać oględzin i dokumentacji.'], steps:['Zapisz model zasilacza, przewodu i urządzenia.','Sprawdź czy port nie ma uszkodzeń mechanicznych lub śladów cieczy.','Zapisz dostępne wskazania/testy USB-C PD z obsługiwanego analizatora.','Pomiary płyty wykonuj tylko według schematu właściwej rewizji.'], missing:['model i profil adaptera','model kabla i portu','wynik negocjacji PD jeśli dostępny','Board ID i dokumentacja'] },
    { id:'storage', match:/dysk|ssd|nvme|hdd|smart|i\/o|nie widzi dysku|storage/, title:'Problem z nośnikiem / pamięcią masową', hypotheses:['Nośnik, połączenie, zasilanie lub sterownik storage mogą powodować objaw.','Błędy I/O mogą oznaczać ryzyko utraty danych.','Raport SMART i logi trzeba odnieść do konkretnego urządzenia.'], steps:['Ogranicz zbędne operacje na źródłowym nośniku i najpierw oceń ryzyko danych.','Zapisz model nośnika, interfejs i pełne komunikaty błędów.','Jeśli dane są ważne, obrazuj nośnik narzędziem przeznaczonym do odzyskiwania i pracuj na kopii.','Analizuj raport SMART/logi bez zapisu naprawczego na oryginale.'], missing:['model nośnika','logi I/O i SMART','interfejs i połączenie','informacja, czy wykonano kopię'] },
    { id:'thermal', match:/temperatur|przegrzew|throttl|wentylator|fan|overheat/, title:'Przegrzewanie / chłodzenie', hypotheses:['Przepływ powietrza, wentylator, radiator lub czujnik mogą być źródłem objawu.','Wartości wymagają modelu, warunków i wiarygodnego źródła odczytu.','Obciążenie, kurz i profil pracy wpływają na wynik.'], steps:['Zapisz model, warunki otoczenia i źródło temperatur.','Sprawdź widoczne drożności i stan wentylatorów bez ryzykownego uruchamiania uszkodzonego układu.','Porównaj odczyty z dokumentacją producenta dla tego modelu.','Po czynnościach serwisowych wykonaj porównywalny test końcowy.'], missing:['model CPU/GPU/urządzenia','temperatura i źródło odczytu','warunki obciążenia','stan chłodzenia'] },
    { id:'other', match:/.*/, title:'Diagnostyka ogólna', hypotheses:['Objaw wymaga doprecyzowania i podziału na podsystemy.','Na tym etapie nie ma wystarczających danych, aby wskazać prawdopodobny element.'], steps:['Zapisz pełny model i wersję urządzenia.','Opisz objaw, kiedy występuje i czy jest powtarzalny.','Zbierz logi, kody i pomiary ze źródłami.','Wybierz jeden test, który bezpiecznie odróżnia dwie hipotezy.'], missing:['model i rewizja','dokładny objaw i warunki','logi/kody','źródło pomiarów'] }
  ];
  function analyzeSymptom(input) {
    const text = clean([input?.symptom, input?.codes, input?.evidence].filter(Boolean).join(' '), 1800).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase();
    const rule = diagnosticRules.find(item => item.match.test(text)) || diagnosticRules[diagnosticRules.length - 1];
    const missing = rule.missing.filter((label, index) => {
      const probes = [input?.model, input?.board, input?.source, input?.codes, input?.evidence, input?.measurements];
      return !probes.some(value => String(value || '').trim().length > (index === 0 ? 2 : 5));
    });
    return { id:rule.id, title:rule.title, hypotheses:rule.hypotheses.slice(), steps:rule.steps.slice(), missing, notice:'Wstępny plan porządkuje kolejne kroki. Nie potwierdza uszkodzonego elementu i nie wylicza uniwersalnych napięć. Weryfikuj wszystko według dokładnego modelu i rewizji.' };
  }
  const scenarios = [
    {id:'no-power',title:'Laptop nie reaguje na przycisk Power',steps:[
      {q:'Jaki jest pierwszy bezpieczny krok?',a:['Od razu podać napięcie na cewkę CPU','Zapisać model, sprawdzić zewnętrzny adapter/przewód i obejrzeć port bez zasilania przy śladach uszkodzeń','Zewrzeć wejście zasilania'],correct:1,why:'Najpierw potwierdź model i źródło zasilania. Nie wykonuj przypadkowych zwarć ani pomiarów bez dokumentacji.'},
      {q:'Adapter i port wyglądają poprawnie. Co dalej?',a:['Zapisz zachowanie LED/przycisku i znajdź procedurę/Board ID','Wymień kontroler ładowania bez pomiarów','Przegrzej układ EC'],correct:0,why:'Objawy i właściwa dokumentacja wyznaczają dalsze testy.'},
      {q:'Kiedy mierzysz linie płyty?',a:['Według uniwersalnej tabeli napięć','Dopiero po identyfikacji punktu, stanu płyty, miernika i referencji konkretnej rewizji','Na przypadkowych pinach'],correct:1,why:'Punkty i wartości są zależne od modelu i warunków.'}
    ]},
    {id:'no-post',title:'PC zatrzymuje się przed POST',steps:[
      {q:'Co zapisujesz przed zmianą konfiguracji?',a:['Dokładny kod POST/LED/beep i konfigurację sprzętu','Tylko kolor obudowy','Od razu ustawienia overclockingu'],correct:0,why:'Dokładny kod i konfiguracja są podstawą porównania z instrukcją.'},
      {q:'Jak testować RAM?',a:['Zmieniaj wszystkie moduły i sloty równocześnie','Pojedynczo według zalecanej konfiguracji płyty, zapisując każdy wynik','Wkładaj RAM przy podłączonym zasilaniu'],correct:1,why:'Kontrolowana zmiana pozwala porównać moduły i sloty.'},
      {q:'Co oznacza kod beep bez modelu?',a:['Uniwersalną diagnozę RAM','Wskazówkę wymagającą instrukcji danego producenta i BIOS-u','Pewne uszkodzenie CPU'],correct:1,why:'Znaczenie sekwencji zależy od platformy.'}
    ]},
    {id:'storage',title:'SSD znika, występują błędy I/O',steps:[
      {q:'Jaki jest priorytet?',a:['Defragmentacja i długi test zapisu','Ochrona danych i ograniczenie zbędnych odczytów/zapisów','Formatowanie'],correct:1,why:'Przy ryzyku awarii nośnika priorytetem są dane.'},
      {q:'Na czym analizować system plików?',a:['Na kopii obrazu, jeśli dane są ważne','Na oryginale z naprawą w ciemno','Na partycji losowego dysku'],correct:0,why:'Praca na kopii ogranicza ryzyko pogorszenia stanu źródła.'},
      {q:'Jak interpretować SMART?',a:['Jeden atrybut zawsze przesądza o diagnozie','W kontekście modelu, logów, trendu i dokumentacji producenta','Bez identyfikacji nośnika'],correct:1,why:'SMART wymaga kontekstu urządzenia i objawów.'}
    ]},
    {id:'thermal',title:'Laptop przegrzewa się pod obciążeniem',steps:[
      {q:'Co należy zebrać?',a:['Model, warunki obciążenia i źródło odczytu temperatur','Wyłącznie temperaturę z przypadkowej aplikacji','Tylko nazwę pasty'],correct:0,why:'Pomiar musi być powiązany z modelem i warunkami.'},
      {q:'Przed demontażem chłodzenia?',a:['Sprawdź instrukcję serwisową i bezpieczne odłączenie zasilania/baterii','Uruchom laptop z otwartą obudową i dotykaj radiatora','Odłącz wentylator podczas pracy'],correct:0,why:'Procedura producenta i bezpieczeństwo są pierwsze.'},
      {q:'Po czyszczeniu i montażu?',a:['Zakończ bez testu','Wykonaj porównywalny test końcowy i zapisz warunki','Ustaw maksymalne napięcia'],correct:1,why:'Test porównywalny potwierdza efekt i wykrywa błędy montażu.'}
    ]}
  ];

  const paneHtml = `
  <section class="n66-pane" data-m64-pane="sequence" hidden>
    <header class="n66-head"><span>POWER-UP SEQUENCE / BOARD-SPECIFIC</span><h3>Analizator sekwencji startowej płyty</h3><p>Oznaczaj etapy jako potwierdzone, niepotwierdzone lub niebadane. Moduł nie podaje uniwersalnych napięć ani pinoutów — wymagane są model, Board ID, rewizja i dokumentacja.</p></header>
    <form id="n66SequenceForm" class="n66-card"><div class="n66-grid two"><label>Model urządzenia<input name="model" maxlength="120" required placeholder="Pełny model"></label><label>Board ID / rewizja<input name="board" maxlength="120" required placeholder="Dokładne oznaczenie"></label><label class="wide">Źródło dokumentacji<input name="source" maxlength="260" required placeholder="Service manual / schemat / strona / URL"></label></div><div id="n66SequenceStages" class="n66-stage-list"></div><label class="wide">Wspólne uwagi / warunki pomiarów<textarea name="notes" maxlength="1200" placeholder="Stan baterii, adapter, miernik, warunki, kody POST…"></textarea></label><div class="n66-actions"><button class="nwm-primary" type="submit">Zapisz przebieg i podsumuj</button><button class="nwm-secondary" id="n66SequenceExport" type="button">Eksportuj historię CSV</button></div></form><div id="n66SequenceResult" class="n66-result" aria-live="polite">Nie wykonano jeszcze przebiegu.</div><div id="n66SequenceHistory" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="netlist" hidden>
    <header class="n66-head"><span>NETLIST / BOARDVIEW COMPANION</span><h3>Analizator połączeń PCB z netlisty CSV</h3><p>Importuj tabelę CSV/TXT z kolumnami Ref/Component, Net oraz Pin/Pad. Moduł grupuje elementy po nazwie sieci i pozwala wyszukiwać połączenia. Nie odczytuje zastrzeżonych formatów BoardView .fz/.brd.</p></header>
    <div class="n66-card"><label>Wybierz netlistę CSV/TXT (max 5 MB)<input type="file" id="n66NetFile" accept=".csv,.txt,text/csv,text/plain"></label><div class="n66-note">Wymagane nagłówki (przykłady): Ref / Component, Net / NetName, Pin / Pad. Wszystko analizowane lokalnie.</div><div id="n66NetStatus" class="n66-result">Nie zaimportowano netlisty.</div></div>
    <div class="n66-toolbar"><select id="n66NetSelect"><option value="">Wybierz sieć</option></select><input id="n66NetSearch" type="search" placeholder="Szukaj elementu / pinu / sieci"><button type="button" class="nwm-secondary" id="n66NetExport">Eksport widocznych połączeń CSV</button></div><div id="n66NetSummary" class="n66-stats"></div><div id="n66NetRows" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="instruments" hidden>
    <header class="n66-head"><span>INSTRUMENT HUB / CSV IMPORT</span><h3>Hub przyrządów i wykresów pomiarowych</h3><p>Importuj wyeksportowane dane CSV z miernika, oscyloskopu lub analizatora. Wybierz kolumny X/Y, zobacz wykres i pobierz raport. Ten moduł nie steruje urządzeniami USB/Serial.</p></header>
    <div class="n66-card"><label>Plik CSV z pomiarami (max 5 MB)<input type="file" id="n66WaveFile" accept=".csv,.txt,text/csv,text/plain"></label><div class="n66-grid two"><label>Model przyrządu / źródło<input id="n66WaveInstrument" maxlength="120" placeholder="Np. producent i model"></label><label>Warunki pomiaru<input id="n66WaveConditions" maxlength="180" placeholder="Zakres, sonda, punkt, stan urządzenia"></label></div><div id="n66WaveStatus" class="n66-result">Brak zaimportowanego przebiegu.</div><div class="n66-toolbar"><label>Oś X<select id="n66WaveX" disabled></select></label><label>Oś Y<select id="n66WaveY" disabled></select></label><button type="button" class="nwm-primary" id="n66WaveDraw" disabled>Rysuj wykres</button><button type="button" class="nwm-secondary" id="n66WaveSave" disabled>Zapisz pomiar</button></div><div id="n66WaveChart" class="n66-wave-chart"><p>Wykres pojawi się po imporcie danych liczbowych.</p></div></div><div id="n66WaveHistory" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="brain" hidden>
    <header class="n66-head"><span>REPAIR BRAIN / EVIDENCE-BASED TRIAGE</span><h3>AI Repair Brain — plan diagnostyczny</h3><p>Generator porządkuje objawy w reguły wstępne i tworzy kontekst do istniejącego Repair Master AI. Nie wykonuje samodzielnej diagnozy i nie wymyśla wartości pomiarowych.</p></header>
    <form id="n66BrainForm" class="n66-card n66-grid two"><label>Typ urządzenia<input name="device" maxlength="80" placeholder="Laptop / PC / GPU / SSD"></label><label>Model<input name="model" maxlength="120" required></label><label>Board ID / rewizja<input name="board" maxlength="120"></label><label>Kody POST / BSOD / LED<input name="codes" maxlength="160"></label><label class="wide">Objaw<input name="symptom" maxlength="400" required placeholder="Opisz dokładnie, co się dzieje"></label><label class="wide">Dowody i dotychczasowe testy<textarea name="evidence" maxlength="1200" placeholder="Co zostało sprawdzone i jaki był wynik?"></textarea></label><label class="wide">Pomiary wraz z jednostką i warunkami<textarea name="measurements" maxlength="900"></textarea></label><label class="wide">Dokumentacja / źródło<input name="source" maxlength="260" placeholder="Link, model instrukcji, strona schematu"></label><div class="n66-actions wide"><button class="nwm-primary" type="submit">Ułóż plan diagnostyczny</button><button class="nwm-secondary" id="n66BrainCopy" type="button" disabled>Kopiuj kontekst do AI</button><button class="nwm-secondary" id="n66BrainOpen" type="button" disabled>Otwórz Repair Master AI</button><button class="nwm-secondary" id="n66BrainDownload" type="button" disabled>Pobierz raport TXT</button></div></form><div id="n66BrainResult" class="n66-result" aria-live="polite">Uzupełnij model, objaw i dostępne dowody.</div><div id="n66BrainHistory" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="audit" hidden>
    <header class="n66-head"><span>WORKSTATION AUDIT / HONEST CAPABILITIES</span><h3>Automatyczny audyt stanowiska</h3><p>Zbiera informacje udostępniane przez przeglądarkę oraz dane wpisane lub zaimportowane przez technika. Nie odczytuje uniwersalnie SMART, temperatur, EDID ani wszystkich podzespołów.</p></header>
    <div class="n66-card"><div class="n66-actions"><button type="button" class="nwm-primary" id="n66AuditRun">Zbadaj dostępne informacje</button><button type="button" class="nwm-secondary" id="n66AuditExport" disabled>Eksportuj raport JSON</button><label class="nwm-secondary n66-file-label">Importuj raport PowerShell JSON<input type="file" id="n66AuditImport" accept="application/json,.json" hidden></label></div><div id="n66AuditBrowser" class="n66-grid two"><p class="n66-note">Uruchom kontrolę.</p></div><h4>Ręcznie potwierdzone komponenty</h4><form id="n66AuditManual" class="n66-grid two"><label>CPU<input name="cpu" maxlength="140"></label><label>GPU<input name="gpu" maxlength="140"></label><label>RAM<input name="ram" maxlength="140"></label><label>Płyta / Board ID<input name="board" maxlength="140"></label><label>Dysk / model<input name="storage" maxlength="140"></label><label>Monitor / EDID<input name="monitor" maxlength="140"></label><label class="wide">Źródło danych / raport producenta<input name="source" maxlength="260" placeholder="Menedżer urządzeń / PowerShell / producent"></label><button type="submit" class="nwm-primary wide">Zapisz inwentarz ręczny</button></form><div id="n66AuditStatus" class="n66-result">Dane przeglądarki będą oznaczone jako odczyt przeglądarkowy, a pola wpisane jako dane ręczne.</div></div><div id="n66AuditHistory" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="orders" hidden>
    <header class="n66-head"><span>LOCAL WORKFLOW / ANONYMOUS WORK CARDS</span><h3>Wewnętrzny rejestr napraw i kosztorysów</h3><p>Lokalne karty pracy serwisowej bez nazwisk, telefonów, adresów, numerów seryjnych ani danych logowania klientów. Dane pozostają w tej przeglądarce; eksportuj kopię i kontroluj dostęp do urządzenia.</p></header>
    <form id="n66OrderForm" class="n66-card n66-grid two"><label>Urządzenie<select name="device"><option>Laptop</option><option>Komputer PC</option><option>Karta graficzna</option><option>Dysk</option><option>Płyta główna</option><option>Inne</option></select></label><label>Model / rodzina<input name="model" maxlength="120" required></label><label class="wide">Objaw / zakres pracy<input name="symptom" maxlength="500" required></label><label>Wewnętrzny kod klienta (anonimowy)<input name="internalRef" maxlength="60" placeholder="Np. K-024 — bez danych osobowych"></label><label>Status<select name="status"><option>Nowe</option><option>Diagnoza</option><option>Oczekuje na zgodę</option><option>W naprawie</option><option>Kontrola jakości</option><option>Gotowe</option><option>Wstrzymane</option></select></label><label>Koszt części PLN<input name="partsCost" type="number" min="0" max="100000" step="0.01" value="0" required></label><label>Robocizna PLN<input name="laborCost" type="number" min="0" max="100000" step="0.01" value="0" required></label><label class="wide">Notatki technika<textarea name="notes" maxlength="1200"></textarea></label><label class="n66-check wide"><input name="approved" type="checkbox"> Kosztorys został zaakceptowany (potwierdzenie technika)</label><button type="submit" class="nwm-primary wide">Utwórz lokalną kartę pracy</button></form><div class="n66-toolbar"><input type="search" id="n66OrderSearch" placeholder="Szukaj numeru, modelu, objawu"><button type="button" class="nwm-secondary" id="n66OrderCsv">Eksport CSV</button></div><div id="n66OrderList" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="practical" hidden>
    <header class="n66-head"><span>DECISION SIMULATOR / PRACTICAL SKILLS</span><h3>Egzaminy praktyczne — scenariusze serwisowe</h3><p>Ćwiczenia z decyzji diagnostycznych. Symulator ocenia kolejność i bezpieczeństwo wyborów, nie mierzy realnej płyty ani nie przyznaje kwalifikacji zawodowych.</p></header><div class="n66-grid two" id="n66ScenarioPicker"></div><div id="n66ScenarioStage" class="n66-card" aria-live="polite">Wybierz scenariusz, aby rozpocząć ćwiczenie.</div><div id="n66ScenarioHistory" class="n66-list"></div>
  </section>
  <section class="n66-pane" data-m64-pane="privacy" hidden>
    <header class="n66-head"><span>FIX17 LOCAL DATA / EXPORT</span><h3>Dane i kopia FIX17</h3><p>Nowe wpisy są przechowywane w localStorage tej przeglądarki bez szyfrowania w miejscu. Eksport JSON należy przechowywać w bezpiecznym miejscu. Nie wprowadzaj danych osobowych klientów.</p></header><div class="n66-card"><div class="n66-actions"><button type="button" class="nwm-primary" id="n66BackupExport">Eksportuj dane FIX17</button><label class="nwm-secondary n66-file-label">Importuj kopię FIX17<input type="file" id="n66BackupImport" accept="application/json,.json" hidden></label><button type="button" class="nwm-danger" id="n66BackupClear">Usuń wyłącznie dane FIX17</button></div><div id="n66BackupStatus" class="n66-result">Import scala rekordy o unikalnych identyfikatorach; istniejące wpisy nie są zastępowane.</div></div>
  </section>
  <div id="n66Status" class="n66-status" role="status" aria-live="polite">FIX17 gotowy do lokalnej pracy.</div>`;

  function normalizeWindowsAudit(payload) {
    if (!payload || typeof payload !== 'object' || payload.format !== 'NPA-WINDOWS-HARDWARE-AUDIT-FIX17' || payload.schemaVersion !== 1) return null;
    const pick = (object, keys) => {
      const source = object && typeof object === 'object' ? object : {};
      return Object.fromEntries(keys.map(key => [key, typeof source[key] === 'string' ? clean(source[key], 240) : (typeof source[key] === 'boolean' ? source[key] : (Number.isFinite(source[key]) ? source[key] : null))]));
    };
    const rows = (value, max, keys) => Array.isArray(value) ? value.slice(0,max).map(item => pick(item,keys)) : [];
    const normalized = {
      format: payload.format, schemaVersion: 1, capturedAt: clean(payload.capturedAt,80) || stamp(),
      source: 'Windows CIM / Storage cmdlets — read only',
      computer: pick(payload.computer,['manufacturer','model','systemType','totalMemoryBytes','totalMemoryGB']),
      os: pick(payload.os,['caption','version','build','architecture','lastBoot']),
      baseboard: pick(payload.baseboard,['manufacturer','product','version']),
      bios: pick(payload.bios,['manufacturer','version','releaseDate']),
      cpu: rows(payload.cpu,16,['name','manufacturer','cores','logicalProcessors','maxClockMHz']),
      memory: rows(payload.memory,32,['manufacturer','partNumber','capacityBytes','capacityGB','speedMHz','configuredSpeedMHz','slot','memoryTypeCode']),
      gpu: rows(payload.gpu,16,['name','driverVersion','videoProcessor','reportedVramBytes','reportedVramGB','currentResolution']),
      disks: rows(payload.disks,64,['model','sizeBytes','sizeGB','interfaceType','mediaType','firmwareRevision','status']),
      physicalDisks: rows(payload.physicalDisks,64,['friendlyName','mediaType','busType','sizeBytes','sizeGB','healthStatus','operationalStatus','temperatureC','wearPercent','readErrorsTotal','writeErrorsTotal']),
      monitors: rows(payload.monitors,16,['manufacturer','model','productCode','yearOfManufacture','active']),
      limitations: Array.isArray(payload.limitations) ? payload.limitations.slice(0,12).map(x=>clean(x,300)) : []
    };
    if (!normalized.computer.model && !normalized.os.caption && !normalized.cpu.length && !normalized.gpu.length && !normalized.disks.length) return null;
    return normalized;
  }

  // Public pure-function contract for automated tests and non-DOM consumers.
  // The UI still initializes only after the existing Workshop root is available.
  window.NPA_MASTER_CENTER_660 = {
    version:'6.6.0', sequenceStages, scenarios,
    parseDelimited, analyzeSymptom, validateWorkOrder, normalizeWindowsAudit,
    normalizeHeader:norm,
    limits:{maxImport:MAX_IMPORT,maxRows:MAX_ROWS,maxRecords:MAX_RECORDS}
  };

  function init() {
    const root = $('nwmMasterWorkshop');
    if (!root || root.dataset.fix17Ready === '1') return;
    const nav = root.querySelector('.n64-subnav');
    const anchor = root.querySelector('[data-m64-pane="security"]');
    if (!nav || !anchor) return;
    root.dataset.fix17Ready = '1';
    const tabs = [
      ['sequence','Sekwencja startowa'], ['netlist','Netlista PCB'], ['instruments','Przyrządy / wykresy'],
      ['brain','AI Repair Brain'], ['audit','Audyt stanowiska'], ['orders','Karty napraw'], ['practical','Egzaminy praktyczne'], ['privacy','Dane FIX17']
    ];
    nav.insertAdjacentHTML('beforeend', tabs.map(([id,label]) => `<button type="button" data-m64-tab="${id}" aria-selected="false">${label}</button>`).join(''));
    anchor.insertAdjacentHTML('afterend', paneHtml);
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-m64-tab]');
      if (!button || !nav.contains(button)) return;
      root.querySelectorAll('[data-m64-tab]').forEach(item => {
        const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      root.querySelectorAll('[data-m64-pane]').forEach(pane => { pane.hidden = pane.dataset.m64Pane !== button.dataset.m64Tab; });
    });
    const list = root.querySelector('#n66SequenceStages');
    list.innerHTML = sequenceStages.map((stage, index) => `<article class="n66-stage" data-seq-stage="${stage.id}"><div class="n66-stage-title"><span>${String(index+1).padStart(2,'0')}</span><b>${esc(stage.name)}</b></div><p>${esc(stage.detail)}</p><div class="n66-grid two"><label>Status<select data-seq-status="${stage.id}"><option value="unknown">Niebadane</option><option value="pass">Potwierdzone</option><option value="fail">Niepotwierdzone / błąd</option><option value="na">Nie dotyczy</option></select></label><label>Wynik / dowód<input data-seq-note="${stage.id}" maxlength="240" placeholder="Kod, odczyt, warunki, źródło"></label></div></article>`).join('');

    // Power-up sequence workflow.
    let latestSequenceText = '';
    $('n66SequenceForm').addEventListener('submit', event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      const statuses = sequenceStages.map(stage => ({...stage, status: $(`[data-seq-status="${stage.id}"]`).value, note: clean($(`[data-seq-note="${stage.id}"]`).value, 240)}));
      if (!statuses.some(stage => stage.status !== 'unknown')) { $('n66SequenceResult').textContent = 'Oznacz co najmniej jeden etap i zapisz źródło dokumentacji.'; return; }
      const firstFail = statuses.find(stage => stage.status === 'fail');
      const firstUnknown = statuses.find(stage => stage.status === 'unknown');
      const model = clean(form.get('model'),120), board = clean(form.get('board'),120), source = clean(form.get('source'),260);
      const item = { id:uid('seq'), at:stamp(), model, board, source, notes:clean(form.get('notes'),1200), statuses:statuses.map(({id,name,status,note})=>({id,name,status,note})), firstFail:firstFail?.id||'', next: firstFail ? firstFail.next : firstUnknown ? `Następny niebadany etap: ${firstUnknown.name}. ${firstUnknown.next}` : 'Wszystkie etapy oznaczono jako potwierdzone przez technika. Wykonaj niezależny test końcowy i zapisz jego źródło.' };
      state.sequences.unshift(item); state.sequences = state.sequences.slice(0,MAX_RECORDS); if (!persist()) return;
      latestSequenceText = `ANALIZA SEKWENCJI STARTOWEJ — EDUKACYJNA\nData: ${item.at}\nModel: ${model}\nBoard ID / rewizja: ${board}\nŹródło: ${source}\n\n${statuses.map(stage=>`${stage.name}: ${stage.status} — ${stage.note||'brak dowodu'}`).join('\n')}\n\nNastępny krok: ${item.next}\nUwagi: ${item.notes}\n\nNie jest to automatyczna diagnoza; warunki i wartości wymagają dokumentacji konkretnej rewizji.`;
      $('n66SequenceResult').innerHTML = `<b>${firstFail ? `Etap wymagający wyjaśnienia: ${esc(firstFail.name)}` : firstUnknown ? `Następny etap: ${esc(firstUnknown.name)}` : 'Wszystkie etapy oznaczono jako potwierdzone'}</b><p>${esc(item.next)}</p><button type="button" class="nwm-secondary" id="n66SequenceDownload">Pobierz raport przebiegu</button>`;
      $('n66SequenceDownload').addEventListener('click',()=>download('nauka-sekwencja-startowa.txt',latestSequenceText)); renderSequenceHistory();
    });
    function renderSequenceHistory(){ $('n66SequenceHistory').innerHTML = state.sequences.slice(0,30).map(item=>`<article class="n66-record"><b>${esc(item.model)} · ${esc(item.board)}</b><small>${new Date(item.at).toLocaleString('pl-PL')} · ${item.statuses.filter(x=>x.status==='pass').length} potwierdzonych · ${item.statuses.filter(x=>x.status==='fail').length} problemów</small><p>${esc(item.next)}</p><button class="nwm-secondary" type="button" data-seq-export="${esc(item.id)}">Raport TXT</button></article>`).join('')||'<p class="n66-note">Brak przebiegów.</p>'; }
    $('n66SequenceHistory').addEventListener('click',event=>{const button=event.target.closest('[data-seq-export]');if(!button)return;const item=state.sequences.find(x=>x.id===button.dataset.seqExport);if(item)download('sekwencja-startowa.txt',JSON.stringify(item,null,2));});
    $('n66SequenceExport').addEventListener('click',()=>download('nauka-sekwencje-startowe.csv',toCsv(state.sequences.map(x=>({at:x.at,model:x.model,board:x.board,source:x.source,next:x.next,statuses:x.statuses.map(s=>`${s.name}:${s.status}`).join(' | ')})),['at','model','board','source','next','statuses']),'text/csv;charset=utf-8'));
    renderSequenceHistory();

    // Netlist import and net grouping.
    let activeNetlist = null, visibleNetRows = [];
    function renderNetlist(){
      const select = $('n66NetSelect'), search = clean($('n66NetSearch').value,120).toLowerCase();
      const nets = activeNetlist ? [...new Set(activeNetlist.rows.map(row=>row.net))].sort() : [];
      const current = select.value; select.innerHTML = '<option value="">Wszystkie sieci</option>' + nets.map(net=>`<option value="${esc(net)}">${esc(net)}</option>`).join(''); if(nets.includes(current))select.value=current;
      const filterNet = select.value; visibleNetRows = (activeNetlist?.rows||[]).filter(row=>(!filterNet||row.net===filterNet)&&(!search||[row.ref,row.net,row.pin,row.description].join(' ').toLowerCase().includes(search))).slice(0,MAX_ROWS);
      $('n66NetSummary').innerHTML = activeNetlist ? `<div class="n66-stat"><b>${activeNetlist.rows.length}</b><span>wierszy netlisty</span></div><div class="n66-stat"><b>${nets.length}</b><span>unikalnych sieci</span></div><div class="n66-stat"><b>${new Set(activeNetlist.rows.map(x=>x.ref)).size}</b><span>elementów</span></div>` : '<p class="n66-note">Nie wybrano netlisty.</p>';
      $('n66NetRows').innerHTML = visibleNetRows.slice(0,400).map(row=>`<article class="n66-record"><b>${esc(row.ref)} · ${esc(row.pin||'pin niepodany')}</b><span class="n66-pill">${esc(row.net)}</span><small>${esc(row.description||'bez opisu')}</small></article>`).join('')||'<p class="n66-note">Brak pasujących połączeń.</p>';
    }
    $('n66NetFile').addEventListener('change',async event=>{
      const file=event.target.files?.[0]; if(!file)return;
      try{
        if(file.size===0||file.size>MAX_IMPORT)throw new Error('Plik musi mieć 1 B–5 MB.');
        const parsed=parseDelimited(await file.text()); if(parsed.rows.length<2)throw new Error('Netlista musi zawierać nagłówek i co najmniej jeden wiersz.');
        const headers=parsed.rows[0], iRef=headerIndex(headers,['ref','refdes','component','designator','element','reference']), iNet=headerIndex(headers,['net','netname','signal','network']), iPin=headerIndex(headers,['pin','pad','ball','padnumber','pinnumber']), iDesc=headerIndex(headers,['description','opis','function','funkcja']);
        if(iRef<0||iNet<0)throw new Error('Brak wymaganych nagłówków: Ref/Component oraz Net/NetName.');
        const rows=parsed.rows.slice(1).filter(row=>row[iRef]&&row[iNet]).slice(0,MAX_ROWS).map(row=>({ref:clean(row[iRef],80),net:clean(row[iNet],100),pin:iPin>=0?clean(row[iPin],60):'',description:iDesc>=0?clean(row[iDesc],180):''}));
        if(!rows.length)throw new Error('Nie znaleziono wierszy z elementem i siecią.');
        activeNetlist={id:uid('net'),name:clean(file.name,180),at:stamp(),rows};state.netlists.unshift(activeNetlist);state.netlists=state.netlists.slice(0,10);persist();
        $('n66NetStatus').textContent=`Zaimportowano ${rows.length} połączeń z ${file.name}. Dane analizowane lokalnie.`; renderNetlist();
      }catch(error){$('n66NetStatus').textContent=error.message;}finally{event.target.value='';}
    });
    $('n66NetSelect').addEventListener('change',renderNetlist);$('n66NetSearch').addEventListener('input',renderNetlist);
    $('n66NetExport').addEventListener('click',()=>download('nauka-netlista-filtr.csv',toCsv(visibleNetRows,['ref','net','pin','description']),'text/csv;charset=utf-8'));

    // Instrument CSV chart renderer.
    let wave = null, lastWavePoints = [];
    function numberValue(value){const parsed=Number(String(value??'').trim().replace(',','.'));return Number.isFinite(parsed)?parsed:null;}
    function drawWave(){
      if(!wave)return;const xi=Number($('n66WaveX').value), yi=Number($('n66WaveY').value); if(xi===yi){$('n66WaveStatus').textContent='Wybierz dwie różne kolumny.';return;}
      const points=wave.rows.map(row=>({x:numberValue(row[xi]),y:numberValue(row[yi])})).filter(p=>p.x!==null&&p.y!==null).slice(0,3000);
      if(points.length<2){$('n66WaveStatus').textContent='Wybrane kolumny muszą zawierać co najmniej dwa wiersze liczbowe.';return;}
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),spanX=maxX-minX||1,spanY=maxY-minY||1;
      const xy=points.map(p=>`${(48+(p.x-minX)/spanX*716).toFixed(1)},${(218-(p.y-minY)/spanY*186).toFixed(1)}`).join(' ');
      const grid=[0,1,2,3,4].map(i=>`<line x1="48" y1="${32+i*46}" x2="764" y2="${32+i*46}" stroke="rgba(130,190,220,.18)"/><text x="8" y="${36+i*46}" fill="#9db6c8" font-size="10">${(maxY-(maxY-minY)*i/4).toPrecision(4)}</text>`).join('');
      $('n66WaveChart').innerHTML=`<svg viewBox="0 0 790 260" role="img" aria-label="Wykres zaimportowanego przebiegu"><rect x="0" y="0" width="790" height="260" rx="12" fill="#06192a"/>${grid}<line x1="48" y1="218" x2="764" y2="218" stroke="#94b6cb"/><polyline points="${xy}" fill="none" stroke="#54c8ed" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><text x="48" y="248" fill="#9db6c8" font-size="11">X: ${esc(wave.headers[xi])} (${minX}…${maxX})</text><text x="764" y="18" text-anchor="end" fill="#9db6c8" font-size="11">Y: ${esc(wave.headers[yi])} (${minY}…${maxY})</text></svg>`;
      lastWavePoints=points;$('n66WaveStatus').textContent=`Wykres ${points.length} punktów z ${wave.rows.length} wierszy. Oś X: ${wave.headers[xi]}, oś Y: ${wave.headers[yi]}. Wartości są importowane z CSV, nie odczytywane na żywo.`;
      $('n66WaveSave').disabled=false;
    }
    $('n66WaveFile').addEventListener('change',async event=>{
      const file=event.target.files?.[0];if(!file)return;
      try{if(file.size===0||file.size>MAX_IMPORT)throw new Error('Plik musi mieć 1 B–5 MB.');const parsed=parseDelimited(await file.text());if(parsed.rows.length<3)throw new Error('CSV musi zawierać nagłówek i co najmniej dwa wiersze.');wave={name:clean(file.name,180),headers:parsed.rows[0].map((x,i)=>clean(x,80)||`Kolumna ${i+1}`),rows:parsed.rows.slice(1,MAX_ROWS+1)};const numeric=wave.headers.map((_,index)=>wave.rows.filter(r=>numberValue(r[index])!==null).length);const choices=wave.headers.map((h,i)=>`<option value="${i}" ${numeric[i]>=2?'':'disabled'}>${esc(h)} · ${numeric[i]} liczb</option>`).join('');$('n66WaveX').innerHTML=choices;$('n66WaveY').innerHTML=choices;const valid=numeric.map((n,i)=>n>=2?i:-1).filter(i=>i>=0);if(valid.length<2)throw new Error('Wykres wymaga co najmniej dwóch kolumn liczbowych.');$('n66WaveX').value=String(valid[0]);$('n66WaveY').value=String(valid[1]);$('n66WaveX').disabled=false;$('n66WaveY').disabled=false;$('n66WaveDraw').disabled=false;$('n66WaveStatus').textContent=`Wczytano ${wave.rows.length} wierszy z ${file.name}. Wybierz kolumny X/Y i narysuj wykres.`;drawWave();}
      catch(error){wave=null;$('n66WaveStatus').textContent=error.message;$('n66WaveX').disabled=true;$('n66WaveY').disabled=true;$('n66WaveDraw').disabled=true;$('n66WaveSave').disabled=true;}
      finally{event.target.value='';}
    });
    $('n66WaveDraw').addEventListener('click',drawWave);$('n66WaveX').addEventListener('change',drawWave);$('n66WaveY').addEventListener('change',drawWave);
    $('n66WaveSave').addEventListener('click',()=>{if(!wave||lastWavePoints.length<2)return;const item={id:uid('wave'),at:stamp(),name:wave.name,instrument:clean($('n66WaveInstrument').value,120),conditions:clean($('n66WaveConditions').value,180),x:wave.headers[Number($('n66WaveX').value)],y:wave.headers[Number($('n66WaveY').value)],points:lastWavePoints.slice(0,1000)};state.waveforms.unshift(item);state.waveforms=state.waveforms.slice(0,50);if(persist()){renderWaveHistory();$('n66WaveSave').disabled=true;}});
    function renderWaveHistory(){$('n66WaveHistory').innerHTML=state.waveforms.slice(0,20).map(x=>`<article class="n66-record"><b>${esc(x.name)} · ${esc(x.instrument||'przyrząd niepodany')}</b><small>${new Date(x.at).toLocaleString('pl-PL')} · X: ${esc(x.x)} · Y: ${esc(x.y)} · ${x.points.length} zapisanych punktów</small><small>${esc(x.conditions)}</small></article>`).join('')||'<p class="n66-note">Brak zapisanych przebiegów.</p>';}
    renderWaveHistory();

    // Repair Brain: evidence-backed rule selection plus context handoff to existing AI view.
    let latestBrainPrompt='';
    $('n66BrainForm').addEventListener('submit',event=>{
      event.preventDefault();const f=new FormData(event.currentTarget),input={device:clean(f.get('device'),80),model:clean(f.get('model'),120),board:clean(f.get('board'),120),codes:clean(f.get('codes'),160),symptom:clean(f.get('symptom'),400),evidence:clean(f.get('evidence'),1200),measurements:clean(f.get('measurements'),900),source:clean(f.get('source'),260)};
      const plan=analyzeSymptom(input);const item={id:uid('brain'),at:stamp(),...input,plan};state.diagnoses.unshift(item);state.diagnoses=state.diagnoses.slice(0,MAX_RECORDS);persist();
      latestBrainPrompt=`KONTEKST DIAGNOSTYCZNY DO WERYFIKACJI\nUrządzenie: ${input.device||'nie podano'}\nModel: ${input.model}\nBoard ID / rewizja: ${input.board||'nie podano'}\nKody: ${input.codes||'nie podano'}\nObjaw: ${input.symptom}\nDowody/testy: ${input.evidence||'nie podano'}\nPomiary: ${input.measurements||'nie podano'}\nŹródło: ${input.source||'nie podano'}\n\nWstępny obszar: ${plan.title}\nMożliwe obszary do sprawdzenia:\n- ${plan.hypotheses.join('\n- ')}\nBezpieczna kolejność:\n- ${plan.steps.join('\n- ')}\nBrakujące dane:\n- ${plan.missing.join('\n- ')||'Dalsza weryfikacja dokumentacji'}\n\nZadanie dla AI: oceń wyłącznie na podstawie dostarczonych dowodów. Nie wymyślaj napięć, pinów, schematów ani wyników. Wskaż, które twierdzenia wymagają źródła producenta. ${plan.notice}`;
      $('n66BrainResult').innerHTML=`<span class="n66-pill">WSTĘPNY TRIAGE / ${esc(plan.id.toUpperCase())}</span><h4>${esc(plan.title)}</h4><div class="n66-grid two"><div><b>Hipotezy do weryfikacji</b><ul>${plan.hypotheses.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><b>Bezpieczna kolejność</b><ol>${plan.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div><div><b>Brakujące dane</b><ul>${(plan.missing.length?plan.missing:['Podano podstawowe dane; potwierdź dokumentację i warunki pomiarów.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><b>Źródło:</b> ${esc(input.source||'Nie podano')}</p></div></div><div class="n66-note">${esc(plan.notice)}</div>`;
      for(const id of ['n66BrainCopy','n66BrainOpen','n66BrainDownload'])$(id).disabled=false;renderBrainHistory();
    });
    $('n66BrainCopy').addEventListener('click',async()=>{if(!latestBrainPrompt)return;try{await navigator.clipboard.writeText(latestBrainPrompt);setStatus('Skopiowano kontekst do schowka. Wklej go do Repair Master AI.');}catch(_){download('kontekst-ai-diagnostyka.txt',latestBrainPrompt);setStatus('Schowek niedostępny — pobrano kontekst TXT.');}});
    $('n66BrainOpen').addEventListener('click',async()=>{if(!latestBrainPrompt)return;try{await navigator.clipboard.writeText(latestBrainPrompt);}catch(_){}if(typeof window.ACADEMY_SHOW_VIEW==='function')window.ACADEMY_SHOW_VIEW('repairmaster');else if(typeof window.ACADEMY_BOOTSTRAP_NAV==='function')window.ACADEMY_BOOTSTRAP_NAV('repairmaster');else setStatus('Nie znaleziono widoku Repair Master AI. Użyj przycisku Kopiuj kontekst do AI.',true);});
    $('n66BrainDownload').addEventListener('click',()=>{if(latestBrainPrompt)download('nauka-ai-repair-brain-kontekst.txt',latestBrainPrompt);});
    function renderBrainHistory(){$('n66BrainHistory').innerHTML=state.diagnoses.slice(0,15).map(x=>`<article class="n66-record"><b>${esc(x.model)} — ${esc(x.plan.title)}</b><small>${new Date(x.at).toLocaleString('pl-PL')} · ${esc(x.board||'Board ID niepodany')}</small><p>${esc(x.symptom)}</p></article>`).join('')||'<p class="n66-note">Brak zapisanych analiz.</p>';}
    renderBrainHistory();

    // Browser facts vs manually entered hardware evidence are deliberately separated.
    let latestAudit = null;
    function collectBrowserAudit(){
      const navObj=navigator, connection=navObj.connection||navObj.mozConnection||navObj.webkitConnection;
      return {capturedAt:stamp(),source:'browser-api',userAgent:navObj.userAgent||'niedostępne',platform:navObj.userAgentData?.platform||navObj.platform||'niedostępne',language:navObj.language||'niedostępne',cores:Number.isFinite(navObj.hardwareConcurrency)?navObj.hardwareConcurrency:null,deviceMemoryGB:Number.isFinite(navObj.deviceMemory)?navObj.deviceMemory:null,screen:{width:screen.width,height:screen.height,pixelRatio:devicePixelRatio||1},online:navObj.onLine,connection:connection?{type:connection.type||'',effectiveType:connection.effectiveType||'',downlink:connection.downlink||null,rtt:connection.rtt||null}:null,cookieEnabled:navObj.cookieEnabled,serviceWorker:'serviceWorker' in navObj,webSerial:'serial' in navObj,webUSB:'usb' in navObj,webHID:'hid' in navObj};
    }
    function renderAudit(audit){const pairs=[['Źródło','API przeglądarki'],['Platforma',audit.platform],['Procesory logiczne',audit.cores??'brak odczytu'],['Pamięć urządzenia (est.)',audit.deviceMemoryGB?`${audit.deviceMemoryGB} GB — wartość przybliżona`:'brak odczytu'],['Ekran',`${audit.screen.width} × ${audit.screen.height} · DPR ${audit.screen.pixelRatio}`],['Język',audit.language],['Połączenie',audit.online?'online':'offline'],['Sieć',audit.connection?.effectiveType||'brak API'],['Web Serial',audit.webSerial?'API dostępne':'niedostępne'],['WebUSB',audit.webUSB?'API dostępne':'niedostępne'],['WebHID',audit.webHID?'API dostępne':'niedostępne']];$('n66AuditBrowser').innerHTML=pairs.map(([k,v])=>`<article class="n66-stat"><b>${esc(v)}</b><span>${esc(k)}</span></article>`).join('');}
    function renderWindowsAudit(audit){const summary=[['Komputer',`${audit.computer.manufacturer||''} ${audit.computer.model||''}`.trim()],['System',`${audit.os.caption||''} ${audit.os.version||''} / build ${audit.os.build||''}`.trim()],['Płyta',`${audit.baseboard.manufacturer||''} ${audit.baseboard.product||''}`.trim()],['BIOS',`${audit.bios.manufacturer||''} ${audit.bios.version||''}`.trim()],['CPU',audit.cpu.map(x=>x.name).filter(Boolean).join(' · ')||'brak odczytu'],['RAM',audit.memory.map(x=>`${x.capacityGB??'?'} GB ${x.partNumber||''} ${x.speedMHz??''} MHz`).join(' · ')||`${audit.computer.totalMemoryGB??'?'} GB`],['GPU',audit.gpu.map(x=>`${x.name||'GPU'} ${x.reportedVramGB?`(${x.reportedVramGB} GB zgłoszone)`:''}`).join(' · ')||'brak odczytu'],['Dyski',audit.disks.map(x=>`${x.model||'Dysk'} ${x.sizeGB??'?'} GB`).join(' · ')||'brak odczytu'],['Nośniki Storage',audit.physicalDisks.map(x=>`${x.friendlyName||'Nośnik'} · ${x.healthStatus||'stan nieznany'}${x.temperatureC!==null&&x.temperatureC!==undefined?` · ${x.temperatureC}°C`:''}`).join(' · ')||'brak danych'],['Monitory',audit.monitors.map(x=>`${x.manufacturer||''} ${x.model||''}`.trim()).filter(Boolean).join(' · ')||'brak odczytu']];$('n66AuditBrowser').innerHTML=summary.map(([k,v])=>`<article class="n66-stat"><b>${esc(v||'brak odczytu')}</b><span>${esc(k)}</span></article>`).join('')+`<p class="n66-note wide">Raport Windows CIM — ${esc(audit.capturedAt)}. Dane zależą od sterowników i dostępnych klas systemowych. Nie jest to test obciążeniowy ani pełna diagnostyka SMART.</p>`;}
    $('n66AuditRun').addEventListener('click',async()=>{let audit=collectBrowserAudit();if(navigator.userAgentData?.getHighEntropyValues){try{const extra=await navigator.userAgentData.getHighEntropyValues(['architecture','bitness','platformVersion','model']);audit.userAgentData=extra;}catch(_){audit.userAgentData=null;}}latestAudit=audit;renderAudit(audit);$('n66AuditExport').disabled=false;$('n66AuditStatus').textContent='Odczytano wyłącznie możliwości i dane udostępnione przez przeglądarkę. CPU/GPU/RAM/SMART/EDID nie są w pełni identyfikowane.';});
    $('n66AuditImport').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size===0||file.size>5*1024*1024)throw new Error('Raport JSON musi mieć 1 B–5 MB.');const parsed=normalizeWindowsAudit(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));if(!parsed)throw new Error('Nieobsługiwany raport. Wybierz JSON utworzony przez AUDYT_STANOWISKA_FIX17.ps1.');const item={id:uid('audit'),at:parsed.capturedAt,source:'Windows CIM / Storage — raport lokalny',kind:'windows-powershell',report:parsed};state.audits.unshift(item);state.audits=state.audits.slice(0,MAX_RECORDS);if(persist()){latestAudit=parsed;renderWindowsAudit(parsed);$('n66AuditExport').disabled=false;$('n66AuditStatus').textContent='Zaimportowano raport Windows. Wartości pochodzą z lokalnych klas CIM/Storage; temperatury i stan nośnika są dostępne tylko, jeśli udostępnia je sterownik.';renderAuditHistory();}}catch(error){$('n66AuditStatus').textContent=error.message;}finally{event.target.value='';}});
    $('n66AuditManual').addEventListener('submit',event=>{event.preventDefault();const f=new FormData(event.currentTarget),manual={id:uid('audit'),at:stamp(),source:clean(f.get('source'),260),components:{cpu:clean(f.get('cpu'),140),gpu:clean(f.get('gpu'),140),ram:clean(f.get('ram'),140),board:clean(f.get('board'),140),storage:clean(f.get('storage'),140),monitor:clean(f.get('monitor'),140)}};if(!Object.values(manual.components).some(Boolean)){$('n66AuditStatus').textContent='Wpisz co najmniej jeden komponent.';return;}state.audits.unshift(manual);state.audits=state.audits.slice(0,MAX_RECORDS);if(persist()){event.currentTarget.reset();renderAuditHistory();$('n66AuditStatus').textContent='Zapisano ręczny inwentarz. Dane są oznaczone jako wpisane przez technika.';}});
    $('n66AuditExport').addEventListener('click',()=>{if(!latestAudit)return;download('nauka-audyt-stanowiska.json',JSON.stringify({browser:latestAudit,manual:state.audits.slice(0,20)},null,2),'application/json;charset=utf-8');});
    function renderAuditHistory(){$('n66AuditHistory').innerHTML=state.audits.slice(0,20).map(x=>{if(x.kind==='windows-powershell'&&x.report){const r=x.report;return `<article class="n66-record"><b>Audyt Windows · ${esc(r.computer.model||'komputer')}</b><small>${new Date(x.at).toLocaleString('pl-PL')} · źródło: Windows CIM / Storage</small><p>CPU: ${esc(r.cpu.map(v=>v.name).filter(Boolean).join(' · ')||'—')} · GPU: ${esc(r.gpu.map(v=>v.name).filter(Boolean).join(' · ')||'—')} · RAM: ${r.computer.totalMemoryGB??'—'} GB · Dyski: ${r.disks.length}</p></article>`;}const components=x.components||{};return `<article class="n66-record"><b>Inwentarz ręczny · ${new Date(x.at).toLocaleString('pl-PL')}</b><small>Źródło: ${esc(x.source||'niepodano')}</small><p>${Object.entries(components).filter(([,v])=>v).map(([k,v])=>`${esc(k.toUpperCase())}: ${esc(v)}`).join(' · ')}</p></article>`;}).join('')||'<p class="n66-note">Brak zapisanych audytów.</p>';}
    renderAuditHistory();

    // Anonymous internal work cards; no customer name, phone, address or serial number fields.
    function renderOrders(){const q=clean($('n66OrderSearch').value,140).toLowerCase();const rows=state.workOrders.filter(x=>!q||[x.number,x.model,x.symptom,x.internalRef,x.device].join(' ').toLowerCase().includes(q));$('n66OrderList').innerHTML=rows.slice(0,150).map(x=>`<article class="n66-record"><div class="n66-order-head"><b>${esc(x.number)} · ${esc(x.device)} — ${esc(x.model)}</b><span class="n66-pill">${esc(x.status)}</span></div><p>${esc(x.symptom)}</p><small>Kod wewnętrzny: ${esc(x.internalRef||'brak')} · ${new Date(x.at).toLocaleString('pl-PL')}</small><p>Części: ${x.partsCost.toFixed(2)} zł · Robocizna: ${x.laborCost.toFixed(2)} zł · <b>Razem: ${x.total.toFixed(2)} zł</b></p><small>Akceptacja kosztorysu: ${x.approved?'zaznaczona przez technika':'niepotwierdzona'}</small><p>${esc(x.notes||'')}</p><div class="n66-actions"><label>Status<select data-order-status="${esc(x.id)}">${['Nowe','Diagnoza','Oczekuje na zgodę','W naprawie','Kontrola jakości','Gotowe','Wstrzymane'].map(v=>`<option ${v===x.status?'selected':''}>${v}</option>`).join('')}</select></label><button class="nwm-secondary" type="button" data-order-report="${esc(x.id)}">Raport TXT</button><button class="nwm-danger" type="button" data-order-delete="${esc(x.id)}">Usuń</button></div></article>`).join('')||'<p class="n66-note">Brak kart pracy.</p>';}
    $('n66OrderForm').addEventListener('submit',event=>{event.preventDefault();const f=new FormData(event.currentTarget),candidate=validateWorkOrder({device:f.get('device'),model:f.get('model'),symptom:f.get('symptom'),internalRef:f.get('internalRef'),status:f.get('status'),partsCost:f.get('partsCost'),laborCost:f.get('laborCost'),notes:f.get('notes'),approved:f.get('approved')==='on'});if(!candidate){setStatus('Sprawdź model, objaw i koszty (0–100 000 zł).',true);return;}const number=`NPA-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;const item={id:uid('job'),number,at:stamp(),...candidate};state.workOrders.unshift(item);state.workOrders=state.workOrders.slice(0,MAX_RECORDS);if(persist()){event.currentTarget.reset();renderOrders();}});
    $('n66OrderSearch').addEventListener('input',renderOrders);
    $('n66OrderList').addEventListener('change',event=>{const select=event.target.closest('[data-order-status]');if(!select)return;const item=state.workOrders.find(x=>x.id===select.dataset.orderStatus);if(item){item.status=select.value;item.updatedAt=stamp();persist();renderOrders();}});
    $('n66OrderList').addEventListener('click',event=>{const report=event.target.closest('[data-order-report]'),del=event.target.closest('[data-order-delete]');if(report){const x=state.workOrders.find(item=>item.id===report.dataset.orderReport);if(x)download(`${x.number}-raport.txt`,`KARTA PRACY ${x.number}\nData: ${x.at}\nUrządzenie: ${x.device}\nModel: ${x.model}\nObjaw: ${x.symptom}\nStatus: ${x.status}\nKod wewnętrzny: ${x.internalRef||'brak'}\nCzęści: ${x.partsCost.toFixed(2)} PLN\nRobocizna: ${x.laborCost.toFixed(2)} PLN\nRazem: ${x.total.toFixed(2)} PLN\nAkceptacja kosztorysu zaznaczona: ${x.approved?'tak':'nie'}\nNotatki: ${x.notes}\n\nDane lokalne, karta nie zawiera danych osobowych klienta.`);}if(del){if(!confirm('Usunąć tę lokalną kartę pracy?'))return;state.workOrders=state.workOrders.filter(x=>x.id!==del.dataset.orderDelete);persist();renderOrders();}});
    $('n66OrderCsv').addEventListener('click',()=>download('nauka-karty-pracy.csv',toCsv(state.workOrders,['number','at','device','model','symptom','internalRef','status','partsCost','laborCost','total','approved','notes']),'text/csv;charset=utf-8'));renderOrders();

    // Practical decision scenarios.
    let activeScenario=null, scenarioStep=0, scenarioScore=0;
    function showScenario(){const item=activeScenario.steps[scenarioStep];$('n66ScenarioStage').innerHTML=`<span class="n66-pill">${esc(activeScenario.title)} · KROK ${scenarioStep+1}/${activeScenario.steps.length}</span><h4>${esc(item.q)}</h4><div class="n66-options">${item.a.map((answer,index)=>`<button type="button" data-scenario-answer="${index}">${esc(answer)}</button>`).join('')}</div><div id="n66ScenarioFeedback" class="n66-result">Wybierz decyzję diagnostyczną.</div><button type="button" id="n66ScenarioNext" class="nwm-primary" hidden>${scenarioStep===activeScenario.steps.length-1?'Zakończ scenariusz':'Następny krok'}</button>`;const host=$('n66ScenarioStage');host.querySelectorAll('[data-scenario-answer]').forEach(button=>button.addEventListener('click',()=>{const choice=Number(button.dataset.scenarioAnswer),ok=choice===item.correct;if(ok)scenarioScore++;host.querySelectorAll('[data-scenario-answer]').forEach(other=>{other.disabled=true;if(Number(other.dataset.scenarioAnswer)===item.correct)other.classList.add('correct');else if(other===button)other.classList.add('incorrect');});$('n66ScenarioFeedback').textContent=`${ok?'Dobra decyzja. ':'To nie jest bezpieczna kolejność. '}${item.why}`;$('n66ScenarioNext').hidden=false;}));$('n66ScenarioNext').addEventListener('click',()=>{scenarioStep++;if(scenarioStep<activeScenario.steps.length)showScenario();else finishScenario();});}
    function finishScenario(){const result={id:uid('scenario'),at:stamp(),scenarioId:activeScenario.id,title:activeScenario.title,score:scenarioScore,total:activeScenario.steps.length,percent:Math.round(scenarioScore/activeScenario.steps.length*100)};state.simulatorResults.unshift(result);state.simulatorResults=state.simulatorResults.slice(0,MAX_RECORDS);persist();$('n66ScenarioStage').innerHTML=`<div class="n66-result ${result.percent>=75?'good':'bad'}"><h4>${result.percent>=75?'Scenariusz zaliczony':'Scenariusz do powtórki'}</h4><p>${result.score}/${result.total} poprawnych · ${result.percent}%</p><p>To wynik ćwiczenia decyzyjnego, nie test rzeczywistego sprzętu.</p><button type="button" id="n66ScenarioRetry" class="nwm-secondary">Powtórz scenariusz</button></div>`;$('n66ScenarioRetry').addEventListener('click',()=>startScenario(activeScenario.id));renderScenarioHistory();}
    function startScenario(id){activeScenario=scenarios.find(item=>item.id===id);if(!activeScenario)return;scenarioStep=0;scenarioScore=0;showScenario();}
    $('n66ScenarioPicker').innerHTML=scenarios.map(item=>`<button type="button" class="n66-scenario-card" data-scenario="${item.id}"><b>${esc(item.title)}</b><small>${item.steps.length} decyzje · lokalne ćwiczenie</small></button>`).join('');
    $('n66ScenarioPicker').addEventListener('click',event=>{const button=event.target.closest('[data-scenario]');if(button)startScenario(button.dataset.scenario);});
    function renderScenarioHistory(){$('n66ScenarioHistory').innerHTML=state.simulatorResults.slice(0,20).map(x=>`<article class="n66-record"><b>${esc(x.title)} · ${x.percent}%</b><small>${new Date(x.at).toLocaleString('pl-PL')} · ${x.score}/${x.total}</small></article>`).join('')||'<p class="n66-note">Brak wyników praktycznych.</p>';}
    renderScenarioHistory();

    // FIX17 data export/restore and narrowly scoped clear.
    $('n66BackupExport').addEventListener('click',()=>download('nauka-fix17-kopia-danych.json',JSON.stringify({format:'NPA-MASTER-CENTER-FIX17',version:1,createdAt:stamp(),records:state},null,2),'application/json;charset=utf-8'));
    $('n66BackupImport').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw new Error('Kopia przekracza 10 MB.');const payload=JSON.parse(await file.text());if(payload.format!=='NPA-MASTER-CENTER-FIX17'||payload.version!==1||!payload.records||typeof payload.records!=='object')throw new Error('Nieobsługiwany format kopii FIX17.');for(const key of ['sequences','netlists','waveforms','diagnoses','audits','workOrders','simulatorResults']){if(!Array.isArray(payload.records[key]))continue;const existing=state[key],ids=new Set(existing.map(x=>x.id).filter(Boolean));state[key]=[...existing,...payload.records[key].filter(x=>x&&typeof x==='object'&&x.id&&!ids.has(x.id))].slice(0,MAX_RECORDS);}if(persist()){$('n66BackupStatus').textContent='Kopia FIX17 scalona. Starsze rekordy FIX11–FIX16 nie zostały zmienione.';renderSequenceHistory();renderNetlist();renderWaveHistory();renderBrainHistory();renderAuditHistory();renderOrders();renderScenarioHistory();}}catch(error){$('n66BackupStatus').textContent=error.message;}finally{event.target.value='';}});
    $('n66BackupClear').addEventListener('click',()=>{if(!confirm('Usunąć wyłącznie lokalne rekordy FIX17? Dane FIX11–FIX16 pozostaną.'))return;localStorage.removeItem(STORE);state={sequences:[],netlists:[],waveforms:[],diagnoses:[],audits:[],workOrders:[],simulatorResults:[]};renderSequenceHistory();renderNetlist();renderWaveHistory();renderBrainHistory();renderAuditHistory();renderOrders();renderScenarioHistory();$('n66BackupStatus').textContent='Usunięto wyłącznie dane FIX17.';setStatus('Dane FIX17 usunięte. Starsze wersje zachowane.');});

    setStatus('FIX17 aktywny. Netlista i przebiegi importowane lokalnie; brak bezpośredniego sterowania sprzętem i brak synchronizacji danych FIX17.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
