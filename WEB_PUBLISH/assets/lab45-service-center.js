/* NAPRAWA PC — AKADEMIA SERWISU PRO 4.5.0 / SERVICE CENTER EXTENSION
   Local-first training tools. Cloud sync is optional and requires an authenticated,
   consented account through the existing /api/state endpoint. No physical readings are simulated as real. */
(function () {
  'use strict';
  const KEY = {
    esd: 'academyLab45ESD', stock: 'academyLab45Stock', marks: 'academyLab45Inspector',
    assignments: 'academyLab45Assignments', powerDone: 'academyLab45PowerDone', recovery: 'academyLab45Recovery', training: 'academyLabTraining', models: 'academyLabModels',
    exam: 'academyLabExamLast', triage: 'academyLabLastTriage'
  };
  const SYNC_KEYS = Object.values(KEY);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const safe = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (_) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { toast('Brak miejsca w pamięci przeglądarki. Wyeksportuj dane i usuń zbędne pliki.'); return false; } };
  const toast = msg => { const el = $('#toast'); if (el) { el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200); } };
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const download = (name, value, type = 'application/json') => { const blob = new Blob([value], {type}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); };

  const powerScenarios = {
    noPower: {
      title: 'Brak reakcji na przycisk zasilania',
      intro: 'Zacznij od wejścia zasilania i warunków pracy kontrolera. Nie zakładaj z góry uszkodzenia KBC/EC.',
      stages: [
        ['Identyfikacja platformy', 'Odczytaj dokładne oznaczenie PCB, rewizję i wariant zasilania. Znajdź właściwy schemat lub boardview.'],
        ['Wejście zasilania', 'Sprawdź zasilacz, przewód, gniazdo DC-IN lub USB-C oraz zabezpieczenia wejścia zgodnie z dokumentacją.'],
        ['Szyny standby', 'Zweryfikuj obecność i warunki aktywacji szyn zawsze w punktach wskazanych dla konkretnej płyty.'],
        ['EC / KBC', 'Sprawdź zasilanie kontrolera, reset, zegar i sygnały wejściowe — nie wymieniaj układu na podstawie jednego objawu.'],
        ['Sygnał przycisku', 'Sprawdź tor przycisku zasilania i zmianę stanu sygnału zgodnie ze schematem.'],
        ['Wniosek i dowody', 'Zapisz wszystkie punkty, tryb przyrządu, warunki pomiaru oraz wyniki przed sformułowaniem hipotezy.']
      ]
    },
    noPost: {
      title: 'Urządzenie włącza się, ale brak POST',
      intro: 'Oddziel problem z zasilaniem, resetem, pamięcią, firmware i inicjalizacją platformy.',
      stages: [
        ['Konfiguracja minimalna', 'Odłącz niepotrzebne urządzenia zewnętrzne. Testuj minimalną konfigurację zgodną z procedurą producenta.'],
        ['Kody diagnostyczne', 'Zapisz sygnały LED, beep code, POST code lub komunikaty kontrolera.'],
        ['RAM i tor pamięci', 'Zweryfikuj moduły, sloty, zgodność i połączenia. Nie wykonuj prób na niestabilnym zasilaniu.'],
        ['BIOS / UEFI', 'Potwierdź wersję, zgodność wsadu i stan firmware. Kopię wykonaj przed jakąkolwiek zmianą.'],
        ['Reset / zegary', 'Sprawdź sygnały resetu i zegarowe tylko przy właściwym punkcie pomiarowym oraz znanych parametrach.'],
        ['Weryfikacja', 'Porównaj objawy i pomiary z dokumentacją dokładnej rewizji płyty.']
      ]
    },
    noCharge: {
      title: 'Brak ładowania przez USB-C / DC-IN',
      intro: 'Ustal, czy problem dotyczy źródła, gniazda, negocjacji, toru wejściowego czy kontrolera ładowania.',
      stages: [
        ['Źródło i kabel', 'Zweryfikuj zgodność zasilacza, przewodu, mocy i profilu. Użyj sprawnego, odpowiednio dobranego zestawu.'],
        ['Gniazdo i mechanika', 'Obejrzyj styki, lutowanie, korozję, uszkodzenia mechaniczne i temperaturę złącza.'],
        ['Negocjacja USB-C PD', 'Ustal, czy urządzenie i źródło uzgodniły wspólny profil. Nie zakładaj napięcia wyłącznie po wyglądzie ładowarki.'],
        ['Tor wejściowy', 'Według schematu prześledź zabezpieczenie, detekcję wejścia i kontroler ładowania.'],
        ['Bateria i BMS', 'Sprawdź stan baterii, temperaturę i komunikację BMS zgodnie z procedurą producenta. Nie rozbieraj uszkodzonego ogniwa.'],
        ['Test końcowy', 'Zapisz profil, pobór, temperaturę i zachowanie urządzenia w kontrolowanych warunkach.']
      ]
    }
  };

  const pdProfiles = {
    '5': {name:'5 V / profil podstawowy', note:'Profil bazowy do zasilania i komunikacji. Dostępność prądu i zachowanie zależą od źródła, kabla i odbiornika.'},
    '9': {name:'9 V / profil podwyższony', note:'Profil dostępny tylko wtedy, gdy źródło i odbiornik obsługują odpowiednią umowę PD.'},
    '15': {name:'15 V / profil podwyższony', note:'Wymaga poprawnej negocjacji. Nie wymuszaj napięcia na nieznanym urządzeniu.'},
    '20': {name:'20 V / profil podwyższony', note:'Często spotykany w zasilaniu laptopów, ale nie jest uniwersalny dla każdego portu i modelu.'}
  };

  const recoveryPlans = {
    notDetected: {title:'Dysk nie jest wykrywany', risk:'Przerwij powtarzane próby uruchamiania, jeśli dysk wydaje nietypowe dźwięki, znika lub ma objawy awarii mechanicznej.', steps:['Zapisz model, interfejs i objawy; nie inicjalizuj ani nie formatuj nośnika.','Sprawdź przewód, zasilanie, port i wykrywanie w UEFI/BIOS — bez zapisu na nośnik.','Jeżeli nośnik jest niestabilny, rozważ sprzętowy write blocker i kopię sektorową do pliku/na sprawny nośnik.','Wykonaj diagnostykę kopii, nie oryginału. Zachowaj logi i mapę błędów odczytu.','Odzyskuj pliki z obrazu i sprawdź ich integralność na osobnym nośniku.']},
    deleted: {title:'Usunięte pliki / utracona partycja', risk:'Każdy zapis na źródłowym nośniku może nadpisać odzyskiwane dane. Nie instaluj programu odzysku na tym dysku.', steps:['Natychmiast ogranicz używanie nośnika i odłącz go bezpiecznie.','Ustal system plików i typ partycji; nie zatwierdzaj propozycji inicjalizacji.','Utwórz obraz sektorowy na nośniku o odpowiedniej pojemności.','Skanuj i rekonstruuj strukturę na kopii, zachowując oryginalny układ sektorów.','Zapisz odzyskane pliki na innym fizycznym nośniku i zweryfikuj próbki.']},
    slow: {title:'Dysk działa wolno / ma błędy SMART', risk:'SMART jest sygnałem diagnostycznym, a nie gwarancją sprawności ani prognozą dokładnej daty awarii.', steps:['Odczytaj identyfikację i atrybuty SMART bez uruchamiania napraw zapisujących.','Sprawdź temperaturę, liczbę błędów i stabilność połączenia.','Przy ważnych danych wykonaj obraz z obsługą błędów odczytu; nie obciążaj niepotrzebnie źródła.','Porównaj wyniki z logiem systemowym i testem kopii.','Po zabezpieczeniu danych zdecyduj o dalszej kwalifikacji nośnika.']},
    raid: {title:'RAID / macierz / wolumen zdegradowany', risk:'Nie inicjalizuj, nie przebudowuj i nie zmieniaj kolejności dysków bez kopii oraz dokumentacji konfiguracji.', steps:['Zapisz konfigurację RAID, kolejność dysków, poziom, stripe size i kontroler.','Oznacz każdy dysk oraz jego zatokę; nie zamieniaj kolejności.','Wykonaj obrazy każdego członka macierzy, jeżeli stan nośników na to pozwala.','Analizuj rekonstrukcję na kopiach. Nie wykonuj rebuild na oryginałach bez planu.','Zapisz parametry rekonstrukcji i sprawdź spójność odzyskanych danych.']}
  };

  const esdItems = [
    'Stanowisko ma sprawdzone uziemienie i punkt wspólny ESD.',
    'Mata ESD jest podłączona do właściwego punktu uziemiającego.',
    'Opaska nadgarstkowa jest sprawna i sprawdzona testerem.',
    'Płyta i moduły są przechowywane w opakowaniach ESD.',
    'Zasilacz i bateria urządzenia są odłączone przed pracą beznapięciową.',
    'Przed dotknięciem płyty wyrównano potencjał zgodnie z procedurą.',
    'Stanowisko jest wolne od płynów, luźnych metalowych przedmiotów i niepotrzebnych narzędzi.',
    'Bateria spuchnięta, przebita lub nagrzewająca się jest wyłączona z dalszej obsługi i odizolowana zgodnie z procedurą.'
  ];

  function createMarkup() {
    const section = $('#view-labplus'); if (!section || $('#lab45-center')) return;
    const nav = document.createElement('nav');
    nav.className = 'lab45-nav'; nav.setAttribute('aria-label','Nawigacja laboratoriów edukacyjnych');
    nav.innerHTML = '<div><span class="lab45-kicker">PRACTICAL LEARNING / 4.5</span><b>Laboratorium praktyczne</b><small>Symulatory, ćwiczenia i narzędzia</small></div>' +
      [['power','Sekwencja zasilania'],['pd','USB-C PD'],['recovery','Odzyskiwanie danych'],['esd','BHP / ESD'],['stock','Magazyn części'],['inspector','Inspektor PCB'],['instructor','Panel instruktora'],['sync','Offline / synchronizacja']].map(([id,label],i)=>`<button type="button" data-lab45-jump="${id}"><span>0${i+1}</span>${label}</button>`).join('');
    const host = document.createElement('section'); host.className = 'lab45-center'; host.id = 'lab45-center';
    host.innerHTML = `
      <div class="lab45-overview"><div><span class="lab45-kicker">NAPRAWA PC / LEARNING LAB</span><h2>Laboratorium praktyczne <em>PRO.</em></h2><p>Trenażery usterek, diagnostyka sekwencji zasilania, USB-C Power Delivery, odzyskiwanie danych, bezpieczeństwo stanowiska i ewidencja części. Dane ćwiczeń są zapisywane lokalnie; synchronizacja online jest opcjonalna.</p></div><div class="lab45-overview-stats"><div><b>08</b><small>nowych modułów</small></div><div><b id="lab45-stock-count">0</b><small>części w magazynie</small></div><div><b id="lab45-esd-count">0/8</b><small>kontrola ESD</small></div></div></div>
      <section class="lab45-card" id="lab45-power"><div class="lab45-heading"><div><span>01 / POWER SEQUENCE TRAINER</span><h3>Sekwencja <em>zasilania płyty.</em></h3><p>Ćwiczenie kolejności kontroli zasilania i sygnałów startowych. Nazwy oraz wartości zależą od platformy i schematu.</p></div><b class="lab45-badge">SYMULACJA EDUKACYJNA</b></div><div class="lab45-grid two"><div class="lab45-control"><label>Scenariusz<select id="lab45-power-case"><option value="noPower">Brak reakcji na zasilanie</option><option value="noPost">Włącza się, ale brak POST</option><option value="noCharge">Nie ładuje baterii</option></select></label><div class="lab45-callout" id="lab45-power-intro"></div><button class="lab45-button" id="lab45-power-load">Załaduj sekwencję ćwiczenia</button></div><div class="lab45-result" id="lab45-power-result"><b>Gotowy do ćwiczenia</b><p>Wybierz scenariusz i przechodź przez kolejne punkty, zapisując wykonane kontrole.</p></div></div><div class="lab45-stage-list" id="lab45-power-stages"></div></section>
      <section class="lab45-card" id="lab45-pd"><div class="lab45-heading"><div><span>02 / USB TYPE-C POWER DELIVERY</span><h3>Laboratorium <em>USB-C PD.</em></h3><p>Symulator negocjacji profilu zasilania i diagnozy toru ładowania. Odczyty są przykładowe, nie sterują fizycznym portem.</p></div><b class="lab45-badge blue">PD CONTRACT LAB</b></div><div class="lab45-grid three"><label>Napięcie docelowe<select id="lab45-pd-voltage"><option value="5">5 V</option><option value="9">9 V</option><option value="15">15 V</option><option value="20" selected>20 V</option></select></label><label>Scenariusz<select id="lab45-pd-fault"><option value="ok">Negocjacja poprawna</option><option value="cable">Kabel nie obsługuje profilu</option><option value="source">Źródło nie oferuje profilu</option><option value="cc">Problem na linii CC</option><option value="sink">Odbiornik odmawia kontraktu</option></select></label><label>Prąd oferowany (symulacja)<select id="lab45-pd-current"><option value="1.5">1,5 A</option><option value="2">2,0 A</option><option value="3" selected>3,0 A</option><option value="5">5,0 A (wymaga zgodnego kabla/warunków)</option></select></label></div><button class="lab45-button" id="lab45-pd-run">Przeprowadź negocjację ↗</button><div id="lab45-pd-result" class="lab45-pd-result"><span class="lab45-pd-orb">PD</span><div><b>Oczekiwanie na scenariusz</b><p>Uruchom ćwiczenie, aby zobaczyć etapy wykrycia, capabilities, request i accept/contract.</p></div></div><div class="lab45-callout warning">Nie wymuszaj profilu napięciowego na nieznanym urządzeniu. Rzeczywiste profile zależą od źródła, odbiornika, kabla, kontrolera i wersji implementacji.</div></section>
      <section class="lab45-card" id="lab45-recovery"><div class="lab45-heading"><div><span>03 / DATA RECOVERY WORKFLOW</span><h3>Centrum <em>odzyskiwania danych.</em></h3><p>Bezpieczna kolejność kwalifikacji, zabezpieczenia źródła, obrazowania i pracy na kopii.</p></div><b class="lab45-badge amber">OCHRONA ŹRÓDŁA</b></div><div class="lab45-grid two"><label>Typ problemu<select id="lab45-recovery-type"><option value="notDetected">Nośnik niewykrywany</option><option value="deleted">Usunięte pliki / partycja</option><option value="slow">Błędy SMART / wolny dysk</option><option value="raid">RAID / macierz</option></select></label><div class="lab45-callout warning" id="lab45-recovery-risk">Najpierw zabezpiecz źródło. Nie zapisuj odzyskanych danych na tym samym nośniku.</div></div><button class="lab45-button" id="lab45-recovery-build">Przygotuj procedurę odzyskiwania</button><div id="lab45-recovery-plan" class="lab45-checklist"></div></section>
      <section class="lab45-card" id="lab45-esd"><div class="lab45-heading"><div><span>04 / ESD & WORKBENCH SAFETY</span><h3>Kontrola stanowiska <em>ESD / BHP.</em></h3><p>Lista przygotowania stanowiska do prac serwisowych. Zaznaczenia są zapisywane w tej przeglądarce.</p></div><b class="lab45-badge green">CHECK BEFORE REPAIR</b></div><div class="lab45-progress"><i id="lab45-esd-bar"></i></div><div class="lab45-checklist" id="lab45-esd-list"></div><div class="lab45-actions"><b id="lab45-esd-status">0/8 kontroli</b><button class="lab45-button secondary" id="lab45-esd-reset">Wyczyść checklistę</button></div></section>
      <section class="lab45-card" id="lab45-stock"><div class="lab45-heading"><div><span>05 / EDUCATIONAL PARTS REFERENCE</span><h3>Katalog części <em>do nauki.</em></h3><p>Lokalny katalog przykładowych elementów i modułów: oznaczenia, ilość, lokalizacja i notatki do ćwiczeń. Dane służą nauce identyfikacji części, nie obsłudze zleceń klientów.</p></div><b class="lab45-badge">LOCAL INVENTORY</b></div><form id="lab45-stock-form" class="lab45-form"><label>Nazwa części<input name="name" maxlength="100" placeholder="MOSFET / gniazdo USB-C / RAM" required></label><label>Oznaczenie / SKU<input name="sku" maxlength="60" placeholder="np. AO4407A / SKU-001"></label><label>Producent<input name="brand" maxlength="60" placeholder="Producent"></label><label>Ilość<input name="qty" type="number" min="0" max="99999" value="1" required></label><label>Stan minimalny<input name="min" type="number" min="0" max="99999" value="1"></label><label>Lokalizacja<input name="location" maxlength="60" placeholder="Szuflada A-03"></label><label>Cena zakupu PLN<input name="price" type="number" min="0" step="0.01" max="1000000" placeholder="0.00"></label><button class="lab45-button" type="submit">Dodaj element do katalogu +</button></form><div class="lab45-actions"><input id="lab45-stock-search" type="search" placeholder="Szukaj części, SKU, szuflady…"><button class="lab45-button secondary" id="lab45-stock-csv">Eksport CSV ↓</button></div><div id="lab45-stock-list" class="lab45-stock-list"></div></section>
      <section class="lab45-card" id="lab45-inspector"><div class="lab45-heading"><div><span>06 / PCB PHOTO INSPECTOR</span><h3>Inspektor zdjęć <em>PCB.</em></h3><p>Oznaczaj obszary na własnym zdjęciu płyty i twórz notatki do pomiarów. To narzędzie anotacji — nie deklaruje automatycznego rozpoznania uszkodzeń przez model AI.</p></div><b class="lab45-badge blue">MANUAL VISUAL REVIEW</b></div><div class="lab45-grid two"><label>Wczytaj zdjęcie płyty<input type="file" id="lab45-inspector-file" accept="image/*"></label><label>Opis oznaczenia<input id="lab45-inspector-label" maxlength="120" placeholder="np. podejrzenie korozji przy PUxx"></label></div><div class="lab45-inspector-stage" id="lab45-inspector-stage"><div class="lab45-inspector-empty">Wczytaj zdjęcie PCB, aby rozpocząć oznaczanie. Kliknij miejsce na zdjęciu, aby dodać znacznik.</div></div><div class="lab45-actions"><button class="lab45-button" id="lab45-inspector-add">Dodaj znacznik w wybranym miejscu</button><button class="lab45-button secondary" id="lab45-inspector-export">Eksportuj notatki JSON</button></div><div id="lab45-inspector-marks" class="lab45-stock-list"></div><div class="lab45-callout warning">Zdjęcie pozostaje w pamięci bieżącej sesji przeglądarki i nie jest przesyłane na serwer. Zapisane notatki nie przechowują samego pliku graficznego.</div></section>
      <section class="lab45-card" id="lab45-instructor"><div class="lab45-heading"><div><span>07 / INSTRUCTOR DESK</span><h3>Panel instruktora <em>i zadań.</em></h3><p>Przydzielaj lokalne ćwiczenia, termin i ocenę. Panel działa w bieżącej przeglądarce; nie zastępuje systemu uprawnień dla wielu instruktorów.</p></div><b class="lab45-badge amber">INSTRUCTOR MODE</b></div><form id="lab45-assignment-form" class="lab45-form"><label>Kursant / grupa<input name="learner" maxlength="80" placeholder="Kursant / grupa" required></label><label>Zadanie<input name="title" maxlength="140" placeholder="np. diagnoza braku POST" required></label><label>Moduł<select name="module"><option>Diagnostyka</option><option>USB-C / PD</option><option>Odzyskiwanie danych</option><option>Lutowanie SMD / BGA</option><option>BIOS / EC</option><option>ESD / BHP</option><option>GPU / VRAM</option></select></label><label>Termin<input name="due" type="date"></label><label class="wide">Wskazówki<textarea name="notes" rows="2" maxlength="500" placeholder="Zakres zadania, pomiary do udokumentowania…"></textarea></label><button class="lab45-button" type="submit">Dodaj zadanie +</button></form><div id="lab45-assignment-list" class="lab45-stock-list"></div></section>
      <section class="lab45-card" id="lab45-sync"><div class="lab45-heading"><div><span>08 / OFFLINE, BACKUP & PORTABLE SYNC</span><h3>Offline i synchronizacja <em>postępów.</em></h3><p>Rdzeń strony może działać offline po pierwszym załadowaniu. Dane można przenosić plikiem JSON; synchronizacja online wymaga zalogowanego konta i udzielonej zgody.</p></div><b class="lab45-badge green" id="lab45-offline-badge">SPRAWDZANIE…</b></div><div class="lab45-grid two"><div class="lab45-sync-card"><b>Status offline</b><p id="lab45-offline-status">Sprawdzanie dostępności Service Worker…</p><button class="lab45-button secondary" id="lab45-offline-check">Sprawdź gotowość offline</button></div><div class="lab45-sync-card"><b>Kopia / przenoszenie danych</b><p>Eksport zawiera postęp nauki, modele, wyniki ćwiczeń, katalog części, checklistę ESD, notatki inspektora i zadania instruktora.</p><div class="lab45-actions"><button class="lab45-button" id="lab45-export-all">Eksportuj kopię JSON ↓</button><label class="lab45-file-button">Importuj kopię JSON<input type="file" id="lab45-import-all" accept="application/json,.json"></label></div></div></div><div class="lab45-sync-card cloud"><b>Synchronizacja konta w chmurze</b><p id="lab45-cloud-status">Wymaga zalogowania i zgody na zapis postępów. Jeśli API zwróci 401/403, najpierw zaloguj się i włącz zgodę w ustawieniach konta.</p><div class="lab45-actions"><button class="lab45-button" id="lab45-cloud-pull">Pobierz z chmury</button><button class="lab45-button secondary" id="lab45-cloud-push">Wyślij do chmury</button></div></div><div class="lab45-callout">Nie przechowuj tu haseł, kluczy BitLocker, danych płatniczych ani danych osobowych. Kopia JSON może zawierać Twoje notatki edukacyjne — zabezpiecz ją jak własne materiały.</div></section>
      <div class="lab45-bottom-note"><b>Granice narzędzi:</b> symulatory są edukacyjne, a plan odzyskiwania i inspekcja zdjęcia nie zastępują pomiarów ani specjalistycznego sprzętu. W razie podejrzenia awarii mechanicznej nośnika, uszkodzenia baterii lub zagrożenia porażeniem przerwij pracę i zastosuj właściwą procedurę.</div>`;
    const disclaimer = $('.lab44-disclaimer', section);
    if (disclaimer) { disclaimer.before(nav); disclaimer.before(host); } else { section.append(nav, host); }
  }

  function renderPower() {
    const key = $('#lab45-power-case')?.value || 'noPower'; const scenario = powerScenarios[key]; if (!scenario) return;
    $('#lab45-power-intro').textContent = scenario.intro;
    const done = read('academyLab45PowerDone', {}); const stageDone = done[key] || {};
    $('#lab45-power-stages').innerHTML = scenario.stages.map((stage, i) => `<article class="lab45-stage ${stageDone[i]?'done':''}"><span class="lab45-stage-num">${String(i+1).padStart(2,'0')}</span><div><b>${safe(stage[0])}</b><p>${safe(stage[1])}</p></div><label><input type="checkbox" data-power-step="${i}" ${stageDone[i]?'checked':''}><span>${stageDone[i]?'Sprawdzone':'Oznacz jako sprawdzone'}</span></label></article>`).join('');
    const n = scenario.stages.filter((_,i)=>stageDone[i]).length;
    $('#lab45-power-result').innerHTML = `<b>${safe(scenario.title)}</b><p>Postęp ćwiczenia: <strong>${n}/${scenario.stages.length}</strong>. ${n===scenario.stages.length?'Zakończono checklistę — przejrzyj dowody i zapisz wnioski.':'Zaznaczaj kroki dopiero po przeanalizowaniu punktu pomiarowego i dokumentacji.'}</p>`;
  }
  function runPd() {
    const v = $('#lab45-pd-voltage').value, fault = $('#lab45-pd-fault').value, current = $('#lab45-pd-current').value;
    const profile = pdProfiles[v];
    const stages = [['Attach / wykrycie','Połączenie fizyczne i wykrycie partnera USB-C.'],['CC / identyfikacja','Kontroler rozpoznaje partnera i dostępne warunki łącza.'],['Source_Capabilities','Źródło ogłasza obsługiwane profile.'],['Request / wybór','Odbiornik żąda zgodnego profilu.'],['Accept / kontrakt','Źródło akceptuje i przechodzi do uzgodnionych warunków.'],['Power Ready','Kontrakt obowiązuje; monitoruj stabilność i limity.']];
    const failures = {ok:5,cable:1,source:2,cc:0,sink:3}; const stop = failures[fault];
    const labels = {ok:'Kontrakt został uzgodniony w scenariuszu edukacyjnym.',cable:'Zatrzymanie: niezgodny lub niepełny kabel/identyfikacja kabla. Sprawdź oznaczenia i obsługę profilu.',source:'Zatrzymanie: źródło nie ogłosiło wybranego profilu. Wybierz profil wspólny dla obu partnerów.',cc:'Zatrzymanie: problem na torze CC lub wykryciu partnera. Zweryfikuj gniazdo, linię CC i kontroler według dokumentacji.',sink:'Zatrzymanie: odbiornik nie zaakceptował żądanego kontraktu. Sprawdź ograniczenia odbiornika i komunikaty kontrolera.'};
    $('#lab45-pd-result').innerHTML = `<span class="lab45-pd-orb">${fault==='ok'?'OK':'PD'}</span><div><b>${safe(profile.name)} · ${current} A — ${fault==='ok'?'PRZYKŁAD ZGODNY':'SCENARIUSZ ZATRZYMANIA'}</b><p>${safe(labels[fault])} ${safe(profile.note)}</p><ol>${stages.map((s,i)=>`<li class="${i<=stop?'done':''} ${i===stop&&fault!=='ok'?'fail':''}"><b>${safe(s[0])}</b><small>${safe(s[1])}</small></li>`).join('')}</ol><small class="lab45-muted">Symulacja edukacyjna. Nie jest pomiarem rzeczywistej linii CC ani gwarancją zgodności sprzętu.</small></div>`;
  }
  function buildRecovery() {
    const plan = recoveryPlans[$('#lab45-recovery-type').value];
    $('#lab45-recovery-risk').textContent = plan.risk;
    const progress=read(KEY.recovery,{}); const completed=progress[$('#lab45-recovery-type').value]||{}; const count=plan.steps.filter((_,i)=>completed[i]).length;
    $('#lab45-recovery-plan').innerHTML = `<h4>${safe(plan.title)}</h4>${plan.steps.map((s,i)=>`<label class="lab45-check-row"><input type="checkbox" data-recovery-step="${i}" ${completed[i]?'checked':''}><span>${safe(s)}</span></label>`).join('')}<div class="lab45-progress"><i id="lab45-recovery-bar" style="width:${count/plan.steps.length*100}%"></i></div><small id="lab45-recovery-status">${count}/${plan.steps.length} kroków</small>`;
    $('#lab45-recovery-plan').dataset.total = plan.steps.length;
  }
  function renderEsd() {
    const saved = read(KEY.esd, {}); const count = esdItems.filter((_,i)=>saved[i]).length;
    $('#lab45-esd-list').innerHTML = esdItems.map((item,i)=>`<label class="lab45-check-row"><input type="checkbox" data-esd-step="${i}" ${saved[i]?'checked':''}><span>${safe(item)}</span></label>`).join('');
    $('#lab45-esd-count').textContent = `${count}/${esdItems.length}`; $('#lab45-esd-status').textContent = `${count}/${esdItems.length} kontroli`; $('#lab45-esd-bar').style.width = `${count/esdItems.length*100}%`;
  }
  function renderStock() {
    const items = read(KEY.stock, []); const query = ($('#lab45-stock-search')?.value || '').toLowerCase(); const host = $('#lab45-stock-list');
    $('#lab45-stock-count').textContent = String(items.length);
    const filtered = items.filter(x => [x.name,x.sku,x.brand,x.location].join(' ').toLowerCase().includes(query));
    host.innerHTML = filtered.length ? filtered.slice().reverse().map(x=>`<article class="lab45-stock-row"><div><b>${safe(x.name)}</b><small>${safe(x.sku||'Brak SKU')} · ${safe(x.brand||'bez producenta')} · ${safe(x.location||'bez lokalizacji')}</small><p>Ilość: <strong>${Number(x.qty)||0}</strong> · minimum: ${Number(x.min)||0} · ${Number(x.qty)<=Number(x.min)?'<em class="low-stock">NISKI STAN</em>':'<em class="ok-stock">STAN OK</em>'} ${x.price!=null&&x.price!==''?'· '+Number(x.price).toFixed(2)+' PLN/szt.':''}</p></div><div class="lab45-stock-actions"><button type="button" data-stock-delta="-1" data-stock-id="${safe(x.id)}" aria-label="Zmniejsz stan">−</button><button type="button" data-stock-delta="1" data-stock-id="${safe(x.id)}" aria-label="Zwiększ stan">+</button><button type="button" class="remove" data-stock-delete="${safe(x.id)}">Usuń</button></div></article>`).join('') : '<div class="lab45-empty">Brak pasujących części. Dodaj pierwszą pozycję powyżej.</div>';
  }
  function drawImageMarkers() {
    const stage=$('#lab45-inspector-stage'), host=$('#lab45-image-markers'); if(!stage||!host)return;
    const file=stage.dataset.file||''; const rows=read(KEY.marks,[]).filter(x=>x.file===file);
    host.innerHTML=rows.map((x,i)=>`<span class="lab45-image-pin" style="left:${Number(x.x)||0}%;top:${Number(x.y)||0}%" title="${safe(x.label)}">${i+1}</span>`).join('');
  }
  function renderMarks() {
    const rows = read(KEY.marks, []); const host = $('#lab45-inspector-marks');
    host.innerHTML = rows.length ? rows.slice().reverse().map(x=>`<article class="lab45-stock-row"><div><b>${safe(x.label)}</b><small>${safe(x.file||'zdjęcie')} · X ${x.x}% / Y ${x.y}% · ${safe(x.date)}</small><p>${safe(x.note||'Brak notatki')}</p></div><button class="lab45-icon-button" type="button" data-mark-delete="${safe(x.id)}">Usuń</button></article>`).join('') : '<div class="lab45-empty">Nie dodano jeszcze znaczników.</div>';
    drawImageMarkers();
  }
  function renderAssignments() {
    const rows = read(KEY.assignments, []); const host = $('#lab45-assignment-list');
    host.innerHTML = rows.length ? rows.slice().reverse().map(x=>`<article class="lab45-stock-row assignment"><div><b>${safe(x.title)}</b><small>${safe(x.learner)} · ${safe(x.module)} · termin: ${safe(x.due||'nieustalony')}</small><p>${safe(x.notes||'Bez dodatkowych wskazówek')} · Status: <strong>${safe(x.status||'Nowe')}</strong> · Ocena: ${safe(x.grade||'—')}</p></div><div class="lab45-stock-actions"><button type="button" data-assignment-done="${safe(x.id)}">${x.status==='Zaliczone'?'Cofnij':'Zaliczone'}</button><button type="button" class="remove" data-assignment-delete="${safe(x.id)}">Usuń</button></div></article>`).join('') : '<div class="lab45-empty">Nie ma jeszcze przydzielonych zadań.</div>';
  }
  function renderOffline() {
    const online = navigator.onLine; const sw = 'serviceWorker' in navigator;
    $('#lab45-offline-badge').textContent = online ? 'ONLINE / CACHE READY' : 'OFFLINE';
    $('#lab45-offline-status').textContent = `${online?'Połączenie sieciowe dostępne':'Brak połączenia sieciowego'}. ${sw?'Obsługa Service Worker jest dostępna.':'Ta przeglądarka nie obsługuje Service Worker.'} Rdzeń Akademii będzie dostępny offline po wcześniejszym otwarciu strony i zapisaniu zasobów.`;
  }
  function mergeValues(local, remote) {
    if (Array.isArray(local) || Array.isArray(remote)) {
      const map = new Map(); [...(Array.isArray(local)?local:[]),...(Array.isArray(remote)?remote:[])].forEach((item,i)=>{ const id=item&&item.id ? item.id : JSON.stringify(item); if(!map.has(id))map.set(id,item); }); return Array.from(map.values());
    }
    if (local && remote && typeof local==='object' && typeof remote==='object') return {...remote,...local};
    return local == null ? remote : local;
  }
  function collectAll() { const data={}; SYNC_KEYS.forEach(k=>{ const v=read(k,null); if(v!=null)data[k]=v; }); return data; }
  function importData(data) {
    if (!data || typeof data !== 'object' || !data.data || data.format !== 'NAPRAWA-PC-AKADEMIA-BACKUP-4.5') throw new Error('Nieprawidłowy format kopii Akademii 4.5.');
    let changed=0; SYNC_KEYS.forEach(k=>{ if(Object.prototype.hasOwnProperty.call(data.data,k)){ write(k,mergeValues(read(k,null),data.data[k])); changed++; } });
    renderAll(); return changed;
  }
  function renderAll() { renderPower(); renderEsd(); renderStock(); renderMarks(); renderAssignments(); }
  async function cloudSync(direction) {
    const status=$('#lab45-cloud-status'); const button=direction==='pull'?$('#lab45-cloud-pull'):$('#lab45-cloud-push');
    if(button)button.disabled=true; if(status)status.textContent='Łączenie z istniejącym API konta Akademii…';
    try {
      const get=await fetch('/api/state',{method:'GET',credentials:'same-origin',headers:{'Accept':'application/json','Cache-Control':'no-store'}});
      const body=await get.json().catch(()=>({}));
      if(!get.ok){ if(get.status===401)throw new Error('Wymagane logowanie i zgoda na synchronizację danych.'); if(get.status===404)throw new Error('Endpoint synchronizacji nie jest dostępny na tym wdrożeniu.'); throw new Error(body.error||`API zwróciło HTTP ${get.status}.`); }
      if(direction==='pull'){
        let count=0; SYNC_KEYS.forEach(k=>{if(body.state&&Object.prototype.hasOwnProperty.call(body.state,k)){write(k,mergeValues(read(k,null),body.state[k]));count++;}});
        renderAll(); status.textContent=`Pobrano i połączono ${count} kategorii danych z konta. Lokalnych wpisów nie usunięto.`; toast('Synchronizacja z chmury zakończona.');
      } else {
        let sent=0; const local=collectAll();
        for(const [key,value] of Object.entries(local)){
          const response=await fetch('/api/state',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({key,value})});
          if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||`Nie udało się wysłać ${key} (HTTP ${response.status}).`);} sent++;
        }
        status.textContent=`Wysłano ${sent} kategorii danych na konto. Synchronizacja obejmuje tylko dozwolone pola Akademii.`; toast('Dane Laboratorium wysłane do chmury.');
      }
    } catch(err){status.textContent=err.message;toast(err.message);} finally {if(button)button.disabled=false;}
  }

  function bind() {
    document.addEventListener('click', event => {
      const jump=event.target.closest('[data-lab45-jump]'); if(jump){const target=$(`#lab45-${jump.dataset.lab45Jump}`);if(target){target.scrollIntoView({behavior:'smooth',block:'start'});$$('.lab45-nav button').forEach(b=>b.classList.toggle('active',b===jump));}return;}
      const delta=event.target.closest('[data-stock-delta]'); if(delta){const rows=read(KEY.stock,[]);const row=rows.find(x=>x.id===delta.dataset.stockId);if(row){row.qty=Math.max(0,(Number(row.qty)||0)+Number(delta.dataset.stockDelta));write(KEY.stock,rows);renderStock();}return;}
      const del=event.target.closest('[data-stock-delete]');if(del){write(KEY.stock,read(KEY.stock,[]).filter(x=>x.id!==del.dataset.stockDelete));renderStock();return;}
      const markDel=event.target.closest('[data-mark-delete]');if(markDel){write(KEY.marks,read(KEY.marks,[]).filter(x=>x.id!==markDel.dataset.markDelete));renderMarks();return;}
      const asDone=event.target.closest('[data-assignment-done]');if(asDone){const rows=read(KEY.assignments,[]);const row=rows.find(x=>x.id===asDone.dataset.assignmentDone);if(row)row.status=row.status==='Zaliczone'?'W toku':'Zaliczone';write(KEY.assignments,rows);renderAssignments();return;}
      const asDel=event.target.closest('[data-assignment-delete]');if(asDel){write(KEY.assignments,read(KEY.assignments,[]).filter(x=>x.id!==asDel.dataset.assignmentDelete));renderAssignments();return;}
    });
    $('#lab45-power-load').addEventListener('click',renderPower); $('#lab45-power-case').addEventListener('change',renderPower);
    $('#lab45-power-stages').addEventListener('change',event=>{
      const el=event.target.closest('[data-power-step]'); if(!el)return;
      const key=$('#lab45-power-case').value; const all=read('academyLab45PowerDone',{}); all[key]=all[key]||{}; all[key][el.dataset.powerStep]=el.checked; write('academyLab45PowerDone',all);
      const card=el.closest('.lab45-stage'); if(card)card.classList.toggle('done',el.checked);
      const label=el.parentElement.querySelector('span'); if(label)label.textContent=el.checked?'Sprawdzone':'Oznacz jako sprawdzone';
      const scenario=powerScenarios[key], done=scenario.stages.filter((_,i)=>all[key][i]).length;
      $('#lab45-power-result').innerHTML=`<b>${safe(scenario.title)}</b><p>Postęp ćwiczenia: <strong>${done}/${scenario.stages.length}</strong>. ${done===scenario.stages.length?'Zakończono checklistę — przejrzyj dowody i zapisz wnioski.':'Zaznaczaj kroki dopiero po przeanalizowaniu punktu pomiarowego i dokumentacji.'}</p>`;
    });
    $('#lab45-pd-run').addEventListener('click',runPd); $('#lab45-recovery-build').addEventListener('click',buildRecovery); $('#lab45-recovery-type').addEventListener('change',buildRecovery);
    $('#lab45-recovery-plan').addEventListener('change',event=>{const el=event.target.closest('[data-recovery-step]');if(!el)return;const key=$('#lab45-recovery-type').value;const all=read(KEY.recovery,{});all[key]=all[key]||{};all[key][el.dataset.recoveryStep]=el.checked;write(KEY.recovery,all);const checks=$$('[data-recovery-step]',$('#lab45-recovery-plan'));const done=checks.filter(x=>x.checked).length;$('#lab45-recovery-bar').style.width=`${done/checks.length*100}%`;$('#lab45-recovery-status').textContent=`${done}/${checks.length} kroków`;});
    $('#lab45-esd-list').addEventListener('change',event=>{
      const el=event.target.closest('[data-esd-step]'); if(!el)return;
      const v=read(KEY.esd,{}); v[el.dataset.esdStep]=el.checked; write(KEY.esd,v);
      const count=esdItems.filter((_,i)=>v[i]).length; $('#lab45-esd-count').textContent=`${count}/${esdItems.length}`; $('#lab45-esd-status').textContent=`${count}/${esdItems.length} kontroli`; $('#lab45-esd-bar').style.width=`${count/esdItems.length*100}%`;
    });
    $('#lab45-esd-reset').addEventListener('click',()=>{write(KEY.esd,{});renderEsd();toast('Checklistę ESD wyczyszczono.');});
    $('#lab45-stock-form').addEventListener('submit',event=>{event.preventDefault();const d=Object.fromEntries(new FormData(event.currentTarget).entries());const item={id:uid('part'),name:d.name.trim(),sku:d.sku.trim(),brand:d.brand.trim(),qty:Number(d.qty)||0,min:Number(d.min)||0,location:d.location.trim(),price:d.price===''?'':Number(d.price),createdAt:new Date().toISOString()};if(!item.name){toast('Podaj nazwę części.');return;}const rows=read(KEY.stock,[]);rows.push(item);write(KEY.stock,rows);event.currentTarget.reset();renderStock();toast('Dodano część do lokalnego magazynu.');});
    $('#lab45-stock-search').addEventListener('input',renderStock);
    $('#lab45-stock-csv').addEventListener('click',()=>{const rows=read(KEY.stock,[]);if(!rows.length){toast('Magazyn jest pusty.');return;}const fields=['name','sku','brand','qty','min','location','price'];const csv=[fields.join(';'),...rows.map(x=>fields.map(k=>`"${String(x[k]??'').replace(/"/g,'""')}"`).join(';'))].join('\r\n');download('akademia-magazyn-czesci.csv','\ufeff'+csv,'text/csv;charset=utf-8');});
    $('#lab45-inspector-file').addEventListener('change',event=>{const file=event.target.files&&event.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){toast('Wybierz plik obrazu.');return;}const reader=new FileReader();reader.onload=()=>{const stage=$('#lab45-inspector-stage');stage.innerHTML=`<img id="lab45-inspector-image" alt="Zdjęcie PCB do ręcznej inspekcji" src="${reader.result}"><div class="lab45-image-markers" id="lab45-image-markers"></div>`;stage.dataset.file=file.name;stage.dataset.mime=file.type;drawImageMarkers();};reader.readAsDataURL(file);});
    $('#lab45-inspector-stage').addEventListener('click',event=>{const image=$('#lab45-inspector-image');if(!image||event.target.closest('.lab45-image-pin'))return;const rect=image.getBoundingClientRect();const x=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100));const y=Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100));$('#lab45-inspector-stage').dataset.pendingX=x.toFixed(1);$('#lab45-inspector-stage').dataset.pendingY=y.toFixed(1);$('#lab45-inspector-stage').style.setProperty('--pin-x',`${x}%`);$('#lab45-inspector-stage').style.setProperty('--pin-y',`${y}%`);$('#lab45-inspector-stage').classList.add('pin-pending');});
    $('#lab45-inspector-add').addEventListener('click',()=>{const stage=$('#lab45-inspector-stage');const x=Number(stage.dataset.pendingX),y=Number(stage.dataset.pendingY);if(!Number.isFinite(x)||!Number.isFinite(y)){toast('Najpierw kliknij punkt na zdjęciu.');return;}const label=$('#lab45-inspector-label').value.trim()||`Punkt inspekcji ${read(KEY.marks,[]).length+1}`;const rows=read(KEY.marks,[]);rows.push({id:uid('mark'),file:stage.dataset.file||'zdjęcie PCB',label,x,y,note:'Do weryfikacji pomiarem i dokumentacją.',date:new Date().toLocaleString('pl-PL')});write(KEY.marks,rows);renderMarks();stage.classList.remove('pin-pending');stage.dataset.pendingX='';stage.dataset.pendingY='';toast('Dodano znacznik. To notatka inspekcyjna, nie diagnoza AI.');});
    $('#lab45-inspector-export').addEventListener('click',()=>download('akademia-inspekcja-pcb.json',JSON.stringify({format:'NAPRAWA-PC-PCB-NOTES-v1',records:read(KEY.marks,[])},null,2)));
    $('#lab45-assignment-form').addEventListener('submit',event=>{event.preventDefault();const d=Object.fromEntries(new FormData(event.currentTarget).entries());const rows=read(KEY.assignments,[]);rows.push({id:uid('task'),learner:d.learner.trim(),title:d.title.trim(),module:d.module,due:d.due,notes:d.notes.trim(),status:'Nowe',createdAt:new Date().toISOString()});write(KEY.assignments,rows);event.currentTarget.reset();renderAssignments();toast('Dodano zadanie instruktora.');});
    $('#lab45-offline-check').addEventListener('click',renderOffline); $('#lab45-export-all').addEventListener('click',()=>{download(`akademia-backup-4.5-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({format:'NAPRAWA-PC-AKADEMIA-BACKUP-4.5',exportedAt:new Date().toISOString(),data:collectAll()},null,2));});
    $('#lab45-import-all').addEventListener('change',event=>{const file=event.target.files&&event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const count=importData(JSON.parse(reader.result));toast(`Import zakończony. Połączono ${count} kategorii.`);}catch(err){toast(err.message);}};reader.readAsText(file);event.target.value='';});
    $('#lab45-cloud-pull').addEventListener('click',()=>cloudSync('pull')); $('#lab45-cloud-push').addEventListener('click',()=>cloudSync('push'));
    window.addEventListener('online',renderOffline); window.addEventListener('offline',renderOffline);
  }
  function init(){
    const lab=$('#view-labplus'); if(!lab||lab.dataset.lab45Init==='1')return; lab.dataset.lab45Init='1';
    createMarkup(); renderPower(); runPd(); buildRecovery(); renderEsd(); renderStock(); renderMarks(); renderAssignments(); renderOffline(); bind();
    // Register the worker only on secure contexts / localhost. API routes remain network-only.
    if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')) navigator.serviceWorker.register('/service-worker.js',{updateViaCache:'none'}).then(reg=>{reg.update().catch(()=>{});return renderOffline();}).catch(()=>renderOffline());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
