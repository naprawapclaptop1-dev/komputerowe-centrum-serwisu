from pathlib import Path
p=Path('/mnt/data/fix148_work/WEB_PUBLISH/index.html')
s=p.read_text(encoding='utf-8')
assert s.count('<meta name="academy-hotfix" content="FIX147">')==1
s=s.replace('<meta name="academy-hotfix" content="FIX147">','<meta name="academy-hotfix" content="FIX148">',1)
link='<link rel="stylesheet" href="assets/academy-master-hub-fix145.css?v=6.8.0-fix145">'
assert s.count(link)==1
s=s.replace(link,link+'\n<link rel="stylesheet" href="assets/academy-pro-modules-fix148.css?v=6.8.0-fix148">',1)
script='<script src="assets/academy-master-hub-fix145.js?v=6.8.0-fix145" defer></script>'
assert s.count(script)==1
s=s.replace(script,script+'\n<script src="assets/academy-pro-modules-fix148.js?v=6.8.0-fix148" defer></script>',1)
# Update the hero kicker's FIX145 stamp only in its own section.
s=s.replace('NAUKA OD A DO Z / MISTRZOWSKA ŚCIEŻKA SERWISANTA / FIX145','NAUKA OD A DO Z / MISTRZOWSKA ŚCIEŻKA SERWISANTA / FIX145 + FIX148',1)
s=s.replace('<div class="a145-hero-actions"><button type="button" class="a145-btn primary" data-nav="courses">Kontynuuj kursy ↗</button><button type="button" class="a145-btn" data-nav="practicepro">Centrum egzaminacyjne ↗</button></div>','<div class="a145-hero-actions"><button type="button" class="a145-btn primary" data-nav="courses">Kontynuuj kursy ↗</button><button type="button" class="a145-btn" data-nav="practicepro">Centrum egzaminacyjne ↗</button><button type="button" class="a145-btn" data-a148-jump>Nowe laboratoria FIX148 ↓</button></div>',1)
insert=r'''
        <section class="a145-block" id="a148AdvancedHub">
          <div class="a148-head">
            <div><span class="a148-eyebrow">FIX148 / 7 NOWYCH MODUŁÓW PRAKTYCZNYCH</span><h2>Centrum technika — narzędzia mistrzowskie PRO</h2><p>Interaktywne narzędzia do nauki BoardView, przebiegu serwisu, zgodności zestawów, raportowania, tworzenia lekcji, analizy typowych usterek i ćwiczeń lutowania. Dane zapisują się lokalnie w tej przeglądarce.</p></div>
            <div><span class="a145-pill">LOKALNE DANE / BEZ MIGRACJI D1</span><button type="button" class="a148-btn" id="a148ExportAll">Eksportuj kopię modułów JSON ↓</button></div>
          </div>
          <nav class="a148-tabs" role="tablist" aria-label="Nowe moduły Centrum Mistrza PRO">
            <button type="button" class="active" data-a148-tab="board" role="tab" aria-selected="true">BOARDVIEW PRO</button>
            <button type="button" data-a148-tab="service" role="tab" aria-selected="false">Symulator serwisu</button>
            <button type="button" data-a148-tab="compat" role="tab" aria-selected="false">PC Compatibility</button>
            <button type="button" data-a148-tab="reports" role="tab" aria-selected="false">Dokumentacja serwisowa</button>
            <button type="button" data-a148-tab="teacher" role="tab" aria-selected="false">Akademia nauczyciela</button>
            <button type="button" data-a148-tab="faults" role="tab" aria-selected="false">Baza usterek PRO</button>
            <button type="button" data-a148-tab="solder" role="tab" aria-selected="false">Laboratorium lutowania</button>
          </nav>

          <section class="a148-panel" data-a148-panel="board" role="tabpanel">
            <div class="a148-head"><div><span class="a148-eyebrow">INTERAKTYWNA PLANSZA EDUKACYJNA</span><h3>BOARDVIEW PRO — poznawaj oznaczenia PCB</h3><p>Wybierz symbol na przykładowej płycie, aby zobaczyć rolę elementu i bezpieczną kolejność nauki. To plansza demonstracyjna, nie BoardView konkretnego modelu ani rzeczywisty pinout.</p></div><button type="button" class="a148-btn" data-nav="ultimate3d">Otwórz istniejące PCB 3D ↗</button></div>
            <div class="a148-board-layout">
              <div><div class="a148-board-map"><div class="a148-board-surface" aria-label="Demonstracyjny układ elementów PCB"><button type="button" class="a148-pad active" data-a148-part="U1">U1<small>CTRL</small></button><button type="button" class="a148-pad" data-a148-part="J1">J1<small>INPUT</small></button><button type="button" class="a148-pad" data-a148-part="F1">F1<small>FUSE</small></button><button type="button" class="a148-pad" data-a148-part="Q1">Q1<small>MOSFET</small></button><button type="button" class="a148-pad" data-a148-part="L1">L1<small>COIL</small></button><button type="button" class="a148-pad" data-a148-part="C1">C1<small>CAP</small></button><button type="button" class="a148-pad" data-a148-part="U2">U2<small>CHARGE</small></button><button type="button" class="a148-pad" data-a148-part="JUSB">JUSB<small>USB-C</small></button><button type="button" class="a148-pad" data-a148-part="TP1">TP1<small>TEST</small></button><button type="button" class="a148-pad" data-a148-part="RAM1">RAM1<small>MEM</small></button></div><p class="a148-small">Legenda: U — układ, J — złącze, F — bezpiecznik, Q — tranzystor, L — dławik, C — kondensator, TP — punkt pomiarowy. Oznaczenia mają charakter przykładowy.</p></div>
                <label>Szukaj oznaczenia / funkcji<input id="a148BoardSearch" type="search" placeholder="np. USB-C, MOSFET, F1…"></label><div id="a148BoardList" class="a148-board-list"></div>
              </div>
              <article id="a148BoardDetail" class="a148-card" aria-live="polite"><h3>U1 — Układ sterujący</h3><p>Wybierz element.</p></article>
            </div>
            <p class="a148-safety">Nie używaj demonstracyjnej planszy do lokalizowania pinów ani podawania napięć. Do prawdziwej naprawy wymagane są schemat, Board ID, rewizja PCB i dokumentacja producenta.</p>
          </section>

          <section class="a148-panel" data-a148-panel="service" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">OD PRZYJĘCIA DO TESTU KOŃCOWEGO</span><h3>Symulator prawdziwego procesu serwisowego</h3><p>Przećwicz kolejność pracy przy przyjęciu sprzętu, diagnozie, USB-C, przegrzewaniu lub ryzyku utraty danych. Zakończony przebieg możesz zapisać jako lokalny wpis ćwiczenia.</p></div></div>
            <div class="a148-grid"><div class="a148-card"><label>Scenariusz ćwiczenia<select id="a148ServiceCase"><option value="intake">Przyjęcie komputera</option><option value="diagnosis">Brak obrazu / brak POST</option><option value="charging">Brak ładowania USB-C</option><option value="data">Ryzyko uszkodzenia nośnika</option><option value="overheating">Przegrzewanie</option></select></label><button type="button" class="a148-btn primary" id="a148ServiceStart">Rozpocznij scenariusz</button><p class="a148-small">Postęp ćwiczenia: <b id="a148ServiceProgress">0/0</b></p><div id="a148ServiceStage" class="a148-service-stage" aria-live="polite"><p>Wybierz scenariusz i kliknij „Rozpocznij”.</p></div><p id="a148ServiceStatus" role="status" class="a148-small">Wyniki są lokalne.</p></div><div class="a148-card"><h3>Historia ćwiczeń</h3><ul id="a148ServiceHistory" class="a148-history-list"><li>Brak ukończonych scenariuszy.</li></ul><p class="a148-safety">To trening procesu. Nie jest zleceniem serwisowym, nie kontaktuje się z klientem i nie zapisuje danych w D1.</p></div></div>
          </section>

          <section class="a148-panel" data-a148-panel="compat" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">ROZSZERZONA KONTROLA PARAMETRÓW</span><h3>PC Compatibility Master</h3><p>Rozszerzenie istniejącego konfiguratora o długość GPU, wysokość chłodzenia, zgodność złącza zasilania i rodzaj obsługi M.2.</p></div></div>
            <form id="a148CompatForm" class="a148-form-grid">
              <label>Socket CPU<select name="cpuSocket"><option>AM4</option><option>AM5</option><option>LGA1700</option><option>LGA1851</option><option>TR5</option></select></label>
              <label>Socket płyty<select name="boardSocket"><option>AM4</option><option>AM5</option><option>LGA1700</option><option>LGA1851</option><option>TR5</option></select></label>
              <label>RAM zestawu<select name="ramType"><option>DDR4</option><option>DDR5</option></select></label>
              <label>RAM płyty<select name="boardRam"><option>DDR4</option><option>DDR5</option></select></label>
              <label>Długość karty GPU (mm)<input name="gpuLength" type="number" min="100" max="500" value="300" required></label>
              <label>Limit długości GPU obudowy (mm)<input name="caseGpu" type="number" min="100" max="500" value="330" required></label>
              <label>Wysokość chłodzenia CPU (mm)<input name="coolerHeight" type="number" min="20" max="250" value="155" required></label>
              <label>Limit chłodzenia obudowy (mm)<input name="caseCooler" type="number" min="20" max="250" value="165" required></label>
              <label>CPU — orientacyjny pobór (W)<input name="cpu" type="number" min="10" max="1000" value="120" required></label>
              <label>GPU — orientacyjny pobór (W)<input name="gpu" type="number" min="10" max="1000" value="250" required></label>
              <label>PSU — moc znamionowa (W)<input name="psu" type="number" min="100" max="2500" value="750" required></label>
              <label>Przewód / złącze GPU<select name="gpuPowerConnector"><option value="yes">Zgodne z dokumentacją PSU i GPU</option><option value="no">Brak potwierdzenia zgodności</option></select></label>
              <label>Obsługa M.2 na płycie<select name="m2Support"><option value="nvme-sata">NVMe + SATA</option><option value="nvme-only">NVMe only</option><option value="sata-only">SATA only</option></select></label>
              <label>Wybrany dysk M.2<select name="drive"><option value="nvme">NVMe</option><option value="sata">SATA</option></select></label>
              <div class="a148-wide"><button type="submit" class="a148-btn primary">Sprawdź zgodność</button><div id="a148CompatResult" class="a148-result" aria-live="polite">Wpisz parametry i uruchom kontrolę.</div></div>
            </form>
          </section>

          <section class="a148-panel" data-a148-panel="reports" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">RAPORT / PROTOKÓŁ / WYDRUK PDF</span><h3>Profesjonalna dokumentacja serwisowa</h3><p>Utwórz czytelny raport z objawami, dowodami diagnozy, wykonanymi pracami, częściami i testem końcowym. Dane pozostają lokalnie na tym urządzeniu.</p></div></div>
            <form id="a148ReportForm" class="a148-form-grid">
              <label>Tytuł raportu<input name="title" required maxlength="120" placeholder="np. Diagnostyka laptopa — brak ładowania"></label>
              <label>Urządzenie / model<input name="device" required maxlength="120" placeholder="Producent i dokładny model"></label>
              <label>Identyfikator wewnętrzny (bez danych wrażliwych)<input name="reference" maxlength="80" placeholder="np. SRV-2026-001"></label>
              <label>Status<select name="status"><option>Diagnoza</option><option>W naprawie</option><option>Test końcowy</option><option>Ukończono</option></select></label>
              <label class="a148-wide">Zgłoszenie / objawy<textarea name="issue" required maxlength="1200"></textarea></label>
              <label class="a148-wide">Ustalenia / dowody diagnozy<textarea name="findings" maxlength="1600"></textarea></label>
              <label class="a148-wide">Wykonane prace<textarea name="work" maxlength="1600"></textarea></label>
              <label>Części / materiały<textarea name="parts" maxlength="800"></textarea></label>
              <label>Test końcowy<textarea name="finalTest" maxlength="1000"></textarea></label>
              <div class="a148-wide"><button type="submit" class="a148-btn primary">Utwórz i zapisz raport</button><button type="button" class="a148-btn" id="a148ReportPrint">Drukuj / Zapisz jako PDF</button><button type="button" class="a148-btn" id="a148ReportExport">Eksportuj raporty JSON</button><span id="a148ReportStatus" class="a148-small" role="status">Raporty przechowywane są lokalnie.</span></div>
            </form>
            <article id="a148ReportPreview" class="a148-report" hidden></article>
            <p class="a148-safety">Nie wpisuj haseł, kluczy BitLocker, danych płatniczych ani zbędnych danych osobowych. Przed wysłaniem/drukiem sprawdź treść i usuń informacje identyfikujące, jeśli nie są potrzebne.</p>
          </section>

          <section class="a148-panel" data-a148-panel="teacher" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">TWORZENIE WŁASNYCH MATERIAŁÓW</span><h3>Akademia nauczyciela</h3><p>Twórz lokalne szkice lekcji z celem, materiałami, krokami i pytaniem kontrolnym. Szkice można przeglądać i eksportować — nie są automatycznie publikowane do wspólnego katalogu.</p></div></div>
            <form id="a148TeacherForm" class="a148-form-grid">
              <label>Tytuł lekcji<input name="title" required maxlength="120"></label>
              <label>Kategoria<select name="category"><option>Diagnostyka PC</option><option>Elektronika</option><option>Laptopy</option><option>BIOS / UEFI</option><option>Windows</option><option>Bezpieczeństwo</option></select></label>
              <label class="a148-wide">Cel nauki<textarea name="objective" required maxlength="500"></textarea></label>
              <label class="a148-wide">Materiały / narzędzia<textarea name="materials" maxlength="500"></textarea></label>
              <label class="a148-wide">Kroki lekcji — jeden krok w każdym wierszu<textarea name="steps" required maxlength="2400" placeholder="1. Przygotuj stanowisko&#10;2. Zidentyfikuj element&#10;3. Zweryfikuj dokumentację"></textarea></label>
              <label class="a148-wide">Pytanie kontrolne<input name="question" maxlength="300"></label>
              <label>Odpowiedź A<input name="answerA" maxlength="160"></label><label>Odpowiedź B<input name="answerB" maxlength="160"></label><label>Odpowiedź C<input name="answerC" maxlength="160"></label>
              <label>Prawidłowa odpowiedź<select name="correct"><option value="0">A</option><option value="1">B</option><option value="2">C</option></select></label>
              <div class="a148-wide"><button type="submit" class="a148-btn primary">Zapisz szkic lekcji</button><button type="button" class="a148-btn" id="a148TeacherExport">Eksportuj szkice JSON</button><span id="a148TeacherStatus" role="status" class="a148-small">Szkice zapisują się lokalnie.</span></div>
            </form>
            <div class="a148-grid"><div id="a148TeacherDrafts" class="a148-card"><p>Nie ma jeszcze własnych szkiców.</p></div><article id="a148TeacherPreview" class="a148-card" hidden></article></div>
          </section>

          <section class="a148-panel" data-a148-panel="faults" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">18 PRZYPADKÓW REFERENCYJNYCH + WŁASNE NOTATKI</span><h3>Baza usterek PRO</h3><p>Wyszukiwalne przypadki z kolejnością bezpiecznych kontroli. Każdy przypadek jest punktem startowym, a nie diagnozą konkretnego podzespołu.</p></div></div>
            <div class="a148-fault-layout"><div><label>Szukaj objawu / elementu<input id="a148FaultSearch" type="search" placeholder="np. USB-C, RAM, BSOD…"></label><label>Kategoria<select id="a148FaultCategory"><option value="all">Wszystkie kategorie</option><option>Zasilanie</option><option>Zasilanie / USB-C</option><option>POST / obraz</option><option>GPU / VRAM</option><option>Windows / zasilanie</option><option>Chłodzenie</option><option>Dane / nośnik</option><option>RAM / POST</option><option>Windows / sterowniki</option><option>Sieć / sterownik</option><option>Mechanika / chłodzenie</option><option>Bateria / bezpieczeństwo</option><option>I/O / USB</option><option>Audio / sterowniki</option><option>BIOS / firmware</option><option>GPU / termika</option></select></label><small id="a148FaultCount" class="a148-small">18 przypadków</small><div id="a148FaultList" class="a148-fault-list"></div></div><article id="a148FaultDetail" class="a148-card"><h3>Wybierz przypadek</h3><p>Opis i kroki pojawią się tutaj.</p></article></div>
            <form id="a148FaultForm" class="a148-form-grid" style="margin-top:16px"><label>Własny przypadek<input name="title" required maxlength="120"></label><label>Kategoria<input name="category" maxlength="60" value="Własne"></label><label class="a148-wide">Kolejność kontroli<textarea name="checks" required maxlength="1200"></textarea></label><label class="a148-wide">Ostrzeżenie bezpieczeństwa<textarea name="safety" maxlength="500"></textarea></label><div class="a148-wide"><button type="submit" class="a148-btn primary">Dodaj własną notatkę</button><button type="button" class="a148-btn" id="a148FaultExport">Eksportuj bazę JSON</button><span id="a148FaultStatus" role="status" class="a148-small"></span></div></form>
          </section>

          <section class="a148-panel" data-a148-panel="solder" role="tabpanel" hidden aria-hidden="true">
            <div class="a148-head"><div><span class="a148-eyebrow">SMD / HOT-AIR / KONTROLA OPTYCZNA</span><h3>Laboratorium lutowania PRO</h3><p>Krokowe ćwiczenie przygotowania stanowiska, materiałów, grotu, spoin i kontroli optycznej. Checklistę możesz odhaczać po wykonaniu ćwiczeń na nieaktywnej płytce treningowej.</p></div><button type="button" class="a148-btn" id="a148SolderReset">Reset checklisty</button></div>
            <div class="a148-card"><b>Postęp ćwiczenia: <span id="a148SolderProgress">0/7</span></b><div class="a148-progress"><i id="a148SolderBar"></i></div></div>
            <div id="a148SolderSteps"></div>
            <div class="a148-grid"><div class="a148-card"><h3>Mini sprawdzian</h3><p>Jak dobierać temperaturę i materiały do konkretnego zadania?</p><label>Wybierz odpowiedź<select id="a148SolderAnswer"><option value="">Wybierz…</option><option value="guess">Zawsze używać jednej stałej temperatury.</option><option value="safe">Kierować się dokumentacją stacji, stopu, topnika i zadaniem.</option><option value="max">Ustawiać maksymalną temperaturę, aby skrócić czas.</option></select></label><button type="button" class="a148-btn primary" id="a148SolderQuiz">Sprawdź odpowiedź</button><p id="a148SolderStatus" role="status" class="a148-small"></p></div><div class="a148-card"><h3>Zasady bezpieczeństwa</h3><ul><li>Używaj sprawnej wentylacji/odciągu i ochrony oczu.</li><li>Nie lutuj baterii, elementów pod napięciem ani nieznanych obwodów.</li><li>Stosuj ESD i instrukcję urządzeń warsztatowych.</li><li>Pracę przy sieci 230 V pozostaw osobom z właściwymi kwalifikacjami.</li></ul></div></div>
          </section>
          <p class="a148-note" id="a148StorageStatus">Postępy lokalne — pamiętaj o eksporcie kopii. Moduły nie wykonują napraw automatycznie ani nie komunikują się ze sprzętem.</p>
        </section>
'''
marker='        <p class="a145-disclaimer">'
assert s.count(marker)==1
s=s.replace(marker,insert+'\n'+marker,1)
p.write_text(s,encoding='utf-8')
print('injected',len(insert),'chars')
