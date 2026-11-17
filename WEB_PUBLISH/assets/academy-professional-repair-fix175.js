(function (global) {
  'use strict';

  const STORAGE_KEY = 'nauka-od-a-do-z-akademia-mistrza-fix175-v1';
  const windowsScenarios = {
    boot: {
      symptom: 'Po ostatniej aktualizacji komputer przechodzi do środowiska odzyskiwania. Dane użytkownika są ważne, a stan dysku nie został jeszcze sprawdzony.',
      options: ['Sprawdź stan nośnika i historię aktualizacji, a następnie dobierz odwracalną procedurę WinRE', 'Od razu sformatuj partycję systemową', 'Usuń wszystkie partycje i rozpocznij instalację od zera'],
      correct: 0,
      explanation: 'Najpierw zabezpiecz dane i oceń nośnik. Dopiero potem rozważ odwrócenie ostatniej aktualizacji lub naprawę systemu w WinRE.'
    },
    bcd: {
      symptom: 'Firmware widzi dysk, ale Windows zgłasza brak urządzenia rozruchowego. Nie potwierdzono jeszcze, czy istnieje partycja EFI i czy tryb UEFI jest zgodny z układem dysku.',
      options: ['Zweryfikuj tryb UEFI/Legacy, kolejność bootowania, partycję EFI i stan nośnika', 'Przełącz losowo UEFI/Legacy i wyczyść TPM', 'Zmień format GPT na MBR bez kopii danych'],
      correct: 0,
      explanation: 'Porównaj tryb firmware z układem GPT/MBR i sprawdź wpisy rozruchowe. Modyfikacje BCD wykonuj dopiero po zabezpieczeniu danych i potwierdzeniu układu partycji.'
    },
    bsod: {
      symptom: 'BSOD pojawia się po instalacji sterownika GPU. W trybie awaryjnym system uruchamia się prawidłowo.',
      options: ['Zidentyfikuj ostatni sterownik i użyj kontrolowanego rollbacku lub pakietu OEM', 'Od razu zaktualizuj BIOS bez związku z objawem', 'Wyłącz wszystkie zabezpieczenia systemowe'],
      correct: 0,
      explanation: 'Związek czasowy i działanie trybu awaryjnego wskazują na sterownik. Zachowaj punkt przywracania i dobierz właściwy pakiet do modelu oraz wersji Windows.'
    },
    update: {
      symptom: 'Aktualizacja systemu zatrzymuje się podczas kolejnych uruchomień. Dysk nie zgłasza dotąd alarmów SMART.',
      options: ['Zapisz kod błędu, sprawdź historię aktualizacji i użyj wspieranej procedury cofnięcia aktualizacji', 'Wielokrotnie wymuszaj wyłączenie bez zapisania objawów', 'Usuń katalogi systemowe ręcznie'],
      correct: 0,
      explanation: 'Zanotuj kod błędu, sprawdź wolne miejsce i logi aktualizacji, a następnie użyj funkcji odzyskiwania Windows. Nie usuwaj ręcznie plików systemowych.'
    }
  };

  const laptopTasks = {
    bottom: { prompt: 'Cel: zdjąć dolną pokrywę bez uszkodzenia zatrzasków. Kolejność elementów mocujących sprawdź w instrukcji danego modelu.', steps: ['Wyłącz laptop, odłącz zasilacz i przygotuj stanowisko ESD', 'Sprawdź instrukcję serwisową oraz rozmieszczenie śrub', 'Odkręć właściwe śruby i odłóż je według położenia', 'Użyj odpowiedniego narzędzia do zwalniania zatrzasków zgodnie z instrukcją'] },
    battery: { prompt: 'Cel: bezpiecznie odłączyć baterię wewnętrzną przed pracami przy podzespołach.', steps: ['Wyłącz laptop i odłącz zasilacz', 'Sprawdź procedurę producenta i lokalizację złącza baterii', 'Otwórz obudowę narzędziem odpowiednim dla konstrukcji', 'Odłącz złącze baterii bez ciągnięcia za przewody', 'Potwierdź brak zasilania zgodnie z instrukcją serwisową'] },
    cooling: { prompt: 'Cel: zdjąć moduł chłodzenia w bezpiecznej kolejności. Nie odkręcaj śrub poza kolejnością określoną przez producenta.', steps: ['Wyłącz urządzenie i odłącz baterię zgodnie z instrukcją', 'Odłącz przewód wentylatora za obudowę wtyku', 'Poluzuj śruby radiatora w oznaczonej kolejności', 'Unieś moduł równomiernie bez podważania laminatu', 'Oczyść powierzchnie i przygotuj właściwe materiały serwisowe'] },
    ssd: { prompt: 'Cel: wymienić dysk M.2 z poszanowaniem danych i ograniczeń mechanicznych.', steps: ['Wykonaj kopię danych i potwierdź typ nośnika/interfejsu', 'Wyłącz urządzenie i odłącz baterię zgodnie z instrukcją', 'Zwolnij mocowanie M.2 i wysuń nośnik pod właściwym kątem', 'Dopasuj długość, kluczowanie i interfejs nowego nośnika', 'Zamocuj dysk bez nadmiernej siły i sprawdź wykrywanie w UEFI'] },
    display: { prompt: 'Cel: przygotować laptop do prac przy matrycy. Elementy zawiasu i taśmy obrazu różnią się między seriami.', steps: ['Wyłącz urządzenie, odłącz zasilacz i baterię według instrukcji', 'Sprawdź dokumentację konkretnej pokrywy i prowadzenie taśm', 'Zabezpiecz powierzchnię matrycy i ramkę', 'Oznacz położenie śrub oraz przewodów antenowych', 'Nie ciągnij za taśmę eDP i nie pracuj przy podłączonym zasilaniu'] }
  };

  const recoveryCases = {
    deleted: { symptom: 'Użytkownik usunął pliki z partycji SSD. System nadal działa i zapisuje na tym samym nośniku.', options: ['Ogranicz dalsze zapisy, zabezpiecz nośnik i pracuj na obrazie/kopii', 'Zainstaluj kilka programów odzyskujących na tej samej partycji', 'Uruchom defragmentację i dalsze kopiowanie danych'], correct: 0, explanation: 'Każdy zapis może nadpisać dane. Najpierw ogranicz użycie źródła; dalszą analizę prowadź na kopii/obrazie, jeśli stan nośnika na to pozwala.' },
    smart: { symptom: 'Dysk wykazuje rosnące błędy SMART i okresowo znika z systemu.', options: ['Przerwij zbędne próby, oceniaj ryzyko i rozważ profesjonalne obrazowanie/odzysk', 'Uruchom długi test zapisu i naprawę sektorów na źródle', 'Kontynuuj normalną pracę, aż dysk przestanie odpowiadać'], correct: 0, explanation: 'Niestabilny nośnik może ulec dalszej degradacji. Przy ważnych danych należy ograniczyć próby i dobrać bezpieczną metodę obrazowania lub przekazać nośnik specjalistom.' },
    partition: { symptom: 'System nie rozpoznaje partycji po nieudanej zmianie rozmiaru. Pliki są ważne.', options: ['Nie zapisuj zmian w tablicy partycji; zabezpiecz kopię/obraz przed analizą', 'Utwórz nową partycję na tym samym obszarze', 'Zainicjuj dysk i sformatuj wolumin'], correct: 0, explanation: 'Przed próbą odbudowy struktury partycji zabezpiecz obraz. Operacje zapisu na źródle mogą utrudnić odzyskiwanie.' },
    encrypted: { symptom: 'Dane znajdują się na zaszyfrowanym woluminie, a użytkownik nie ma obecnie klucza odzyskiwania.', options: ['Zachowaj nośnik bez zmian i ustal legalną ścieżkę odzyskania klucza', 'Próbuj omijać szyfrowanie przypadkowymi narzędziami', 'Formatuj wolumin i obiecaj odzyskanie danych'], correct: 0, explanation: 'Nie obiecuj obejścia szyfrowania. Zachowaj nośnik i ustal, czy użytkownik ma legalny klucz odzyskiwania lub kopię danych.' }
  };

  const driverVendors = {
    '10DE': 'NVIDIA', '1002': 'AMD', '8086': 'Intel', '1022': 'AMD (platforma/chipset)',
    '14E4': 'Broadcom', '10EC': 'Realtek', '168C': 'Qualcomm Atheros',
    '046D': 'Logitech', '045E': 'Microsoft', '04F2': 'Chicony', '0BDA': 'Realtek'
  };

  const powerScenarios = {
    noStandby: { options: ['Zasilanie wejściowe, przewód, gniazdo lub tor standby wymagają weryfikacji', 'Uszkodzony profil kolorów monitora', 'Brak sterownika audio'], correct: 0, explanation: 'Najpierw bezpiecznie potwierdź źródło zasilania, przewód i adapter/PSU jako całość. Dalsza diagnostyka toru standby wymaga dokumentacji i kwalifikacji.' },
    load: { options: ['Sprawdź budżet mocy, temperatury, okablowanie i stabilność zasilania zgodnie ze specyfikacją', 'Zwiększ napięcie GPU bez pomiarów', 'Odłącz przewód ochronny'], correct: 0, explanation: 'Restart pod obciążeniem może mieć wiele przyczyn. Zbierz logi, temperatury i konfigurację mocy. Nie modyfikuj zabezpieczeń ani napięć w ciemno.' },
    usbC: { options: ['Sprawdź zgodność profilu USB-C PD, adapter, przewód i diagnostykę modelu', 'Wymień dowolny układ BGA bez testów', 'Wymuś profil napięciowy niezgodny z urządzeniem'], correct: 0, explanation: 'Zasilanie USB-C PD zależy od uzgodnionego profilu, przewodu i adaptera. Weryfikuj elementy zgodnie z dokumentacją urządzenia.' },
    battery: { options: ['Sprawdź kondycję baterii, raport Windows i zachowanie układu ładowania', 'Zewrzyj styki baterii w celu testu', 'Otwórz pakiet ogniw i zmierz pojedyncze ogniwa bez procedur'], correct: 0, explanation: 'Użyj raportu baterii i procedur producenta. Nie zwieraj styków ani nie rozbieraj pakietu ogniw.' }
  };

  const finalProfiles = {
    ram: ['Wykrywanie całej zainstalowanej pamięci', 'Test pamięci bez nowych błędów', 'Stabilność systemu po kilku restartach', 'Zgodność częstotliwości i profilu pamięci'],
    ssd: ['Dysk jest poprawnie wykrywany w UEFI', 'System plików i partycje są dostępne', 'SMART nie zgłasza nowych krytycznych ostrzeżeń', 'Kopia danych lub klonowanie zostały zweryfikowane'],
    cooling: ['Wentylatory są prawidłowo podłączone', 'Radiator i wloty powietrza są drożne', 'Temperatury pod obciążeniem mieszczą się w specyfikacji', 'Brak nietypowych hałasów i throttlingu'],
    windows: ['System uruchamia się bez pętli naprawy', 'Menedżer urządzeń nie pokazuje nowych błędów', 'Aktualizacje i podstawowe funkcje działają', 'Dziennik zdarzeń nie wykazuje powtarzalnego błędu naprawianego obszaru'],
    gpu: ['Sterownik odpowiada modelowi GPU i systemowi', 'Obraz jest stabilny w rozdzielczości docelowej', 'Test obciążeniowy nie wykazuje artefaktów', 'Temperatury i pobór mocy pozostają w specyfikacji']
  };

  const masterCases = [
    { title: 'Laptop wyłącza się po kilku minutach', context: 'Po czyszczeniu użytkownik zgłasza szybki wzrost temperatury i wyłączenie pod obciążeniem. W historii są dwa niezależne ślady: wentylator okresowo nie startuje, a temperatury CPU rosły już przed ostatnim czyszczeniem. Trzeba znaleźć obie przyczyny.', diagnosis: ['Niepodłączony lub zablokowany wentylator ORAZ nieprawidłowy kontakt radiatora z CPU', 'Uszkodzony profil tapety', 'Brak kodeka audio'], correctDiagnosis: 0, plan: ['Przerwij obciążenie, sprawdź montaż i wentylator zgodnie z serwisówką', 'Zwiększ obciążenie do maksimum i obserwuj, czy się wyłączy', 'Wyłącz zabezpieczenia termiczne'], correctPlan: 0, validation: ['Kontrola montażu, odczyt czujników i kontrolowany test po naprawie', 'Tylko zmiana tapety pulpitu', 'Brak testu po naprawie'], correctValidation: 0 },
    { title: 'PC ma BSOD po instalacji nowego GPU', context: 'System uruchamia się w trybie awaryjnym; błąd pojawił się po zmianie sterownika. W dzienniku są też zaniki zasilania GPU przy obciążeniu, a po montażu nie sprawdzono przewodów karty. Trzeba oddzielić problem programowy od sprzętowego.', diagnosis: ['Konflikt sterownika GPU ORAZ nieprawidłowo osadzony przewód zasilania karty', 'Uszkodzona klawiatura', 'Nieprawidłowa data w BIOS jako jedyna możliwa przyczyna'], correctDiagnosis: 0, plan: ['Rollback do znanego sterownika i instalacja pakietu dla właściwego modelu', 'Losowe aktualizowanie wszystkich sterowników z nieznanego źródła', 'Formatowanie wszystkich dysków'], correctPlan: 0, validation: ['Kontrolny restart i test grafiki z obserwacją błędów', 'Sam fakt instalacji pakietu', 'Brak testu'], correctValidation: 0 },
    { title: 'Dysk okresowo znika z systemu', context: 'SMART zawiera rosnące błędy, a użytkownik przechowuje na nim ważne dane. Dodatkowo połączenie SATA było poruszane przy ostatnim serwisie. Należy uwzględnić stan nośnika i tor połączenia, bez wykonywania zapisów na źródle.', diagnosis: ['Degradacja nośnika ORAZ niestabilne połączenie SATA wymagające weryfikacji', 'Wyłącznie błąd czcionki Windows', 'Problem z ustawieniem jasności'], correctDiagnosis: 0, plan: ['Ogranicz użycie źródła i zabezpiecz dane/obraz; w razie potrzeby przekaż do specjalistów', 'Uruchom długi zapis naprawczy na źródle', 'Zainstaluj aktualizator sterowników na tym dysku'], correctPlan: 0, validation: ['Zweryfikuj kopię na innym nośniku i raport stanu', 'Zapisz kolejne pliki na źródle', 'Usuń raport SMART'], correctValidation: 0 },
    { title: 'Brak zasilania laptopa przez USB-C', context: 'Urządzenie działa na baterii. Po podłączeniu adaptera nie pojawia się ładowanie. Użytkownik używał dwóch różnych przewodów, a oględziny portu wykazały możliwe zanieczyszczenie. Wymagane jest rozdzielenie problemu akcesoriów i gniazda.', diagnosis: ['Niezgodny adapter lub przewód USB-C PD ORAZ problem z portem wymagający oględzin', 'Zły układ partycji GPT', 'Brak kodeka wideo'], correctDiagnosis: 0, plan: ['Sprawdź zgodność PD, adapter i przewód, potem postępuj według dokumentacji modelu', 'Podaj napięcie na losowe styki', 'Zewrzyj styki złącza'], correctPlan: 0, validation: ['Potwierdź bezpieczne uzgodnienie ładowania zgodnym zestawem i obserwuj stabilność', 'Wyłącznie zmiana sterownika audio', 'Brak weryfikacji'], correctValidation: 0 }
  ];

  const faults = [
    { id: 'F001', domain: 'Windows', title: 'Pętla automatycznej naprawy', symptom: 'Windows za każdym razem przechodzi do środowiska odzyskiwania.', first: 'Zabezpiecz dane, odczytaj kod błędu i oceń stan nośnika przed naprawą rozruchu.', avoid: 'Nie formatuj dysku jako pierwszego kroku.' },
    { id: 'F002', domain: 'RAM', title: 'Niestabilność po rozbudowie pamięci', symptom: 'Komputer restartuje się po dołożeniu modułu RAM.', first: 'Sprawdź specyfikację płyty, obsadzenie slotów i uruchom test pamięci w bezpiecznej konfiguracji.', avoid: 'Nie podnoś napięć bez dokumentacji i oceny kompatybilności.' },
    { id: 'F003', domain: 'SSD', title: 'Dysk znika podczas pracy', symptom: 'Nośnik okresowo znika z systemu, a SMART sygnalizuje ostrzeżenia.', first: 'Zabezpiecz ważne dane i oceń nośnik bez zbędnych zapisów.', avoid: 'Nie wykonuj długich testów zapisu na niestabilnym źródle.' },
    { id: 'F004', domain: 'GPU', title: 'Artefakty obrazu pod obciążeniem', symptom: 'Pojawiają się kolorowe artefakty po kilku minutach pracy GPU.', first: 'Zapisz objawy, temperatury, sterownik i przetestuj bezpiecznie znaną konfigurację.', avoid: 'Nie zwiększaj limitów mocy ani napięć w ciemno.' },
    { id: 'F005', domain: 'Chłodzenie', title: 'Wysokie temperatury laptopa', symptom: 'Wentylator pracuje głośno, a temperatury rosną szybko.', first: 'Oceń przepływ powietrza, obciążenie, czujniki i stan układu chłodzenia.', avoid: 'Nie uruchamiaj długiego testu obciążeniowego przed wstępną kontrolą.' },
    { id: 'F006', domain: 'USB-C PD', title: 'Brak ładowania USB-C', symptom: 'Laptop nie ładuje się z jednego adaptera, ale działa na baterii.', first: 'Zweryfikuj zgodność adaptera, przewodu i profilu PD z modelem urządzenia.', avoid: 'Nie wymuszaj nieobsługiwanych napięć.' },
    { id: 'F007', domain: 'Sterowniki', title: 'Nieznane urządzenie PCI', symptom: 'Menedżer urządzeń pokazuje urządzenie z kodem 28.', first: 'Odczytaj pełny Hardware ID i dobierz sterownik z witryny producenta.', avoid: 'Nie instaluj przypadkowego pakietu sterowników.' },
    { id: 'F008', domain: 'Zasilanie', title: 'Restart przy obciążeniu', symptom: 'PC restartuje się, gdy GPU i CPU są mocno obciążone.', first: 'Zbierz logi, temperatury, konfigurację mocy i sprawdź specyfikację zasilania.', avoid: 'Nie otwieraj zasilacza i nie omijaj zabezpieczeń.' },
    { id: 'F009', domain: 'UEFI', title: 'Brak urządzenia rozruchowego', symptom: 'Firmware nie znajduje wpisu Windows Boot Manager.', first: 'Sprawdź wykrywanie dysku, tryb UEFI, GPT/EFI i kolejność startową.', avoid: 'Nie zmieniaj losowo GPT/MBR.' },
    { id: 'F010', domain: 'Bateria', title: 'Nagłe wyłączenie po odłączeniu adaptera', symptom: 'Laptop działa z zasilaczem, ale wyłącza się po odłączeniu.', first: 'Sprawdź raport kondycji baterii i procedurę producenta.', avoid: 'Nie rozbieraj pakietu ogniw i nie zwieraj styków.' },
    { id: 'F011', domain: 'Obraz', title: 'Brak obrazu po wybudzeniu', symptom: 'System pracuje, lecz ekran pozostaje czarny po wybudzeniu.', first: 'Sprawdź reakcję systemu, zewnętrzny ekran, sterownik i historię zdarzeń.', avoid: 'Nie wymieniaj matrycy bez testu toru obrazu.' },
    { id: 'F012', domain: 'Sieć PC', title: 'Komputer nie uzyskuje adresu IP', symptom: 'Windows zgłasza brak poprawnego adresu IPv4.', first: 'Sprawdź kartę, link, konfigurację DHCP i wynik diagnostyki sieci Windows.', avoid: 'Nie resetuj bez potrzeby całej konfiguracji routera.' }
  ];

  const codes = [
    { code: '0x0000007B', type: 'BSOD', title: 'INACCESSIBLE_BOOT_DEVICE', detail: 'Windows nie uzyskał dostępu do urządzenia rozruchowego. Sprawdź zmiany trybu kontrolera, konfigurację rozruchu i stan nośnika.' },
    { code: '0x00000124', type: 'BSOD', title: 'WHEA_UNCORRECTABLE_ERROR', detail: 'Zgłoszenie błędu sprzętowego przez architekturę WHEA. Analizuj zrzut, dziennik WHEA, temperatury i stabilność podzespołów.' },
    { code: '0x000000EF', type: 'BSOD', title: 'CRITICAL_PROCESS_DIED', detail: 'Zakończył działanie krytyczny proces systemu. Sprawdź zrzut pamięci, pliki systemowe, dysk i ostatnie sterowniki.' },
    { code: '0x0000009F', type: 'BSOD', title: 'DRIVER_POWER_STATE_FAILURE', detail: 'Sterownik nieprawidłowo obsłużył zmianę stanu zasilania. Zbadaj zrzut i ostatnie zmiany sterowników/urządzeń.' },
    { code: 'SMART 05', type: 'SMART', title: 'Reallocated Sector Count', detail: 'Liczba sektorów przeniesionych. Interpretuj trend i progi producenta; ważne dane zabezpiecz przed dalszym testowaniem.' },
    { code: 'SMART C5', type: 'SMART', title: 'Current Pending Sector Count', detail: 'Sektory oczekujące na ponowną ocenę. Rosnąca wartość może wskazywać problem z powierzchnią/nośnikiem.' },
    { code: 'SMART C6', type: 'SMART', title: 'Uncorrectable Sector Count', detail: 'Zgłoszone niekorygowalne błędy. Przy ważnych danych przerwij niepotrzebne zapisy i rozważ specjalistyczne odzyskiwanie.' },
    { code: 'KOD 10', type: 'Menedżer urządzeń', title: 'Urządzenie nie może się uruchomić', detail: 'Sprawdź pełny identyfikator sprzętu, sterownik, zasilanie i zgodność z systemem.' },
    { code: 'KOD 28', type: 'Menedżer urządzeń', title: 'Brak zainstalowanych sterowników', detail: 'Odczytaj Hardware ID i znajdź pakiet w oficjalnym źródle producenta urządzenia lub komputera.' },
    { code: 'KOD 43', type: 'Menedżer urządzeń', title: 'Windows zatrzymał urządzenie', detail: 'Sprawdź logi, połączenie, zasilanie i sterownik; kod nie przesądza samodzielnie o awarii podzespołu.' },
    { code: 'POST BEEP', type: 'POST / UEFI', title: 'Sygnały dźwiękowe podczas POST', detail: 'Sekwencje sygnałów zależą od producenta BIOS/UEFI i płyty. Zawsze sprawdź instrukcję dokładnego modelu.' }
  ];

  function safeNumber(value, max) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > max) throw new RangeError('Wartość poza dozwolonym zakresem.');
    return n;
  }
  function estimateCost(input) {
    const hours = safeNumber(input.hours, 100);
    const rate = safeNumber(input.rate, 5000);
    const parts = safeNumber(input.parts, 100000);
    const diagnostic = safeNumber(input.diagnostic, 10000);
    const labor = Math.round(hours * rate * 100) / 100;
    return { labor, parts, diagnostic, total: Math.round((labor + parts + diagnostic) * 100) / 100, currency: 'PLN', taxIncluded: false };
  }
  function lookupHardwareId(value) {
    const id = String(value || '').trim().toUpperCase();
    const pci = id.match(/VEN_([0-9A-F]{4})/);
    const usb = id.match(/VID_([0-9A-F]{4})/);
    const vendorId = (pci && pci[1]) || (usb && usb[1]) || '';
    if (!vendorId) return { valid: false, vendorId: '', vendor: 'Nie rozpoznano identyfikatora PCI VEN_ lub USB VID_', note: 'Wklej pełny identyfikator z Menedżera urządzeń. Sam opis urządzenia może być niewystarczający.' };
    return { valid: true, vendorId, vendor: driverVendors[vendorId] || 'Nieznany w lokalnym katalogu', protocol: pci ? 'PCI' : 'USB', note: 'Rozpoznanie producenta to dopiero pierwszy etap. Potwierdź pełny DEV/SUBSYS/REV, model urządzenia, wersję Windows i oficjalne źródło sterownika.' };
  }
  function searchCodes(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return codes.slice();
    return codes.filter(item => `${item.code} ${item.type} ${item.title} ${item.detail}`.toLowerCase().includes(q));
  }
  function pickFault(randomValue) {
    const n = Number.isFinite(randomValue) ? Math.max(0, Math.min(0.999999, randomValue)) : Math.random();
    return faults[Math.floor(n * faults.length)];
  }
  function shuffleQuestion(options, correctIndex, random = Math.random) {
    const rows = options.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.max(0, Math.min(0.999999, random())) * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
    return { options: rows.map(row => row.text), correctIndex: rows.findIndex(row => row.originalIndex === correctIndex) };
  }
  function evaluateMaster(item, answers) {
    if (!item) throw new TypeError('Brak scenariusza egzaminacyjnego.');
    const parts = [answers.diagnosis === item.correctDiagnosis, answers.plan === item.correctPlan, answers.validation === item.correctValidation];
    return { correct: parts.filter(Boolean).length, total: 3, points: parts.reduce((sum, ok, index) => sum + (ok ? [30, 40, 30][index] : 0), 0), passed: parts.every(Boolean), parts };
  }
  const api = { estimateCost, lookupHardwareId, searchCodes, pickFault, shuffleQuestion, evaluateMaster, windowsScenarios, laptopTasks, recoveryCases, powerScenarios, finalProfiles, masterCases, faults, codes };
  global.NAUKA_FIX175 = api;

  if (!global.document) return;
  const doc = global.document;
  const root = doc.getElementById('a168ProfessionalSuite');
  if (!root || root.dataset.initialized === '1') return;
  root.dataset.initialized = '1';

  const $ = id => doc.getElementById(id);
  const on = (id, event, handler) => { const el = $(id); if (el) el.addEventListener(event, handler); };
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = String(value ?? ''); };
  const setOutput = (id, heading, body, good) => {
    const el = $(id); if (!el) return;
    el.replaceChildren();
    const title = doc.createElement('strong'); title.textContent = heading; el.appendChild(title);
    const text = doc.createElement('p'); text.textContent = body; el.appendChild(text);
    el.classList.toggle('good', Boolean(good)); el.classList.toggle('warning', good === false);
  };
  const addOption = (select, value, label) => { const option = doc.createElement('option'); option.value = String(value); option.textContent = label; select.appendChild(option); };
  const setOptions = (id, options, selected) => {
    const select = $(id); if (!select) return;
    select.replaceChildren(); options.forEach((label, index) => addOption(select, index, label));
    if (selected !== undefined) select.value = String(selected);
  };
  const readState = () => {
    try {
      const raw = global.localStorage?.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { points: Number(parsed.points) || 0, completed: Array.isArray(parsed.completed) ? parsed.completed : [], journal: Array.isArray(parsed.journal) ? parsed.journal.slice(0, 150) : [], profiles: parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : {}, profile: typeof parsed.profile === 'string' ? parsed.profile.slice(0, 32) : 'Serwisant', exams: Array.isArray(parsed.exams) ? parsed.exams.slice(0, 80) : [], lastFault: parsed.lastFault || null };
    } catch (_) { return { points: 0, completed: [], journal: [], profiles: {}, profile: 'Serwisant', exams: [], lastFault: null }; }
  };
  const state = readState();
  const persist = () => {
    const profile = state.profiles[state.profile] || { points: 0, tasks: 0, exams: 0, best: 0 };
    profile.points = state.points; profile.tasks = state.completed.length; profile.exams = state.exams.length;
    state.profiles[state.profile] = profile;
    try { global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Private mode/quota: current session remains usable. */ }
    renderStats(); renderRanking();
  };
  const addJournal = (kind, title, note) => {
    const entry = { id: `J-${Date.now()}-${Math.floor(Math.random() * 10000)}`, at: new Date().toISOString(), kind: String(kind).slice(0, 40), title: String(title).slice(0, 100), note: String(note).slice(0, 700) };
    state.journal.unshift(entry); state.journal = state.journal.slice(0, 150); persist(); renderJournal(); return entry;
  };
  const award = (id, points, label) => {
    if (state.completed.includes(id)) return false;
    state.completed.push(id); state.points += points; addJournal('Ukończone ćwiczenie', label, `Przyznano ${points} punktów. Klucz zadania: ${id}.`); persist(); return true;
  };
  // FIX179 integration: new expert lessons reuse the existing local profile and journal without changing their storage schema.
  global.ACADEMY_FIX168_AWARD = award;
  global.ACADEMY_FIX168_ADD_JOURNAL = addJournal;
  const renderStats = () => { setText('a168Points', state.points); setText('a168Completed', `${state.completed.length} ukończonych ćwiczeń`); setText('a168MyPoints', state.points); setText('a168MyTasks', state.completed.length); setText('a168MyExams', state.exams.length); };
  const renderJournal = () => {
    const host = $('a168JournalList'); if (!host) return;
    host.replaceChildren();
    if (!state.journal.length) { const p = doc.createElement('p'); p.className = 'a168-note'; p.textContent = 'Dziennik jest pusty. Ukończ ćwiczenie lub dodaj notatkę.'; host.appendChild(p); return; }
    state.journal.slice(0, 40).forEach(entry => {
      const card = doc.createElement('article'); card.className = 'a168-journal-item';
      const head = doc.createElement('div'); head.className = 'a168-journal-meta';
      const kind = doc.createElement('b'); kind.textContent = entry.kind;
      const date = doc.createElement('time'); date.dateTime = entry.at; date.textContent = new Date(entry.at).toLocaleString('pl-PL');
      head.append(kind, date);
      const title = doc.createElement('strong'); title.textContent = entry.title;
      const note = doc.createElement('p'); note.textContent = entry.note;
      card.append(head, title, note); host.appendChild(card);
    });
  };
  const renderRanking = () => {
    const list = $('a168RankingList'); if (!list) return;
    list.replaceChildren();
    const profiles = Object.entries(state.profiles).map(([name, item]) => ({ name, points: Number(item.points) || 0, tasks: Number(item.tasks) || 0, exams: Number(item.exams) || 0 })).sort((a, b) => b.points - a.points || b.tasks - a.tasks).slice(0, 12);
    if (!profiles.length) profiles.push({ name: state.profile, points: state.points, tasks: state.completed.length, exams: state.exams.length });
    profiles.forEach((item, index) => { const li = doc.createElement('li'); const strong = doc.createElement('strong'); strong.textContent = `${index + 1}. ${item.name}`; const span = doc.createElement('span'); span.textContent = `${item.points} pkt · ${item.tasks} ćwiczeń · ${item.exams} egz.`; li.append(strong, span); list.appendChild(li); });
  };
  const download = (filename, content, type) => {
    try { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = doc.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none'; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (_) { setOutput('a168ProfileStatus', 'Eksport niedostępny', 'Przeglądarka zablokowała pobieranie. Sprawdź uprawnienia pobierania.', false); }
  };
  const exportAll = () => download('NaukaOdAdoZ_FIX175_Kopia.json', JSON.stringify({ exportedAt: new Date().toISOString(), productVersion: '6.8.0', hotfix: 'FIX168-FIX175', scope: 'local-training-data', state }, null, 2), 'application/json;charset=utf-8');
  const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

  // Tabs inside the existing view-academypro view.
  root.querySelectorAll('[data-a168-tab]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.a168Tab;
    root.querySelectorAll('[data-a168-tab]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); });
    root.querySelectorAll('[data-a168-panel]').forEach(panel => { const active = panel.dataset.a168Panel === name; panel.hidden = !active; panel.classList.toggle('active', active); });
  }));

  // FIX168 — Windows rescue case analysis.
  let currentWinCorrect = 0;
  const updateWindows = () => { const item = windowsScenarios[$('a168WinScenario')?.value || 'boot']; if (!item) return; const mixed = shuffleQuestion(item.options, item.correct); currentWinCorrect = mixed.correctIndex; setText('a168WinSymptom', item.symptom); setOptions('a168WinAnswer', mixed.options); setText('a168WinResult', 'Wybierz najbezpieczniejszy pierwszy krok i sprawdź diagnozę.'); };
  on('a168WinScenario', 'change', updateWindows);
  on('a168WinCheck', 'click', () => { const id = $('a168WinScenario').value, item = windowsScenarios[id], ok = Number($('a168WinAnswer').value) === currentWinCorrect; setOutput('a168WinResult', ok ? 'Dobra decyzja' : 'Spróbuj ponownie', item.explanation, ok); if (ok) award(`windows-${id}`, 15, `Windows Rescue: ${id}`); });
  updateWindows();

  // FIX169 — guided laptop disassembly sequence.
  let laptopIndex = 0;
  const laptopDecoys = ['Zacznij podważać obudowę bez sprawdzenia śrub', 'Pracuj przy podłączonym zasilaczu', 'Ciągnij za przewody zamiast za wtyk', 'Pomiń sprawdzenie instrukcji konkretnego modelu'];
  const updateLaptop = () => { laptopIndex = 0; const task = laptopTasks[$('a168LapTask')?.value || 'bottom']; setText('a168LapPrompt', task.prompt); setOptions('a168LapNext', [task.steps[0], ...laptopDecoys].sort(() => 0.5 - Math.random())); setOutput('a168LapProgress', 'Krok 1 z ' + task.steps.length, 'Wybierz pierwszy prawidłowy etap. Kolejne kroki pojawią się po zatwierdzeniu.', true); };
  on('a168LapTask', 'change', updateLaptop);
  on('a168LapStep', 'click', () => { const id = $('a168LapTask').value, task = laptopTasks[id], chosen = $('a168LapNext').value; const select = $('a168LapNext'); const chosenText = select.options[select.selectedIndex]?.textContent || ''; if (chosenText !== task.steps[laptopIndex]) { setOutput('a168LapProgress', 'Nieprawidłowa kolejność', 'Sprawdź procedurę producenta i wybierz właściwy następny krok. Postęp nie został zmieniony.', false); return; } laptopIndex++; if (laptopIndex >= task.steps.length) { setOutput('a168LapProgress', 'Ćwiczenie ukończone', 'Poprawnie przeprowadzono całą sekwencję edukacyjną. Rzeczywisty model może mieć inną kolejność.', true); award(`laptop-${id}`, 20, `Demontaż laptopa: ${id}`); } else { const nextOptions = [task.steps[laptopIndex], ...laptopDecoys].sort(() => 0.5 - Math.random()); setOptions('a168LapNext', nextOptions); setOutput('a168LapProgress', `Krok ${laptopIndex + 1} z ${task.steps.length}`, 'Poprzedni krok poprawny. Wybierz kolejny etap.', true); } });
  updateLaptop();

  // FIX170 — safe data recovery decisions.
  let currentRecoveryCorrect = 0;
  const updateRecovery = () => { const item = recoveryCases[$('a168RecoveryCase')?.value || 'deleted']; const mixed = shuffleQuestion(item.options, item.correct); currentRecoveryCorrect = mixed.correctIndex; setText('a168RecoverySymptom', item.symptom); setOptions('a168RecoveryAnswer', mixed.options); setText('a168RecoveryResult', 'Wybierz strategię i oceń ją.'); };
  on('a168RecoveryCase', 'change', updateRecovery);
  on('a168RecoveryCheck', 'click', () => { const id = $('a168RecoveryCase').value, item = recoveryCases[id], ok = Number($('a168RecoveryAnswer').value) === currentRecoveryCorrect; setOutput('a168RecoveryResult', ok ? 'Bezpieczna strategia' : 'Strategia ryzykowna', item.explanation, ok); if (ok) award(`recovery-${id}`, 18, `Data Recovery: ${id}`); });
  updateRecovery();

  // FIX171 — hardware ID vendor lookup.
  on('a168DriverLookup', 'click', () => { const result = lookupHardwareId($('a168HardwareId').value); setOutput('a168DriverResult', result.vendor, `${result.note}${result.valid ? ` ID producenta: ${result.vendorId} (${result.protocol}).` : ''}`, result.valid); if (result.valid) award(`driver-${result.protocol}-${result.vendorId}`, 5, `Atlas identyfikatorów: ${result.vendorId}`); });

  // FIX172 — safe power diagnosis with mandatory safety checks.
  let currentPowerCorrect = 0;
  const updatePower = () => { const mixed = shuffleQuestion(powerScenarios[$('a168PowerScenario')?.value || 'noStandby'].options, 0); currentPowerCorrect = mixed.correctIndex; setOptions('a168PowerAnswer', mixed.options); };
  on('a168PowerScenario', 'change', updatePower);
  on('a168PowerCheck', 'click', () => { const id = $('a168PowerScenario').value, item = powerScenarios[id], safe = ['a168SafeMains', 'a168SafePsu', 'a168SafeBattery'].every(key => $(key)?.checked), ok = safe && Number($('a168PowerAnswer').value) === currentPowerCorrect; setOutput('a168PowerResult', !safe ? 'Najpierw zasady bezpieczeństwa' : ok ? 'Procedura zaliczona' : 'Nieprawidłowy kierunek', !safe ? 'Zaznacz wszystkie trzy zasady bezpieczeństwa. Nie pomijaj ich w żadnym scenariuszu.' : item.explanation, ok); if (ok) award(`power-${id}`, 18, `Diagnostyka zasilania: ${id}`); });
  updatePower();

  // FIX173 — anonymized intake protocol, stored locally.
  on('a168IntakeForm', 'submit', event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (!data.get('consent') || !data.get('privacy')) { setOutput('a168IntakeResult', 'Brak potwierdzenia bezpieczeństwa', 'Zaznacz zgodę szkoleniową oraz potwierdź, że nie zapisujesz danych poufnych.', false); return; }
    const id = `NPA-TRN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const ticket = { id, device: data.get('device'), issue: data.get('issue'), symptoms: data.get('symptoms'), scope: data.get('scope'), priority: data.get('priority'), backupDiscussed: Boolean(data.get('backup')), trainingOnly: true };
    addJournal('Protokół przyjęcia (ćwiczenie)', id, `${ticket.device} · ${ticket.issue} · ${ticket.scope}. Objawy: ${ticket.symptoms}. Kopia/ryzyko omówione: ${ticket.backupDiscussed ? 'tak' : 'nie'}. Dane wyłącznie szkoleniowe.`);
    setOutput('a168IntakeResult', `Utworzono protokół ${id}`, 'Zapisano lokalnie w dzienniku. Nie jest to zgłoszenie do prawdziwego serwisu ani zapis w D1.', true); award(`intake-${id}`, 8, `Protokół szkoleniowy ${id}`); form.reset();
  });

  // FIX174 — final service quality checklists.
  const updateFinal = () => {
    const host = $('a168FinalChecks'); if (!host) return; host.replaceChildren();
    (finalProfiles[$('a168FinalProfile')?.value || 'ram'] || []).forEach((label, index) => { const row = doc.createElement('label'); const input = doc.createElement('input'); input.type = 'checkbox'; input.value = String(index); const text = doc.createTextNode(` ${label}`); row.append(input, text); host.appendChild(row); });
  };
  on('a168FinalProfile', 'change', updateFinal);
  on('a168FinalEvaluate', 'click', () => { const id = $('a168FinalProfile').value, host = $('a168FinalChecks'), total = host?.querySelectorAll('input[type="checkbox"]').length || 0, checked = host?.querySelectorAll('input[type="checkbox"]:checked').length || 0, ok = total > 0 && total === checked; setOutput('a168FinalResult', ok ? 'Kontrola kompletna' : 'Kontrola niekompletna', `Zaliczone punkty: ${checked}/${total}. Wynik jest lokalną checklistą szkoleniową, nie pomiarem urządzenia.`, ok); if (ok) award(`final-${id}`, 16, `Test końcowy: ${id}`); });
  updateFinal();

  // FIX175 — randomized master technician exam.
  let activeMaster = null;
  const fillMaster = (id, list) => { const select = $(id); if (!select) return; select.replaceChildren(); list.forEach((label, index) => addOption(select, index, label)); };
  on('a168MasterStart', 'click', () => { const base = masterCases[Math.floor(Math.random() * masterCases.length)]; const d = shuffleQuestion(base.diagnosis, base.correctDiagnosis), p = shuffleQuestion(base.plan, base.correctPlan), v = shuffleQuestion(base.validation, base.correctValidation); activeMaster = { ...base, diagnosis: d.options, plan: p.options, validation: v.options, correctDiagnosis: d.correctIndex, correctPlan: p.correctIndex, correctValidation: v.correctIndex }; setText('a168MasterCase', `${activeMaster.title}. ${activeMaster.context}`); fillMaster('a168MasterDiagnosis', activeMaster.diagnosis); fillMaster('a168MasterPlan', activeMaster.plan); fillMaster('a168MasterValidation', activeMaster.validation); $('a168MasterSubmit').disabled = false; setText('a168MasterResult', 'Przypadek wylosowany. Uzupełnij diagnozę, plan i test końcowy.'); });
  on('a168MasterSubmit', 'click', () => { if (!activeMaster) return; const result = evaluateMaster(activeMaster, { diagnosis: Number($('a168MasterDiagnosis').value), plan: Number($('a168MasterPlan').value), validation: Number($('a168MasterValidation').value) }); state.exams.push({ at: new Date().toISOString(), title: activeMaster.title, points: result.points, passed: result.passed }); state.exams = state.exams.slice(-80); if (result.points > (state.profiles[state.profile]?.best || 0)) { const p = state.profiles[state.profile] || {}; p.best = result.points; state.profiles[state.profile] = p; } setOutput('a168MasterResult', `Wynik: ${result.points}/100 pkt`, `${result.correct}/3 prawidłowe etapy. ${result.passed ? 'Egzamin zaliczony w symulacji.' : 'Przeanalizuj błędy i spróbuj ponownie.'}`, result.passed); if (result.passed) award(`master-${activeMaster.title}`, 30, `Egzamin Mistrza: ${activeMaster.title}`); else persist(); $('a168MasterSubmit').disabled = true; });

  // Shared tool 1 — intelligent fault generator.
  let currentFault = null;
  on('a168FaultGenerate', 'click', () => { currentFault = pickFault(); state.lastFault = currentFault.id; const el = $('a168FaultResult'); el.replaceChildren(); [[`Przypadek ${currentFault.id} · ${currentFault.domain}`, currentFault.title], ['Objaw', currentFault.symptom], ['Pierwszy bezpieczny krok', currentFault.first], ['Czego unikać', currentFault.avoid]].forEach(([label, value]) => { const row = doc.createElement('p'); const b = doc.createElement('b'); b.textContent = `${label}: `; row.append(b, doc.createTextNode(value)); el.appendChild(row); }); $('a168FaultSave').disabled = false; });
  on('a168FaultSave', 'click', () => { if (!currentFault) return; addJournal('Wylosowana awaria', `${currentFault.id} · ${currentFault.title}`, `${currentFault.symptom} Pierwszy krok: ${currentFault.first} Unikaj: ${currentFault.avoid}`); award(`fault-${currentFault.id}`, 5, `Generator awarii: ${currentFault.id}`); setText('a168FaultSave', 'Zapisano w dzienniku'); });

  // Shared tool 2 — code atlas.
  const renderCodes = () => { const host = $('a168CodeResults'); if (!host) return; host.replaceChildren(); const found = searchCodes($('a168CodeSearch')?.value); if (!found.length) { const p = doc.createElement('p'); p.className = 'a168-note'; p.textContent = 'Nie znaleziono kodu. Sprawdź zapis lub producenta urządzenia.'; host.appendChild(p); return; } found.forEach(item => { const card = doc.createElement('article'); card.className = 'a168-code-card'; const badge = doc.createElement('span'); badge.textContent = item.type; const code = doc.createElement('strong'); code.textContent = item.code; const title = doc.createElement('b'); title.textContent = item.title; const detail = doc.createElement('p'); detail.textContent = item.detail; card.append(badge, code, title, detail); host.appendChild(card); }); };
  on('a168CodeSearch', 'input', renderCodes); renderCodes();

  // Shared tool 3 — transparent estimate calculator.
  on('a168CostCalc', 'click', () => {
    try { const result = estimateCost({ hours: $('a168CostHours').value, rate: $('a168CostRate').value, parts: $('a168CostParts').value, diagnostic: $('a168CostDiag').value }); setOutput('a168CostResult', `Szacunkowy koszt: ${result.total.toFixed(2)} zł`, `Robocizna: ${result.labor.toFixed(2)} zł · części: ${result.parts.toFixed(2)} zł · diagnostyka: ${result.diagnostic.toFixed(2)} zł. Kwota bez podatków i dodatkowych opłat.`, true); }
    catch (error) { setOutput('a168CostResult', 'Nieprawidłowe wartości', error.message, false); }
  });

  // Shared tool 4 — local technician journal.
  on('a168JournalForm', 'submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); addJournal(data.get('kind'), data.get('title'), data.get('note')); event.currentTarget.reset(); award(`journal-${state.journal[0].id}`, 3, 'Wpis do dziennika'); });
  on('a168JournalExport', 'click', () => {
    const rows = [['Data','Rodzaj','Tytuł','Notatka'], ...state.journal.map(e => [e.at, e.kind, e.title, e.note])];
    download('NaukaOdAdoZ_Dziennik_Serwisanta_FIX175.csv', '\uFEFF' + rows.map(row => row.map(csvEscape).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  });

  // Shared tool 5 — local-only profile and leaderboard.
  const nameInput = $('a168ProfileName'); if (nameInput) nameInput.value = state.profile;
  on('a168ProfileSave', 'click', () => { const name = String($('a168ProfileName').value || '').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 32); if (!name) { setOutput('a168ProfileStatus', 'Wpisz pseudonim', 'Profil jest lokalny. Nie używaj pełnego imienia, nazwiska ani danych kontaktowych.', false); return; } state.profile = name; persist(); setOutput('a168ProfileStatus', 'Profil zapisany lokalnie', `Aktywny profil: ${name}. Wyniki nie są wysyłane na serwer.`, true); });
  on('a168ExportAll', 'click', exportAll);
  renderStats(); renderJournal(); renderRanking();

})(typeof window !== 'undefined' ? window : globalThis);
