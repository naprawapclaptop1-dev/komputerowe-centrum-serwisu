/* NAUKA OD A DO Z 6.8.0 FIX27 — PRACTICE & SPECIALIST ACADEMY
 * Local-first interactive training suite. Educational simulation only; no live PCB power control.
 */
(() => {
  'use strict';
  const STORE = 'npaPracticeAcademyFix27';
  const DB_NAME = 'npa-practice-academy-fix27';
  const DB_STORE = 'documents';
  const MAX_DOC = 20 * 1024 * 1024;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = (value, max=500) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0,max);
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const now = () => new Date().toISOString();
  const saveFile = (name, content, type='application/json;charset=utf-8') => {
    const blob = content instanceof Blob ? content : new Blob([content], {type});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  const PRACTICE_TABS = new Set(['pcb','challenge','schematic','bench','mentor','academies','exams','portfolio','instructor','search']);
  const PRACTICE_ACADEMIES = new Set(['mac','gpu','server','monitor','usbc','atx']);
  const PRACTICE_EXAMS = new Set([...PRACTICE_ACADEMIES,'pcb']);
  const PRACTICE_CHALLENGES = new Set(['no-power','no-display','usb-c','gpu-artifacts','ram']);
  const MEASUREMENT_KINDS = new Set(['voltage','resistance','continuity','current','temperature','frequency']);
  const MEASUREMENT_CONDITIONS = new Set(['isolated','powered','unknown']);
  const MEASUREMENT_UNITS = new Set(['V','mV','Ω','kΩ','mA','A','°C','Hz','kHz']);
  const safeRecordId = value => typeof value==='string' && /^[A-Za-z0-9._:-]{1,96}$/.test(value) ? value : uid('import');
  const safeDate = value => { const n=Date.parse(value); return Number.isFinite(n) ? new Date(n).toISOString() : now(); };
  const normalizeMeasurement = item => {
    if (!item || typeof item!=='object' || Array.isArray(item)) return null;
    const value=Number(item.value), kind=String(item.kind||'');
    if (!Number.isFinite(value) || !MEASUREMENT_KINDS.has(kind)) return null;
    const condition=MEASUREMENT_CONDITIONS.has(item.condition) ? item.condition : 'unknown';
    if ((kind==='resistance'||kind==='continuity') && condition!=='isolated') return null;
    return {id:safeRecordId(item.id),at:safeDate(item.at),point:clean(item.point,120),kind,value,unit:MEASUREMENT_UNITS.has(item.unit)?item.unit:'',condition,instrument:clean(item.instrument,80),reference:clean(item.reference,180)};
  };
  const normalizeChallengeRun = item => {
    if (!item || typeof item!=='object' || Array.isArray(item) || !PRACTICE_CHALLENGES.has(item.caseId)) return null;
    const score=Number(item.score); if(!Number.isInteger(score)||score<0||score>3)return null;
    const pct=Math.round(score/3*100);
    return {id:safeRecordId(item.id),caseId:item.caseId,title:clean(item.title,140),score,total:3,pct,at:safeDate(item.at)};
  };
  const normalizeExamRun = item => {
    if (!item || typeof item!=='object' || Array.isArray(item) || !PRACTICE_EXAMS.has(item.academy)) return null;
    const score=Number(item.score); if(!Number.isInteger(score)||score<0||score>4)return null;
    const pct=Math.round(score/4*100);
    return {id:safeRecordId(item.id),academy:item.academy,score,total:4,pct,passed:pct>=75,at:safeDate(item.at)};
  };
  const normalizeAssignment = item => {
    if (!item || typeof item!=='object' || Array.isArray(item)) return null;
    const title=clean(item.title,120),instructions=clean(item.instructions,1200);
    if(title.length<3||instructions.length<10)return null;
    const source=item.rubric&&typeof item.rubric==='object'&&!Array.isArray(item.rubric)?item.rubric:{};
    const score=k=>{const n=Number(source[k]);return Number.isInteger(n)?Math.max(0,Math.min(5,n)):0;};
    const rubric={'Diagnoza':score('Diagnoza'),'Bezpieczeństwo':score('Bezpieczeństwo'),'Dokumentacja':score('Dokumentacja'),'Test końcowy':score('Test końcowy')};
    return {id:safeRecordId(item.id),title,instructions,path:clean(item.path,80),createdAt:safeDate(item.createdAt),rubric,feedback:clean(item.feedback,700),reviewed:item.reviewed===true};
  };
  const normalizeState = raw => {
    const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const unique = (items, mapper, limit) => {
      const out=[],ids=new Set();
      for(const rawItem of (Array.isArray(items)?items:[]).slice(-limit*2)){
        const item=mapper(rawItem); if(!item||ids.has(item.id))continue; ids.add(item.id); out.push(item);
        if(out.length>=limit)break;
      }
      return out;
    };
    const paths=Object.create(null);
    for(const id of PRACTICE_ACADEMIES){const arr=source.paths&&Array.isArray(source.paths[id])?source.paths[id]:[];paths[id]=arr.slice(0,6).map(v=>v===true);}
    return {
      measurements:unique(source.measurements,normalizeMeasurement,500),
      challengeRuns:unique(source.challengeRuns,normalizeChallengeRun,300),
      examRuns:unique(source.examRuns,normalizeExamRun,300),
      assignments:unique(source.assignments,normalizeAssignment,200),
      paths,
      lastTab:PRACTICE_TABS.has(source.lastTab)?source.lastTab:'pcb',
      portfolioNote:clean(source.portfolioNote,1200)
    };
  };
  const readState = () => { try { return normalizeState(JSON.parse(localStorage.getItem(STORE)||'{}')); } catch (_) { return normalizeState({}); } };
  const state = readState();
  const calculations = Object.freeze({
    ohms(voltage, resistance) { if (![voltage,resistance].every(Number.isFinite) || resistance <= 0) throw new Error('Napięcie musi być liczbą, a rezystancja dodatnia.'); const current=voltage/resistance; return {current,power:voltage*current,resistance}; },
    divider(voltage, r1, r2) { if (![voltage,r1,r2].every(Number.isFinite) || r1 <= 0 || r2 <= 0) throw new Error('Rezystory muszą być dodatnie.'); const current=voltage/(r1+r2); return {output:voltage*r2/(r1+r2),current,powerR1:current*current*r1,powerR2:current*current*r2}; },
    rc(resistance, capacitance) { if (![resistance,capacitance].every(Number.isFinite) || resistance <= 0 || capacitance <= 0) throw new Error('R i C muszą być dodatnie.'); const tau=resistance*capacitance; return {tau,at63:tau,at993:5*tau}; }
  });
  window.ACADEMY_PRACTICE_FIX27_API = { calculations, normalizeState, boardParts: null, challenges: null, academies: null, exams: null, resources: null };
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); status('Zapisano lokalny postęp FIX27.'); return true; } catch(e) { status('Nie udało się zapisać danych. Wyeksportuj postęp i zwolnij miejsce w przeglądarce.',true); return false; } };
  const status = (msg, bad=false) => { const n=$('p27Status'); if(n){n.textContent=msg;n.dataset.kind=bad?'error':'ok';} };
  const dbOpen = () => new Promise((resolve,reject)=>{
    if (!('indexedDB' in window)) return reject(new Error('Ta przeglądarka nie obsługuje IndexedDB.'));
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE)){const s=db.createObjectStore(DB_STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt');}};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error||new Error('Nie można otworzyć lokalnej biblioteki.'));
  });
  const dbTx = async (mode, work) => { const db=await dbOpen(); return new Promise((resolve,reject)=>{ const tx=db.transaction(DB_STORE,mode); const store=tx.objectStore(DB_STORE); let result; try{result=work(store);}catch(e){db.close();reject(e);return;} tx.oncomplete=()=>{db.close();resolve(result&&result.result!==undefined?result.result:result);};tx.onerror=()=>{db.close();reject(tx.error||new Error('Błąd IndexedDB.'));};tx.onabort=()=>{db.close();reject(tx.error||new Error('Przerwano zapis.'));};}); };
  const idbGetAll = async () => { const db=await dbOpen(); return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();}); };
  const idbGet = async id => { const db=await dbOpen(); return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();}); };
  const idbPut = async record => { const db=await dbOpen(); return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(record);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error);};}); };
  const idbDelete = async id => { const db=await dbOpen(); return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error);};}); };

  const boardParts = [
    {id:'U1',name:'Kontroler EC',ref:'U1 / Embedded Controller',role:'Zarządza sekwencją startową i wybranymi sygnałami platformy.',tests:'Sprawdź zasilania, sygnały reset/enable oraz komunikację zgodnie ze schematem konkretnej płyty.',risk:'Nie przypisuj napięć bez schematu i rewizji PCB.'},
    {id:'PU1',name:'Kontroler przetwornicy',ref:'PU1 / PWM controller',role:'Steruje stopniem zasilania danej szyny.',tests:'Zweryfikuj VIN, EN, feedback i sygnały bramek wyłącznie w zatwierdzonej procedurze.',risk:'Pomiary w obwodzie zasilanym wykonuje wyłącznie osoba kompetentna, z właściwą sondą.'},
    {id:'Q1',name:'MOSFET',ref:'Q1 / Power switch',role:'Przełącza lub zabezpiecza linię zasilania.',tests:'Porównaj pinout, oznaczenie i kartę katalogową; sprawdź zwarcia po bezpiecznym odłączeniu.',risk:'Nie zwieraj bramki, drenu ani źródła w celu testu.'},
    {id:'L1',name:'Dławik',ref:'L1 / Inductor',role:'Element magazynujący energię w przetwornicy.',tests:'Zmierz rezystancję tylko po odłączeniu zasilania; interpretuj ją z topologią i dokumentacją.',risk:'Niska rezystancja DC nie oznacza automatycznie zwarcia.'},
    {id:'F1',name:'Bezpiecznik',ref:'F1 / Fuse',role:'Chroni obwód przed nadmiernym prądem.',tests:'Sprawdź ciągłość po odłączeniu zasilania i znajdź przyczynę przepalenia przed wymianą.',risk:'Nigdy nie mostkuj bezpiecznika i nie zwiększaj jego wartości.'},
    {id:'J1',name:'Złącze USB-C',ref:'J1 / USB-C connector',role:'Może obsługiwać zasilanie, dane i alternatywne tryby obrazu.',tests:'Zweryfikuj port, przewód, kontroler PD i linie CC według dokumentacji.',risk:'Ładowanie nie dowodzi sprawności toru danych.'},
    {id:'U2',name:'Pamięć / układ BGA',ref:'U2 / Memory IC',role:'Układ pamięci lub inny komponent w obudowie BGA.',tests:'Najpierw wyklucz moduły, slot, ustawienia i kontroler; używaj testów producenta.',risk:'Nie wykonuj reflow jako uniwersalnej naprawy.'},
    {id:'CN1',name:'Złącze matrycy',ref:'CN1 / eDP connector',role:'Łączy płytę z panelem wyświetlacza.',tests:'Sprawdź dokumentację panelu, stan taśmy i złącza przy całkowicie odłączonym zasilaniu.',risk:'Taśma eDP może przenosić linie zasilania podświetlenia.'}
  ];

  const challenges = [
    {id:'no-power',title:'Laptop nie reaguje na przycisk zasilania',level:'Podstawowy',summary:'Brak diod i reakcji. Ustal bezpieczną kolejność kontroli.',steps:[
      {q:'Jaki jest pierwszy krok przed rozbieraniem urządzenia?',a:['Odłączyć zasilacz, odłączyć baterię zgodnie z procedurą i ocenić ryzyka','Od razu wymienić kontroler EC','Zewrzeć piny przycisku'],correct:0,why:'Najpierw bezpieczeństwo, odłączenie źródeł energii i identyfikacja modelu. Nie zwieraj nieznanych pinów.'},
      {q:'Co sprawdzasz bez rozbierania płyty?',a:['Znany sprawny zasilacz i przewód o właściwych parametrach','Losowy zasilacz o wyższym napięciu','Tylko kolor diody'],correct:0,why:'Potwierdź zasilacz, przewód i zgodność napięcia/protokołu zgodnie z urządzeniem.'},
      {q:'Po potwierdzeniu wejścia zasilania nadal brak reakcji. Co dalej?',a:['Dokumentacja platformy, bezpieczniki i sekwencja startowa według schematu','Podgrzewanie wszystkich układów','Wymiana EC bez pomiarów'],correct:0,why:'Zbierz model, board ID, rewizję, schemat i udokumentowane pomiary. Sama cisza nie wskazuje uszkodzonego EC.'}
    ]},
    {id:'no-display',title:'Laptop uruchamia się, ale nie ma obrazu',level:'Podstawowy',summary:'Oddziel problem panelu od problemu POST/GPU.',steps:[
      {q:'Jaki test może szybko rozdzielić tor matrycy od problemu POST?',a:['Sprawdzenie obrazu na znanym sprawnym monitorze zewnętrznym','Wymiana matrycy bez testu','Podniesienie napięcia GPU'],correct:0,why:'Monitor zewnętrzny pomaga rozdzielić część usterek panelu i toru obrazu, ale wynik nadal wymaga interpretacji.'},
      {q:'Obraz zewnętrzny działa. Co sprawdzasz?',a:['Model panelu, taśmę eDP, złącza i dokumentację; zasilanie odłączone przed manipulacją','Przeprogramowanie BIOS w ciemno','Zwarcie pinów złącza'],correct:0,why:'Przed odłączeniem taśmy wyłącz sprzęt i odłącz zasilanie oraz baterię zgodnie z procedurą.'},
      {q:'Nie ma obrazu także zewnętrznie. Jak postąpić?',a:['Sprawdź kody POST, RAM, zasilania i logi, nie przesądzaj winy GPU','Od razu wymień GPU','Uznaj płytę za nienaprawialną'],correct:0,why:'Brak obrazu ma wiele przyczyn. Potrzebne są dane POST, RAM, zasilania i platformy.'}
    ]},
    {id:'usb-c',title:'USB-C ładuje tylko w jednej orientacji',level:'Średni',summary:'Ćwicz rozdzielenie przewodu, portu, CC i kontrolera PD.',steps:[
      {q:'Co wykluczasz jako pierwsze?',a:['Znany sprawny przewód i zasilacz zgodne z urządzeniem','Kontroler PD poprzez reflow','Zwarcie linii CC'],correct:0,why:'Zacznij od akcesoriów i prostych testów bez ingerencji w płytę.'},
      {q:'Który obszar jest istotny przy różnicy orientacji wtyku?',a:['Port i obie linie CC wraz z ich ochroną i kontrolerem','Tylko pamięć RAM','Wyłącznie BIOS'],correct:0,why:'Zachowanie orientacji może wskazywać tor CC/port, ale wymaga weryfikacji schematem.'},
      {q:'Jak dokumentujesz pomiary?',a:['Punkt, warunek zasilania, przyrząd, zakres i źródło wartości odniesienia','Samą liczbę bez jednostki','Wymyśloną wartość referencyjną'],correct:0,why:'Pomiar bez punktu, warunków, jednostki i źródła odniesienia nie jest użytecznym dowodem.'}
    ]},
    {id:'gpu-artifacts',title:'Artefakty obrazu pod obciążeniem',level:'Zaawansowany',summary:'Ustal, co monitorować i kiedy przerwać test.',steps:[
      {q:'Co zapisujesz przed testem?',a:['Model GPU, sterownik, temperatury spoczynkowe, taktowanie i objaw','Tylko wynik FPS','Hasło użytkownika'],correct:0,why:'Zapisz środowisko i stan bazowy; nie publikuj danych osobowych.'},
      {q:'Temperatura szybko rośnie i pojawiają się artefakty. Co robisz?',a:['Przerywasz test i sprawdzasz chłodzenie/warunki','Zwiększasz obciążenie bez limitu','Ignorujesz temperaturę'],correct:0,why:'Przerwij test przy anomalii termicznej, zapachu, dźwięku lub niestabilności.'},
      {q:'Czy artefakty oznaczają zawsze uszkodzoną pamięć VRAM?',a:['Nie, trzeba wykluczyć sterownik, kabel, ekran, GPU, pamięć i zasilanie','Tak, zawsze','Tylko jeśli karta jest nowa'],correct:0,why:'Objaw nie jest diagnozą. Porównuj wiele testów i źródła danych.'}
    ]},
    {id:'ram',title:'Niestabilne błędy pamięci RAM',level:'Średni',summary:'Ustal, czy problem dotyczy modułu, slotu czy platformy.',steps:[
      {q:'Jaki jest dobry pierwszy test?',a:['Przywrócić ustawienia bazowe i testować pojedyncze moduły/sloty','Podnosić napięcie bez danych','Wymienić płytę od razu'],correct:0,why:'Usuń wpływ profilu XMP/EXPO i porównaj moduły oraz sloty w kontrolowany sposób.'},
      {q:'Błąd występuje tylko w jednym slocie. Co dokumentujesz?',a:['Konfigurację, moduł, slot, wersję BIOS i powtarzalność testu','Tylko nazwę komputera','Wynik bez konfiguracji'],correct:0,why:'Powtarzalność i dokładna konfiguracja pomagają rozdzielić moduł, slot, socket i kontroler.'},
      {q:'Czy test pamięci może być destrukcyjny dla danych?',a:['Testy pamięci zwykle nie kasują danych, ale przed zmianami BIOS i naprawą zabezpiecz dane','Każdy test automatycznie usuwa dysk','Nigdy nie trzeba robić kopii'],correct:0,why:'Zabezpiecz ważne dane przed zmianami firmware, systemu lub konfiguracji.'}
    ]}
  ];

  const academies = [
    {id:'mac',title:'MacBook & Apple Silicon',tag:'MAC / LOGIC BOARD',level:'Zaawansowany',desc:'Diagnostyka platform Intel i Apple Silicon bez zgadywania i bez nieautoryzowanego obchodzenia zabezpieczeń.',lessons:['Identyfikacja modelu i numeru płyty','Architektura zasilania i sekwencje startowe','USB-C/PD i diagnostyka ładowania','Diagnostyka obrazu i toru wyświetlania','Analiza logów i trybów odzyskiwania','Test końcowy i dokumentacja naprawy']},
    {id:'gpu',title:'Naprawa kart graficznych',tag:'GPU / VRAM / VRM',level:'Zaawansowany',desc:'Artefakty, pamięć, sekcje zasilania, chłodzenie, sterowniki i walidacja stabilności.',lessons:['Identyfikacja GPU i rewizji PCB','Zasilanie VRM i sygnały enable','Diagnostyka VRAM i artefaktów','Termika, pasta, pady i docisk','Sterowniki, testy i logowanie wyników','Raport i test długotrwały']},
    {id:'server',title:'Serwery, RAID i pamięci ECC',tag:'SERVER / STORAGE',level:'Ekspert',desc:'Planowanie diagnostyki serwerów, kontrolerów RAID, dysków, redundancji i pamięci ECC.',lessons:['Identyfikacja platformy i kontrolera','SMART i ocena nośników przed odbudową','Poziomy RAID i scenariusze awarii','ECC, kanały pamięci i logi BMC','Procedury kopii i odzyskiwania','Walidacja odtworzenia usług']},
    {id:'monitor',title:'Monitory i elektronika wyświetlaczy',tag:'LCD / LED / T-CON',level:'Średniozaawansowany',desc:'Zasilanie, podświetlenie, tor obrazu, T-CON, eDP/LVDS i kontrola panelu.',lessons:['Identyfikacja panelu i zasilacza','Podświetlenie LED i sterowanie','T-CON i tor sygnałowy','eDP/LVDS oraz bezpieczne złącza','Pomiary według dokumentacji','Test obrazu i równomierności']},
    {id:'usbc',title:'USB-C i Power Delivery',tag:'USB-C / PD / ALT MODE',level:'Średniozaawansowany',desc:'Negocjacja PD, linie CC, kontrolery, zabezpieczenia ESD i tryby alternatywne.',lessons:['Profile zasilania i role portu','CC1/CC2 i orientacja wtyku','Kontrolery PD i firmware','ESD, filtry i uszkodzenia portu','USB4/Thunderbolt — podstawy toru','Test zgodności przewodu i urządzenia']},
    {id:'atx',title:'Zasilacze ATX i zasilanie PC',tag:'PSU / ATX / VRM',level:'Zaawansowany',desc:'Architektura zasilania komputera, sygnały sterujące, zabezpieczenia i diagnostyka objawów.',lessons:['Standard ATX i sygnały sterujące','Standby, PS_ON i PWR_OK — teoria','Topologia przetwornic i VRM','Zabezpieczenia OCP/OVP/OTP/SCP','Analiza tętnień w dokumentowanych warunkach','Test końcowy bez niebezpiecznych modyfikacji']}
  ];

  window.ACADEMY_PRACTICE_FIX27_API.boardParts = boardParts;
  window.ACADEMY_PRACTICE_FIX27_API.challenges = challenges;
  window.ACADEMY_PRACTICE_FIX27_API.academies = academies;

  const exams = {
    mac:[
      ['Co należy ustalić przed diagnozą MacBooka?', ['Dokładny model, identyfikator płyty, rewizję i objaw', 'Tylko kolor obudowy', 'Wyłącznie numer ładowarki'],0,'Modele i rewizje różnią się architekturą oraz procedurami serwisowymi.'],
      ['MacBook nie ładuje baterii. Od czego zacząć?', ['Sprawdzić znany sprawny zasilacz/przewód, port, stan baterii i dokumentację', 'Wykonać reflow kontrolera', 'Od razu wymienić płytę'],0,'Najpierw wyklucz akcesoria i zbierz dane bez ingerencji w płytę.'],
      ['Co jest ważne przy analizie sekwencji startowej?', ['Odniesienie pomiarów do schematu i kolejności sygnałów danej platformy', 'Losowe podawanie napięć', 'Zwarcie punktów testowych'],0,'Sekwencje i nazwy sygnałów zależą od konkretnej płyty.'],
      ['Jak dokumentować przypadek po naprawie?', ['Objaw, model/rewizję, pomiary, źródła wartości i test końcowy', 'Tylko informację „działa”', 'Hasła i klucze klienta'],0,'Raport powinien być odtwarzalny i nie może zawierać sekretów klienta.']
    ],
    pcb:[
      ['Co musi być znane przed interpretacją pomiaru na płycie?',['Dokładny model, board ID/rewizja, punkt i warunki pomiaru','Tylko marka laptopa','Kolor laminatu'],0,'Wartości zależą od topologii i rewizji.'],
      ['Czy niski opór szyny zawsze dowodzi zwarcia?',['Tak','Nie — oceń topologię, kondensatory i dane odniesienia','Tylko na GPU'],1,'Niska rezystancja może być normalna dla niektórych szyn.'],
      ['Co robisz przed testem omomierzem?',['Odłącz zasilanie i baterię, rozładuj obwód według procedury','Zostaw podłączoną ładowarkę','Uruchom test pod obciążeniem'],0,'Tryb omomierza używaj tylko na bezpiecznie odłączonym obwodzie.'],
      ['Kiedy wymieniasz bezpiecznik?',['Po ustaleniu przyczyny przepalenia i z zachowaniem parametrów','Na większy, aby nie przepalał','Mostkujesz go'],0,'Nie mostkuj zabezpieczeń.']
    ],
    gpu:[
      ['Co robisz przy gwałtownym wzroście temperatury?',['Przerywasz test','Zwiększasz obciążenie','Ignorujesz alarm'],0,'Bezpieczeństwo i ochrona sprzętu mają pierwszeństwo.'],
      ['Artefakty zawsze oznaczają VRAM?',['Tak','Nie, wyklucz kabel, monitor, sterownik, GPU i zasilanie','Zawsze HDMI'],1,'Objawy wymagają różnicowania.'],
      ['Co zapisujesz z testu GPU?',['Model, wersję sterownika, temperaturę, taktowanie i warunki','Tylko liczbę FPS','Dane logowania'],0,'Raport musi umożliwiać odtworzenie warunków.'],
      ['Czy reflow jest uniwersalną naprawą?',['Tak','Nie, wymaga diagnozy, sprzętu i procedury; może pogorszyć uszkodzenie','Tak, dla każdego BGA'],1,'Nie stosuj bezrefleksyjnego podgrzewania.']
    ],
    server:[
      ['Przed odbudową RAID co jest najważniejsze?',['Zabezpieczenie obrazu/backup i identyfikacja kolejności dysków','Wymiana wszystkich dysków','Losowa zmiana poziomu RAID'],0,'Nie eksperymentuj na oryginalnych nośnikach.'],
      ['Czy SMART „GOOD” gwarantuje sprawność?',['Tak','Nie, to tylko zestaw wskaźników i nie wyklucza awarii','Tylko dla SSD'],1,'SMART nie daje gwarancji.'],
      ['Co opisuje ECC?',['Wykrywanie/korygowanie określonych błędów pamięci','Szybszy dysk','Typ złącza SATA'],0,'ECC zależy od wspieranej platformy.'],
      ['Co weryfikujesz po odtworzeniu RAID?',['Spójność, stan macierzy, logi, kopie i test usług','Tylko diodę obudowy','Sam rozmiar woluminu'],0,'Odtworzenie wymaga testu całości.']
    ],
    monitor:[
      ['Przed odłączeniem taśmy eDP?',['Wyłącz i odłącz źródła zasilania zgodnie z procedurą','Zostaw urządzenie włączone','Zewrzyj piny'],0,'Taśma może przenosić zasilanie.'],
      ['Obraz widać pod latarką, ale brak podświetlenia. Co badać?',['Tor podświetlenia, panel, złącze i sterowanie według dokumentacji','Od razu GPU','Tylko RAM'],0,'To wskazówka, nie końcowa diagnoza.'],
      ['Czy każdy panel ma ten sam pinout?',['Tak','Nie — sprawdź dokładny numer i dokumentację panelu','Tylko 15 cali'],1,'Nie podłączaj panelu na podstawie samego złącza.'],
      ['Jak potwierdzić naprawę?',['Test obrazu, jasności, kolorów i pracy w różnych stanach','Sam ekran startowy','Tylko pomiar napięcia'],0,'Potrzebny jest test funkcjonalny.']
    ],
    usbc:[
      ['Co odpowiada za wykrycie orientacji wtyku USB-C?',['Linie CC1/CC2 i logika kontrolera','RAM','SATA'],0,'Linie CC są częścią negocjacji Type-C.'],
      ['Ładowanie działa, dane nie. Co może być przyczyną?',['Osobny tor danych, przewód, kontroler lub zabezpieczenia','Zawsze bateria','Tylko BIOS'],0,'Ładowanie i dane to różne funkcje.'],
      ['Czy można użyć dowolnego zasilacza USB-C?',['Nie, trzeba uwzględnić obsługiwane profile i standardy','Tak, bez względu na parametry','Tylko wyższe napięcie'],0,'Dobierz sprzęt do specyfikacji urządzenia.'],
      ['Co dokumentujesz przy pomiarze CC?',['Punkt, stan, przewód, przyrząd, jednostkę i źródło','Tylko wynik','Nic'],0,'Pomiary muszą mieć kontekst.']
    ],
    atx:[
      ['Co oznacza PS_ON w typowym ATX?',['Sygnał sterujący włączeniem głównych szyn PSU','Linia audio','Sygnał wentylatora CPU'],0,'To sygnał sterujący, nie szyna zasilania.'],
      ['Czy należy otwierać zasilacz ATX bez kwalifikacji?',['Nie — wewnątrz mogą występować niebezpieczne napięcia','Tak, zawsze','Tylko po podłączeniu'],0,'Kondensatory mogą utrzymywać ładunek.'],
      ['Co oznacza PWR_OK?',['Informację o poprawności głównych wyjść w określonych warunkach','Napięcie USB','Temperaturę CPU'],0,'Sygnał informuje płytę o stanie zasilacza.'],
      ['Jak diagnozować niestabilność PC?',['Porównywać szyny, obciążenie, logi i komponenty według bezpiecznej procedury','Losowo zmieniać napięcia','Zwiększać limit mocy'],0,'Nie zmieniaj parametrów zasilania bez danych.']
    ]
  };

  const resources = [
    ...boardParts.map(p=>({title:p.name,category:'PCB / komponenty',text:`${p.ref}. ${p.role} ${p.tests} ${p.risk}`,tab:'pcb'})),
    ...challenges.map(c=>({title:c.title,category:'Przypadki diagnostyczne',text:c.summary+' '+c.steps.map(s=>s.q+' '+s.why).join(' '),tab:'challenge'})),
    ...academies.map(a=>({title:a.title,category:'Akademie specjalistyczne',text:a.desc+' '+a.lessons.join(' '),tab:'academies'})),
    {title:'Prawo Ohma i moc',category:'Elektronika',text:'Napięcie prąd rezystancja moc elektryczna kalkulator obwodu',tab:'bench'},
    {title:'Dzielnik napięcia',category:'Elektronika',text:'Dzielnik napięcia dwa rezystory Vin Vout',tab:'bench'},
    {title:'Stała czasowa RC',category:'Elektronika',text:'Rezystor kondensator stała czasowa ładowanie',tab:'bench'},
    {title:'Przeglądarka schematów',category:'Dokumentacja',text:'PDF obraz schemat BoardView znaczniki notatki lokalne',tab:'schematic'},
    {title:'Asystent mentora',category:'AI / nauka',text:'AI TECHNICIAN MENTOR model objaw pomiary kontekst pytanie do asystenta',tab:'mentor'},
    {title:'Egzaminy specjalistyczne',category:'Egzaminy',text:'test wiedzy punkty wynik wyjaśnienia ścieżki GPU serwer Mac monitor USB-C zasilacz',tab:'exams'},
    {title:'Portfolio technika',category:'Postępy',text:'umiejętności osiągnięcia ukończone lekcje raport eksport lokalny',tab:'portfolio'},
    {title:'Studio instruktora',category:'Nauczanie',text:'zadania ucznia kryteria rubryka ocenianie komentarze lokalnie',tab:'instructor'}
  ];
  window.ACADEMY_PRACTICE_FIX27_API.exams = exams;
  window.ACADEMY_PRACTICE_FIX27_API.resources = resources;

  function openTab(tab) {
    if(!PRACTICE_TABS.has(tab)) tab='pcb';
    document.querySelectorAll('[data-p27-tab]').forEach(b=>{const on=b.dataset.p27Tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
    document.querySelectorAll('[data-p27-pane]').forEach(p=>{p.hidden=p.dataset.p27Pane!==tab;});
    state.lastTab=tab; persist();
  }

  function renderBoard() {
    const host=$('p27BoardParts'); if(!host)return;
    host.innerHTML=boardParts.map((p,i)=>`<button type="button" class="p27-part ${i===0?'active':''}" data-part="${p.id}"><b>${p.id}</b><span>${esc(p.name)}</span></button>`).join('');
    host.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>showPart(b.dataset.part)));
    showPart(boardParts[0].id);
  }
  function showPart(id) {
    const p=boardParts.find(x=>x.id===id); if(!p)return;
    document.querySelectorAll('[data-part]').forEach(b=>b.classList.toggle('active',b.dataset.part===id));
    const detail=$('p27PartDetail'); if(detail)detail.innerHTML=`<span class="p27-kicker">${esc(p.ref)}</span><h3>${esc(p.name)}</h3><p>${esc(p.role)}</p><h4>Plan kontroli</h4><p>${esc(p.tests)}</p><div class="p27-warning">${esc(p.risk)}</div><button type="button" class="p27-btn" id="p27PartToMeasurement">Dodaj pomiar tego elementu</button>`;
    const btn=$('p27PartToMeasurement'); if(btn)btn.addEventListener('click',()=>{const f=$('p27MeasurePoint');if(f)f.value=p.ref;openTab('pcb');$('p27MeasureValue')?.focus();});
  }
  function renderMeasurements() {
    const host=$('p27MeasurementRows'); if(!host)return;
    host.innerHTML=state.measurements.slice().reverse().map(m=>`<tr><td>${esc(new Date(m.at).toLocaleString('pl-PL'))}</td><td>${esc(m.point)}</td><td>${esc(m.kind)}</td><td>${esc(m.value)} ${esc(m.unit)}</td><td>${esc(m.condition)}</td><td>${esc(m.instrument||'—')}</td></tr>`).join('') || '<tr><td colspan="6">Brak własnych pomiarów. Dodaj pierwszy wpis powyżej.</td></tr>';
    const c=$('p27MeasurementCount'); if(c)c.textContent=String(state.measurements.length);
  }
  function addMeasurement(event) {
    event.preventDefault(); const form=event.currentTarget; const d=new FormData(form);
    const kind=clean(d.get('kind'),30),condition=clean(d.get('condition'),30),value=Number(d.get('value'));
    if(!Number.isFinite(value)){status('Wpisz poprawną wartość pomiaru.',true);return;}
    if((kind==='resistance'||kind==='continuity') && condition!=='isolated'){status('Zablokowano zapis: pomiar rezystancji/ciągłości wymaga odłączenia zasilania i rozładowania obwodu.',true);return;}
    const record={id:uid('m'),at:now(),point:clean(d.get('point'),120),kind,value,unit:clean(d.get('unit'),20),condition,instrument:clean(d.get('instrument'),80),reference:clean(d.get('reference'),180)};
    if(!record.point){status('Podaj punkt pomiarowy.',true);return;}
    state.measurements.push(record); if(state.measurements.length>500)state.measurements=state.measurements.slice(-500);persist();form.reset();renderMeasurements();
  }
  function exportMeasurements(){const rows=[['Data','Punkt','Rodzaj','Wartość','Jednostka','Stan','Przyrząd','Źródło odniesienia'],...state.measurements.map(m=>[m.at,m.point,m.kind,m.value,m.unit,m.condition,m.instrument,m.reference])];const textCell=x=>{let v=String(x??'');if(/^[\s]*[=+@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};saveFile('NPA_FIX27_pomiary.csv','\uFEFF'+rows.map((r,i)=>r.map((x,j)=>i>0&&[1,6,7].includes(j)?textCell(x):'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8');}

  let activeChallenge=null, challengeStep=0, challengeScore=0, challengeAnswered=false;
  function renderChallengePicker(){const h=$('p27ChallengePicker');if(!h)return;h.innerHTML=challenges.map(c=>`<button type="button" class="p27-case-card" data-challenge="${c.id}"><span>${esc(c.level)}</span><b>${esc(c.title)}</b><small>${esc(c.summary)}</small></button>`).join('');h.querySelectorAll('[data-challenge]').forEach(b=>b.addEventListener('click',()=>startChallenge(b.dataset.challenge)));}
  function startChallenge(id){activeChallenge=challenges.find(c=>c.id===id);if(!activeChallenge)return;challengeStep=0;challengeScore=0;challengeAnswered=false;showChallengeStep();}
  function showChallengeStep(){const host=$('p27ChallengeStage');if(!host||!activeChallenge)return;const s=activeChallenge.steps[challengeStep];host.hidden=false;host.innerHTML=`<div class="p27-stage-head"><span>${esc(activeChallenge.title)}</span><b>KROK ${challengeStep+1}/${activeChallenge.steps.length}</b></div><h3>${esc(s.q)}</h3><div class="p27-answer-grid">${s.a.map((a,i)=>`<button type="button" data-answer="${i}">${esc(a)}</button>`).join('')}</div><div id="p27ChallengeFeedback" class="p27-feedback" aria-live="polite">Wybierz odpowiedź, aby zobaczyć wyjaśnienie.</div><button type="button" class="p27-btn" id="p27ChallengeNext" hidden>${challengeStep===activeChallenge.steps.length-1?'Zakończ przypadek':'Następny krok →'}</button>`;
    host.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{if(challengeAnswered)return;challengeAnswered=true;const choice=Number(b.dataset.answer),ok=choice===s.correct;if(ok)challengeScore++;host.querySelectorAll('[data-answer]').forEach(x=>{x.disabled=true;if(Number(x.dataset.answer)===s.correct)x.classList.add('correct');else if(x===b)x.classList.add('incorrect');});$('p27ChallengeFeedback').textContent=`${ok?'Dobra decyzja. ':'To nie jest najlepsza kolejność. '}${s.why}`;$('p27ChallengeNext').hidden=false;}));
    $('p27ChallengeNext').addEventListener('click',()=>{if(challengeStep<activeChallenge.steps.length-1){challengeStep++;challengeAnswered=false;showChallengeStep();}else finishChallenge();});
  }
  function finishChallenge(){const pct=Math.round(challengeScore/activeChallenge.steps.length*100);state.challengeRuns.push({id:uid('case'),caseId:activeChallenge.id,title:activeChallenge.title,score:challengeScore,total:activeChallenge.steps.length,pct,at:now()});persist();const h=$('p27ChallengeStage');h.innerHTML=`<div class="p27-result"><span>WYNIK PRZYPADKU</span><strong>${pct}%</strong><h3>${esc(activeChallenge.title)}</h3><p>${challengeScore}/${activeChallenge.steps.length} poprawnych decyzji.</p><button type="button" class="p27-btn" id="p27ChallengeAgain">Powtórz przypadek</button><button type="button" class="p27-btn secondary" id="p27ChallengeBack">Wróć do przypadków</button></div>`;$('p27ChallengeAgain').addEventListener('click',()=>startChallenge(activeChallenge.id));$('p27ChallengeBack').addEventListener('click',()=>{h.hidden=true;});renderProgress();}

  let activeDocId=null, activeDocUrl=null, currentDoc=null;
  async function renderDocs(){const list=$('p27DocList');if(!list)return;try{const docs=(await idbGetAll()).filter(d=>d&&typeof d.id==='string'&&d.blob instanceof Blob&&Number.isFinite(d.size)&&d.size>0&&d.size<=MAX_DOC&&(d.mime==='application/pdf'||['image/png','image/jpeg','image/webp'].includes(d.mime))).sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));list.innerHTML=docs.map(d=>`<button type="button" class="p27-doc-item" data-doc="${esc(d.id)}"><b>${esc(clean(d.name,160))}</b><small>${(d.size/1024/1024).toFixed(2)} MB · ${esc(d.mime)}</small></button>`).join('')||'<p class="p27-muted">Brak poprawnych dokumentów. Dodaj własny schemat PDF lub obraz.</p>';list.querySelectorAll('[data-doc]').forEach(b=>b.addEventListener('click',()=>loadDoc(b.dataset.doc)));}catch(e){list.textContent='Lokalna biblioteka dokumentów jest niedostępna: '+e.message;}}
  async function uploadDoc(file){if(!file)return;if(file.size<=0){status('Plik jest pusty.',true);return;}if(file.size>MAX_DOC){status('Plik przekracza limit 20 MB.',true);return;}const mime=file.type||'';const allowed=mime==='application/pdf'||['image/png','image/jpeg','image/webp'].includes(mime);if(!allowed){status('Dozwolone są wyłącznie PDF, PNG, JPG i WEBP. Archiwa i pliki wykonywalne są blokowane.',true);return;}const id=uid('doc');const rec={id,name:clean(file.name,160),mime,size:file.size,blob:file,createdAt:now(),notes:'',markers:[]};try{await idbPut(rec);await renderDocs();await loadDoc(id);status('Zapisano dokument lokalnie w IndexedDB tej przeglądarki.');}catch(e){status('Nie zapisano dokumentu: '+e.message,true);}}
  async function loadDoc(id){try{const rec=await idbGet(id);if(!rec||!(rec.blob instanceof Blob)||rec.blob.size<=0||rec.blob.size>MAX_DOC||!(rec.mime==='application/pdf'||['image/png','image/jpeg','image/webp'].includes(rec.mime)))throw new Error('Dokument ma nieprawidłowy format lub rozmiar.');currentDoc=rec;activeDocId=id;if(activeDocUrl)URL.revokeObjectURL(activeDocUrl);activeDocUrl=URL.createObjectURL(rec.blob);const v=$('p27DocViewer');if(v){if(rec.mime==='application/pdf')v.innerHTML=`<div class="p27-pdf-preview"><iframe title="Podgląd dokumentu PDF" src="${activeDocUrl}#toolbar=1" loading="lazy"></iframe><p>Jeżeli przeglądarka nie wyświetla PDF, użyj przycisku „Otwórz w nowej karcie”.</p></div>`;else v.innerHTML=`<div class="p27-image-stage" id="p27ImageStage"><img src="${activeDocUrl}" alt="Własny schemat lub zdjęcie płyty" id="p27DocImage">${(Array.isArray(rec.markers)?rec.markers:[]).filter(m=>m&&Number.isFinite(Number(m.x))&&Number.isFinite(Number(m.y))).slice(0,500).map(m=>`<button type="button" class="p27-marker" style="left:${Math.max(0,Math.min(1,Number(m.x)))*100}%;top:${Math.max(0,Math.min(1,Number(m.y)))*100}%" title="${esc(clean(m.note,240))}">${esc(clean(m.label,30))}</button>`).join('')}</div>`;}
      const notes=$('p27DocNotes');if(notes)notes.value=rec.notes||'';const info=$('p27DocInfo');if(info)info.textContent=`${rec.name} · ${(rec.size/1024/1024).toFixed(2)} MB · ${new Date(rec.createdAt).toLocaleString('pl-PL')}`;const stage=$('p27ImageStage');if(stage)stage.addEventListener('click',e=>{if(e.target.closest('.p27-marker'))return;const rect=stage.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;const label=prompt('Oznaczenie punktu (np. TP1, U12):');if(label===null)return;const note=prompt('Notatka do punktu (bez danych klienta):')||'';rec.markers.push({x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y)),label:clean(label,30)||'Punkt',note:clean(note,240)});idbPut(rec).then(()=>loadDoc(id));});}catch(e){status('Nie udało się otworzyć dokumentu: '+e.message,true);}}
  async function saveDocNotes(){if(!currentDoc)return;currentDoc.notes=clean($('p27DocNotes')?.value,3000);try{await idbPut(currentDoc);status('Notatki zapisane lokalnie.');}catch(e){status('Błąd zapisu notatek: '+e.message,true);}}
  async function deleteCurrentDoc(){if(!activeDocId)return;if(!confirm('Usunąć wybrany dokument i jego lokalne znaczniki?'))return;try{await idbDelete(activeDocId);if(activeDocUrl)URL.revokeObjectURL(activeDocUrl);activeDocUrl=null;activeDocId=null;currentDoc=null;$('p27DocViewer').innerHTML='<p class="p27-muted">Wybierz dokument z listy.</p>';$('p27DocInfo').textContent='Nie wybrano dokumentu.';$('p27DocNotes').value='';await renderDocs();status('Usunięto dokument lokalny.');}catch(e){status('Nie udało się usunąć dokumentu: '+e.message,true);}}

  function calculateBench(){const mode=$('p27BenchMode')?.value||'ohm';const out=$('p27BenchResult');if(!out)return;const n=id=>Number($(id)?.value);let lines=[];
    try {
      if(mode==='ohm'){const result=calculations.ohms(n('p27V'),n('p27R'));lines=[`Prąd: ${(result.current*1000).toFixed(3)} mA`,`Moc: ${result.power.toFixed(4)} W`,`Rezystancja: ${result.resistance.toFixed(2)} Ω`];}
      else if(mode==='divider'){const result=calculations.divider(n('p27V'),n('p27R1'),n('p27R2'));lines=[`Vout bez obciążenia: ${result.output.toFixed(4)} V`,`Prąd dzielnika: ${(result.current*1000).toFixed(3)} mA`,`Moc R1: ${result.powerR1.toFixed(4)} W`,`Moc R2: ${result.powerR2.toFixed(4)} W`];}
      else {const result=calculations.rc(n('p27RC_R'),n('p27RC_C'));lines=[`Stała czasowa τ: ${result.tau.toFixed(6)} s`,`Około 63,2% po 1τ: ${result.at63.toFixed(6)} s`,`Około 99,3% po 5τ: ${result.at993.toFixed(6)} s`];}
    } catch(error) { out.textContent=error.message; return; }
    out.innerHTML=`<b>Wynik symulacji edukacyjnej</b>${lines.map(l=>`<span>${esc(l)}</span>`).join('')}<small>Model idealny. Nie uwzględnia tolerancji, ESR, temperatury, obciążenia i topologii konkretnej płyty.</small>`;drawWave();
  }
  function drawWave(){const canvas=$('p27Wave');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(107,177,209,.22)';ctx.lineWidth=1;for(let x=0;x<=w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<=h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.strokeStyle='#35d5e9';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<w;x++){const y=h/2-Math.sin(x/w*Math.PI*8)*h*.31;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.fillStyle='#d8f7ff';ctx.font='12px system-ui';ctx.fillText('Przebieg poglądowy — sinusoida syntetyczna',12,18);}

  function renderAcademies(){const host=$('p27AcademyGrid');if(!host)return;host.innerHTML=academies.map(a=>{const p=state.paths[a.id]||[];const pct=Math.round(p.filter(Boolean).length/a.lessons.length*100);return `<article class="p27-academy-card"><div class="p27-card-kicker">${esc(a.tag)} · ${esc(a.level)}</div><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><div class="p27-progress"><i style="width:${pct}%"></i></div><small>${p.filter(Boolean).length}/${a.lessons.length} lekcji · ${pct}%</small><div class="p27-lesson-list">${a.lessons.map((l,i)=>`<label><input type="checkbox" data-path="${a.id}" data-lesson="${i}" ${p[i]?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div></article>`;}).join('');host.querySelectorAll('[data-path]').forEach(c=>c.addEventListener('change',()=>{const id=c.dataset.path,i=Number(c.dataset.lesson);if(!Array.isArray(state.paths[id]))state.paths[id]=[];state.paths[id][i]=c.checked;persist();renderAcademies();renderProgress();}));}
  function renderExamPicker(){const host=$('p27ExamPicker');if(!host)return;host.innerHTML=academies.map(a=>`<button type="button" class="p27-exam-card" data-exam="${a.id}"><b>${esc(a.title)}</b><small>4 pytania · wynik lokalny</small></button>`).join('');host.querySelectorAll('[data-exam]').forEach(b=>b.addEventListener('click',()=>startExam(b.dataset.exam)));renderExamHistory();}
  let examId=null,examIndex=0,examScore=0,examAnswered=false;
  function startExam(id){examId=id;examIndex=0;examScore=0;examAnswered=false;showExamQuestion();}
  function showExamQuestion(){const host=$('p27ExamStage');if(!host)return;const questions=exams[examId];const a=academies.find(x=>x.id===examId);const q=questions[examIndex];host.hidden=false;host.innerHTML=`<div class="p27-stage-head"><span>${esc(a?.title||examId)}</span><b>${examIndex+1}/${questions.length}</b></div><h3>${esc(q[0])}</h3><div class="p27-answer-grid">${q[1].map((x,i)=>`<button type="button" data-e-answer="${i}">${esc(x)}</button>`).join('')}</div><div id="p27ExamFeedback" class="p27-feedback">Wybierz jedną odpowiedź.</div><button type="button" id="p27ExamNext" class="p27-btn" hidden>${examIndex===questions.length-1?'Zakończ egzamin':'Dalej →'}</button>`;host.querySelectorAll('[data-e-answer]').forEach(b=>b.addEventListener('click',()=>{if(examAnswered)return;examAnswered=true;const n=Number(b.dataset.eAnswer),ok=n===q[2];if(ok)examScore++;host.querySelectorAll('[data-e-answer]').forEach(x=>{x.disabled=true;if(Number(x.dataset.eAnswer)===q[2])x.classList.add('correct');else if(x===b)x.classList.add('incorrect');});$('p27ExamFeedback').textContent=`${ok?'Poprawnie. ':'Niepoprawnie. '}${q[3]}`;$('p27ExamNext').hidden=false;}));$('p27ExamNext').addEventListener('click',()=>{if(examIndex<questions.length-1){examIndex++;examAnswered=false;showExamQuestion();}else finishExam();});}
  function finishExam(){const total=exams[examId].length,pct=Math.round(examScore/total*100),passed=pct>=75;state.examRuns.push({id:uid('exam'),academy:examId,score:examScore,total,pct,passed,at:now()});persist();const host=$('p27ExamStage');host.innerHTML=`<div class="p27-result"><span>WYNIK EGZAMINU</span><strong>${pct}%</strong><h3>${passed?'Zaliczone':'Do powtórzenia'}</h3><p>${examScore}/${total} poprawnych odpowiedzi. To wewnętrzny test edukacyjny, nie akredytacja ani uprawnienie zawodowe.</p><button type="button" class="p27-btn" id="p27ExamAgain">Powtórz</button></div>`;$('p27ExamAgain').addEventListener('click',()=>startExam(examId));renderExamHistory();renderProgress();}
  function renderExamHistory(){const h=$('p27ExamHistory');if(!h)return;h.innerHTML=state.examRuns.slice().reverse().slice(0,10).map(r=>`<div class="p27-history-row"><b>${esc(academies.find(a=>a.id===r.academy)?.title||r.academy)}</b><span>${r.pct}% · ${r.passed?'Zaliczone':'Powtórz'}</span><small>${new Date(r.at).toLocaleString('pl-PL')}</small></div>`).join('')||'<p class="p27-muted">Nie ma jeszcze wyników.</p>';}

  function renderProgress(){const lessons=academies.reduce((n,a)=>n+a.lessons.length,0),done=academies.reduce((n,a)=>n+(state.paths[a.id]||[]).filter(Boolean).length,0),ch=state.challengeRuns.length,ex=state.examRuns.length,passed=state.examRuns.filter(x=>x.passed).length;const p=$('p27ProgressSummary');if(p)p.innerHTML=`<div><b>${done}/${lessons}</b><span>Lekcje specjalistyczne</span></div><div><b>${ch}</b><span>Ukończone przypadki</span></div><div><b>${passed}/${ex}</b><span>Zaliczone egzaminy</span></div><div><b>${state.measurements.length}</b><span>Wpisy pomiarowe</span></div>`;const bar=$('p27OverallProgress');if(bar)bar.style.width=`${Math.round(done/lessons*100)}%`;const map=$('p27ProgressMap');if(map)map.innerHTML=academies.map(a=>{const arr=state.paths[a.id]||[],pct=Math.round(arr.filter(Boolean).length/a.lessons.length*100);return `<div class="p27-map-row"><b>${esc(a.title)}</b><div><i style="width:${pct}%"></i></div><span>${pct}%</span></div>`;}).join('');}

  function buildMentorContext(){const model=clean($('p27MentorModel')?.value,140),board=clean($('p27MentorBoard')?.value,120),symptom=clean($('p27MentorSymptom')?.value,800),measure=clean($('p27MentorMeasures')?.value,1000),actions=clean($('p27MentorActions')?.value,800);if(symptom.length<12){status('Opisz objaw co najmniej jednym pełnym zdaniem.',true);return null;}return `Jesteś mentorem technika w Akademii Nauka od A do Z. Proszę o edukacyjny plan diagnostyczny, nie pewną diagnozę. Oddziel fakty od hipotez, wskaż brakujące dane, zaproponuj kolejność bezpiecznych testów i powiedz, kiedy przerwać pracę. Nie wymyślaj napięć ani wartości referencyjnych.\nMODEL: ${model||'nie podano'}\nBOARD ID / REV: ${board||'nie podano'}\nOBJAW: ${symptom}\nPOMIARY: ${measure||'nie podano'}\nWYKONANE TESTY: ${actions||'nie podano'}\nWskaż dokumentację wymaganą do potwierdzenia każdej wartości.`;}
  function sendMentorToChat(){const promptText=buildMentorContext();if(!promptText)return;const box=$('cloudChatQuestion');if(!box){status('Nie znaleziono istniejącego czatu AI.',true);return;}box.value=promptText;box.dispatchEvent(new Event('input',{bubbles:true}));if(typeof window.ACADEMY_BOOTSTRAP_NAV==='function')window.ACADEMY_BOOTSTRAP_NAV('cloudchat');else document.querySelector('[data-view="cloudchat"]')?.click();setTimeout(()=>{box.focus();status('Kontekst przeniesiono do istniejącego czatu AI. Przeczytaj go i naciśnij „Wyślij pytanie”, aby wysłać.');},80);}

  function makePortfolio(){const done=academies.flatMap(a=>(state.paths[a.id]||[]).map((v,i)=>v?{academy:a.title,lesson:a.lessons[i]}:null).filter(Boolean));state.portfolioNote=clean($('p27PortfolioNote')?.value??state.portfolioNote,1200);persist();const obj={title:'Portfolio nauki — NAUKA OD A DO Z',createdAt:now(),note:state.portfolioNote,completedLessons:done,challengeRuns:state.challengeRuns,examRuns:state.examRuns,measurementCount:state.measurements.length,disclaimer:'Portfolio edukacyjne z danych lokalnych. Nie jest formalną kwalifikacją ani potwierdzeniem naprawy sprzętu.'};return obj;}
  function exportPortfolio(){const obj=makePortfolio();saveFile('NAUKA_OD_A_DO_Z_portfolio_FIX27.json',JSON.stringify(obj,null,2));const box=$('p27PortfolioPreview');if(box)box.textContent=`Portfolio zawiera ${obj.completedLessons.length} ukończonych etapów, ${obj.challengeRuns.length} przypadków i ${obj.examRuns.length} egzaminów.`;}
  function printPortfolio(){const o=makePortfolio();const html=`<!doctype html><html lang="pl"><meta charset="utf-8"><title>Portfolio nauki</title><style>body{font:15px/1.5 Arial;margin:36px;color:#102033}h1{color:#087d9c}li{margin:5px 0}.note{background:#eef7fb;padding:14px}.small{font-size:12px;color:#586b7c}</style><h1>${esc(o.title)}</h1><p>Wygenerowano: ${esc(new Date(o.createdAt).toLocaleString('pl-PL'))}</p><h2>Ukończone etapy (${o.completedLessons.length})</h2><ul>${o.completedLessons.map(x=>`<li>${esc(x.academy)} — ${esc(x.lesson)}</li>`).join('')}</ul><h2>Przypadki i egzaminy</h2><p>Przypadki: ${o.challengeRuns.length}; egzaminy: ${o.examRuns.length}; pomiary: ${o.measurementCount}.</p><div class="note">${esc(o.note||'Brak notatki.')}</div><p class="small">${esc(o.disclaimer)}</p></html>`;const w=window.open('','_blank');if(!w){status('Przeglądarka zablokowała okno wydruku. Użyj eksportu JSON.',true);return;}w.document.write(html);w.document.close();w.focus();w.print();}

  function renderAssignments(){const h=$('p27AssignmentList');if(!h)return;h.innerHTML=state.assignments.slice().reverse().map(a=>`<article class="p27-assignment"><div><b>${esc(a.title)}</b><small>${esc(a.path)} · ${new Date(a.createdAt).toLocaleString('pl-PL')}</small><p>${esc(a.instructions)}</p><div class="p27-assignment-rubric">${Object.entries(a.rubric).map(([k,v])=>`<span>${esc(k)}: ${v}/5</span>`).join('')}</div>${a.feedback?`<p class="p27-feedback-note">Ocena: ${esc(a.feedback)}</p>`:''}</div><button type="button" class="p27-btn secondary" data-review="${a.id}">${a.reviewed?'Zmień ocenę':'Oceń'}</button></article>`).join('')||'<p class="p27-muted">Brak lokalnych zadań. Dodaj pierwsze zadanie.</p>';h.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>reviewAssignment(b.dataset.review)));}
  function addAssignment(e){e.preventDefault();const d=new FormData(e.currentTarget);const title=clean(d.get('title'),120),instructions=clean(d.get('instructions'),1200);if(title.length<3||instructions.length<10){status('Uzupełnij nazwę i instrukcję zadania.',true);return;}state.assignments.push({id:uid('task'),title,instructions,path:clean(d.get('path'),80),createdAt:now(),rubric:{'Diagnoza':0,'Bezpieczeństwo':0,'Dokumentacja':0,'Test końcowy':0},feedback:'',reviewed:false});persist();e.currentTarget.reset();renderAssignments();}
  function reviewAssignment(id){const a=state.assignments.find(x=>x.id===id);if(!a)return;const score=prompt('Wpisz ocenę 0–5 dla każdego kryterium jako cztery liczby oddzielone przecinkiem (diagnoza, bezpieczeństwo, dokumentacja, test końcowy).');if(score===null)return;const nums=score.split(',').map(x=>Number(x.trim()));if(nums.length!==4||nums.some(n=>!Number.isInteger(n)||n<0||n>5)){status('Nieprawidłowa ocena. Użyj czterech liczb 0–5.',true);return;}a.rubric={'Diagnoza':nums[0],'Bezpieczeństwo':nums[1],'Dokumentacja':nums[2],'Test końcowy':nums[3]};a.feedback=clean(prompt('Komentarz instruktora (bez danych osobowych):')||'',700);a.reviewed=true;persist();renderAssignments();}
  function exportInstructor(){saveFile('NPA_FIX27_studio_instruktora.json',JSON.stringify({schema:'npa-instructor-fix27',createdAt:now(),assignments:state.assignments},null,2));}
  function importInstructor(file){if(!file)return;if(file.size>2*1024*1024){status('Plik przekracza 2 MB.',true);return;}const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.schema!=='npa-instructor-fix27'||!Array.isArray(d.assignments))throw new Error('Nieprawidłowy format kopii.');let added=0;const ids=new Set(state.assignments.map(x=>x.id));for(const raw of d.assignments.slice(0,200)){const a=normalizeAssignment(raw);if(!a||ids.has(a.id)||state.assignments.length>=200)continue;state.assignments.push(a);ids.add(a.id);added++;}persist();renderAssignments();status(`Zaimportowano ${added} nowych zadań wraz z ocenami. Istniejących wpisów nie nadpisano.`);}catch(e){status('Import nieudany: '+e.message,true);}};r.readAsText(file);}

  function searchKnowledge(){const q=clean($('p27KnowledgeSearch')?.value,120).toLowerCase();const host=$('p27KnowledgeResults');if(!host)return;if(q.length<2){host.innerHTML='<p class="p27-muted">Wpisz co najmniej 2 znaki.</p>';return;}const hits=resources.filter(r=>(r.title+' '+r.category+' '+r.text).toLowerCase().includes(q)).slice(0,40);host.innerHTML=hits.map(r=>`<button type="button" class="p27-search-hit" data-open-tab="${r.tab}"><b>${esc(r.title)}</b><small>${esc(r.category)}</small><p>${esc(r.text.slice(0,260))}</p></button>`).join('')||'<p class="p27-muted">Brak wyników w indeksie tego modułu. Spróbuj innego hasła lub skorzystaj z globalnej wyszukiwarki Akademii.</p>';host.querySelectorAll('[data-open-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.openTab)));}

  function exportAll(){const data={schema:'npa-practice-academy-fix27',exportedAt:now(),state};saveFile('NAUKA_OD_A_DO_Z_FIX27_postepy.json',JSON.stringify(data,null,2));}
  function importAll(file){if(!file)return;if(file.size>5*1024*1024){status('Kopia przekracza 5 MB.',true);return;}const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(data.schema!=='npa-practice-academy-fix27'||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw new Error('Nieprawidłowy format FIX27.');const incoming=normalizeState(data.state);let added=0;for(const key of ['measurements','challengeRuns','examRuns','assignments']){const ids=new Set(state[key].map(x=>x.id));for(const item of incoming[key]){if(ids.has(item.id)||state[key].length>=({measurements:500,challengeRuns:300,examRuns:300,assignments:200}[key]))continue;state[key].push(item);ids.add(item.id);added++;}}for(const id of PRACTICE_ACADEMIES){const current=state.paths[id]||[];const next=incoming.paths[id]||[];state.paths[id]=Array.from({length:6},(_,i)=>current[i]===true||next[i]===true);}if(!state.portfolioNote&&incoming.portfolioNote)state.portfolioNote=incoming.portfolioNote;persist();renderAll();status(`Zaimportowano ${added} nowych wpisów i połączono postępy. Istniejących danych nie usunięto.`);}catch(e){status('Import kopii nieudany: '+e.message,true);}};r.readAsText(file);}

  function renderAll(){renderBoard();renderMeasurements();renderChallengePicker();renderAcademies();renderExamPicker();renderProgress();renderAssignments();renderDocs();}
  function bind(){
    document.querySelectorAll('[data-p27-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.p27Tab)));
    $('p27MeasurementForm')?.addEventListener('submit',addMeasurement);$('p27ExportMeasurements')?.addEventListener('click',exportMeasurements);
    $('p27DocInput')?.addEventListener('change',e=>uploadDoc(e.target.files?.[0]));$('p27DocSaveNotes')?.addEventListener('click',saveDocNotes);$('p27DocDelete')?.addEventListener('click',deleteCurrentDoc);$('p27DocOpen')?.addEventListener('click',()=>{if(activeDocUrl)window.open(activeDocUrl,'_blank','noopener');});
    $('p27BenchCalculate')?.addEventListener('click',calculateBench);$('p27BenchMode')?.addEventListener('change',()=>{const mode=$('p27BenchMode').value;document.querySelectorAll('[data-bench-field]').forEach(x=>x.hidden=!x.dataset.benchField.split(' ').includes(mode));});
    $('p27MentorSend')?.addEventListener('click',sendMentorToChat);$('p27PortfolioExport')?.addEventListener('click',exportPortfolio);$('p27PortfolioPrint')?.addEventListener('click',printPortfolio);$('p27InstructorForm')?.addEventListener('submit',addAssignment);$('p27InstructorExport')?.addEventListener('click',exportInstructor);$('p27InstructorImport')?.addEventListener('change',e=>importInstructor(e.target.files?.[0]));
    $('p27KnowledgeSearch')?.addEventListener('input',searchKnowledge);$('p27KnowledgeClear')?.addEventListener('click',()=>{$('p27KnowledgeSearch').value='';searchKnowledge();});
    $('p27PortfolioNote')?.addEventListener('change',e=>{state.portfolioNote=clean(e.target.value,1200);persist();});
    $('p27ExportAll')?.addEventListener('click',exportAll);$('p27ImportAll')?.addEventListener('change',e=>importAll(e.target.files?.[0]));
  }
  function init(){if(window.ACADEMY_PRACTICE_FIX27_READY||!$('view-practicepro'))return;window.ACADEMY_PRACTICE_FIX27_READY=true;bind();const note=$('p27PortfolioNote');if(note)note.value=state.portfolioNote||'';renderAll();drawWave();openTab(state.lastTab||'pcb');status('Centrum praktyki FIX27 gotowe. Dane pozostają lokalnie w tej przeglądarce.');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
