/* NAUKA OD A DO Z 6.8.0 — FIX145 / DODATKOWE PRAKTYCZNE LEKCJE PRO */
(() => {
  'use strict';
  const data = window.ACADEMY_DATA;
  if (!data || !Array.isArray(data.courseLessons)) return;
  const existing = new Set(data.courseLessons.map(item => item.id));
  const make = (id, category, level, minutes, title, description, symptoms, diagnosis, repair, verify, warning, tools, step, steps, body, scenario, task, deliverable, acceptance, quiz) => ({
    id, category, level, minutes, title, description, symptoms, diagnosis, repair, verify, warning, tools, step, steps, body,
    exercise:{scenario,task,deliverable,acceptance}, quiz
  });
  const lessons = [
    make('PRACTICE145-001','USB-C i Power Delivery','Średni → zaawansowany',40,
      'USB-C Power Delivery — diagnoza toru ładowania bez wymiany na ślepo',
      'Rozdziel problem przewodu, zasilacza, gniazda, negocjacji PD i toru wejściowego płyty.',
      'Laptop nie ładuje się, ładuje tylko pod określonym kątem, rozpoznaje zasilacz bez poboru mocy albo przerywa ładowanie.',
      'Objaw może wynikać z kabla bez odpowiedniego profilu, źródła zasilania, zabrudzonego lub uszkodzonego gniazda, kontrolera CC/PD albo sekcji wejściowej. Sam brak ładowania nie wskazuje konkretnego układu.',
      'Wykonaj kontrolę od elementów zewnętrznych do płyty: zgodny zasilacz i przewód, stan portu, identyfikacja modelu i dopiero potem pomiary według dokumentacji konkretnej rewizji.',
      'Po naprawie potwierdź stabilną negocjację zasilania, brak przerw przy delikatnym poruszeniu przewodem, ładowanie baterii i poprawną pracę na zasilaczu.',
      'Nie mierz rezystancji w zasilonym obwodzie. Przed pomiarami pasywnymi odłącz zasilacz i baterię. Nie zwieraj pinów USB-C ani nie podawaj napięcia na nieznane punkty.',
      ['Zgodny zasilacz USB-C PD i przewód o znanych parametrach','Dokumentacja dokładnego modelu i rewizji PCB','Miernik USB-C/PD lub analizator protokołu — jeśli dostępny','Multimetr i procedura ESD'],
      'Zapisz model urządzenia, moc i profile zasilacza, typ przewodu oraz dokładny objaw przed demontażem.',
      ['Potwierdź model laptopa, rewizję płyty i wymagany profil zasilania z dokumentacji.','Sprawdź gniazdo, przewód i zasilacz na znanym, zgodnym zestawie.','Oceń port pod kątem luzu, zabrudzeń, korozji i uszkodzeń mechanicznych.','Jeśli urządzenie pozwala, odczytaj stan ładowania i komunikaty firmware bez otwierania obudowy.','Odłącz zasilanie i baterię przed kontrolą pasywną oraz pomiarami rezystancji.','Wykonuj pomiary wyłącznie w punktach wskazanych w dokumentacji właściwej rewizji.','Zapisz wynik negocjacji, pomiary, wykonane czynności i test końcowy.'],
      'CEL LEKCJI\nRozdzielić usterkę kabla, zasilacza, złącza, negocjacji PD i toru wejściowego.\n\nPODSTAWY\nUSB-C opisuje typ złącza; USB Power Delivery jest protokołem negocjacji zasilania. Sam kształt portu nie potwierdza obsługi PD ani konkretnej mocy.\n\nPRAKTYKA\nZacznij od zestawu zewnętrznego i danych producenta. Nie przechodź do pomiarów płyty, dopóki nie ustalisz rewizji i bezpiecznych punktów testowych.\n\nKRYTERIUM\nRaport musi odróżniać zaobserwowany objaw od potwierdzonej przyczyny.',
      'Laptop ładuje się tylko z jednym przewodem. Inny przewód nie uruchamia ładowania, a użytkownik podejrzewa uszkodzenie kontrolera na płycie.',
      'Ułóż kolejność prób, która rozdzieli problem przewodu, zasilacza, portu i płyty bez losowej wymiany elementów.',
      ['Specyfikacja zasilacza i przewodu','Wynik próby z drugim zgodnym zestawem','Opis portu oraz model/revizja płyty','Wyniki pomiarów wykonanych według właściwej dokumentacji'],
      'Wniosek jest poparty kontrolą zestawu zewnętrznego i udokumentowaną próbą; nie zakłada uszkodzenia kontrolera bez dowodu.',
      [
        {q:'Czy każdy port USB-C obsługuje ładowanie Power Delivery?',options:['Tak, każdy port USB-C ma identyczne funkcje','Nie — funkcje i profile zależą od implementacji urządzenia','Tak, ale tylko po instalacji sterownika'],correct:1,explain:'USB-C określa złącze. Obsługiwane funkcje, moce i role zależą od konkretnego urządzenia.'},
        {q:'Od czego zacząć diagnozę braku ładowania?',options:['Od wymiany kontrolera PD','Od potwierdzenia zgodnego zasilacza, przewodu i stanu portu','Od przypadkowego podania napięcia na gniazdo'],correct:1,explain:'Najpierw wyklucz elementy zewnętrzne i potwierdź model oraz wymagane profile.'},
        {q:'Kiedy wolno wykonywać pomiar rezystancji?',options:['W zasilonym laptopie','Po bezpiecznym odłączeniu źródeł zasilania zgodnie z procedurą','Podczas negocjacji PD'],correct:1,explain:'Pomiar rezystancji i ciągłości wykonuje się w obwodzie pozbawionym zasilania.'}
      ]),
    make('PRACTICE145-002','GPU i VRAM','Średni → zaawansowany',45,
      'Artefakty GPU — oddzielanie problemu sterownika, temperatury i VRAM',
      'Twórz kontrolowany plan diagnozy artefaktów, migotania i resetów sterownika.',
      'Pojawiają się kolorowe piksele, migające tekstury, czarny ekran, reset sterownika lub błędy po wzroście obciążenia.',
      'Przyczyną może być tor obrazu, przewód/monitor, sterownik, niestabilne OC, termika, zasilanie lub pamięć GPU. Jeden zrzut ekranu nie wystarcza do wskazania uszkodzonego układu.',
      'Najpierw przywróć ustawienia fabryczne, sprawdź inny przewód/monitor i logi. Następnie kontroluj temperaturę rdzenia/hotspotu, stabilność zasilania i wykonuj testy pamięci zgodnie z możliwościami narzędzia.',
      'Po naprawie wykonaj porównywalny test, sprawdź artefakty, temperatury, logi i stabilność po zimnym starcie.',
      'Przerwij test przy zapachu, dymie, niekontrolowanej temperaturze lub niestabilnym zasilaniu. Nie rozbieraj zasilacza i nie wykonuj pomiarów na żywych punktach bez kwalifikacji.',
      ['Narzędzie monitorujące temperatury i taktowania','Znany sprawny monitor i przewód','Test diagnostyczny VRAM o kontrolowanym obciążeniu','Dziennik zdarzeń i wersja sterownika'],
      'Zapisz model GPU, wersję sterownika, ustawienia fabryczne/OC, temperaturę i warunki wystąpienia artefaktów.',
      ['Sprawdź, czy artefakty pojawiają się również w BIOS/UEFI lub przed załadowaniem sterownika.','Podłącz znany sprawny przewód i monitor oraz sprawdź inne wyjście obrazu.','Przywróć fabryczne zegary i napięcia; zapisz wcześniejsze ustawienia.','Zapisz temperaturę rdzenia, hotspot i prędkość wentylatorów w bezpiecznym obciążeniu.','Sprawdź logi sterownika i zdarzenia WHEA/TDR z czasu awarii.','Uruchom test VRAM zgodny z kartą i przerwij go, gdy pojawią się warunki niebezpieczne.','Porównaj wynik na czystym/znanym sterowniku i przygotuj raport z hipotezami.'],
      'CEL LEKCJI\nNie utożsamiać artefaktów z automatyczną awarią VRAM.\n\nTOK ROZUMOWANIA\nWystępowanie obrazu w BIOS, na innym monitorze oraz przy ustawieniach fabrycznych pomaga oddzielić tor obrazu, sterownik i stabilność karty.\n\nPRAKTYKA\nWykonuj próby w tych samych warunkach. Zapisuj temperaturę, obciążenie, sterownik i moment wystąpienia objawu.\n\nWYNIK\nWniosek powinien wskazywać, co potwierdzono, czego nie wykluczono i jakie dane są potrzebne dalej.',
      'Artefakty pojawiają się po 15 minutach gry. Po restarcie systemu znikają, a temperatura hotspotu jest wyższa niż w spoczynku.',
      'Ułóż bezpieczne próby oddzielające przewód/monitor, sterownik, OC, termikę i VRAM.',
      ['Wynik testu na innym przewodzie/monitorze','Logi i wersja sterownika','Zapis temperatur i ustawień','Wynik kontrolowanego testu pamięci'],
      'Nie ma nieuzasadnionej wymiany GPU lub VRAM; każda hipoteza ma przypisany test i wynik.',
      [
        {q:'Czy artefakty zawsze oznaczają uszkodzoną pamięć VRAM?',options:['Tak, bez dalszych testów','Nie — trzeba wykluczyć tor obrazu, sterownik, OC i temperaturę','Tak, jeśli komputer jest nowy'],correct:1,explain:'Artefakty mają wiele możliwych przyczyn. Potrzebne są niezależne próby.'},
        {q:'Co należy zrobić przed testem stabilności?',options:['Przywrócić ustawienia fabryczne i zanotować stan bazowy','Podnieść wszystkie zegary','Zwiększyć napięcie bez dokumentacji'],correct:0,explain:'Stan bazowy ogranicza liczbę zmiennych w diagnozie.'},
        {q:'Jak postąpić przy niekontrolowanym wzroście temperatury?',options:['Kontynuować test przez godzinę','Przerwać test i sprawdzić chłodzenie oraz warunki pracy','Zasłonić otwory wentylacyjne'],correct:1,explain:'Bezpieczeństwo podzespołu i użytkownika ma pierwszeństwo.'}
      ]),
    make('PRACTICE145-003','Bezpieczeństwo serwisu','Podstawowy → średni',25,
      'ESD, bateria i przygotowanie stanowiska przed demontażem laptopa',
      'Ustal bezpieczną kolejność przygotowania laptopa do inspekcji i prac serwisowych.',
      'Urządzenie ma być otwarte do czyszczenia, diagnostyki gniazda, wymiany RAM/SSD lub kontroli płyty.',
      'Ryzyko obejmuje zwarcie, uszkodzenie ESD, uszkodzenie złącza baterii, utratę danych i uszkodzenie mechaniczne. Procedura zależy od modelu.',
      'Zabezpiecz dane, wyłącz urządzenie, odłącz źródła zasilania i postępuj według instrukcji serwisowej. Używaj właściwego stanowiska ESD i narzędzi.',
      'Po złożeniu sprawdź złącza, mocowania, przewody, uruchomienie, obraz, klawiaturę, sieć, ładowanie i test końcowy.',
      'Nie otwieraj baterii, zasilacza sieciowego ani elementów wysokiego napięcia. Przy spuchniętej/uszkodzonej baterii przerwij pracę i zastosuj procedurę producenta.',
      ['Instrukcja serwisowa dokładnego modelu','Mata i opaska ESD używane zgodnie z procedurą','Zestaw narzędzi dopasowany do śrub','Nośnik kopii danych i karta kontroli'],
      'Zapisz model, stan obudowy, stan baterii i kopię danych przed rozpoczęciem demontażu.',
      ['Potwierdź dokładny model i odszukaj instrukcję serwisową.','Zapisz stan urządzenia i zabezpiecz ważne dane.','Wyłącz system, odłącz ładowarkę i zastosuj instrukcję odłączenia baterii.','Przygotuj stanowisko i ochronę ESD; uporządkuj śruby i elementy.','Otwieraj obudowę narzędziem nieuszkadzającym zatrzasków i przewodów.','Przed dotknięciem płyty potwierdź brak zasilania zgodnie z procedurą.','Po montażu wykonaj kontrolę przewodów, śrub, portów oraz test końcowy.'],
      'CEL LEKCJI\nPrzygotować laptop do pracy bez utraty danych i bez niepotrzebnego ryzyka.\n\nESD\nWyładowanie elektrostatyczne może uszkodzić elementy bez widocznego śladu. Stosuj procedurę i właściwe stanowisko.\n\nBATERIA\nSposób odłączenia różni się między modelami. Nie podważaj i nie przebijaj ogniw.\n\nKRYTERIUM\nPraca rozpoczyna się dopiero po identyfikacji modelu, zabezpieczeniu danych i odłączeniu zasilania według instrukcji.',
      'Laptop ma zostać otwarty do wymiany SSD. Właściciel nie wykonał kopii danych, a bateria jest wewnętrzna.',
      'Przygotuj listę czynności w kolejności, która zabezpiecza dane i urządzenie.',
      ['Potwierdzony model i instrukcja','Lista kopii danych','Procedura wyłączenia/odłączenia baterii','Lista kontroli po złożeniu'],
      'Nie ma pracy pod napięciem ani ryzykownego obchodzenia się z baterią; wszystkie kroki są powiązane z instrukcją modelu.',
      [
        {q:'Co należy zrobić przed otwarciem laptopa?',options:['Wyłączyć urządzenie i przygotować procedurę odłączenia zasilania/baterii','Zostawić ładowarkę podłączoną','Wymusić uśpienie'],correct:0,explain:'Kroki zależą od modelu, ale praca wewnątrz wymaga właściwego odłączenia źródeł zasilania.'},
        {q:'Czy spuchniętą baterię można przebić, aby ją rozładować?',options:['Tak, ostrożnie','Nie — przerwij pracę i zastosuj procedurę bezpiecznej obsługi baterii','Tak, jeśli urządzenie jest wyłączone'],correct:1,explain:'Nie wolno przebijać ani zgniatać ogniw litowych.'},
        {q:'Po co stosuje się ochronę ESD?',options:['Aby zapobiegać wyładowaniom elektrostatycznym na elementy','Tylko do czyszczenia ekranu','Aby zwiększyć taktowanie CPU'],correct:0,explain:'ESD może uszkodzić elektronikę nawet bez widocznego śladu.'}
      ]),
    make('PRACTICE145-004','Odzyskiwanie danych','Średni',35,
      'SMART i nośnik z błędami — kiedy przestać testować dysk',
      'Rozpoznawaj ryzyko dalszego pogorszenia stanu nośnika i dobieraj bezpieczny plan.',
      'Dysk klika, znika z systemu, ma błędy odczytu, rosnący licznik błędów lub komputer długo się zawiesza.',
      'SMART to zestaw wskaźników, a nie gwarancja sprawności. Objawy mechaniczne i błędy odczytu mogą oznaczać ryzyko utraty danych.',
      'Jeśli dane są ważne, ogranicz dalsze używanie i nie uruchamiaj napraw systemu plików przed oceną ryzyka. Priorytetem jest kopia/obraz sektorowy lub profesjonalne odzyskiwanie odpowiednie do rodzaju awarii.',
      'Po odtworzeniu danych zweryfikuj integralność kopii i dopiero osobno oceń, czy nośnik nadaje się do dalszego użycia.',
      'Nie otwieraj dysku HDD w zwykłym warsztacie, nie wykonuj wielokrotnych pełnych skanów na nośniku z objawami mechanicznymi i nie zapisuj danych na źródłowym dysku.',
      ['Narzędzie odczytu SMART w trybie nieinwazyjnym','Nośnik docelowy o wystarczającej pojemności','Narzędzie do obrazowania z kontrolą błędów — gdy stan na to pozwala','Lista kontrolna łańcucha kopii i weryfikacji'],
      'Ustal wartość danych, objawy, model nośnika, interfejs i czy nośnik wydaje nietypowe dźwięki.',
      ['Zapytaj o znaczenie danych i możliwość odtworzenia kopii.','Zapisz objawy oraz model nośnika; nie wykonuj zbędnych zapisów.','Odczytaj SMART tylko wtedy, gdy nie zwiększa to ryzyka i nośnik jest stabilny.','Przy objawach mechanicznych lub szybkim pogarszaniu odłącz nośnik i skieruj do specjalisty.','Jeśli obrazowanie jest bezpieczne, pracuj na kopii sektorowej i rejestruj błędy odczytu.','Odzyskuj pliki z kopii, nie zapisuj ich na źródłowym nośniku.','Zweryfikuj pliki, sumy kontrolne i kompletność przekazania danych.'],
      'CEL LEKCJI\nOchronić dane przed niepotrzebnym pogorszeniem stanu nośnika.\n\nSMART\nWskaźniki pomagają ocenić ryzyko, ale ich interpretacja zależy od producenta i modelu. Dobry status SMART nie wyklucza awarii.\n\nPRAKTYKA\nRozdziel diagnostykę nośnika od odzyskiwania danych. Najpierw zabezpiecz źródło, później testuj kopię.\n\nWYNIK\nRaport zawiera decyzję: dalsza praca, obrazowanie lub przerwanie i przekazanie do specjalistycznego odzyskiwania.',
      'Dysk z danymi klienta znika z systemu i wydaje powtarzalny dźwięk. Użytkownik prosi o uruchomienie CHKDSK.',
      'Uzasadnij, czy wolno wykonywać naprawę systemu plików i jak zabezpieczyć dane.',
      ['Ocena znaczenia danych','Opis objawów i modelu','Decyzja o przerwaniu/obrazowaniu','Raport weryfikacji kopii'],
      'Nie wykonano zapisu na źródle; ryzyko mechaniczne skutkuje przerwaniem testów i właściwą eskalacją.',
      [
        {q:'Czy zielony status SMART gwarantuje sprawny dysk?',options:['Tak, zawsze','Nie — SMART nie wykrywa wszystkich awarii','Tak, jeśli dysk ma mniej niż rok'],correct:1,explain:'SMART jest pomocny, ale nie wyklucza awarii elektronicznej ani mechanicznej.'},
        {q:'Dysk klika i zawiera ważne dane. Co jest rozsądne?',options:['Uruchamiać wielokrotnie pełny skan','Ograniczyć zasilanie i eskalować do bezpiecznego odzyskiwania','Zapisać nowe pliki na tym dysku'],correct:1,explain:'Objawy mechaniczne wymagają ograniczenia dalszej pracy, aby nie pogorszyć uszkodzenia.'},
        {q:'Gdzie zapisywać odzyskane pliki?',options:['Na tym samym źródłowym dysku','Na oddzielnym, sprawnym nośniku docelowym','W losowych sektorach źródła'],correct:1,explain:'Źródło należy zachować bez dodatkowych zapisów.'}
      ]),
    make('PRACTICE145-005','Windows i testy końcowe','Średni',35,
      'Odbiór po naprawie — test końcowy, raport i ślad wykonanych czynności',
      'Zamykaj naprawę na podstawie powtarzalnych testów, a nie samego uruchomienia systemu.',
      'Urządzenie uruchamia się po naprawie, ale nie wykonano jeszcze kontroli wszystkich funkcji i stabilności.',
      'Pojedynczy udany start nie potwierdza sprawności. Należy zweryfikować obszar naprawy, funkcje zależne, logi, temperatury oraz warunki użytkowe.',
      'Wykonaj kontrolę wizualną, test objawu pierwotnego, test funkcji powiązanych i krótki test stabilności zgodny z zakresem naprawy.',
      'Zamknij raport dopiero po udokumentowaniu wyników, wersji oprogramowania, części i ograniczeń testu. Użytkownik powinien znać także elementy nieobjęte naprawą.',
      'Nie deklaruj pełnej sprawności, jeśli test był częściowy. Nie uruchamiaj długich obciążeń bez potwierdzonego chłodzenia i stabilnego zasilania.',
      ['Karta odbioru i numer sprawy','Narzędzia monitorowania i testów odpowiednie do urządzenia','Dokumentacja modelu i wykonanej naprawy','Nośnik na raport i załączniki'],
      'Porównaj objaw pierwotny, zakres naprawy i kryteria odbioru ustalone przed rozpoczęciem pracy.',
      ['Sprawdź, czy wszystkie złącza, śruby, osłony i przewody zostały prawidłowo zamontowane.','Uruchom urządzenie i sprawdź podstawowe funkcje oraz rozpoznanie podzespołów.','Powtórz test, który przed naprawą odtwarzał usterkę.','Sprawdź funkcje powiązane z naprawianym obszarem: ładowanie, obraz, dźwięk, sieć lub pamięć.','Zapisz temperatury, logi i wyniki testów adekwatnych do zakresu naprawy.','Zapisz część/wersję, wykonane czynności i elementy nieobjęte testem.','Przekaż raport z wynikiem oraz zaleceniami dalszej obserwacji.'],
      'CEL LEKCJI\nZamknąć naprawę na podstawie dowodów i jasno opisać ograniczenia.\n\nODBIÓR\nTest końcowy musi odtwarzać warunki, które wcześniej wywoływały usterkę, i obejmować funkcje powiązane z naprawą.\n\nDOKUMENTACJA\nRaport powinien oddzielać czynności wykonane, pomiary, wynik i zakres, którego nie badano.\n\nKRYTERIUM\nNie używaj określenia „100% sprawny”, jeśli nie ma potwierdzenia wszystkich istotnych funkcji.',
      'Wymieniono gniazdo zasilania laptopa. Urządzenie startuje, ale nie sprawdzono ładowania baterii, obciążenia ani stanu portów.',
      'Ułóż plan testu odbiorczego proporcjonalny do zakresu naprawy.',
      ['Lista kontroli mechanicznej','Test pierwotnego objawu','Wyniki funkcji powiązanych','Raport i zakres nieobjęty testem'],
      'Naprawa zostaje zamknięta dopiero po powtórzeniu testu pierwotnego i jasnym opisaniu ograniczeń.',
      [
        {q:'Czy pojedynczy udany start potwierdza zakończoną naprawę?',options:['Tak, zawsze','Nie — trzeba odtworzyć test pierwotnego objawu i sprawdzić funkcje powiązane','Tak, jeśli wentylator się obraca'],correct:1,explain:'Test odbiorczy powinien sprawdzić problem, który był przyczyną wizyty.'},
        {q:'Co powinien zawierać raport?',options:['Tylko informację „naprawiono”','Zakres, czynności, części, wyniki i ograniczenia testu','Wyłącznie cenę części'],correct:1,explain:'Raport ma pozwalać odtworzyć, co zrobiono i co faktycznie sprawdzono.'},
        {q:'Jak opisać funkcję, której nie testowano?',options:['Jako sprawną','Jako nieobjętą zakresem weryfikacji','Pominąć ją bez informacji'],correct:1,explain:'Uczciwy raport jasno oddziela testy wykonane od niewykonanych.'}
      ])
  ];
  let added = 0;
  for (const lesson of lessons) {
    if (existing.has(lesson.id)) continue;
    data.courseLessons.push(lesson); existing.add(lesson.id); added++;
  }
  window.ACADEMY_PRACTICE_FIX145 = Object.freeze({hotfix:'FIX145', added, total:data.courseLessons.length, lessonIds:lessons.map(x=>x.id)});
})();
