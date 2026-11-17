(() => {
  'use strict';
  const DATA = window.ACADEMY_DATA || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  // Fixed overlays must live directly under BODY. Keeping them inside .main-area
  // (which clips overflow) cuts the dialog at the sidebar edge on desktop.
  const portalToBody = id => {
    const node = document.getElementById(id);
    if (node && node.parentElement !== document.body) document.body.appendChild(node);
  };
  portalToBody('contentModal');
  portalToBody('toast');
  const contentModal = document.getElementById('contentModal');
  if (contentModal) { contentModal.setAttribute('aria-modal', 'true'); }
  document.documentElement.classList.add('academy-ui-394');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allRepairs = DATA.faults || [];
  const localizedRecord = item => {
    if (!item || state.language !== 'en') return item;
    const copy = {...item};
    const pairs = {title:'titleEn',name:'nameEn',category:'categoryEn',level:'levelEn',description:'descriptionEn',step:'stepEn',body:'bodyEn',symptom:'symptomEn',symptoms:'symptomsEn',focus:'focusEn',causes:'causesEn',checks:'checksEn',diagnosis:'diagnosisEn',steps:'stepsEn',tests:'testsEn',repair:'repairEn',verify:'verifyEn',stop:'stopEn',warning:'warningEn',priority:'priorityEn'};
    for (const [pl,en] of Object.entries(pairs)) if (copy[en]) copy[pl] = Array.isArray(copy[en]) ? copy[en] : copy[en];
    return copy;
  };
  const languageLabel = () => state.language === 'en' ? 'EN' : 'PL';
  const updateLanguageButton = () => { const b=$('#languageToggle'); if(b){b.textContent=`MATERIAŁY: ${languageLabel()} ⇄`;b.setAttribute('aria-label',state.language==='en'?'Switch learning content to Polish':'Switch learning content to English');} };


  const PHOTO_DATA = [
    {file:'laptop-board-inspection.jpg', title:'Inspekcja płyty głównej', titleEn:'Motherboard inspection', desc:'Oględziny płyty laptopa pod powiększeniem i lokalizacja elementów.', descEn:'Inspect the laptop motherboard under magnification and identify components.'},
    {file:'cooling-cleaning.jpg', title:'Czyszczenie układu chłodzenia', titleEn:'Cooling system cleaning', desc:'Wentylator, radiator i kanały przepływu powietrza.', descEn:'Inspect the fan, heatsink and airflow channels.'},
    {file:'ram-ssd-installation.jpg', title:'Pamięć RAM i nośnik M.2', titleEn:'RAM and M.2 storage', desc:'Identyfikacja modułów i poprawny montaż podzespołów.', descEn:'Identify modules and install components correctly.'},
    {file:'motherboard-multimeter-test.jpg', title:'Diagnostyka multimetrem', titleEn:'Multimeter diagnostics', desc:'Kontrolowane pomiary na płycie zgodnie ze schematem.', descEn:'Perform controlled board measurements using the correct schematic.'},
    {file:'gpu-cpu-cooling.jpg', title:'GPU i chłodzenie procesora', titleEn:'GPU and CPU cooling', desc:'Układ chłodzenia karty graficznej i procesora.', descEn:'Inspect the graphics-card and processor cooling system.'},
    {file:'laptop-screen-hinge.jpg', title:'Matryca, zawias i taśma', titleEn:'Display, hinge and cable', desc:'Kontrola połączenia ekranu i elementów mechanicznych.', descEn:'Inspect the display connection and mechanical components.'},
    {file:'workbench-motherboard-inspection.jpg', title:'Stanowisko i oględziny płyty głównej', titleEn:'Workbench and motherboard inspection', desc:'Identyfikacja rewizji PCB, dokumentowanie i inspekcja podzespołów.', descEn:'Identify PCB revision, document the board and inspect components.'},
    {file:'motherboard-multimeter-probing.jpg', title:'Pomiary na płycie głównej', titleEn:'Motherboard measurements', desc:'Bezpieczne sondowanie wskazanych punktów zgodnie ze schematem.', descEn:'Safely probe documented test points using the matching schematic.'},
    {file:'ram-m2-installation-detail.jpg', title:'Montaż RAM i SSD M.2', titleEn:'RAM and M.2 SSD installation', desc:'Kontrola zgodności, montaż modułów i mocowania radiatora.', descEn:'Check compatibility, install modules and secure the heatsink.'},
    {file:'usb-c-power-delivery-diagnostic.jpg', title:'Diagnostyka USB-C Power Delivery', titleEn:'USB-C Power Delivery diagnostics', desc:'Analiza zasilania, kabla, portu i negocjacji PD.', descEn:'Inspect power source, cable, port and PD negotiation.'},
    {file:'laptop-cooling-fan-cleaning.jpg', title:'Czyszczenie wentylatora i radiatora', titleEn:'Fan and heatsink cleaning', desc:'Ocena drożności radiatora, łopatek i chłodzenia.', descEn:'Inspect heatsink airflow, fan blades and cooling.'},
    {file:'laptop-hinge-display-repair.jpg', title:'Naprawa zawiasu i przewodu ekranu', titleEn:'Hinge and display-cable repair', desc:'Kontrola mechaniki klapy i prowadzenia przewodu eDP.', descEn:'Inspect lid mechanics and eDP cable routing.'},
  ];
  const LOCAL_VIDEO_DATA = [{"id":"LOCAL-ESD","title":"Bezpieczne stanowisko serwisowe i ochrona ESD","category":"BHP / ESD","narration":"Zanim otworzysz komputer, najpierw rozpoznaj model, zapisz objawy i zabezpiecz dane. Odłącz zasilacz sieciowy oraz wszystkie akcesoria. Baterię wewnętrzną odłącz zgodnie z instrukcją producenta. Przygotuj czyste stanowisko, matę i opaskę ESD używane zgodnie z zasadami stanowiska. Nie kładź płyty na tkaninie, dywanie ani metalowej powierzchni. Zrób zdjęcia przewodów, taśm i położenia śrub przed demontażem. Używaj plastikowych narzędzi do otwierania obudowy. Nie otwieraj zasilacza sieciowego i nie mierz rezystancji na zasilonej płycie. Po zakończeniu sprawdź, czy wszystkie przewody są osadzone, a obudowa zamknięta bez naprężeń.","duration":53.0,"bytes":1196026,"poster":"video_posters/LOCAL-ESD.jpg?v=6.8.0-fix83","file":"videos/film_01_bhp_esd_i_przygotowanie.mp4","captions":"videos/film_01_bhp_esd_i_przygotowanie.vtt"},{"id":"LOCAL-COOL","title":"Czyszczenie wentylatora i radiatora laptopa","category":"Chłodzenie","narration":"Przegrzewanie może wynikać z kurzu, zatkanego radiatora, uszkodzonego wentylatora lub niewłaściwego kontaktu termicznego. Zapisz model laptopa i znajdź instrukcję serwisową. Wyłącz urządzenie, odłącz zasilacz, a baterię odłącz zgodnie z procedurą. Zabezpiecz wentylator przed obracaniem podczas czyszczenia. Usuwaj kurz z łopatek, kanałów i radiatora, nie wciskając zanieczyszczeń głębiej. Nie używaj cieczy na płycie i nie kręć wentylatorem sprężonym powietrzem z dużą prędkością. Sprawdź łożysko, przewód i złącze wentylatora. Po montażu wykonaj krótki test temperatur, obrotów i stabilności. Jeśli radiator lub heatpipe są uszkodzone, wymień część zgodną z modelem.","duration":56.7,"bytes":1194247,"poster":"video_posters/LOCAL-COOL.jpg?v=6.8.0-fix83","file":"videos/film_02_czyszczenie_chlodzenia.mp4","captions":"videos/film_02_czyszczenie_chlodzenia.vtt"},{"id":"LOCAL-RAMSSD","title":"Wymiana RAM i SSD NVMe bez ryzyka dla danych","category":"RAM / NVMe","narration":"Przed wymianą pamięci lub dysku sprawdź dokładny model urządzenia, typ pamięci i obsługiwany interfejs. Moduł DDR5 nie jest zamienny z DDR4. Złącze M.2 może obsługiwać SATA albo NVMe, a rozmiar nie gwarantuje zgodności. Najpierw zabezpiecz dane i, jeśli dysk jest niestabilny, nie uruchamiaj długich benchmarków. Wyłącz komputer i odłącz baterię zgodnie z instrukcją. Włóż moduł RAM pod właściwym kątem i dociśnij do zatrzaśnięcia. Dysk NVMe przykręć właściwą śrubą i sprawdź kontakt z radiatorem. Po montażu sprawdź wykrycie w UEFI, SMART i test pamięci. Dopiero po teście bazowym rozważ XMP lub EXPO.","duration":53.5,"bytes":1145237,"poster":"video_posters/LOCAL-RAMSSD.jpg?v=6.8.0-fix83","file":"videos/film_03_wymiana_ram_i_nvme.mp4","captions":"videos/film_03_wymiana_ram_i_nvme.vtt"},{"id":"LOCAL-POWER","title":"Komputer nie włącza się — pierwsza diagnostyka","category":"Zasilanie / POST","narration":"Brak reakcji na przycisk nie oznacza automatycznie uszkodzonej płyty głównej. Rozdziel brak zasilania, brak czuwania, brak POST i brak obrazu. Najpierw sprawdź gniazdko, przewód oraz zgodność zasilacza. Odłącz akcesoria i stację dokującą. Zapisz zachowanie diod, wentylatorów, sygnałów dźwiękowych i kodów POST. W komputerze stacjonarnym sprawdź podłączenie 24 pin i EPS CPU zgodnie z manualem, bez ingerencji w zasilacz. Użyj minimalnej konfiguracji tylko wtedy, gdy potrafisz wykonać ją bezpiecznie. Nie zwieraj przypadkowych pinów i nie mostkuj bezpiecznika. Dopiero pomiary według schematu i instrukcji mogą zawęzić tor zasilania. Każdy wynik zapisz i weryfikuj ponownym testem.","duration":58.2,"bytes":1242658,"poster":"video_posters/LOCAL-POWER.jpg?v=6.8.0-fix83","file":"videos/film_04_pc_nie_wlacza_sie_diagnostyka.mp4","captions":"videos/film_04_pc_nie_wlacza_sie_diagnostyka.vtt"},{"id":"LOCAL-DISPLAY","title":"Czarny ekran laptopa — matryca, taśma i podświetlenie","category":"Matryca / eDP","narration":"Czarny ekran laptopa nie jest jednoznacznym dowodem awarii matrycy. Najpierw sprawdź jasność, tryb projekcji i kontrolki zasilania. Podłącz znany sprawny monitor zewnętrzny. Jeżeli obraz jest widoczny na monitorze, problem może leżeć w matrycy, taśmie eDP, podświetleniu lub czujniku pokrywy. Test latarką może pomóc odróżnić brak podświetlenia od braku obrazu, ale nie zastępuje pomiarów. Przed otwarciem laptopa odłącz zasilacz i baterię zgodnie z dokumentacją. Taśmy eDP nie wolno podłączać przy zasilaniu. Sprawdź zatrzask, przebieg taśmy i ślady przetarcia. Po złożeniu przetestuj obraz przy różnych kątach pokrywy, jasność i uśpienie.","duration":54.0,"bytes":1174151,"poster":"video_posters/LOCAL-DISPLAY.jpg?v=6.8.0-fix83","file":"videos/film_05_laptop_czarny_ekran_matryca.mp4","captions":"videos/film_05_laptop_czarny_ekran_matryca.vtt"},{"id":"LOCAL-WIN26","title":"Serwis Windows 11 26H2 — kompilacja, KB i znane problemy","category":"Windows 11 / aktualizacje","narration":"W serwisie Windows 11 zacznij od dokładnej identyfikacji wydania. Użyj polecenia winver i zapisz kompilację oraz numer ostatniego pakietu KB. Następnie sprawdź oficjalną stronę Windows Release Health. Na dzień 30 października 2026 Windows 11 26H2 jest dostępny dla kwalifikujących się urządzeń. Aktualizacja KB5127936 z 28 października jest wydaniem Preview. Opisuje między innymi poprawę obsługi PIN BitLocker i problem części urządzeń USB Audio Class 1.0. Nie instaluj Preview automatycznie na komputerze klienta. Porównaj datę objawu z aktualizacją, sterownikiem i firmware. Zabezpiecz dane, a po zmianie powtórz dokładnie pierwotny test.","duration":63.9,"bytes":1393008,"poster":"video_posters/LOCAL-WIN26.jpg?v=6.8.0-fix83","file":"videos/film_06_windows_11_26h2_serwis.mp4","captions":"videos/film_06_windows_11_26h2_serwis.vtt"},{"id":"LOCAL-SECUREBOOT","title":"Secure Boot 2026 i BitLocker — bezpieczna diagnostyka","category":"UEFI / bezpieczeństwo","narration":"W 2026 roku ważnym tematem serwisowym jest aktualizacja certyfikatów Secure Boot z zestawu 2011 do nowych certyfikatów 2023. Nie oznacza to, że każdy komputer przestanie się uruchamiać. Nieaktualne certyfikaty mogą ograniczyć przyszłe zabezpieczenia wczesnego rozruchu. Najpierw ustal model, wersję UEFI i status certyfikatów. Sprawdź instrukcję Microsoft i aktualizacje firmware OEM. Przed zmianą BIOS upewnij się, że właściciel ma właściwy klucz odzyskiwania BitLocker. Nigdy nie czyść TPM ani nie wyłączaj Secure Boot jako szybkiego obejścia. Aktualizację przetestuj najpierw na reprezentatywnym urządzeniu, a potem sprawdź status, zimny start i brak monitów odzyskiwania.","duration":61.5,"bytes":1291611,"poster":"video_posters/LOCAL-SECUREBOOT.jpg?v=6.8.0-fix83","file":"videos/film_07_secure_boot_bitlocker_2026.mp4","captions":"videos/film_07_secure_boot_bitlocker_2026.vtt"},{"id":"LOCAL-WIFIUSB4","title":"Wi-Fi 7, USB4 i Thunderbolt 5 — zgodność w praktyce","category":"Nowe standardy łączności","narration":"Nowoczesne porty i karty sieciowe mają możliwości, których nie da się poznać po samym kształcie złącza. Wi-Fi 7 może używać MLO, kanałów 320 megaherców i modulacji 4096 QAM, ale wymaga kompatybilnego adaptera i routera. USB4 Version 2.0 opisuje nową architekturę, lecz nie każdy port obsługuje 80 gigabitów na sekundę. Thunderbolt 5 podaje do 80 gigabitów dwukierunkowo i tryb Bandwidth Boost do 120 gigabitów w odpowiedniej konfiguracji. Sprawdź host, dock, kabel i urządzenie. Testuj najpierw pojedynczy monitor lub adapter, potem kolejne urządzenia. Zapisuj negocjowaną szybkość i problemy po wybudzeniu.","duration":58.0,"bytes":1199876,"poster":"video_posters/LOCAL-WIFIUSB4.jpg?v=6.8.0-fix83","file":"videos/film_08_wifi7_usb4_thunderbolt5.mp4","captions":"videos/film_08_wifi7_usb4_thunderbolt5.vtt"},{"id":"LOCAL-POSTTEST","title":"Post-repair verification — raport i kontrola jakości","category":"Kontrola jakości","narration":"Naprawa nie kończy się w chwili, gdy komputer się uruchomi. Wróć do objawu zgłoszonego przez klienta i odtwórz go w tych samych warunkach. Sprawdź temperatury, SMART, pamięć, porty, kamerę, dźwięk, Wi-Fi, Bluetooth, ładowanie i uśpienie zależnie od zakresu naprawy. Zapisz wersje BIOS, sterowników i oprogramowania, które zmieniłeś. Nie obciążaj urządzenia testem długotrwałym, jeśli nie potwierdziłeś wcześniej chłodzenia i zasilania. Raport powinien zawierać hipotezę, wykonany test, wynik przed i po oraz ograniczenia testu. Oznacz wynik jako naprawiono, częściowo naprawiono lub wymaga dalszej diagnostyki. Przekaż klientowi jasne informacje i zalecenia.","duration":55.2,"bytes":1157782,"poster":"video_posters/LOCAL-POSTTEST.jpg?v=6.8.0-fix83","file":"videos/film_09_test_koncowy_po_naprawie.mp4","captions":"videos/film_09_test_koncowy_po_naprawie.vtt"},{"id":"LOCAL-NPU","title":"NPU i AI PC — jak rozpoznać i testować nowe funkcje","category":"NPU / AI PC","narration":"Komputery AI mogą mieć CPU, GPU i osobną jednostkę NPU. NPU jest przeznaczone do wybranych operacji uczenia maszynowego. W Windows sprawdzaj, czy procesor NPU pojawia się w Menedżerze zadań, ale pamiętaj, że widoczność zależy od sterownika i platformy. Funkcje Copilot Plus mogą wymagać określonej wydajności NPU, na przykład czterdziestu TOPS, ale to wymaganie dotyczy wskazanych funkcji, a nie każdego programu AI. Zidentyfikuj model platformy i architekturę systemu. Zaktualizuj sterownik z portalu OEM lub Microsoft. Przetestuj konkretną aplikację i porównaj wykorzystanie CPU, GPU, NPU oraz baterii. Zapisz wersję runtime i dokładny wynik.","duration":55.5,"bytes":701718,"poster":"video_posters/LOCAL-NPU.jpg?v=6.8.0-fix83","file":"videos/film_10_npu_ai_pc_diagnostyka.mp4","captions":"videos/film_10_npu_ai_pc_diagnostyka.vtt"}];
  const categories = [
    {name:'Zasilanie i bateria', icon:'ϟ', match:/zasil|bateria|ładow|power/i, desc:'Brak reakcji, ładowanie, tor zasilania i akumulator.'},
    {name:'Płyta główna i POST', icon:'▦', match:/płyta|post|bios|rtc|cmos|ram|pamięć/i, desc:'Sekwencja startowa, pamięć, firmware i elektronika płyty.'},
    {name:'Dyski i odzyskiwanie danych', icon:'▤', match:/dysk|dane|nośnik|bitlocker|szyfrow|ssd|hdd/i, desc:'Wykrywanie nośników, SMART, błędy odczytu i ochrona plików.'},
    {name:'Obraz, matryca i grafika', icon:'▣', match:/obraz|matryca|grafik|ekran|wideo|taśma|podświetl/i, desc:'Czarny ekran, artefakty, taśmy, podświetlenie i wyjścia obrazu.'},
    {name:'Chłodzenie i wydajność', icon:'❋', match:/chłod|temperatur|wentyl|wydajność|restart/i, desc:'Przegrzewanie, hałas, throttling i niestabilność pod obciążeniem.'},
    {name:'Sieć i łączność', icon:'⌁', match:/sieć|wi-fi|wifi|bluetooth|lan|bezprzewod/i, desc:'Wi-Fi, Ethernet, Bluetooth, sterowniki i połączenie z routerem.'},
    {name:'Porty i stacje dokujące', icon:'⌗', match:/port|usb|hdmi|usb-c|dokując|złącze/i, desc:'USB, HDMI, USB-C, złącza, przewody i stacje dokujące.'},
    {name:'Audio, kamera i wejścia', icon:'◖', match:/audio|dźwięk|mikrofon|kamera|klawiatur|touchpad/i, desc:'Dźwięk, mikrofon, kamera, klawiatura i touchpad.'},
    {name:'Windows i oprogramowanie', icon:'▥', match:/windows|system|sterownik|rozruch|boot|oprogram/i, desc:'System, sterowniki, błędy uruchamiania i konfiguracja.'},
    {name:'Bezpieczeństwo i obudowa', icon:'⬡', match:/bezpieczeń|zalanie|obudow|zawias|spuchnię|dym|spalenizn/i, desc:'Zalanie, uszkodzenia mechaniczne i sytuacje wymagające przerwania pracy.'}
  ];
  const categoryFor = item => {
    const text = `${item.category || ''} ${item.title || ''}`;
    return categories.find(c => c.match.test(text))?.name || 'Pozostałe';
  };
  const categoryIcon = name => categories.find(c => c.name === name)?.icon || '⌘';
  const byId = id => allRepairs.find(x => x.id === id);
  const libraryById = id => (DATA.library || []).find(x => x.id === id);
  const docRef = {
    'BONUS-01':'DOC-08','BONUS-02':'DOC-09','BONUS-04':'DOC-10','BONUS-05':'DOC-11','BONUS-06':'DOC-12',
    'CASEBOOK-06':'DOC-13','BOOK-COURSE-707':'DOC-01','BOOK-SERVICE-161':'DOC-02'
  };
  const state = {
    courseTab:'lessons',
    checklistIndex:0,
    pdfIndexLoaded:false,
    pdfIndexLoading:false,
    activeRepair:null,
    activeGuideKey:null,
    language:(()=>{try{return localStorage.getItem('academyLanguage')||'pl'}catch{return 'pl'}})()
  };
  const localGet = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const localSet = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const sessionGet = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const sessionSet = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const toast = message => {
    const node = $('#toast'); if (!node) return;
    node.textContent = message; node.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2300);
  };
  const empty = (title, desc) => `<div class="empty-state"><b>${esc(title)}</b><span>${esc(desc)}</span></div>`;
  const procedureParts = value => {
    const raw = String(value || '').trim(); if (!raw) return [];
    let parts = raw.split(/\n+/).map(x => x.replace(/^\s*[•·\-]\s*/, '').trim()).filter(Boolean);
    if (parts.length === 1 && /(?:^|\s)\d+[.)]\s+/.test(raw)) parts = raw.replace(/^\s*\d+[.)]\s*/, '').split(/\s+\d+[.)]\s+/).map(x=>x.trim()).filter(Boolean);
    else if (parts.length === 1 && raw.split(';').length > 2) parts = raw.split(/;\s*/).map(x=>x.trim()).filter(Boolean);
    return parts;
  };
  const textContent = value => `<p>${esc(value || 'Brak dodatkowego opisu w materiale źródłowym.')}</p>`;
  const listContent = value => {
    const parts = procedureParts(value);
    if (!parts.length) return textContent('Brak dodatkowego opisu w materiale źródłowym.');
    if (parts.length === 1) return textContent(parts[0]);
    return `<ol>${parts.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  };
  const causeContent = value => {
    const parts = String(value || '').split(/;\s*/).map(x=>x.trim()).filter(Boolean);
    if (parts.length < 2) return textContent(value);
    return `<div class="cause-list">${parts.map(x=>`<div class="cause-item">${esc(x)}</div>`).join('')}</div>`;
  };
  const showView = view => {
    const target = document.getElementById(`view-${view}`);
    if (!target) return;
    // Main navigation is a real tab/page switch: exactly one section is visible.
    $$('.view-section').forEach(section => {
      const active = section === target;
      section.classList.toggle('active', active);
      section.hidden = !active;
      section.setAttribute('aria-hidden', String(!active));
    });
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $('#crumbCurrent').textContent = target.dataset.sectionLabel || 'Akademia';
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Keep a reloadable module route without relying on scroll position.
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('view', view);
    nextUrl.hash = '';
    const nextRoute = `${nextUrl.pathname}${nextUrl.search}`;
    if (`${location.pathname}${location.search}${location.hash}` !== nextRoute) history.replaceState(null, '', nextRoute);
    if (view === 'repairs') renderRepairList();
    if (view === 'community') window.ACADEMY_CLOUD?.refreshCommunity?.();
  };
  // Public, guarded bridges used by the early HTML navigation fallback.
  window.ACADEMY_SHOW_VIEW = view => { showView(view); return true; };
  const closeMobileMenu = () => { $('#sidebar').classList.remove('open'); $('#mobileScrim').classList.remove('show'); };
  const groupCounts = () => categories.map(c => ({...c, count:allRepairs.filter(f=>categoryFor(f)===c.name).length})).filter(x=>x.count);
  const renderQuickRepairs = () => {
    const picks = ['FAULT-01','FAULT-03','FAULT-06','FAULT-10','FAULT-02','FAULT-40','FAULT-04'];
    $('#quickRepairs').innerHTML = picks.map((id,i)=>{const raw=byId(id);const f=localizedRecord(raw);return f?`<button type="button" class="quick-repair" data-open-repair="${esc(f.id)}" title="${esc(f.title)}" aria-label="Otwórz procedurę: ${esc(f.title)}"><span class="quick-num">${String(i+1).padStart(2,'0')}</span><span class="quick-title">${esc(f.title)}</span><span class="quick-open-mark" aria-hidden="true">↗</span></button>`:''}).join('');
  };
  const renderHome = () => {
    $('#homeCategories').innerHTML = groupCounts().map(c=>`<button class="category-card" data-category-open="${esc(c.name)}"><span class="category-top"><span class="category-icon">${c.icon}</span><span class="category-num">${String(c.count).padStart(2,'0')} PROCEDUR</span></span><b>${esc(c.name)}</b><small>${esc(c.desc)}</small></button>`).join('');
    const top = ['FAULT-01','FAULT-03','FAULT-06','FAULT-10','FAULT-02','FAULT-40'];
    $('#featuredRepairs').innerHTML = top.map((id,i)=>{const raw=byId(id);const f=localizedRecord(raw);return f?`<button class="featured-item" data-open-repair="${id}"><span class="featured-number">${String(i+1).padStart(2,'0')}</span><span><b>${esc(f.title)}</b><small>${esc(f.symptom)}</small></span><span class="featured-arrow">→</span></button>`:''}).join('');
    updateProgress();
  };
  const renderRepairFilters = () => {
    const sel = $('#repairCategory');
    sel.innerHTML = '<option value="all">Wszystkie obszary</option>'+groupCounts().map(c=>`<option value="${esc(c.name)}">${esc(c.name)} (${c.count})</option>`).join('');
  };
  const renderRepairList = () => {
    const q = ($('#repairSearch').value || '').trim().toLowerCase();
    const cat = $('#repairCategory').value;
    const pr = $('#repairPriority').value;
    const found = allRepairs.filter(f=>{
      const hay = [f.title,f.titleEn,f.category,f.categoryEn,f.symptom,f.symptomEn,f.focus,f.focusEn,f.causes,f.causesEn,f.checks,f.checksEn,f.repair,f.repairEn].join(' ').toLowerCase();
      return (!q || hay.includes(q)) && (cat==='all'||categoryFor(f)===cat) && (pr==='all'||String(f.priority||'').toUpperCase().includes(pr));
    });
    $('#repairResultsCount').textContent = `${found.length} ${found.length===1?'procedura':found.length<5?'procedury':'procedur'}`;
    $('#repairList').innerHTML = found.length ? found.map((raw,i)=>{const f=localizedRecord(raw);const photo=window.ACADEMY_ART?.getRepairPhoto?.(f);return `<article class="repair-row"><div class="repair-row-photo-wrap"><img class="repair-row-art ${photo?.illustration?'repair-photo-illustration':''}" data-repair-photo="${esc(f.id)}" data-photo-context="card" data-photo-slot="0" data-photo-id="repair-card:${esc(f.id)}" data-photo-scope="repair-card" data-photo-kind="${esc(f.category||f.categoryEn||'board')}" data-photo-title="${esc(f.title)}" data-photo-alt="${esc(f.title)}" ${photo?`src="${esc(photo.url)}"`:''} alt="${esc(f.title)} — unikalny materiał techniczny" loading="lazy" ${photo?'':'hidden'}><small data-repair-photo-credit="${esc(f.id)}" data-photo-slot="0" ${photo?'':'hidden'}>${photo?.illustration?'Unikalna ilustracja techniczna · offline':(photo?.local?'Fotografia lokalna · offline':'')}</small><span class="repair-photo-pending" ${photo?'hidden':''}>Przygotowywanie zdjęcia…</span></div><div class="repair-row-body"><div class="repair-row-top"><h3>${esc(f.title)}</h3><span class="priority ${String(f.priority||'').includes('ŚREDNIA')?'medium':''}">${esc(f.priority||'STANDARD')}</span></div><p>${esc(f.symptom)}</p></div><button class="repair-open" aria-label="Otwórz lekcję: ${esc(f.title)}" data-open-repair="${esc(f.id)}">→</button></article>`}).join('') : empty('Nie znaleziono takiej procedury','Zmień słowo lub wybierz inną kategorię.');
    window.ACADEMY_ART?.loadRepairPhotos?.(allRepairs);
  };
  const section = (id,no,title,hint,content,extra='') => `<section class="detail-section ${extra}" id="${id}"><div class="detail-section-head"><span class="section-no">${no}</span><div><h2>${title}</h2><div class="section-hint">${hint}</div></div></div><div class="detail-content">${content}</div></section>`;
  const renderRepairDetail = f => {
    const isEn=state.language==='en';
    const tx=(pl,en)=>isEn?en:pl;
    const refs = (f.refs||[]).map(ref=>{
      const doc=libraryById(docRef[ref]);
      return doc?`<button type="button" class="reference-chip" data-open-doc-id="${esc(doc.id)}">${esc(doc.title)} · preview in Academy</button>`:`<span class="reference-chip">${esc(ref)}</span>`;
    }).join('');
    const titleText = `${f.title||''} ${f.category||''}`.toLowerCase();
    const photoTitle = isEn ? 'Visual material for this repair' : 'Materiały wizualne do tej naprawy';
    const photoDesc = isEn ? 'The photo catalog searches licensed real photographs online first; if no verified match is available, a clearly labelled topic-specific offline technical illustration remains.' : 'Katalog najpierw wyszukuje prawdziwe fotografie z licencją i autorem; gdy brak zweryfikowanego dopasowania lub połączenia, pozostaje wyraźnie podpisana ilustracja techniczna offline.';
    const uniquePhotos = window.ACADEMY_ART?.getRepairPhotos?.(f) || [];
    const photoPanel = `<div class="repair-photo-panel repair-photo-panel-expanded"><div class="repair-photo-panel-intro"><span class="eyebrow">${tx('TRZY MATERIAŁY WIZUALNE','THREE EDUCATIONAL VISUALS')}</span><b>${esc(photoTitle)}</b><p>${esc(photoDesc)} Każda usterka ma osobny obraz karty oraz trzy inne, tematyczne materiały w lekcji. Ilustracje techniczne są generowane lokalnie i działają offline; zweryfikowane fotografie zewnętrzne mogą je uzupełniać, gdy źródło jest dostępne.</p><small class="repair-photo-reference-note">Materiały są przykładami edukacyjnymi, nie dokumentacją tej samej sztuki urządzenia.</small></div><div class="repair-photo-stage-grid">${['Przykład wizualny 1','Przykład wizualny 2','Przykład wizualny 3'].map((label,slot)=>{const photo=uniquePhotos[slot];return `<article class="repair-photo-stage"><span class="repair-photo-stage-label">${label}</span><img class="${photo?.illustration?'repair-photo-illustration':''}" data-repair-photo="${esc(f.id)}" data-photo-context="detail" data-photo-slot="${slot}" data-photo-id="repair-detail:${esc(f.id)}:${slot}" data-photo-scope="repair-detail" data-photo-kind="${esc(f.category||f.categoryEn||'board')}" data-photo-title="${esc(f.title)} — ${label}" data-photo-alt="${esc(f.title)} — ${label}" ${photo?`src="${esc(photo.url)}"`:''} alt="${esc(f.title)} — ${label}" ${photo?'':'hidden'} loading="lazy"><small class="repair-photo-credit" data-repair-photo-credit="${esc(f.id)}" data-photo-slot="${slot}" ${photo?'':'hidden'}>${photo?esc(photo.illustration?'Unikalna ilustracja techniczna · dostępna offline':(photo.local?'Fotografia lokalna · dostępna offline':photo.author)):''}</small><span class="repair-photo-pending" ${photo?'hidden':''}>Przygotowywanie zdjęcia…</span><button class="inline-link" type="button" data-repair-photo-zoom="${esc(f.id)}" data-photo-slot="${slot}" ${photo?`data-open-image="${esc(photo.url)}"`:'disabled'} data-image-title="${esc(f.title)} — ${label}">${tx('Powiększ materiał →','Enlarge material →')}</button></article>`;}).join('')}</div></div>`;
    return `
      <div class="repair-modal-actions"><button class="btn btn-outline btn-small" type="button" data-copy-repair="${esc(f.id)}">${tx('Kopiuj adres tej procedury','Copy procedure link')}</button><button class="btn btn-outline btn-small" type="button" data-print-repair>${tx('Drukuj procedurę','Print procedure')}</button></div>
      <header class="detail-hero"><div><div class="detail-pill-row"><span class="detail-id">${esc(f.id)} / ${tx('STUDIUM USTERKI','FAULT STUDY')}</span><span class="detail-meta-pill">${esc(categoryFor(f))}</span><span class="detail-meta-pill warn">${tx('PRIORYTET:','PRIORITY:')} ${esc(f.priority||'STANDARD')}</span></div><h1>${esc(f.title)}</h1><p class="symptom-lead">${esc(f.symptom)}</p></div><div class="title-metric"><b>${allRepairs.findIndex(x=>x.id===f.id)+1}/${allRepairs.length}</b><span>${tx('lekcja','lesson')}<br>${tx('edukacyjna','educational')}</span></div></header>
      <div class="detail-focus"><span class="focus-symbol">◎</span><div><b>${tx('Cel diagnostyki','Diagnostic goal')}</b><p>${esc(f.focus)}</p></div></div>
      ${photoPanel}
      <nav class="detail-anchor-nav"><a href="#sec-causes">${tx('Możliwe przyczyny','Possible causes')}</a><a href="#sec-checks">${tx('Wstępna kontrola','Initial checks')}</a><a href="#sec-steps">${tx('Diagnostyka krok po kroku','Step-by-step diagnosis')}</a><a href="#sec-tests">${tx('Ważne przy pomiarach','Test and measurement notes')}</a><a href="#sec-repair">${tx('Naprawa','Repair')}</a><a href="#sec-verify">${tx('Test końcowy','Final verification')}</a><a href="#sec-stop">${tx('Kiedy przerwać','When to stop')}</a></nav>
      <div class="detail-grid">
        ${section('sec-causes','01',tx('Możliwe przyczyny','Possible causes'),tx('Lista hipotez — nie wymieniaj części bez potwierdzenia.','Hypotheses — do not replace parts without confirmation.'),causeContent(f.causes))}
        ${section('sec-checks','02',tx('Wstępna kontrola','Initial checks'),tx('Czynności, które pomagają zawęzić problem.','Checks that help narrow down the problem.'),listContent(f.checks))}
        ${section('sec-steps','03',tx('Diagnostyka krok po kroku','Step-by-step diagnosis'),tx('Kolejność pracy serwisowej.','Service workflow sequence.'),listContent(f.steps),'full')}
        ${section('sec-tests','04',tx('Ważne przy testach i pomiarach','Test and measurement notes'),tx('Ograniczenia, warunki i pułapki diagnostyczne.','Limits, conditions and diagnostic pitfalls.'),textContent(f.tests))}
        ${section('sec-repair','05',tx('Plan naprawy','Repair plan'),tx('Działanie dopiero po potwierdzeniu przyczyny.','Proceed only after confirming the cause.'),textContent(f.repair))}
        ${section('sec-verify','06',tx('Test końcowy po naprawie','Post-repair verification'),tx('Sprawdź, czy pierwotny objaw nie wraca.','Verify that the original symptom does not return.'),textContent(f.verify))}
        ${section('sec-stop','07',tx('Kiedy natychmiast przerwać','When to stop immediately'),tx('Sygnały zagrożenia dla użytkownika lub urządzenia.','Warnings that indicate risk to the user or device.'),textContent(f.stop),'stop-section')}
        ${section('sec-refs','08',tx('Powiązane materiały','Related resources'),tx('Dokumenty źródłowe do pogłębienia tematu.','Source documents for further study.'),`<div class="reference-row">${refs || '<span class="reference-chip">No linked sources</span>'}</div>`,'full')}
      </div>${window.ACADEMY_LEARNING_ENGINE ? window.ACADEMY_LEARNING_ENGINE.buildGuide({id:f.id,title:f.title,category:f.category,description:f.symptom,body:f.focus,symptoms:f.symptom,diagnosis:f.checks,repair:f.repair,warning:f.stop,steps:f.steps,source:'Baza procedur serwisowych Akademii'},'repair') : ''}`;
  };
  const openRepairModal = id => {
    state.activeCourse=null;
    const raw=byId(id); if(!raw)return;
    const f=localizedRecord(raw);
    state.activeRepair=id;
    history.replaceState(null,'',`${location.pathname}${location.search}#repair/${id}`);
    openModal(f.title,`${f.id} / ${state.language==='en'?'FULL REPAIR PROCEDURE':'PEŁNA PROCEDURA NAPRAWY'}`,`<div class="repair-procedure">${renderRepairDetail(f)}</div>`,true);
    $('#contentModal .modal').classList.add('repair-procedure-modal');
    $('#contentModal .modal-body').scrollTop=0;window.ACADEMY_ART?.loadRepairPhotos?.(allRepairs);
  };
  window.ACADEMY_OPEN_REPAIR = id => { if (!byId(id)) return false; closeMobileMenu(); openRepairModal(id); return true; };

  const sendTutorQuestion = async question => {
    const box=$('#tutorMessages'); const engine=window.ACADEMY_LEARNING_ENGINE;
    if(!box||!engine)return;
    const user=document.createElement('div'); user.className='tutor-message tutor-user';
    const ub=document.createElement('b'); ub.textContent='Ty'; const up=document.createElement('p'); up.textContent=question; user.append(ub,up); box.append(user);
    const bot=document.createElement('div'); bot.className='tutor-message tutor-bot';
    const bb=document.createElement('b'); bb.textContent='Pomocnik Akademii'; const bp=document.createElement('div'); bp.innerHTML=engine.response(question); bot.append(bb,bp); box.append(bot); box.scrollTop=box.scrollHeight;
    if(window.ACADEMY_CLOUD?.ask){
      try{const answer=await window.ACADEMY_CLOUD.ask(question);if(answer?.answer){bp.textContent=answer.answer;if(answer.sources?.length){const refs=document.createElement('div');refs.className='cloud-chat-sources';answer.sources.forEach((source,i)=>{try{const u=new URL(source.url);if(u.protocol!=='https:')return;const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`[${i+1}] ${source.title||u.hostname}`;refs.append(a);}catch{}});bp.append(refs);}}}catch{}
    }
  };
  const hydrateGuideChecks = () => {
    const all=localGet('academyGuideSteps',{});
    $$('#modalBody [data-guide-check]').forEach(cb=>{const k=cb.dataset.guideCheck,i=Number(cb.dataset.guideIndex);cb.checked=!!all[k]?.[i];});
  };
  const openDocument = (doc, page=null) => {
    if(!doc)return;
    const path=String(doc.path||'');
    const isPdf=String(doc.type||'').toUpperCase()==='PDF' || path.toLowerCase().endsWith('.pdf');
    if(isPdf){
      const pageHash=page?`#page=${Number(page)}`:'';
      const body=`<div class="embedded-pdf"><iframe title="Podgląd dokumentu ${esc(doc.title)}" src="${esc(path+pageHash)}" loading="lazy"></iframe></div><div class="modal-actions"><a class="btn btn-primary" href="${esc(path)}" download>Pobierz oryginalny PDF</a></div>`;
      openModal(doc.title,`BIBLIOTEKA / PODGLĄD PDF${page?` / STRONA ${Number(page)}`:''}`,body,true);
      return;
    }
    if(String(doc.type||'').toUpperCase()==='XLSX' && DATA.tables?.length){
      const tables=DATA.tables.map((t,i)=>`<section class="xlsx-preview-sheet"><h3>${esc(t.name)}</h3><div class="xlsx-scroll"><table class="xlsx-table"><tbody>${(t.rows||[]).map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`).join('');
      openModal(doc.title,'PODGLĄD ARKUSZY W AKADEMII',`<p>Podgląd danych arkuszy dostępnych w Akademii. Oryginalny skoroszyt pozostaje dostępny do pobrania.</p>${tables}<div class="modal-actions"><a class="btn btn-primary" href="${esc(path)}" download>Pobierz oryginalny XLSX</a></div>`,true);
      return;
    }
    openModal(doc.title,'MATERIAŁ DO POBRANIA',`<div class="download-document"><div class="download-document-icon">${esc(doc.type||'PLIK')}</div><h3>${esc(doc.title)}</h3><p>${esc(doc.description||'Oryginalny dokument źródłowy Akademii.')}</p><p>Dokument jest przechowywany w tej samej witrynie. Pobierz go bez otwierania nowej karty przeglądarki.</p><a class="btn btn-primary" href="${esc(path)}" download>Pobierz dokument</a></div>`,false);
  };
  const openDocById = (id,page=null) => openDocument(libraryById(id),page);
  const openDocByPath = (path,page=null) => openDocument((DATA.library||[]).find(d=>d.path===path),page);
  const courseTabs = ['lessons','basics','topics','articles','manual'];
  const courseData = () => ({lessons:DATA.courseLessons||[],basics:DATA.beginnerLessons||[],topics:DATA.courseTopics||[],articles:DATA.htmlArticles||[],manual:DATA.manualChapters||[]}[state.courseTab]||[]);
  const courseTitle = item => item.title || item.titleEn || 'Temat';
  const courseDescription = item => item.description || item.symptoms || item.body || item.diagnosis || 'Otwórz temat, aby przeczytać szczegóły.';
  // Każdy materiał otrzymuje rzeczywistą fotografię warsztatową dobraną do tematu i kategorii.
  const courseImageFor = (item, scope=state.courseTab) => {
    if (window.ACADEMY_ART?.dataUrl) return window.ACADEMY_ART.dataUrl(item, `course:${scope}`);
    return item.image || 'assets/artwork-fix77/page-illustration-40.svg';
  };
  const renderCourses = () => {
    const q = ($('#courseSearch').value||'').trim().toLowerCase();
    const items = courseData().filter(x=>[x.title,x.titleEn,x.description,x.descriptionEn,x.body,x.bodyEn,x.category,x.categoryEn,x.diagnosis,x.repair,x.repairEn,x.tags].join(' ').toLowerCase().includes(q)).map(localizedRecord);
    $('#courseCount').textContent = `${items.length} materiałów`;
    $('#courseContent').innerHTML = items.length ? items.map((x,i)=>{
      const level=x.level||x.category||x.minutes?`${x.level||x.category||''}${x.minutes?` · ${x.minutes} min`:''}`:'';
      const thumb=`<img class="course-card-image" data-photo-id="course-card:${esc(state.courseTab)}:${esc(x.id||i)}" data-photo-scope="course-card" data-photo-title="${esc(courseTitle(x))}" src="${esc(courseImageFor(x, `${state.courseTab}:${x.id||i}`))}" alt="${esc(courseTitle(x))} — oczekiwanie na fotografię warsztatową" loading="lazy">`;
      return `<button class="course-card" data-course-id="${esc(x.id||String(i))}">${thumb}<span class="course-meta"><span>${esc(level || 'MATERIAŁ EDUKACYJNY')}</span><span class="course-level">${String(i+1).padStart(2,'0')}</span></span><b>${esc(courseTitle(x))}</b><p>${esc(courseDescription(x).slice(0,170))}${courseDescription(x).length>170?'…':''}</p><span class="course-more">Otwórz materiał →</span></button>`;
    }).join('') : empty('Brak wyników','Spróbuj wpisać inną nazwę lub fragment opisu.');
  };
  const openCourseModal = id => {
    state.activeCourse=id;
    const raw=courseData().find((x,i)=>(x.id||String(i))===id); if(!raw) return; const item=localizedRecord(raw);
    const completed = localGet('academyCompletedLessons',[]);
    const content = item.body || [item.description,item.symptoms,item.diagnosis,item.repair,item.tests,item.verify].filter(Boolean).join('\n\n');
    const title=courseTitle(item);
    const variants = state.courseTab === 'basics' ? (DATA.sourceVersions || []).filter(v=>v.title===title) : [];
    const variantsHtml = variants.length ? `<details><summary>Historia wersji źródłowych (${variants.length})</summary><ul>${variants.map(v=>`<li><b>${esc(v.version || v.source || 'Wersja źródłowa')}</b> — ${esc(v.description || '')}<br><span>${esc(v.step || '')}</span></li>`).join('')}</ul></details>` : '';
    const manualHtml = state.courseTab === 'manual' && item.sourcePdf ? `<h3>Oryginalny podręcznik</h3><p>Pełny dokument źródłowy: <button class="inline-link" type="button" data-open-doc-path="${esc(item.sourcePdf)}" data-doc-page="${Number(item.sourcePage||1)}">podgląd podręcznika w Akademii</button>${item.sourcePage ? ` · strona źródłowa: ${esc(item.sourcePage)}` : ''}</p>` : '';
    const contentParagraphs=String(content||'W oryginalnym źródle brak rozszerzonego opisu tego tematu.').split(/\n{2,}/).filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
    const lessonImage=`<figure class="course-lesson-figure"><img data-photo-id="course-detail:${esc(state.courseTab)}:${esc(item.id||id)}" data-photo-scope="course-detail" data-photo-title="${esc(title)}" src="${esc(courseImageFor(item, `${state.courseTab}:${item.id||id}`))}" alt="${esc(title)} — oczekiwanie na fotografię warsztatową" loading="lazy"><figcaption>${esc(title)} · ${state.language==='en'?'Topic-matched photo; offline illustration if unavailable':'Fotografia tematyczna; przy braku źródła ilustracja offline'}</figcaption></figure>`;
    const lessonVideo=item.video?`<section class="academy-lesson-video"><div class="academy-video-head"><span>FILM INSTRUKTAŻOWY</span><b>Materiał wideo Akademii</b></div><video controls preload="metadata" playsinline poster="${esc(courseImageFor(item, `video:${item.id||id}`))}"><source src="${esc(item.video)}" type="video/mp4">Twoja przeglądarka nie obsługuje odtwarzania MP4.</video><p>Oglądaj film razem z procedurą. Ustawienia urządzeń i temperatury zawsze weryfikuj dla konkretnego modelu i procesu.</p></section>`:'';
    const body = `${lessonImage}${lessonVideo}<div class="course-source-intro"><h3>${state.language==='en'?'Detailed lesson':'Szczegółowe omówienie lekcji'}</h3><div class="course-intro-copy">${contentParagraphs}</div>${item.step?`<h3>${state.language==='en'?'Safe first step':'Bezpieczny pierwszy krok'}</h3><p>${esc(item.step)}</p>`:''}${item.symptoms?`<h3>${state.language==='en'?'Symptoms to recognize':'Objawy do rozpoznania'}</h3><p>${esc(item.symptoms)}</p>`:''}${item.diagnosis?`<h3>${state.language==='en'?'Diagnostic reasoning':'Tok rozumowania diagnostycznego'}</h3><p>${esc(item.diagnosis)}</p>`:''}${item.repair?`<h3>${state.language==='en'?'Repair options':'Możliwe rozwiązania'}</h3><p>${esc(item.repair)}</p>`:''}${item.verify?`<h3>${state.language==='en'?'Acceptance test':'Test końcowy'}</h3><p>${esc(item.verify)}</p>`:''}${item.warning?`<h3>${state.language==='en'?'Safety stop':'Ostrzeżenia i warunki przerwania pracy'}</h3><p class=\"lesson-safety-note\">${esc(item.warning)}</p>`:''}${variantsHtml}${manualHtml}</div>${window.ACADEMY_LEARNING_ENGINE ? window.ACADEMY_LEARNING_ENGINE.buildGuide(item,state.courseTab) : ''}<div class="modal-actions"><button class="btn btn-primary" id="markCourseComplete" data-complete-id="${esc(id)}">${completed.includes(`${state.courseTab}:${id}`)?state.language==='en'?'Mark as incomplete':'Oznacz jako nieukończone':state.language==='en'?'Mark topic complete':'Oznacz temat jako ukończony'}</button></div>`;
    openModal(title,`${state.courseTab.toUpperCase()} / ${state.language==='en'?'COMPLETE LEARNING A–Z':'KOMPLETNA NAUKA A–Z'}`,body,true);
  };
  const openModal = (title,kicker,body,wide=false) => {
    $('#modalTitle').textContent=title;
    $('#modalKicker').textContent=kicker;
    $('#modalBody').innerHTML=body;
    const modal=$('#contentModal .modal');
    modal.classList.toggle('modal-wide',!!wide);
    modal.classList.remove('repair-procedure-modal');
    $('#modalBody').scrollTop=0;
    document.body.classList.add('modal-open');
    $('#contentModal').classList.remove('hidden');
    hydrateGuideChecks();
  };
  const closeModal = () => {
    state.activeCourse=null;
    state.activeRepair=null;
    $('#contentModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    $('#modalBody').innerHTML='';
    if(/^#repair\/(FAULT[\w-]+)$/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search);
  };
  const renderLibrary = () => {
    const q=($('#librarySearch').value||'').trim().toLowerCase(); const cat=$('#libraryCategory').value;
    const docs=(DATA.library||[]).filter(d=>(cat==='all'||d.category===cat)&&[d.title,d.category,d.description,d.type].join(' ').toLowerCase().includes(q));
    $('#libraryGrid').innerHTML=docs.length?docs.map(d=>{const file=(d.path||'').split('/').pop()||'material';const type=String(d.type||'PLIK').toUpperCase();return `<article class="doc-card"><div class="doc-card-top"><span class="doc-icon">${type==='PDF'?'▧':type==='XLSX'?'▦':type==='DOCX'?'▤':'≡'}</span><span class="doc-type">${esc(type)}</span></div><h3>${esc(d.title)}</h3><p>${esc(d.description||'Materiał z biblioteki serwisowej.')}</p><div class="doc-card-foot"><span class="doc-size">${d.bytes?`${(d.bytes/1024/1024).toFixed(1)} MB`:''}</span><div class="doc-actions"><button class="doc-link doc-open-button" type="button" data-open-doc-id="${esc(d.id)}">${type==='PDF'?'Podgląd':'Szczegóły'} →</button><a class="doc-download" href="${esc(d.path)}" download="${esc(file)}">Pobierz ${esc(type)}</a></div></div></article>`;}).join(''):empty('Nie znaleziono dokumentu','Zmień kategorię lub wyszukiwane hasło.');
  };
  const initLibraryFilters = () => { const cats=[...new Set((DATA.library||[]).map(x=>x.category).filter(Boolean))]; $('#libraryCategory').innerHTML='<option value="all">Wszystkie grupy</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); };
  const renderDiagnosticDocs = () => {
    const ids=['DOC-08','DOC-09','DOC-10','DOC-11','DOC-12','DOC-06','DOC-07','DOC-13'];
    const docs=ids.map(libraryById).filter(Boolean);
    $('#diagnosticDocs').innerHTML=docs.map(d=>`<article class="doc-card"><div class="doc-card-top"><span class="doc-icon">▧</span><span class="doc-type">${esc(d.type)}</span></div><h3>${esc(d.title)}</h3><p>${esc(d.description||'Materiał diagnostyczny.')}</p><div class="doc-card-foot"><span class="doc-size">${(d.bytes/1024/1024).toFixed(1)} MB</span><div class="doc-actions"><button class="doc-link doc-open-button" type="button" data-open-doc-id="${esc(d.id)}">Podgląd →</button><a class="doc-download" href="${esc(d.path)}" download="${esc((d.path||'').split('/').pop()||'material.pdf')}">Pobierz ${esc(String(d.type||'PDF'))}</a></div></div></article>`).join('');
  };
  const diagnosticFeatureItems = [
    {id:'BIOS-002',tag:'UEFI / BIOS',desc:'Odzyskiwanie firmware, bezpieczny rollback, analiza nieudanego flashowania i procedury ratunkowe.'},
    {id:'LATEST-038',tag:'WINDOWS 11',desc:'Analiza logów WHEA, błędów PCIe i niestabilności sprzętu w systemie Windows.'},
    {id:'LATEST-039',tag:'GPU',desc:'Testy VRAM, hotspot, artefakty obrazu, stabilność i diagnostyka TDR.'},
    {id:'LATEST-040',tag:'ARM / SOC',desc:'Zgodność sterowników, aplikacji i systemu Windows na platformach ARM.'},
    {id:'LATEST-043',tag:'USB / ZASILANIE',desc:'Porty USB 2.0/3.x/USB4, wykrywanie urządzeń i diagnostyka zasilania.'},
    {id:'LATEST-041',tag:'USB-C / PD',desc:'Negocjacja Power Delivery, pomiary napięcia, przewody i układ ładowania.'},
    {id:'LATEST-042',tag:'HDD / SSD',desc:'Ocena dysku po upadku, SMART, błędy nośnika i bezpieczne odzyskiwanie danych.'},
    {id:'PRO311-001',tag:'EC / POST',desc:'Sekwencja startowa laptopa, sygnały EC, ładowanie i diagnostyka braku POST.'},
    {id:'LATEST-034',tag:'BATERIA',desc:'Ocena kondycji akumulatora Li-ion, cykli, ładowania i bezpieczeństwa.'},
    {id:'GLOBAL-075',tag:'RAM',desc:'Testy modułów i slotów DDR4/DDR5, profile XMP/EXPO i błędy pamięci.'},
    {id:'GLOBAL-082',tag:'CHŁODZENIE',desc:'Czyszczenie układu chłodzenia, wentylatory, termopady, pasta i temperatury.'},
    {id:'PRO31-001',tag:'PŁYTA GŁÓWNA',desc:'Diagnostyka sekcji zasilania VRM, pomiary napięć i kontrola płyty.'}
  ];
  const renderDiagnosticCatalog = () => {
    const root=$('#diagnosticCatalog'); if(!root)return;
    const q=($('#diagnosticCardSearch')?.value||'').trim().toLocaleLowerCase('pl');
    const all=diagnosticFeatureItems.map(card=>({...card,item:(DATA.courseLessons||[]).find(x=>x.id===card.id)})).filter(x=>x.item);
    const rows=all.filter(x=>[x.tag,x.desc,x.item.title,x.item.category,x.item.titleEn].join(' ').toLocaleLowerCase('pl').includes(q));
    $('#diagnosticCardCount').textContent=`${rows.length} materiałów`;
    root.innerHTML=rows.length?rows.map((x,i)=>{
      const item=localizedRecord(x.item); const image=window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl(item,`diagnostic:${x.id}`):'assets/artwork-fix77/page-illustration-40.svg';
      return `<article class="diagnostic-feature-card"><button class="diagnostic-feature-action" type="button" data-diagnostic-course="${esc(x.id)}" aria-label="Otwórz materiał: ${esc(item.title)}"><span class="diagnostic-feature-image"><img class="diagnostic-photo-fix90" data-photo-id="diagnostic:${esc(x.id)}" data-photo-scope="diagnostic-card" data-photo-title="${esc(item.title)}" data-photo-kind="${esc(item.category||x.tag||'board')}" src="${esc(image)}" alt="${esc(item.title)} — oczekiwanie na fotografię" loading="lazy"><span class="diagnostic-feature-tag">${esc(x.tag)}</span></span><span class="diagnostic-feature-copy"><span class="diagnostic-feature-title">${esc(item.title)}</span><span class="diagnostic-feature-description">${esc(x.desc)}</span><span class="diagnostic-feature-button">Otwórz materiał <b>→</b></span></span></button></article>`;
    }).join(''):empty('Nie znaleziono materiałów','Zmień wyszukiwane hasło.');
  };
  const renderChecklistTabs = () => {
    $('#checklistTabs').innerHTML=(DATA.tables||[]).map((t,i)=>{const label=state.language==='en'?(t.nameEn||t.name):t.name;return `<button class="checklist-tab ${i===state.checklistIndex?'active':''}" data-checklist-index="${i}">${esc(label)}</button>`;}).join('');
    renderChecklist();
  };
  const renderChecklist = () => {
    const table=(DATA.tables||[])[state.checklistIndex]; if(!table){$('#checklistPanel').innerHTML=empty('Brak arkuszy','Nie znaleziono tabel serwisowych.');return;}
    const rows=(state.language==='en'&&table.rowsEn)?table.rowsEn:(table.rows||[]); const headers=rows[0]||[]; const checklistState=localGet('academyChecklist',{}); const checks=checklistState[state.checklistIndex]||{};
    const body=rows.slice(1).map((row,i)=>`<tr class="${checks[i]?'done':''}"><td>${i+1}</td><td>${esc(row[1]??row[0]??'')}</td><td><input type="checkbox" aria-label="Oznacz ${esc(row[1]??row[0]??'czynność')}" data-check-row="${i}" ${checks[i]?'checked':''}></td></tr>`).join('');
    const done=Object.values(checks).filter(Boolean).length; const total=rows.length-1;
    const tableName=state.language==='en'?(table.nameEn||table.name):table.name; const rangeLabel=state.language==='en'?'Checklist scope: ':'Zakres arkusza: '; const doneLabel=state.language==='en'?'completed':'wykonanych'; const actionLabel=state.language==='en'?'Clear this checklist':'Wyczyść tę checklistę'; const savedLabel=state.language==='en'?'Selections are stored in this browser.':'Zaznaczenia są zapisywane w tej przeglądarce.'; const nrLabel=state.language==='en'?'NO.':'NR'; const okLabel=state.language==='en'?'DONE':'OK'; $('#checklistPanel').innerHTML=`<div class="checklist-head"><div><h2>${esc(tableName)}</h2><span class="muted">${rangeLabel}${esc((state.language==='en'?(table.rangeEn||table.range):table.range)||'')}</span></div><span class="check-progress">${done} / ${total} ${doneLabel}</span></div><table class="check-table"><thead><tr><th>${nrLabel}</th><th>${esc(headers[1]||(state.language==='en'?'Service action':'Czynność serwisowa'))}</th><th>${okLabel}</th></tr></thead><tbody>${body}</tbody></table><div class="checklist-actions"><span class="muted">${savedLabel}</span><button class="btn btn-outline btn-small" id="resetChecklist">${actionLabel}</button></div>`;
  };
  const updateProgress = () => {
    const completed=localGet('academyCompletedLessons',[]); const checks=localGet('academyChecklist',{});
    const count=completed.length+Object.values(checks).reduce((n,obj)=>n+Object.values(obj||{}).filter(Boolean).length,0);
    const total=(DATA.courseLessons||[]).length+(DATA.beginnerLessons||[]).length+(DATA.tables||[]).reduce((n,t)=>n+Math.max(0,(t.rows||[]).length-1),0);
    const pct=total?Math.min(100,Math.round(count/total*100)):0;
    const ring=$('#progressRing');if(ring)ring.textContent=`${pct}%`;
    const bar=$('#progressBar');if(bar)bar.style.width=`${pct}%`;
    const label=$('#progressLabel');if(label)label.textContent=`${count} wykonanych zadań z ${total}`;
    const deck=$('#academyDeckProgress');if(deck)deck.textContent=`${pct}%`;
    const orb=$('.academy-progress-orb');if(orb)orb.style.background=`conic-gradient(#11e9ad 0 ${pct}%,#17466b ${pct}% 100%)`;
  };
  const globalSearch = () => {
    const q=($('#globalSearch').value||'').trim().toLowerCase(); const box=$('#searchSuggestions');
    if(q.length<2){box.classList.add('hidden');box.innerHTML='';return;}
    const matches=[];
    allRepairs.forEach(f=>{if([f.title,f.symptom,f.category,f.causes].join(' ').toLowerCase().includes(q))matches.push({type:'NAPRAWA',title:f.title,desc:f.symptom,action:()=>openRepairModal(f.id)});});
    (DATA.courseTopics||[]).slice(0,400).forEach((x,i)=>{if([x.title,x.description,x.symptoms].join(' ').toLowerCase().includes(q))matches.push({type:'KURS',title:x.title,desc:x.description||x.symptoms,action:()=>{state.courseTab='topics';showView('courses');renderCourseTabButtons();renderCourses();openCourseModal(x.id||String(i));}});});
    (DATA.library||[]).forEach(d=>{if([d.title,d.description,d.category].join(' ').toLowerCase().includes(q))matches.push({type:'BIBLIOTEKA',title:d.title,desc:d.description,action:()=>{showView('library');$('#librarySearch').value=q;renderLibrary();}});});
    const subset=matches.slice(0,8);
    box.innerHTML=subset.length?subset.map((m,i)=>`<button class="suggestion-item" data-suggestion="${i}"><small>${esc(m.type)}</small><b>${esc(m.title)}</b><small>${esc(m.desc||'')}</small></button>`).join(''):empty('Brak wyników','Spróbuj wpisać inną frazę.');
    box.classList.remove('hidden');
    box._actions=subset;
  };
  const doPdfSearch = () => {
    const q=($('#pdfSearchInput').value||'').trim().toLowerCase(); if(q.length<2){toast('Wpisz co najmniej 2 znaki.');return;}
    const output=$('#pdfSearchResults');
    if(!state.pdfIndexLoaded){
      if(state.pdfIndexLoading)return;
      state.pdfIndexLoading=true;output.innerHTML='<div class="muted">Ładowanie indeksu podręczników…</div>';
      const script=document.createElement('script');script.src='assets/pdf-index.js';script.onload=()=>{state.pdfIndexLoaded=!!window.ACADEMY_PDF_INDEX;state.pdfIndexLoading=false;searchPdf(q);};script.onerror=()=>{state.pdfIndexLoading=false;output.innerHTML=empty('Nie można wczytać indeksu','Otwórz stronę na hostingu lub sprawdź, czy plik assets/pdf-index.js jest w katalogu.');};document.body.appendChild(script);
    }else searchPdf(q);
  };
  const searchPdf = q => {
    const entries=window.ACADEMY_PDF_INDEX||[]; const found=[];
    for(const item of entries){const t=String(item.text||'');const index=t.toLowerCase().indexOf(q);if(index>=0){const from=Math.max(0,index-100),to=Math.min(t.length,index+q.length+190);found.push({...item,snippet:t.slice(from,to).replace(/\s+/g,' ').trim()});if(found.length>=30)break;}}
    $('#pdfSearchResults').innerHTML=found.length?found.map(x=>`<article class="pdf-result"><h3>${esc(x.source)} · strona ${x.page}</h3><p>${esc(x.snippet)}</p><div class="doc-actions"><button type="button" class="doc-link" data-open-pdf-page data-pdf-path="${esc(x.path)}" data-pdf-page="${Number(x.page)}">Podgląd strony ${Number(x.page)} w Akademii →</button><a class="doc-download" href="${esc(x.path)}" download="${esc(String(x.path).split('/').pop()||'podrecznik.pdf')}">Pobierz PDF</a></div></article>`).join(''):empty('Brak dopasowań','W indeksie 880 stron nie znaleziono tego hasła.');
  };
  const renderMedia = () => {
    const photoRoot=$('#photoGallery');
    if(photoRoot) photoRoot.innerHTML=(window.ACADEMY_ART?.onlinePhotos||[]).map(p=>{const labels={'pcb-microscope':['Naprawa PCB pod mikroskopem','Inspekcja elementów i pól lutowniczych.'],'motherboard-closeup':['Płyta główna — zbliżenie','Rozpoznawanie układów i sekcji na PCB.'],'laptop-motherboard':['Płyta laptopa','Budowa i rozmieszczenie podzespołów.'],'laptop-repair-tools':['Narzędzia naprawy laptopa','Przygotowanie stanowiska i demontaż.'],'pc-hardware':['Podzespoły komputera','Identyfikacja elementów komputera.'],'ram-modules':['Moduły pamięci RAM','Rozpoznawanie modułów i styków pamięci.'],'data-storage':['Nośniki danych','Porównanie różnych technologii przechowywania.'],'multimeter-pcb':['Pomiar na płycie głównej','Praca z multimetrem i punktem pomiarowym.'],'multimeter-bench':['Multimetr cyfrowy','Przyrząd i jego zastosowanie w elektronice.'],'electronics-measurement':['Diagnostyka elektroniki','Pomiar układów elektronicznych.'],'team-learning':['Wspólna analiza płyty','Współpraca i ćwiczenia diagnostyczne.'],'electronics-work':['Praca z elektroniką','Stanowisko do nauki napraw.']};const [title,desc]=labels[p.id]||[p.title||p.id,p.description||`Unikalna ilustracja techniczna: ${p.kind}`];const poster=window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl({id:p.id,image:p.url,category:p.kind},`gallery:${p.id}`):p.url;const realPhoto=!poster.startsWith('data:image/svg+xml');return `<article class="photo-card photo-card-online"><button class="photo-card-image-button" type="button" ${realPhoto?`data-open-image="${esc(p.url)}"`:''} data-image-title="${esc(title)}"><img src="${esc(poster)}" alt="${esc(realPhoto?title:'Unikalna ilustracja edukacyjna: '+title)}" loading="lazy"><span class="photo-zoom">${state.language==='en'?'Open image ⤢':'Powiększ ⤢'}</span></button><span class="photo-card-caption"><b>${esc(title)}</b><small>${esc(desc)}</small>${realPhoto?`<a href="${esc(p.page)}" target="_blank" rel="noopener noreferrer">Autor: ${esc(p.author)} · Pexels License ↗</a>`:'<small>Unikalna ilustracja techniczna — bez powtarzania fotografii.</small>'}</span></article>`;}).join('');
    const videoRoot=$('#videoGallery');
    if(videoRoot) videoRoot.innerHTML=LOCAL_VIDEO_DATA.map(v=>{const poster=window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl(v,`video-card:${v.id}`):`media/${v.poster}`;return `<article class="video-card"><button class="video-cover" type="button" data-open-video="${v.id}" data-video-title="${esc(v.title)}"><img src="${esc(poster)}" alt="Unikalna ilustracja techniczna filmu: ${esc(v.title)}" loading="lazy"><span class="play-button">▶</span><span class="video-duration-tag">AUTORSKI · ${Math.round(v.duration/60)} min</span></button><div class="video-copy"><span class="video-category">${esc(v.category)} · 2026</span><h3>${esc(v.title)}</h3><p>${esc(v.narration.slice(0,180))}…</p><small>NAPRAWA PC · oryginalny film z polską narracją</small><button class="btn btn-outline btn-small" type="button" data-open-video="${v.id}">Odtwórz w Akademii ▶</button></div></article>`;}).join('');
    const longRoot=$('#longVideoGallery');
    if(longRoot) longRoot.innerHTML=(window.ACADEMY_LONG_VIDEOS||[]).map(v=>{const done=localGet('academyLongVideoDone',[]).includes(v.id);const poster=(window.ACADEMY_ART?.onlinePhotos||[]).find(p=>p.id===v.photoId);const posterUrl=poster?(window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl({id:poster.id,image:poster.url,category:poster.kind},`long-video:${v.id}`):poster.url):'';const posterIsPhoto=!!posterUrl&&!posterUrl.startsWith('data:image/svg+xml');return `<article class="long-video-card">${poster?`<a class="long-video-cover" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(posterUrl)}" alt="${esc(posterIsPhoto?'Fotografia tematyczna kursu: '+v.title:'Unikalna ilustracja tematyczna kursu: '+v.title)}"><span>▶ PEŁNE SZKOLENIE</span></a><small class="long-video-credit">${posterIsPhoto?`Zdjęcie: ${esc(poster.author)} · Pexels`:'Unikalna ilustracja edukacyjna; zdjęcie nie jest powielane.'}</small>`:''}<div class="long-video-top"><span class="long-video-level">${esc(v.level)} · ${esc(v.language)}</span><span class="long-video-duration">▶ ${esc(v.duration)}</span></div><div class="long-video-copy"><span class="video-category">${esc(v.category)} · ELECTRONICS REPAIR SCHOOL / YOUTUBE</span><h3>${esc(v.title)}</h3><p>${esc(v.description)}</p><div class="long-video-chapters"><b>W programie:</b><span>${v.chapters.map(esc).join(' · ')}</span></div><div class="long-video-outcome"><b>Po obejrzeniu:</b> ${esc(v.outcome)}</div><div class="long-video-actions"><a class="btn btn-primary btn-small" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">Otwórz materiał u wydawcy ↗</a><button type="button" class="btn btn-outline btn-small" data-long-video-done="${esc(v.id)}">${done?'✓ Obejrzane':'Oznacz jako obejrzane'}</button></div><small>${done?'Zapisano lokalnie w Twoim postępie.':'Link prowadzi do zewnętrznego materiału wideo; czas i język podano zgodnie ze źródłem.'}</small></div></article>`;}).join('');
  };
  const openVideo = id => {
    const local=LOCAL_VIDEO_DATA.find(x=>x.id===id);
    if(local){const body=`<div class="video-player-wrap"><video controls playsinline preload="metadata" poster="${esc(window.ACADEMY_ART?.dataUrl?window.ACADEMY_ART.dataUrl(local,`video-player:${local.id}`):`media/${local.poster}`)}"><source src="media/${esc(local.file)}" type="video/mp4"><track kind="captions" srclang="pl" label="Polski" src="media/${esc(local.captions||local.file.replace('.mp4','.vtt'))}" default>Twoja przeglądarka nie obsługuje wideo MP4.</video></div><div class="video-details"><span class="video-category">${esc(local.category)} · film autorski</span><h3>${esc(local.title)}</h3><p>${esc(local.narration)}</p><p><a class="doc-download" href="media/${esc(local.file)}" download>⬇ Pobierz własny film MP4</a> <a class="doc-download" href="media/${esc(local.file.replace('.mp4','.srt'))}" download>Pobierz napisy SRT</a></p><small>Materiał autorski Akademii; plansze i polska narracja syntetyczna przygotowane do kursu. Film działa lokalnie, bez YouTube.</small></div>`;openModal(local.title,'FILMY AUTORSKIE / ODTWARZANIE LOKALNE',body,true);return;}
    toast('Ten materiał nie jest dostępny jako film lokalny. W galerii znajdują się wyłącznie autorskie filmy Akademii.');
  };
  const openImage = (src,title) => { const body=`<figure class="image-viewer"><img src="${esc(src)}" alt="${esc(title)}"><figcaption>${esc(title)} · Materiał wizualny z biblioteki Nauka od A do Z.</figcaption></figure>`; openModal(title,'GALERIA SERWISOWA / ZDJĘCIE',body,true); };
  const renderCourseTabButtons = () => {
    const counts={lessons:(DATA.courseLessons||[]).length,basics:(DATA.beginnerLessons||[]).length,topics:(DATA.courseTopics||[]).length,articles:(DATA.htmlArticles||[]).length,manual:(DATA.manualChapters||[]).length};
    $$('.subtab').forEach(b=>{b.classList.toggle('active',b.dataset.courseTab===state.courseTab);const em=b.querySelector('em');if(em)em.textContent=counts[b.dataset.courseTab]??'';});
    const total=Object.values(counts).reduce((a,b)=>a+b,0);const metric=$('#view-courses .title-metric b');if(metric)metric.textContent=total.toLocaleString('pl-PL');
    const metricLabel=$('#view-courses .title-metric span');if(metricLabel)metricLabel.innerHTML=`lekcji, tematów i rozdziałów<br>szkoleniowych`;
  };
  const bindEvents = () => {
    $$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
    $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.nav)));
    $('#openAllRepairs')?.addEventListener('click',()=>showView('repairs'));
    $('#startDiagnosis')?.addEventListener('click',()=>showView('diagnostics'));
    $('#repairSearch')?.addEventListener('input',renderRepairList);$('#repairCategory')?.addEventListener('change',renderRepairList);$('#repairPriority')?.addEventListener('change',renderRepairList);
    $('#quickRepairs')?.addEventListener('click',e=>{const b=e.target.closest('[data-open-repair]');if(b)openRepairModal(b.dataset.openRepair);});
    $('#featuredRepairs')?.addEventListener('click',e=>{const b=e.target.closest('[data-open-repair]');if(b)openRepairModal(b.dataset.openRepair);});
    $('#homeCategories')?.addEventListener('click',e=>{const b=e.target.closest('[data-category-open]');if(b){showView('repairs');$('#repairCategory').value=b.dataset.categoryOpen;renderRepairList();}});
    $('#repairList')?.addEventListener('click',e=>{const b=e.target.closest('[data-open-repair]');if(b)openRepairModal(b.dataset.openRepair);});
    $('#courseTabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-course-tab]');if(!b)return;state.courseTab=b.dataset.courseTab;renderCourseTabButtons();renderCourses();});
    $('#courseSearch')?.addEventListener('input',renderCourses);
    $$('[data-course-quick]').forEach(b=>b.addEventListener('click',()=>{state.courseTab='lessons';renderCourseTabButtons();$('#courseSearch').value=b.dataset.courseQuick;renderCourses();$('#courseContent').scrollIntoView({behavior:'smooth',block:'start'});}));
    $('#courseContent')?.addEventListener('click',e=>{const b=e.target.closest('[data-course-id]');if(b)openCourseModal(b.dataset.courseId);});
    $('#diagnosticCardSearch')?.addEventListener('input',renderDiagnosticCatalog);
    $('#diagnosticCatalog')?.addEventListener('click',e=>{const b=e.target.closest('[data-diagnostic-course]');if(!b)return;state.courseTab='lessons';renderCourseTabButtons();openCourseModal(b.dataset.diagnosticCourse);});
    $('#modalClose')?.addEventListener('click',closeModal);$('#contentModal')?.addEventListener('click',e=>{if(e.target.id==='contentModal')closeModal();});
    $('#modalBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-complete-id]');if(!b)return;const id=`${state.courseTab}:${b.dataset.completeId}`;const arr=localGet('academyCompletedLessons',[]);const next=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];localSet('academyCompletedLessons',next);b.textContent=next.includes(id)?state.language==='en'?'Mark as incomplete':'Oznacz jako nieukończone':state.language==='en'?'Mark topic complete':'Oznacz temat jako ukończony';updateProgress();toast('Postęp zapisany lokalnie.');});
    $('#modalBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-tutor-prompt]');if(!b)return;sendTutorQuestion(b.dataset.tutorPrompt);});
    $('#modalBody')?.addEventListener('submit',e=>{if(e.target.id!=='tutorChatForm')return;e.preventDefault();const input=$('#tutorQuestion');const q=(input?.value||'').trim();if(!q)return;sendTutorQuestion(q);input.value='';});
    $('#modalBody')?.addEventListener('change',e=>{const cb=e.target.closest('[data-guide-check]');if(!cb)return;const key=cb.dataset.guideCheck;const idx=Number(cb.dataset.guideIndex);const all=localGet('academyGuideSteps',{});all[key]=all[key]||{};all[key][idx]=cb.checked;localSet('academyGuideSteps',all);toast('Krok nauki zapisany.');});
    document.addEventListener('click',async e=>{const doneBtn=e.target.closest('[data-long-video-done]');if(doneBtn){const saved=localGet('academyLongVideoDone',[]);const id=doneBtn.dataset.longVideoDone;const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];localSet('academyLongVideoDone',next);renderMedia();toast(next.includes(id)?'Zapisano szkolenie jako obejrzane.':'Cofnięto oznaczenie szkolenia.');return;}const docBtn=e.target.closest('[data-open-video],[data-open-image],[data-open-doc-id],[data-open-doc-path],[data-open-pdf-page],[data-copy-repair],[data-print-repair]');if(!docBtn)return;if(docBtn.hasAttribute('data-open-video')){openVideo(docBtn.dataset.openVideo);return;}if(docBtn.hasAttribute('data-open-image')){const live=docBtn.querySelector('img')?.currentSrc||docBtn.dataset.openImage;openImage(live,docBtn.dataset.imageTitle||'Materiał wizualny');return;}if(docBtn.hasAttribute('data-open-doc-id')){openDocById(docBtn.dataset.openDocId);return;}if(docBtn.hasAttribute('data-open-doc-path')){openDocByPath(docBtn.dataset.openDocPath,docBtn.dataset.docPage||null);return;}if(docBtn.hasAttribute('data-open-pdf-page')){openDocByPath(docBtn.dataset.pdfPath,docBtn.dataset.pdfPage);return;}if(docBtn.hasAttribute('data-copy-repair')){const url=`${location.origin}${location.pathname}#repair/${docBtn.dataset.copyRepair}`;try{await navigator.clipboard.writeText(url);toast('Skopiowano adres procedury.');}catch{toast('Adres: '+url);}return;}if(docBtn.hasAttribute('data-print-repair')){window.print();return;}});
    $('#librarySearch')?.addEventListener('input',renderLibrary);$('#libraryCategory')?.addEventListener('change',renderLibrary);
    $('#onlineSourceSearch')?.addEventListener('input',()=>window.ACADEMY_LEARNING_ENGINE?.renderOnline());$('#onlineSourceCategory')?.addEventListener('change',()=>window.ACADEMY_LEARNING_ENGINE?.renderOnline());
    $('#languageToggle')?.addEventListener('click',()=>{state.language=state.language==='pl'?'en':'pl';try{localStorage.setItem('academyLanguage',state.language)}catch{};updateLanguageButton();renderQuickRepairs();renderHome();renderRepairList();renderCourses();renderDiagnosticCatalog();renderMedia();if(state.activeRepair&&$('#contentModal')&&!$('#contentModal').classList.contains('hidden'))openRepairModal(state.activeRepair);else if(state.activeCourse&&$('#contentModal')&&!$('#contentModal').classList.contains('hidden')&&$('#modalBody .course-source-intro'))openCourseModal(state.activeCourse);});
    $('#checklistTabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-checklist-index]');if(!b)return;state.checklistIndex=Number(b.dataset.checklistIndex);renderChecklistTabs();});
    $('#checklistPanel')?.addEventListener('change',e=>{const cb=e.target.closest('[data-check-row]');if(!cb)return;const data=localGet('academyChecklist',{});data[state.checklistIndex]=data[state.checklistIndex]||{};data[state.checklistIndex][cb.dataset.checkRow]=cb.checked;localSet('academyChecklist',data);renderChecklist();updateProgress();});
    $('#checklistPanel')?.addEventListener('click',e=>{if(e.target.id==='resetChecklist'){const data=localGet('academyChecklist',{});delete data[state.checklistIndex];localSet('academyChecklist',data);renderChecklist();updateProgress();}});
    $('#globalSearch')?.addEventListener('input',globalSearch);
    $('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$('#searchSuggestions .suggestion-item');if(first)first.click();}});
    $('#searchSuggestions')?.addEventListener('click',e=>{const b=e.target.closest('[data-suggestion]');if(!b)return;const action=$('#searchSuggestions')._actions?.[Number(b.dataset.suggestion)];if(action){$('#searchSuggestions').classList.add('hidden');$('#globalSearch').value='';action.action();}});
    document.addEventListener('click',e=>{if(!e.target.closest('.global-search-wrap'))$('#searchSuggestions').classList.add('hidden');});
    $('#runPdfSearch')?.addEventListener('click',doPdfSearch);$('#pdfSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')doPdfSearch();});
    $('#copyBlikNumber')?.addEventListener('click',async()=>{const value=$('#blikNumber')?.textContent?.trim()||'78640187';try{await navigator.clipboard.writeText(value);toast('Skopiowano dane BLIK.');}catch{toast('Dane BLIK: '+value);}});
    $('#menuToggle')?.addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#mobileScrim').classList.add('show');});$('#sidebarClose')?.addEventListener('click',closeMobileMenu);$('#mobileScrim')?.addEventListener('click',closeMobileMenu);
    $('#aboutButton')?.addEventListener('click',()=>openModal('Nauka od A do Z — Dla Wszystkich','INFORMACJE O PROJEKCIE',`<p>Jedna strona szkoleniowa do diagnostyki i napraw komputerów PC, laptopów i powiązanych urządzeń peryferyjnych. Materiały korzystają z lokalnych ilustracji technicznych, schematów, plansz szkoleniowych i autorskich filmów MP4 z polską narracją oraz napisami; biblioteka dokumentów i katalog wyposażenia pozostają dostępne.</p><h3>Zakres wydania 3.9.8</h3><ul><li>155 kart usterek i procedur napraw</li><li>409 lekcji serwisowych, 337 materiałów od podstaw, 158 tematów zaawansowanych</li><li>80 artykułów, 11 rozdziałów podręcznika, 51 checklist</li><li>lokalna biblioteka ilustracji technicznych; 10 filmów MP4 z polską narracją i napisami</li><li>Dwujęzyczne materiały PL/EN, tok diagnostyczny, checklisty, testy odbiorcze i ostrzeżenia BHP</li><li>Rozbudowany pomocnik nauki A–Z, historia działań i synchronizacja zapisywana w D1 po dobrowolnej zgodzie</li><li>Asystent AI Google Gemini: jeden dostawca bez zapasowego modelu; odpowiedzi ograniczone do nauki, diagnostyki, naprawy i konserwacji komputerów oraz laptopów; z kontekstem bazy wiedzy Nauki od A do Z</li><li>Eksport i usuwanie danych użytkownika, moderacja wkładów społeczności oraz statystyki wspólnej aktywności osób z aktywną zgodą</li><li>Globalny licznik wizyt i odsłon publicznej strony ze wszystkich urządzeń, oparty na istniejącej bazie D1</li></ul><h3>Granice zastosowania</h3><p>Nie ma uniwersalnej procedury dla wszystkich rewizji sprzętu. Przed naprawą sprawdź dokładny model, rewizję PCB, schemat, instrukcję producenta, napięcia i warunki gwarancji. Standardy IPC/IEC mogą wymagać płatnej licencji.</p><h3>Prywatność</h3><p>Zapisywanie historii w chmurze jest dobrowolne i wymaga zgody. Użytkownik może wyeksportować lub usunąć dane. Bez zgody postęp pozostaje lokalny w przeglądarce. Profil synchronizacji jest pseudonimowy i powiązany z sesją tej przeglądarki; logowanie pseudonimowe jest dostępne bez zewnętrznego konta, a odzyskiwanie na innym urządzeniu wymaga skonfigurowanego dostawcy Google, Facebook lub Microsoft.</p>`));
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus();}if(e.key==='Escape')closeModal();});
    window.addEventListener('popstate',()=>{
      const routeView=new URLSearchParams(location.search).get('view');
      if(routeView&&document.getElementById(`view-${routeView}`))showView(routeView);
    });
    window.addEventListener('hashchange',()=>{
      const id=location.hash.match(/^#repair\/(FAULT[\w-]+)$/)?.[1];
      if(id&&byId(id)){showView('repairs');openRepairModal(id);return;}
      const view=location.hash.match(/^#view=([a-z-]+)(?:&.*)?$/)?.[1];
      if(view&&document.getElementById(`view-${view}`))showView(view);
    });
  };
  const initSectionObserver = () => {
    if(!('IntersectionObserver' in window))return;
    const items=$$('.view-section');
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      const id=visible.target.id.replace('view-','');
      $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
      $('#crumbCurrent').textContent=visible.target.dataset.sectionLabel||'Akademia';
    },{rootMargin:'-18% 0px -65% 0px',threshold:[0,.1,.25,.5]});
    items.forEach(x=>observer.observe(x));
  };
  window.ACADEMY_OPEN_SOURCE = (group,id) => {
    if(group==='faults'){ openRepairModal(id); return true; }
    const tabMap={courseLessons:'lessons',beginnerLessons:'basics',courseTopics:'topics',htmlArticles:'articles',manualChapters:'manual'};
    if(tabMap[group]){ state.courseTab=tabMap[group]; renderCourseTabButtons(); renderCourses(); showView('courses'); openCourseModal(id); return true; }
    if(group==='library'){ openDocById(id); return true; }
    return false;
  };
  const init = () => {
    // Activate the route first. Later rendering errors must never leave the dashboard on screen.
    const earlyQueryView=new URLSearchParams(location.search).get('view');
    const earlyHashView=location.hash.match(/^#view=([a-z-]+)(?:&.*)?$/)?.[1];
    const earlyView=earlyQueryView||earlyHashView||'home';
    showView(document.getElementById(`view-${earlyView}`)?earlyView:'home');
    updateLanguageButton();
    renderQuickRepairs();renderHome();renderRepairFilters();renderRepairList();renderCourses();initLibraryFilters();renderLibrary();renderDiagnosticDocs();renderDiagnosticCatalog();renderChecklistTabs();renderMedia();if(window.ACADEMY_LEARNING_ENGINE){window.ACADEMY_LEARNING_ENGINE.renderOnline();const cats=[...new Set(window.ACADEMY_LEARNING_ENGINE.sources.map(x=>x.category))];const sel=$('#onlineSourceCategory');if(sel)sel.innerHTML='<option value="all">Wszystkie kategorie</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');}bindEvents();
    const queryView=new URLSearchParams(location.search).get('view');
    const hashView=location.hash.match(/^#view=([a-z-]+)(?:&.*)?$/)?.[1];
    const initialView=queryView||hashView;
    showView(initialView&&document.getElementById(`view-${initialView}`)?initialView:'home');
    const hashId=location.hash.match(/^#repair\/(FAULT[\w-]+)$/)?.[1];
    if(hashId&&byId(hashId)){showView('repairs');openRepairModal(hashId);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
