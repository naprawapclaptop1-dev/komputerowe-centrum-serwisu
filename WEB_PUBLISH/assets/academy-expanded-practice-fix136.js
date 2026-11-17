/* NAUKA OD A DO Z 6.8.0 — FIX136
 * Additive workshop cases. Does not rewrite or remove any existing lesson.
 */
(() => {
  'use strict';
  const data = window.ACADEMY_DATA;
  if (!data || !Array.isArray(data.courseLessons)) return;
  const existing = new Set(data.courseLessons.map(item => item.id));
  const lessons = [
    {
      id:'PRACTICE136-001', category:'Płyty główne i POST', level:'Średni → zaawansowany', minutes:35,
      title:'Odczyt kodów POST, Q-LED i sygnałów startowych',
      description:'Praktyczna interpretacja kodów POST i diod diagnostycznych bez wymieniania części na ślepo.',
      symptoms:'Komputer uruchamia wentylatory, ale nie wyświetla obrazu; płyta zatrzymuje się na kodzie POST albo świeci określona dioda diagnostyczna.',
      diagnosis:'Kod jest wskazówką dotyczącą etapu inicjalizacji, a nie automatycznym wskazaniem uszkodzonego podzespołu. Znaczenie kodu zależy od producenta i modelu płyty.',
      repair:'Porównaj kod z instrukcją dokładnej płyty, sprawdź minimalną konfigurację i wykonaj jeden test rozdzielający naraz.',
      verify:'Po usunięciu przyczyny wykonaj kilka zimnych startów i potwierdź przejście POST, obraz oraz wykrycie podzespołów.',
      warning:'Nie wyjmuj ani nie przekładaj podzespołów przy podłączonym zasilaniu. Nie interpretuj kodu według tabeli od innego modelu płyty.',
      tools:['Instrukcja płyty i tabela kodów POST/Q-LED','Głośnik systemowy lub wyświetlacz kodów, jeśli płyta je obsługuje','Sprawny monitor i przewód','Zestaw znanych sprawnych części o potwierdzonej zgodności'],
      step:'Zapisz dokładny kod, kolor diody i moment zatrzymania rozruchu; sprawdź instrukcję producenta.',
      steps:[
        'Zapisz model płyty, rewizję PCB, wersję BIOS i konfigurację komputera.',
        'Nagraj pełną sekwencję uruchamiania: diody, kody, sygnały dźwiękowe i moment zatrzymania.',
        'Sprawdź w instrukcji producenta znaczenie kodu dla dokładnego modelu.',
        'Odłącz zasilanie i przygotuj minimalną konfigurację zalecaną przez producenta.',
        'Testuj pojedynczo: pamięć w zalecanym slocie, grafikę, przewód i monitor.',
        'Po każdej zmianie wykonaj ten sam start i zapisz, czy kod POST się zmienił.',
        'W raporcie oddziel kod obserwowany od potwierdzonej przyczyny usterki.'
      ],
      body:'CEL LEKCJI\nUmiejętność odczytania etapu POST i zaplanowania testu, który potwierdza albo odrzuca hipotezę.\n\nNAJWAŻNIEJSZE POJĘCIA\nPOST to procedura inicjalizacji sprzętu przed przekazaniem sterowania do systemu. Kody i diody diagnostyczne są zależne od producenta. Ten sam symbol może mieć inne znaczenie w różnych rodzinach płyt.\n\nPRAKTYKA\nNie zaczynaj od wymiany procesora lub płyty. Zapisz stan wyjściowy, sprawdź tabelę kodów dla konkretnego modelu i zmieniaj tylko jeden element konfiguracji. Minimalna konfiguracja ma być zgodna z instrukcją płyty i obsługą zintegrowanej grafiki, jeżeli jest dostępna.\n\nWYNIK\nPoprawny raport zawiera model/revizję, wersję firmware, kod, konfigurację testową, wykonane próby i wynik każdego startu.',
      exercise:{scenario:'Zestaw testowy uruchamia wentylatory, nie pokazuje obrazu, a dioda DRAM świeci stale. Moduły RAM pochodzą z innego komputera.',task:'Opracuj plan bezpiecznego testu bez założenia, że pamięć jest uszkodzona.',deliverable:['Model i rewizja płyty oraz właściwa tabela kodów','Lista zgodnych modułów i zalecanego slotu','Wyniki pojedynczych prób i końcowa hipoteza'],acceptance:'Wniosek wynika z instrukcji płyty i powtarzalnego testu, a nie tylko z nazwy diody.'},
      quiz:[
        {q:'Co oznacza świecąca dioda DRAM?',options:['Zawsze uszkodzony procesor','Etap lub obszar inicjalizacji pamięci wymagający dalszej diagnozy','Zawsze uszkodzony zasilacz'],correct:1,explain:'Dioda wskazuje obszar diagnostyki; trzeba sprawdzić znaczenie dla konkretnej płyty i wykonać testy.'},
        {q:'Gdzie sprawdzić znaczenie kodu POST?',options:['W instrukcji dokładnego modelu i rewizji','W dowolnej tabeli w Internecie','Na podstawie koloru obudowy'],correct:0,explain:'Kody i ich opis mogą różnić się między producentami i generacjami.'},
        {q:'Jak porównywać konfiguracje?',options:['Zmienić RAM, GPU i BIOS jednocześnie','Zmieniać jeden czynnik i powtarzać ten sam test','Wymienić płytę bez testów'],correct:1,explain:'Jedna zmienna na próbę pozwala przypisać zmianę wyniku do konkretnego czynnika.'}
      ]
    },
    {
      id:'PRACTICE136-002', category:'Pamięć RAM', level:'Średni', minutes:30,
      title:'DDR5 Memory Training — długi pierwszy start i pętla rozruchu',
      description:'Rozróżnianie normalnego treningu pamięci DDR5 od niezgodności modułów i niestabilnych ustawień.',
      symptoms:'Po zmianie pamięci komputer długo nie pokazuje obrazu, kilkukrotnie restartuje się albo po włączeniu profilu pamięci nie przechodzi POST.',
      diagnosis:'Platformy DDR5 mogą wykonywać trening pamięci po zmianie konfiguracji. Czas i zachowanie zależą od CPU, płyty, BIOS-u, pojemności i obsadzenia slotów.',
      repair:'Wróć do ustawień bazowych, użyj slotów wskazanych w instrukcji i testuj moduły oddzielnie. Profil EXPO/XMP oceniaj dopiero po potwierdzeniu stabilności konfiguracji domyślnej.',
      verify:'Wykonaj kilka zimnych startów, test pamięci i kontrolę logów. Zapisz częstotliwość, timingi, napięcia raportowane przez platformę oraz wersję BIOS.',
      warning:'Nie wymuszaj wielokrotnych odcięć zasilania podczas aktualizacji BIOS. Nie ustawiaj napięć pamięci na podstawie cudzej konfiguracji.',
      tools:['Instrukcja płyty z mapą slotów RAM','Lista QVL i dokumentacja modułu','Narzędzie diagnostyczne pamięci','Notatnik konfiguracji BIOS'],
      step:'Zapisz liczbę modułów, pojemność, sloty, profil pamięci i wersję BIOS przed zmianą ustawień.',
      steps:['Zapisz model CPU, płyty, BIOS oraz oznaczenia wszystkich modułów.','Sprawdź zalecaną kolejność obsadzania slotów w instrukcji płyty.','Wyłącz komputer i odłącz zasilanie przed zmianą położenia modułów.','Uruchom konfigurację bazową bez ręcznego OC i zanotuj czas oraz przebieg pierwszego startu.','Jeżeli POST nie przechodzi, przetestuj pojedynczy moduł w zalecanym slocie, zgodnie z instrukcją.','Po przejściu testu bazowego włączaj profil pamięci jako osobny etap i kontroluj stabilność.','Zapisz wynik testu pamięci i zachowanie po zimnym starcie.'],
      body:'CEL LEKCJI\nRozpoznaj, kiedy długi start może wynikać z treningu pamięci, a kiedy wskazuje na problem konfiguracji.\n\nDIAGNOZA\nNie ma jednego uniwersalnego czasu treningu dla wszystkich platform. Aktualizacja BIOS, zmiana pojemności, liczby modułów i parametrów może uruchomić ponowną inicjalizację. Zawsze korzystaj z dokumentacji danej płyty.\n\nPRAKTYKA\nZbuduj tabelę prób: konfiguracja, slot, profil, wersja BIOS, czas do POST, rezultat testu pamięci. Nie zmieniaj jednocześnie częstotliwości, timingu i napięcia.\n\nKRYTERIUM\nKonfiguracja jest zaakceptowana dopiero po powtarzalnych zimnych startach i teście pamięci bez błędów w zdefiniowanych warunkach.',
      exercise:{scenario:'Po włączeniu EXPO system uruchamia się tylko czasami. Przy ustawieniach domyślnych uruchamia się poprawnie.',task:'Przygotuj serię prób, która oddzieli trening pamięci od niestabilnego profilu.',deliverable:['Tabela konfiguracji i wyników','Wynik testu modułów w ustawieniach domyślnych','Osobny wynik dla profilu EXPO lub XMP'],acceptance:'Raport jasno wskazuje, która konfiguracja jest stabilna; nie wymusza niepotwierdzonych napięć.'},
      quiz:[
        {q:'Dlaczego po zmianie DDR5 pierwszy start może być dłuższy?',options:['Platforma może ponownie trenować pamięć','Każdy dysk NVMe musi zostać sformatowany','To zawsze oznacza uszkodzenie CPU'],correct:0,explain:'Trening pamięci może wystąpić po zmianie konfiguracji lub parametrów.'},
        {q:'Od czego zacząć diagnozę niestabilnego profilu?',options:['Od ręcznego podniesienia wszystkich napięć','Od stabilnych ustawień bazowych i testu modułów','Od wymiany płyty'],correct:1,explain:'Najpierw potwierdź działanie podstawowej konfiguracji.'},
        {q:'Jak wykonać porównanie?',options:['Zmieniać wiele parametrów jednocześnie','Zapisywać i zmieniać jeden parametr na próbę','Pominąć test zimnego startu'],correct:1,explain:'Kontrolowana próba pozwala ustalić wpływ konkretnej zmiany.'}
      ]
    },
    {
      id:'PRACTICE136-003', category:'Windows i sterowniki', level:'Podstawowy → średni', minutes:25,
      title:'Identyfikacja nieznanego urządzenia po Hardware ID',
      description:'Ustalanie producenta i modelu urządzenia oraz bezpieczne dobranie właściwego sterownika.',
      symptoms:'W Menedżerze urządzeń widnieje Nieznane urządzenie, żółty wykrzyknik lub brak funkcji sieci, dźwięku czy kontrolera.',
      diagnosis:'Identyfikatory sprzętowe PCI, USB i ACPI zawężają wyszukiwanie do producenta i układu, ale mogą wymagać dopasowania do platformy oraz rewizji.',
      repair:'Pobierz sterownik z oficjalnej strony producenta komputera lub układu, po potwierdzeniu identyfikatora i wersji systemu.',
      verify:'Po instalacji sprawdź brak błędu urządzenia, wersję sterownika, działanie funkcji i zachowanie po restarcie.',
      warning:'Nie instaluj pakietów sterowników z nieznanych agregatorów i nie wyłączaj podpisywania sterowników jako domyślnej metody naprawy.',
      tools:['Menedżer urządzeń Windows','PowerShell lub właściwości urządzenia','Oficjalna strona producenta komputera/płyty/układu','Punkt przywracania lub kopia ustawień, gdy to właściwe'],
      step:'Otwórz właściwości urządzenia i skopiuj identyfikator sprzętowy bez publikowania numerów seryjnych.',
      steps:['Otwórz Menedżer urządzeń i odszukaj urządzenie z błędem.','Wejdź w Szczegóły i wybierz Identyfikatory sprzętu.','Zapisz wartości VEN/DEV dla PCI albo VID/PID dla USB oraz identyfikator ACPI, jeżeli występuje.','Porównaj identyfikator z dokumentacją producenta komputera i podzespołu.','Sprawdź zgodność pakietu z modelem, systemem, architekturą i wersją urządzenia.','Utwórz punkt przywracania, jeżeli instalacja może zmienić istotną konfigurację.','Zainstaluj jeden właściwy pakiet i sprawdź status oraz wersję sterownika.'],
      body:'CEL LEKCJI\nNieznane urządzenie nie musi być uszkodzone. Celem jest identyfikacja układu i bezpieczny wybór sterownika.\n\nJAK CZYTAĆ ID\nIdentyfikatory PCI/USB wskazują dostawcę i urządzenie. W laptopach identyfikator ACPI może należeć do kontrolera platformy. Sama nazwa z wyszukiwarki nie jest wystarczającym potwierdzeniem zgodności.\n\nPRAKTYKA\nUtwórz kartę: ID sprzętu, model komputera, wersja Windows, źródło pakietu, wersja sterownika i wynik po restarcie. Nie instaluj kilku paczek „na próbę”.',
      exercise:{scenario:'Po czystej instalacji Windows brakuje sterownika urządzenia PCI i nie działa część funkcji laptopa.',task:'Zidentyfikuj urządzenie z Hardware ID i opracuj ścieżkę do oficjalnego pakietu.',deliverable:['Zanonimizowany identyfikator sprzętu','Model i wersja systemu','Link do oficjalnej strony wsparcia i wersja pakietu'],acceptance:'Źródło sterownika jest oficjalne, a urządzenie po restarcie nie zgłasza błędu.'},
      quiz:[
        {q:'Gdzie można odczytać identyfikator sprzętowy?',options:['W Menedżerze urządzeń, we właściwościach urządzenia','W nazwie tapety Windows','Wyłącznie w BIOS-ie'],correct:0,explain:'W zakładce Szczegóły można wybrać Identyfikatory sprzętu.'},
        {q:'Co trzeba sprawdzić przed instalacją?',options:['Wyłącznie datę publikacji','Model, system, architekturę i zgodność pakietu','Kolor ikony instalatora'],correct:1,explain:'Sterownik musi pasować do platformy i systemu.'},
        {q:'Jaki jest najbezpieczniejszy kanał pobrania?',options:['Nieznany agregator','Oficjalna strona producenta komputera lub układu','Losowy link z reklamy'],correct:1,explain:'Oficjalny kanał ogranicza ryzyko błędnego lub zmodyfikowanego pakietu.'}
      ]
    },
    {
      id:'PRACTICE136-004', category:'Diagnostyka sprzętowa', level:'Średni', minutes:40,
      title:'Losowe restarty komputera — plan izolacji przyczyny',
      description:'Rozdzielanie problemów termicznych, zasilania, pamięci, sterowników i błędów systemowych.',
      symptoms:'Komputer restartuje się bez stałego wzorca: podczas gry, bezczynności albo po wybudzeniu.',
      diagnosis:'Restart może być skutkiem utraty zasilania, przegrzewania, błędu sprzętowego, pamięci, sterownika lub awarii systemu. Sam brak niebieskiego ekranu nie wskazuje jednej przyczyny.',
      repair:'Zawęź problem poprzez zapis logów i testów bazowych, a następnie wykonuj pojedyncze próby izolacyjne.',
      verify:'Po naprawie powtórz warunki wywołujące usterkę i sprawdź logi, temperatury oraz stabilność.',
      warning:'Nie uruchamiaj długiego testu obciążeniowego, jeśli chłodzenie lub zasilanie jest niepewne. Przerwij przy zapachu, dymie, nadmiernym nagrzewaniu albo iskrzeniu.',
      tools:['Podgląd zdarzeń i Monitor niezawodności','Narzędzie monitoringu temperatur i taktowań','Test pamięci i test dysku odpowiedni dla producenta','Sprawny przewód/zasilacz o potwierdzonej zgodności'],
      step:'Zapisz datę, obciążenie, temperaturę, kod błędu i ostatnią zmianę konfiguracji przed restartem.',
      steps:['Ustal, czy komputer wyłącza się całkowicie, restartuje czy pokazuje BSOD.','Zapisz ostatnie zdarzenia krytyczne i błędy z czasu awarii.','Sprawdź temperatury w spoczynku i przy umiarkowanym obciążeniu.','Przywróć ustawienia domyślne CPU/GPU/RAM, zapisując wcześniejszą konfigurację.','Wykonaj odpowiedni test pamięci i odczyt SMART bez zbędnego obciążania niestabilnego nośnika.','Sprawdź przewody, zasilacz i połączenia bez otwierania zasilacza sieciowego.','Zmieniaj tylko jeden czynnik, a potem powtórz ten sam scenariusz.'],
      body:'CEL LEKCJI\nOpracuj logiczną ścieżkę diagnostyczną dla awarii, która występuje nieregularnie.\n\nINTERPRETACJA\nKernel-Power 41 informuje o nieoczekiwanym zamknięciu, ale nie podaje samodzielnie przyczyny. WHEA, BugCheck, logi sterownika i monitoring mogą dostarczyć dodatkowych wskazówek.\n\nPRAKTYKA\nPrzeprowadź testy od najmniej ryzykownych. Nie łącz jednocześnie aktualizacji BIOS, zmian RAM i sterownika GPU, ponieważ utracisz możliwość oceny przyczyny.\n\nRAPORT\nZapisz konfigurację, dokładny scenariusz, czas do restartu, temperatury, kody oraz efekt każdej pojedynczej zmiany.',
      exercise:{scenario:'PC restartuje się po 10–20 minutach gry, lecz działa kilka godzin na pulpicie. W logach jest Kernel-Power 41.',task:'Zaproponuj test, który oddzieli problem termiczny/GPU od zasilania i sterownika.',deliverable:['Logi z czasu awarii','Monitoring temperatur i taktowań','Plan dwóch niezależnych prób i wnioski'],acceptance:'Kernel-Power nie jest uznany za diagnozę; przyczyna jest poparta niezależnymi wynikami.'},
      quiz:[
        {q:'Co oznacza Kernel-Power 41?',options:['Pewne uszkodzenie zasilacza','Nieoczekiwane zamknięcie/restart, bez samodzielnego wskazania przyczyny','Pewne uszkodzenie RAM'],correct:1,explain:'Zdarzenie opisuje nieprawidłowe zakończenie pracy; wymaga korelacji z innymi danymi.'},
        {q:'Jak zmieniać konfigurację testową?',options:['Jeden czynnik na próbę','Wszystko jednocześnie','Bez zapisu stanu początkowego'],correct:0,explain:'Pojedyncza zmiana ułatwia ustalenie, co wpłynęło na wynik.'},
        {q:'Kiedy przerwać test obciążeniowy?',options:['Przy dymie, nietypowym zapachu lub niekontrolowanym wzroście temperatury','Dopiero po 24 godzinach','Nigdy'],correct:0,explain:'Bezpieczeństwo ma pierwszeństwo przed dokończeniem testu.'}
      ]
    },
    {
      id:'PRACTICE136-005', category:'Chłodzenie i termika', level:'Średni → zaawansowany', minutes:35,
      title:'Kontrola docisku radiatora i śladów kontaktu termicznego',
      description:'Odczyt wzoru kontaktu radiatora, pasta kontra termopad i weryfikacja montażu chłodzenia.',
      symptoms:'Po czyszczeniu lub wymianie materiałów termicznych temperatury są wyższe, a radiator nie odbiera ciepła równomiernie.',
      diagnosis:'Problem może wynikać z nierównego docisku, niewłaściwej grubości termopadu, złego ułożenia folii ochronnej albo pominiętego elementu chłodzonego.',
      repair:'Ustal materiał i grubość na podstawie dokumentacji modelu. Sprawdź kolejność śrub i procedurę dokręcania producenta.',
      verify:'Po złożeniu monitoruj temperatury, taktowania i zachowanie wentylatorów w porównywalnych warunkach.',
      warning:'Nie zastępuj termopadów przypadkową grubością. Zbyt gruby materiał może unieść radiator i pogorszyć kontakt z CPU/GPU. Nie pracuj przy podłączonym zasilaniu.',
      tools:['Instrukcja serwisowa dokładnego modelu','Odpowiedni materiał termiczny i narzędzia','Lupa lub mikroskop do oceny śladów kontaktu','Monitoring temperatur i taktowania'],
      step:'Przed demontażem zrób zdjęcia rozmieszczenia materiałów i zapisz model oraz rewizję urządzenia.',
      steps:['Zidentyfikuj dokładny model i znajdź dokumentację chłodzenia.','Zapisz temperatury i taktowania przed ingerencją w porównywalnych warunkach.','Odłącz zasilanie i postępuj według procedury odłączenia baterii.','Zdemontuj radiator zgodnie z kolejnością śrub i oceń ślady kontaktu.','Porównaj miejsca termopadów, grubości oraz materiałów z instrukcją lub oznaczeniem OEM.','Oczyść powierzchnie metodą odpowiednią dla urządzenia i nałóż właściwy materiał.','Dokręć radiator zgodnie z kolejnością producenta i wykonaj test porównawczy.'],
      body:'CEL LEKCJI\nNaucz się oceniać kontakt termiczny na podstawie dokumentacji i śladów montażu.\n\nPASTA I TERMOPAD\nPasta termiczna wypełnia mikronierówności na stykających się powierzchniach. Termopad może wypełniać większą szczelinę i chłodzić pamięci lub sekcję zasilania. Nie są to materiały zamienne w dowolnej sytuacji.\n\nPRAKTYKA\nPrzed wymianą zapisz położenie i grubość materiału. Jeżeli brak danych OEM, nie zgaduj. Po złożeniu porównaj temperatury, taktowania i objaw w identycznym scenariuszu.',
      exercise:{scenario:'Po wymianie termopadów GPU ma wyższą temperaturę rdzenia, a ślad pasty pokazuje słaby kontakt.',task:'Ustal, jakie dane trzeba pozyskać przed ponownym montażem i jak zweryfikować docisk.',deliverable:['Mapa elementów chłodzonych','Dane materiału i grubości potwierdzone dokumentacją','Temperatury przed/po w porównywalnym teście'],acceptance:'Nie stosujesz uniwersalnej grubości; wynik po montażu potwierdza równomierny kontakt i bezpieczne temperatury.'},
      quiz:[
        {q:'Czy można dobrać grubość termopadu tylko „na oko”?',options:['Tak, każdy termopad jest taki sam','Nie, trzeba potwierdzić wymagania modelu i geometrię','Tak, jeśli jest miękki'],correct:1,explain:'Nieprawidłowa grubość może pogorszyć kontakt radiatora z innymi elementami.'},
        {q:'Co warto zrobić przed demontażem?',options:['Zrobić zdjęcia ułożenia materiałów i sprawdzić instrukcję','Wyrzucić wszystkie podkładki','Odłączyć wentylator przy włączonym komputerze'],correct:0,explain:'Dokumentacja pomaga odtworzyć prawidłowy montaż.'},
        {q:'Jak potwierdzić efekt?',options:['Porównać temperatury i taktowania w tych samych warunkach','Ocenić wyłącznie dotykiem','Uznać naprawę po samym starcie'],correct:0,explain:'Test porównawczy powinien odtwarzać scenariusz bazowy.'}
      ]
    },
    {
      id:'PRACTICE136-006', category:'GPU i diagnostyka obrazu', level:'Zaawansowany', minutes:35,
      title:'GPU Hot Spot i różnica temperatur rdzenia',
      description:'Interpretacja temperatury krawędzi, hotspotu, obciążenia i zachowania chłodzenia karty graficznej.',
      symptoms:'Temperatura GPU wydaje się akceptowalna, lecz hotspot jest znacznie wyższy, pojawia się throttling lub wentylatory gwałtownie przyspieszają.',
      diagnosis:'Odczyty zależą od czujników, modelu i narzędzia. Różnica temperatur może być związana z dociskiem, materiałem termicznym, przepływem powietrza lub charakterem obciążenia.',
      repair:'Porównaj odczyty w tym samym teście, sprawdź chłodzenie i dokumentację producenta. Nie przyjmuj jednej uniwersalnej granicy dla każdej karty.',
      verify:'Zapisz model GPU, wersję sterownika, obciążenie, temperatury, taktowania i zachowanie po naprawie.',
      warning:'Przerwij test przy artefaktach, wyłączaniu, zapachu lub niekontrolowanym wzroście temperatury. Nie rozbieraj karty bez odpowiedniej procedury.',
      tools:['Narzędzie monitorowania czujników GPU','Kontrolowany test obciążeniowy','Dane producenta karty i układu','Raport temperatur/taktowań'],
      step:'Ustal dokładny model karty i które czujniki są rzeczywiście raportowane przez jej firmware.',
      steps:['Zapisz model i rewizję karty oraz wersję sterownika.','Sprawdź temperaturę w spoczynku i w lekkim obciążeniu.','Wykonaj krótki test o stałym profilu, zapisując rdzeń, hotspot, pamięć i taktowanie, jeśli czujniki są dostępne.','Porównaj wyniki z zaleceniami producenta dla danego modelu.','Sprawdź przepływ powietrza, krzywą wentylatorów i widoczne przeszkody.','Jeżeli konieczna jest ingerencja mechaniczna, sprawdź dokumentację i procedurę termiczną.','Powtórz identyczny test i porównaj wyniki.'],
      body:'CEL LEKCJI\nRozumiej różnicę pomiędzy odczytem temperatury GPU a hotspotem i nie oceniaj karty wyłącznie po jednym wskaźniku.\n\nZASADA POMIARU\nNazwy i dostępność czujników różnią się między kartami. Tego samego rodzaju obciążenie i ta sama wersja narzędzia są potrzebne do porównania.\n\nPRAKTYKA\nZbuduj wykres temperatury, taktowania i obciążenia. Zaznacz moment wystąpienia throttlingu lub artefaktów. Oddziel obserwację od wniosku o uszkodzeniu układu.',
      exercise:{scenario:'Karta nie zgłasza błędu sterownika, ale podczas gry obniża taktowanie, a hotspot szybko rośnie.',task:'Przygotuj raport z korelacją temperatur, obciążenia i taktowania.',deliverable:['Model GPU i dostępne czujniki','Wykres lub tabela z testu o stałym profilu','Wniosek i plan dalszej kontroli chłodzenia'],acceptance:'Wynik został porównany z danymi producenta i nie opiera się na uniwersalnej liczbie dla wszystkich GPU.'},
      quiz:[
        {q:'Czy każda karta raportuje identyczny zestaw czujników?',options:['Tak','Nie, zależy to od modelu i firmware','Tylko karty mobilne'],correct:1,explain:'Dostępność odczytów zależy od konkretnej karty i jej kontrolerów.'},
        {q:'Co jest ważne przy porównaniu przed/po?',options:['Ten sam profil testu i warunki','Dwa różne programy i ustawienia','Tylko temperatura w spoczynku'],correct:0,explain:'Porównywalność warunków jest konieczna do oceny zmiany.'},
        {q:'Co może wywołać throttling?',options:['Temperatura, limity mocy lub inne ograniczenia platformy','Zawsze wyłącznie uszkodzona pamięć VRAM','Wyłącznie kabel monitora'],correct:0,explain:'Interpretuj razem temperatury, zegary, limity i obciążenie.'}
      ]
    },
    {
      id:'PRACTICE136-007', category:'Monitory i obraz', level:'Średni', minutes:30,
      title:'EDID monitora, odświeżanie i brak właściwej rozdzielczości',
      description:'Diagnoza błędnego wykrywania monitora, trybów obrazu i ograniczeń przewodu lub adaptera.',
      symptoms:'Monitor wykrywa się jako ogólny, brakuje natywnej rozdzielczości lub częstotliwości odświeżania, a obraz zanika po zmianie trybu.',
      diagnosis:'EDID przekazuje ekranowi systemu informacje o obsługiwanych trybach. Odczyt może być zakłócony przez przewód, adapter, stację dokującą, KVM lub sterownik.',
      repair:'Sprawdź tor połączenia od monitora do GPU, użyj przewodu o potwierdzonych parametrach i porównaj bezpośrednie podłączenie z konfiguracją pośrednią.',
      verify:'Potwierdź natywną rozdzielczość, stabilny tryb odświeżania, brak migotania i poprawne wykrywanie po ponownym uruchomieniu.',
      warning:'Nie wymuszaj trybu przekraczającego specyfikację monitora lub przewodu. Zmiany EDID i firmware wykonuj tylko na podstawie wiarygodnej dokumentacji.',
      tools:['Menu OSD monitora i instrukcja','Ustawienia ekranu Windows','Inny zgodny przewód i port','Dokumentacja stacji dokującej/adaptera'],
      step:'Zapisz dokładny model monitora, GPU, port, przewód, adapter i aktualny tryb obrazu.',
      steps:['Odczytaj model monitora z OSD i sprawdź jego specyfikację.','Podłącz monitor bezpośrednio do GPU sprawnym przewodem.','Sprawdź rozdzielczość i częstotliwość w ustawieniach Windows.','Porównaj zachowanie na innym porcie i przewodzie o odpowiedniej przepustowości.','Usuń pośredni KVM/dock z toru tylko na czas kontrolowanej próby.','Zaktualizuj sterownik wyłącznie z oficjalnego źródła, jeśli wyniki wskazują na problem programowy.','Wykonaj restart i sprawdź, czy tryb zostaje wykryty prawidłowo.'],
      body:'CEL LEKCJI\nUstal, czy problem z trybem obrazu powstaje w monitorze, przewodzie, adapterze, doku, GPU czy sterowniku.\n\nEDID\nTo zestaw danych identyfikacyjnych i informacji o możliwościach ekranu. Uszkodzony lub ograniczony tor komunikacji może powodować wykrycie monitora jako ogólnego albo utratę części trybów.\n\nPRAKTYKA\nPorównaj konfigurację bezpośrednią i pośrednią. Zapisz pełny łańcuch urządzeń oraz wszystkie tryby, które działają stabilnie.',
      exercise:{scenario:'Monitor 144 Hz po podłączeniu przez stację dokującą oferuje tylko 60 Hz. Bez doku dostępny jest pełny tryb.',task:'Wskaż, jakie parametry stacji, przewodu i portu należy sprawdzić.',deliverable:['Schemat toru sygnału','Specyfikacja portów i przepustowości','Wynik porównania bezpośrednio i przez dock'],acceptance:'Wniosek wskazuje ograniczenie konkretnego elementu toru lub potwierdza poprawny EDID.'},
      quiz:[
        {q:'Jaką rolę pełni EDID?',options:['Przekazuje informacje o monitorze i obsługiwanych trybach','Steruje prędkością wentylatora GPU','Przechowuje hasło Windows'],correct:0,explain:'EDID wspiera identyfikację ekranu i dostępnych trybów obrazu.'},
        {q:'Co jest dobrą próbą rozdzielającą problem doku?',options:['Podłączenie monitora bezpośrednio do GPU','Zmiana kilku ustawień naraz','Wymiana monitora bez sprawdzenia przewodu'],correct:0,explain:'Porównanie bezpośrednie i przez stację izoluje element pośredni.'},
        {q:'Czy można wymusić dowolne odświeżanie?',options:['Tak, bez ograniczeń','Nie, trzeba respektować specyfikację całego toru','Tak, jeśli monitor jest duży'],correct:1,explain:'Ograniczenia dotyczą monitora, przewodu, portu, adaptera i GPU.'}
      ]
    },
    {
      id:'PRACTICE136-008', category:'USB-C i peryferia', level:'Średni → zaawansowany', minutes:35,
      title:'USB-C ładuje laptop, ale nie przesyła obrazu',
      description:'Weryfikacja DisplayPort Alt Mode, możliwości portu, przewodu i stacji dokującej.',
      symptoms:'Laptop ładuje się przez USB-C, ale monitor nie pokazuje obrazu albo działa tylko po podłączeniu do innego portu.',
      diagnosis:'Kształt USB-C nie gwarantuje obsługi DisplayPort Alt Mode, Thunderbolt ani każdej funkcji danych. Port, przewód i dock muszą wspierać wymagany tryb.',
      repair:'Zweryfikuj specyfikację konkretnego portu i przewodu, a następnie testuj bezpośrednie połączenie oraz stację dokującą oddzielnie.',
      verify:'Potwierdź obraz, rozdzielczość, odświeżanie, ładowanie i pozostałe funkcje portu niezależnie.',
      warning:'Nie zakładaj, że wszystkie porty USB-C w jednym laptopie mają identyczne funkcje. Nie wciskaj uszkodzonej wtyczki.',
      tools:['Instrukcja laptopa z opisem każdego portu','Przewód USB-C/DP o potwierdzonej specyfikacji','Monitor z obsługiwanym wejściem','Dokumentacja stacji dokującej'],
      step:'Zidentyfikuj oznaczenie portu i jego funkcje w instrukcji producenta.',
      steps:['Zapisz model laptopa i numer portu, którego używasz.','Sprawdź w instrukcji, czy port obsługuje DisplayPort Alt Mode lub Thunderbolt.','Ustal, czy przewód obsługuje transmisję obrazu i wymagany tryb.','Wykonaj bezpośrednią próbę laptop–monitor bez docka.','Powtórz test z innym przewodem o potwierdzonej zgodności.','Dopiero potem sprawdź stację dokującą, jej zasilanie i firmware zgodny z modelem.','Zapisz osobno wynik obrazu, danych USB i zasilania.'],
      body:'CEL LEKCJI\nRozdziel funkcję zasilania od funkcji obrazu w USB-C.\n\nWAŻNE\nUSB-C określa złącze, nie pełny zestaw możliwości portu. Laptop może oferować ładowanie na jednym porcie, a obraz tylko na innym. Kabel może ładować, ale nie obsługiwać wymaganej prędkości lub trybu obrazu.\n\nPRAKTYKA\nZrób tabelę portów z instrukcji i sprawdź każdy tor osobno. Nie używaj samego kształtu wtyczki jako potwierdzenia funkcji.',
      exercise:{scenario:'Laptop ładuje się przez port po lewej stronie, ale ekran USB-C nie działa. Producent oznaczył tylko jeden port ikoną DisplayPort.',task:'Weryfikuj specyfikację portów i przewodu bez wymiany płyty głównej.',deliverable:['Tabela funkcji portów z instrukcji','Specyfikacja przewodu i monitora','Wynik bezpośredniego testu obrazu'],acceptance:'Wyjaśniasz różnicę między ładowaniem a transportem obrazu i wskazujesz zgodny port.'},
      quiz:[
        {q:'Czy każdy port USB-C obsługuje obraz?',options:['Tak','Nie, zależy od implementacji portu','Tylko porty po lewej stronie'],correct:1,explain:'Funkcje portów należy potwierdzić w dokumentacji modelu.'},
        {q:'Co sprawdzić, gdy laptop ładuje, ale nie ma obrazu?',options:['Port, obsługę Alt Mode, przewód i monitor','Wyłącznie baterię','Wyłącznie wersję Windows'],correct:0,explain:'Ładowanie i obraz to odrębne funkcje toru USB-C.'},
        {q:'Jak najlepiej izolować dock?',options:['Najpierw test bezpośredni laptop–monitor','Wymienić płytę','Aktualizować wszystkie sterowniki naraz'],correct:0,explain:'Bezpośrednie połączenie pozwala sprawdzić, czy ograniczenie wprowadza dock.'}
      ]
    },
    {
      id:'PRACTICE136-009', category:'USB i peryferia', level:'Średni', minutes:30,
      title:'USB over-current — lokalizacja przeciążonego portu',
      description:'Bezpieczne rozdzielenie uszkodzonego urządzenia, przewodu, portu i obwodu zasilania USB.',
      symptoms:'Pojawia się komunikat o przekroczeniu limitu zasilania USB, port przestaje działać albo komputer wyłącza kontroler.',
      diagnosis:'Przeciążenie może wynikać z uszkodzonego przewodu, urządzenia, złącza, zwarcia mechanicznego lub układu ochronnego płyty.',
      repair:'Odłącz urządzenia, sprawdź porty wzrokowo i testuj znanymi sprawnymi akcesoriami. Diagnostykę płyty wykonuje się według schematu i zasad BHP.',
      verify:'Po usunięciu przyczyny sprawdź wszystkie porty w kontrolowanej kolejności i potwierdź brak ponownego komunikatu.',
      warning:'Nie wkładaj metalowych przedmiotów do portu i nie resetuj zabezpieczenia przez wielokrotne wymuszanie zasilania. Nie mostkuj bezpieczników.',
      tools:['Latarka i lupa','Znany sprawny przewód oraz urządzenie USB','Dokumentacja płyty i portów','Multimetr tylko dla przeszkolonego technika i odpowiedniego punktu'],
      step:'Odłącz wszystkie urządzenia USB i obejrzyj porty pod kątem wygiętych styków lub obcych przedmiotów.',
      steps:['Odłącz wszystkie urządzenia i stacje dokujące.','Zapisz, kiedy komunikat się pojawia i czy dotyczy konkretnego portu.','Przy wyłączonym i odłączonym sprzęcie obejrzyj gniazda bez wkładania metalowych narzędzi.','Podłączaj pojedynczo znane sprawne urządzenia i przewody, obserwując komunikaty.','Porównaj porty na obudowie i porty bezpośrednio na płycie tylko zgodnie z instrukcją.','Jeśli błąd pozostaje bez podłączonych urządzeń, zaplanuj diagnostykę płyty przez wykwalifikowanego technika.','Po naprawie sprawdź porty i zapisz rezultat.'],
      body:'CEL LEKCJI\nOgranicz ryzyko uszkodzenia kontrolera USB i znajdź źródło przeciążenia.\n\nTOK POSTĘPOWANIA\nNie diagnozuj wyłącznie na podstawie komunikatu systemu. Najpierw usuń wszystkie peryferia, obejrzyj złącza i testuj pojedynczo. Jeżeli port wygląda na mechanicznie uszkodzony, nie używaj go do kolejnych prób.\n\nPRAKTYKA\nW raporcie przypisz komunikat do portu, urządzenia i przewodu. Zachowaj test bazowy i nie obchodź elementów zabezpieczających.',
      exercise:{scenario:'Komunikat pojawia się tylko po podłączeniu jednego przewodu USB, nawet bez urządzenia na jego drugim końcu.',task:'Zaprojektuj kontrolowany test, który nie naraża pozostałych portów.',deliverable:['Opis stanu przewodu i złącza','Wyniki testu znanym sprawnym przewodem i portem','Wniosek o przewodzie lub porcie'],acceptance:'Uszkodzony przewód zostaje wycofany, a zabezpieczenia płyty nie są obchodzone.'},
      quiz:[
        {q:'Co zrobić jako pierwszy krok przy komunikacie USB over-current?',options:['Odłączyć wszystkie urządzenia i doki','Zmostkować bezpiecznik','Podłączyć więcej urządzeń'],correct:0,explain:'Ograniczenie obciążenia i izolacja urządzeń to pierwszy bezpieczny etap.'},
        {q:'Czego nie wolno robić?',options:['Obejrzeć port pod światłem','Wkładać metalowe przedmioty i mostkować zabezpieczenia','Testować sprawny przewód'],correct:1,explain:'Takie działanie może pogłębić uszkodzenie i zagrozić użytkownikowi.'},
        {q:'Jak wykonać test akcesoriów?',options:['Podłączać pojedynczo znane sprawne elementy','Wszystkie naraz','Tylko podczas komunikatu przeciążenia'],correct:0,explain:'Jeden element na próbę ułatwia wskazanie źródła problemu.'}
      ]
    },
    {
      id:'PRACTICE136-010', category:'Sieci komputerowe', level:'Średni', minutes:35,
      title:'Wi-Fi — utrata pakietów i rozłączanie podczas roamingu',
      description:'Diagnoza niestabilnego Wi-Fi z uwzględnieniem sygnału, pasma, punktu dostępowego i sterownika.',
      symptoms:'Laptop traci połączenie podczas przemieszczania się, wideokonferencje zrywają się, a prędkość zmienia się bez oczywistej przyczyny.',
      diagnosis:'Przyczyną może być słaby sygnał, zakłócenia, przeciążenie kanału, roaming między AP, oszczędzanie energii, sterownik lub sam router.',
      repair:'Porównaj zachowanie w jednym miejscu i podczas roamingu, odczytaj parametry połączenia i testuj jedną zmianę konfiguracji naraz.',
      verify:'Wykonaj serię testów ping i transferu w tych samych lokalizacjach oraz porównaj utratę pakietów i stabilność.',
      warning:'Nie zmieniaj ustawień bezpieczeństwa na słabsze tylko po to, aby uzyskać połączenie. Nie publikuj haseł Wi-Fi ani adresów prywatnych klientów.',
      tools:['Windows: netsh wlan i ustawienia karty','Panel administracyjny routera/AP','Test ping do bramy i adresu zewnętrznego','Mapa lokalizacji i pasm'],
      step:'Ustal, czy problem dotyczy jednego urządzenia, jednego AP czy wszystkich użytkowników sieci.',
      steps:['Sprawdź, czy inne urządzenia tracą połączenie w tym samym miejscu i czasie.','Zapisz pasmo, SSID, BSSID, kanał i poziom sygnału w kilku lokalizacjach.','Wykonaj ping do bramy oraz niezależnego adresu IP i zapisz utratę pakietów.','Porównaj połączenie w pobliżu AP i w miejscu występowania problemu.','Sprawdź roaming, kanały, obciążenie AP i ustawienia zasilania karty.','Zaktualizuj sterownik z oficjalnego źródła tylko wtedy, gdy wyniki wskazują na warstwę sterownika.','Powtórz test w tych samych miejscach i godzinach.'],
      body:'CEL LEKCJI\nRozdziel problem radiowy, lokalny i po stronie dostawcy Internetu.\n\nPOMIARY\nPing do bramy pokazuje jakość połączenia lokalnego z routerem. Ping do adresu poza siecią dodaje zależność od WAN. Wynik zależy od serwera docelowego i nie jest samodzielnym pomiarem przepustowości.\n\nPRAKTYKA\nZapisz mapę lokalizacji, BSSID, kanał, pasmo i utratę pakietów. Porównaj urządzenie przy AP i w strefie roamingu.',
      exercise:{scenario:'Laptop traci połączenie przy przejściu między dwoma pokojami, ale telefon pozostaje online.',task:'Ustal, czy problem jest związany z kartą laptopa, roamingiem czy zasięgiem.',deliverable:['Odczyty sygnału/BSSID w obu pokojach','Wyniki ping do bramy i poza sieć','Porównanie z drugim urządzeniem'],acceptance:'Wniosek wynika z porównywalnych pomiarów i nie obniża poziomu bezpieczeństwa sieci.'},
      quiz:[
        {q:'Co pozwala sprawdzić ping do bramy?',options:['Połączenie lokalne urządzenia z routerem','Szybkość dysku SSD','Stan baterii laptopa'],correct:0,explain:'Brama jest pierwszym punktem sieciowym w lokalnej podsieci.'},
        {q:'Co warto zapisać podczas roamingu?',options:['BSSID, pasmo, kanał i poziom sygnału','Tylko tapetę systemu','Numer seryjny klienta w publicznym raporcie'],correct:0,explain:'Dane radiowe pomagają ocenić przełączanie między punktami dostępowymi.'},
        {q:'Czy należy obniżać zabezpieczenia Wi-Fi dla testu?',options:['Tak, zawsze','Nie, bezpieczeństwo ma pozostać zachowane','Tylko dla sieci firmowej'],correct:1,explain:'Diagnostyka nie powinna polegać na osłabianiu szyfrowania.'}
      ]
    },
    {
      id:'PRACTICE136-011', category:'Sieci i Windows', level:'Średni', minutes:30,
      title:'SMB — udział sieciowy: rozdzielenie DNS, logowania i uprawnień',
      description:'Ustalanie, czy problem z folderem sieciowym wynika z nazwy hosta, połączenia, poświadczeń czy ACL.',
      symptoms:'Udział sieciowy działa po adresie IP, ale nie po nazwie komputera; użytkownik widzi odmowę dostępu albo żądanie logowania.',
      diagnosis:'Dostęp do SMB zależy od rozwiązywania nazwy, łączności, usługi serwera, poświadczeń, uprawnień udziału oraz NTFS.',
      repair:'Testuj kolejno nazwę i adres, stan usługi, poświadczenia oraz uprawnienia. Nie włączaj niebezpiecznych protokołów tylko po to, by usunąć komunikat.',
      verify:'Potwierdź dostęp kontem o właściwym zakresie uprawnień, odczyt i zapis tylko tam, gdzie jest dozwolony.',
      warning:'Nie udostępniaj udziału Everyone z pełną kontrolą jako uniwersalnej naprawy. Nie włączaj SMB1 bez wyjątkowej, udokumentowanej potrzeby i oceny ryzyka.',
      tools:['Windows PowerShell: Resolve-DnsName/Test-NetConnection','Menedżer poświadczeń Windows','Ustawienia udziału i NTFS','Logi serwera plików'],
      step:'Zapisz ścieżkę UNC, nazwę serwera, konto testowe i oczekiwany poziom dostępu.',
      steps:['Sprawdź, czy host odpowiada w sieci i czy właściwy port usługi jest osiągalny.','Porównaj otwarcie ścieżki UNC po nazwie i po adresie IP.','Jeśli nazwa nie działa, sprawdź DNS i wpisy nazwy hosta.','Sprawdź, czy usługa udostępniania plików działa na serwerze.','Zweryfikuj konto, zapisane poświadczenia i stan blokady konta.','Porównaj uprawnienia udziału z uprawnieniami NTFS dla tego samego użytkownika.','Wykonaj test odczytu i kontrolowany zapis w zatwierdzonym katalogu.'],
      body:'CEL LEKCJI\nRozdziel błąd nazwy, łączności, logowania i autoryzacji do zasobu SMB.\n\nUPRAWNIENIA\nDostęp jest wynikiem połączenia uprawnień udziału i systemu plików. Zmiana tylko jednej warstwy może nie rozwiązać problemu, a nadmierne uprawnienia tworzą ryzyko.\n\nPRAKTYKA\nWykonaj test kontem zwykłego użytkownika oraz porównaj wynik z kontem administracyjnym tylko wtedy, gdy jest to uzasadnione. Nie przechowuj haseł w raporcie.',
      exercise:{scenario:'Folder otwiera się jako \\192.168.1.20\Serwis, ale nie jako \\NAS-SERWIS\Serwis. Po zalogowaniu część plików jest niedostępna.',task:'Rozdziel błąd DNS od uprawnień użytkownika.',deliverable:['Wynik rozwiązywania nazwy','Wynik łączności i uwierzytelnienia','Macierz udział/NTFS dla konta testowego'],acceptance:'Dostęp jest nadany minimalnie, zgodnie z rolą użytkownika, bez osłabiania protokołów.'},
      quiz:[
        {q:'Co oznacza, że udział działa po IP, ale nie po nazwie?',options:['Warto sprawdzić DNS/rozwiązywanie nazwy','Zawsze uszkodzony dysk NAS','Zawsze błędne hasło'],correct:0,explain:'Różnica wskazuje na możliwy problem z rozpoznawaniem nazwy hosta.'},
        {q:'Od czego zależy dostęp do pliku SMB?',options:['Od uprawnień udziału i NTFS oraz właściwego konta','Wyłącznie od nazwy folderu','Wyłącznie od prędkości Wi-Fi'],correct:0,explain:'Obie warstwy uprawnień mają wpływ na skuteczny dostęp.'},
        {q:'Czy włączenie SMB1 to domyślna naprawa?',options:['Tak','Nie, wymaga wyjątkowej oceny ryzyka','Tak, na wszystkich serwerach'],correct:1,explain:'Nie należy włączać przestarzałego protokołu jako uniwersalnego rozwiązania.'}
      ]
    },
    {
      id:'PRACTICE136-012', category:'UEFI i GPT', level:'Średni → zaawansowany', minutes:40,
      title:'UEFI/GPT — kontrola partycji EFI i wpisów rozruchowych',
      description:'Diagnostyka rozruchu Windows bez pochopnego formatowania partycji EFI lub dysku.',
      symptoms:'Komputer zgłasza brak urządzenia rozruchowego, po aktualizacji zmieniła się kolejność startu albo Windows Boot Manager zniknął z menu UEFI.',
      diagnosis:'Rozruch UEFI może zależeć od trybu firmware, tablicy GPT, partycji EFI, plików rozruchowych i wpisów NVRAM. Błąd jednego elementu nie oznacza utraty wszystkich danych.',
      repair:'Najpierw zidentyfikuj dysk i partycje, zabezpiecz dane, sprawdź ustawienia UEFI i użyj oficjalnego środowiska odzyskiwania.',
      verify:'Potwierdź uruchamianie z właściwego wpisu, poprawny tryb UEFI oraz zachowanie danych i partycji.',
      warning:'Nie formatuj partycji EFI, nie kasuj wpisów NVRAM i nie zmieniaj GPT/MBR bez kopii i planu odzyskania.',
      tools:['WinRE lub nośnik instalacyjny Windows','DiskPart w trybie odczytu/identyfikacji','Dokumentacja producenta płyty','Kopia danych i klucz odzyskiwania BitLocker'],
      step:'Zapisz komunikat rozruchowy, kolejność bootowania oraz stan BitLocker przed zmianami.',
      steps:['Sprawdź ustawienia UEFI: tryb rozruchu, widoczność dysku i kolejność urządzeń.','Uruchom WinRE i zidentyfikuj dyski po modelu oraz pojemności.','Sprawdź styl partycji GPT i obecność partycji EFI bez formatowania.','Ustal, czy Windows Boot Manager jest widoczny jako wpis UEFI.','Zapisz stan szyfrowania i przygotuj klucz odzyskiwania przed zmianami firmware.','Wykonaj wyłącznie procedurę odbudowy rozruchu właściwą dla konfiguracji systemu.','Po naprawie wykonaj kilka restartów i sprawdź dane, szyfrowanie oraz kolejność startu.'],
      body:'CEL LEKCJI\nNaucz się diagnozować problem UEFI/GPT, zanim wykonasz operację zapisu na dysku.\n\nROZRÓŻNIENIE\nGPT opisuje układ partycji. Partycja EFI zawiera pliki startowe. UEFI przechowuje wpisy rozruchowe w pamięci firmware. Są to różne elementy i mogą wymagać odrębnej diagnostyki.\n\nPRAKTYKA\nZapisz mapę dysku i partycji. Upewnij się, że wybrany dysk jest właściwy. Polecenia naprawcze dobieraj do stanu i konfiguracji, nigdy z listy przypadkowych komend.',
      exercise:{scenario:'Po aktualizacji firmware komputer zgłasza No bootable device. Dysk jest widoczny w UEFI, ale wpis Windows Boot Manager nie pojawia się.',task:'Ułóż plan kontroli bez formatowania dysku.',deliverable:['Zapisane ustawienia UEFI','Mapa dysku GPT i partycji','Stan BitLocker i plan odbudowy rozruchu'],acceptance:'Dysk i partycja EFI nie są formatowane; naprawa jest dopasowana do zidentyfikowanego układu.'},
      quiz:[
        {q:'Czy GPT, partycja EFI i wpis UEFI to to samo?',options:['Tak','Nie, to odrębne elementy rozruchu','Tylko na laptopach'],correct:1,explain:'Każdy element ma inną rolę i wymaga osobnej kontroli.'},
        {q:'Co zrobić przed zmianą rozruchu przy BitLocker?',options:['Zabezpieczyć klucz odzyskiwania i stan szyfrowania','Usunąć partycję EFI','Zignorować szyfrowanie'],correct:0,explain:'Zmiana firmware lub boot może wywołać żądanie klucza odzyskiwania.'},
        {q:'Jaka jest pierwsza zasada przy identyfikacji dysku?',options:['Potwierdzić model i pojemność przed operacją zapisu','Wybrać pierwszy dysk z listy','Formatować wszystkie partycje'],correct:0,explain:'Błędny wybór nośnika może spowodować utratę danych.'}
      ]
    },
    {
      id:'PRACTICE136-013', category:'Bezpieczeństwo i TPM', level:'Średni', minutes:30,
      title:'TPM, Secure Boot i BitLocker — kontrola przed serwisem',
      description:'Przygotowanie bezpiecznej procedury serwisowej przed aktualizacją BIOS, resetem TPM lub zmianą trybu Secure Boot.',
      symptoms:'Po zmianie firmware lub ustawień UEFI Windows prosi o klucz odzyskiwania BitLocker albo nie przechodzi Secure Boot.',
      diagnosis:'Zmiana pomiarów rozruchu, ustawień TPM, trybu Secure Boot lub kolejności startu może zmienić warunki odblokowania chronionego dysku.',
      repair:'Przed zmianą potwierdź status szyfrowania, dostępność klucza u właściciela, ustawienia platformy i instrukcję producenta.',
      verify:'Sprawdź stan TPM/Secure Boot, rozruch i status ochrony BitLocker po zakończonej operacji.',
      warning:'Nigdy nie żądaj przesłania klucza BitLocker na czat lub do publicznego raportu. Nie czyść TPM bez uzasadnienia i zgody właściciela.',
      tools:['Windows: manage-bde i stan ochrony','Ustawienia UEFI/TPM producenta','Dokumentacja platformy','Procedura uzyskania klucza od właściciela'],
      step:'Zanim zmienisz firmware, sprawdź stan ochrony BitLocker i ustal z właścicielem bezpieczny dostęp do klucza.',
      steps:['Sprawdź, czy wolumin systemowy jest zaszyfrowany i czy ochrona jest aktywna.','Potwierdź, że właściciel ma dostęp do klucza odzyskiwania w oficjalnym miejscu przechowywania.','Zapisz aktualny stan TPM, Secure Boot, tryb UEFI i wersję firmware.','Sprawdź, czy planowana aktualizacja wymaga zawieszenia ochrony zgodnie z instrukcją OEM.','Wykonaj jedną zatwierdzoną zmianę i nie czyść TPM bez potrzeby.','Po operacji sprawdź rozruch i stan ochrony BitLocker.','Usuń z raportu dane tajne; zapisz tylko status i wykonane czynności.'],
      body:'CEL LEKCJI\nZabezpiecz dane i uniknij blokady dostępu po pracach serwisowych.\n\nTPM I SECURE BOOT\nTPM przechowuje lub wspiera operacje związane z kluczami. Secure Boot weryfikuje komponenty rozruchu. BitLocker może wiązać odblokowanie z pomiarami platformy. Zmiana firmware może wywołać dodatkową weryfikację.\n\nPRAKTYKA\nNajpierw przygotuj plan i zgodę. Klucz odzyskiwania pozostaje w posiadaniu właściciela, nie w notatkach serwisowych. Po zmianie potwierdź stan ochrony.',
      exercise:{scenario:'Laptop ma włączony BitLocker i wymaga aktualizacji BIOS. Klient nie jest pewny, gdzie przechowywany jest klucz.',task:'Przygotuj checklistę przed aktualizacją bez ujawniania klucza technikowi.',deliverable:['Stan szyfrowania i TPM','Potwierdzenie dostępu właściciela do klucza','Plan aktualizacji i kontroli po restarcie'],acceptance:'Aktualizacja nie rozpoczyna się, dopóki właściciel nie potwierdzi bezpiecznego dostępu do klucza.'},
      quiz:[
        {q:'Co należy sprawdzić przed aktualizacją BIOS przy BitLocker?',options:['Stan ochrony i dostęp właściciela do klucza odzyskiwania','Tylko nazwę tapety','Wyłącznie wolne miejsce na pulpicie'],correct:0,explain:'Zmiany firmware mogą wpłynąć na mechanizm odblokowania.'},
        {q:'Czy technik powinien zapisywać klucz odzyskiwania w raporcie?',options:['Tak','Nie, to informacja poufna właściciela','Tylko w raporcie publicznym'],correct:1,explain:'Klucz należy chronić i nie umieszczać go w ogólnym raporcie.'},
        {q:'Czy TPM należy czyścić profilaktycznie?',options:['Tak, przed każdą naprawą','Nie, tylko przy uzasadnionej procedurze i zgodzie','Tak, gdy komputer jest wolny'],correct:1,explain:'Czyszczenie TPM może spowodować utratę dostępu do kluczy i wymaga planu.'}
      ]
    },
    {
      id:'PRACTICE136-014', category:'Dane i odzysk', level:'Średni → zaawansowany', minutes:40,
      title:'Nośnik z błędami odczytu — priorytetyzacja kopii sektorowej',
      description:'Decyzja, kiedy przerwać zwykłą diagnostykę i najpierw zabezpieczyć dane na kopii.',
      symptoms:'Dysk znika z systemu, odczyt jest bardzo wolny, pojawiają się błędy I/O lub pliki przestają być czytelne.',
      diagnosis:'Dalsze zapisy i intensywne skanowanie oryginału mogą pogorszyć sytuację. SMART jest źródłem wskazówek, ale brak alarmu nie gwarantuje sprawności.',
      repair:'Ustal priorytet danych, ogranicz zapisy i użyj odpowiedniej procedury obrazowania na inny nośnik. Przy objawach mechanicznych skieruj nośnik do laboratorium.',
      verify:'Weryfikuj odzyskane dane na kopii i zachowaj oryginał bez zbędnych operacji.',
      warning:'Nie uruchamiaj CHKDSK, defragmentacji, benchmarków ani naprawy systemu plików na niestabilnym, jedynym nośniku przed zabezpieczeniem danych.',
      tools:['Nośnik docelowy o odpowiedniej pojemności','Narzędzie do obrazowania z obsługą błędów i logiem','Odczyt SMART w trybie możliwie nieinwazyjnym','Procedura eskalacji do laboratorium odzysku'],
      step:'Ustal wartość danych i uzyskaj zgodę właściciela na obrazowanie przed próbami naprawy systemu plików.',
      steps:['Zatrzymaj zapisy na źródłowym nośniku i ustal priorytet danych.','Zapisz objawy, model, pojemność i odczyty SMART, o ile są dostępne.','Oceń, czy nośnik wydaje nietypowe dźwięki lub znika z magistrali; w takim przypadku przerwij zwykłe próby.','Przy nośniku logicznie uszkodzonym zaplanuj obraz sektorowy na inny nośnik.','Zapisz log błędów odczytu i kolejność zabezpieczonych obszarów.','Odzyskuj pliki na kopii/obrazie, nie na oryginale.','Zweryfikuj czytelność najważniejszych plików i opisz ograniczenia odzysku.'],
      body:'CEL LEKCJI\nZrozum, dlaczego przy niestabilnym nośniku priorytetem jest zabezpieczenie danych, a nie naprawa logiczna.\n\nSMART\nAtrybuty i logi mogą wskazać problem, lecz ich znaczenie jest zależne od producenta i rodzaju nośnika. Nie traktuj pojedynczego parametru jako jedynej podstawy decyzji.\n\nPRAKTYKA\nW ćwiczeniu użyj obrazu dysku treningowego. Zapisz liczbę błędów odczytu, postęp obrazowania, obszary problemowe i pliki potwierdzone po odzysku.',
      exercise:{scenario:'Dysk klienta ma ważne dane, zgłasza błędy odczytu i czasem znika w systemie.',task:'Zdecyduj, czy można wykonywać standardowy test systemu plików, czy należy najpierw zabezpieczyć dane.',deliverable:['Ocena ryzyka i zgoda właściciela','Plan obrazowania oraz miejsce docelowe','Log i weryfikacja odzyskanych plików'],acceptance:'Oryginał nie jest niepotrzebnie obciążany; odzysk jest prowadzony na kopii.'},
      quiz:[
        {q:'Co jest priorytetem przy niestabilnym nośniku z ważnymi danymi?',options:['Benchmark','Zabezpieczenie danych i obrazowanie według oceny ryzyka','Defragmentacja'],correct:1,explain:'Dodatkowe zapisy i obciążenie mogą ograniczyć możliwość odzysku.'},
        {q:'Gdzie najlepiej pracować z odzyskanymi plikami?',options:['Na oryginale','Na kopii lub obrazie, gdy to możliwe','Na dowolnej partycji źródłowej'],correct:1,explain:'Praca na kopii ogranicza ryzyko pogorszenia stanu oryginału.'},
        {q:'Czy brak alarmu SMART gwarantuje sprawność dysku?',options:['Tak','Nie','Tylko na SSD'],correct:1,explain:'SMART jest wskazówką, nie gwarancją pełnej sprawności.'}
      ]
    },
    {
      id:'PRACTICE136-015', category:'Audio i multimedia', level:'Podstawowy → średni', minutes:25,
      title:'Brak dźwięku — analiza toru od kodeka do głośnika',
      description:'Rozdzielanie problemu wyjścia audio, sterownika, jack detection, kodeka i głośników.',
      symptoms:'Windows pokazuje urządzenie audio, ale brak dźwięku; słuchawki działają, a głośniki laptopa nie albo odwrotnie.',
      diagnosis:'Tor audio obejmuje źródło, mikser systemowy, urządzenie wyjściowe, sterownik, kodek, wzmacniacz i przetwornik.',
      repair:'Sprawdź trasę sygnału i wykrywanie gniazda, a następnie porównaj działanie urządzenia w ustawieniach i w teście sprzętowym producenta.',
      verify:'Odtwórz dźwięk na każdym wymaganym wyjściu, sprawdź mikrofon, regulację głośności i brak trzasków.',
      warning:'Nie zwiększaj głośności do maksimum przy trzaskach lub sprzężeniu. Nie wykonuj pomiarów na zasilonej płycie bez kwalifikacji.',
      tools:['Ustawienia dźwięku Windows','Menedżer urządzeń i sterownik OEM','Sprawne słuchawki i przewód','Narzędzie testowe producenta laptopa'],
      step:'Ustal, czy problem dotyczy wszystkich wyjść, jednego wyjścia czy konkretnej aplikacji.',
      steps:['Sprawdź wybrane urządzenie wyjściowe i poziomy miksera aplikacji.','Przetestuj dźwięk w drugiej aplikacji i na sprawnych słuchawkach.','Sprawdź, czy gniazdo wykrywa podłączenie i czy nie jest aktywne wyciszenie sprzętowe.','Odczytaj model kodeka i wersję sterownika w Menedżerze urządzeń.','Porównaj sterownik OEM z aktualnym stanem systemu i nie instaluj wielu wersji naraz.','Wykonaj diagnostykę producenta, jeżeli jest dostępna.','Powtórz test na głośnikach, słuchawkach oraz mikrofonie.'],
      body:'CEL LEKCJI\nPoznaj tor sygnału audio, żeby nie wymieniać głośników, gdy problem leży w ustawieniach lub sterowniku.\n\nDIAGNOZA\nJeżeli dźwięk jest dostępny na słuchawkach, część toru audio działa. Nadal trzeba sprawdzić przełączanie wyjść, wykrywanie jack, wzmacniacz oraz same głośniki.\n\nPRAKTYKA\nZbuduj tabelę: wyjście, aplikacja, poziom, sterownik, wynik. Oddziel awarię jednej aplikacji od problemu całego systemu.',
      exercise:{scenario:'Laptop odtwarza dźwięk w słuchawkach, ale wbudowane głośniki milczą.',task:'Rozdziel problem routingu, detekcji gniazda i głośników.',deliverable:['Tabela wyników dla różnych wyjść','Model kodeka i wersja sterownika','Wniosek o dalszym teście sprzętowym'],acceptance:'Wymiana części nie jest proponowana, dopóki nie zostanie zawężony tor usterki.'},
      quiz:[
        {q:'Co oznacza działający dźwięk w słuchawkach?',options:['Część toru audio i systemu działa','Głośniki na pewno są sprawne','Płyta główna jest na pewno uszkodzona'],correct:0,explain:'Działanie jednego wyjścia zawęża diagnozę, ale nie potwierdza całego toru.'},
        {q:'Co warto przetestować?',options:['Drugą aplikację i sprawne słuchawki','Wyłącznie BIOS','Tylko jasność ekranu'],correct:0,explain:'Porównanie wyjść i aplikacji pomaga oddzielić warstwę programową.'},
        {q:'Czy należy instalować kilka sterowników audio jednocześnie?',options:['Tak','Nie, testuj jedną zgodną wersję na raz','Tylko sterowniki z agregatora'],correct:1,explain:'Wiele zmian naraz utrudnia ocenę wyniku i może pogłębić konflikt.'}
      ]
    },
    {
      id:'PRACTICE136-016', category:'Serwis i kontrola jakości', level:'Profesjonalny', minutes:30,
      title:'Końcowy test serwisowy — macierz funkcji przed wydaniem komputera',
      description:'Tworzenie odtwarzalnej listy testów po naprawie z kryteriami akceptacji i dokumentacją.',
      symptoms:'Urządzenie uruchamia się po naprawie, ale nie wiadomo, czy sprawdzono wszystkie funkcje związane z pierwotnym zgłoszeniem.',
      diagnosis:'Sam start systemu nie potwierdza poprawności naprawy. Trzeba powtórzyć test pierwotnego objawu oraz sprawdzić funkcje zależne od naprawianego obszaru.',
      repair:'Przygotuj macierz testów z wynikiem, warunkami i ograniczeniami; wykonuj tylko testy odpowiednie do naprawy.',
      verify:'Raport zawiera zaliczone, niezaliczone i niewykonane próby wraz z przyczyną oraz zgodą klienta na dalszy zakres.',
      warning:'Nie wykonuj destrukcyjnych testów, kasowania danych lub długiego obciążenia bez uzgodnienia i kopii. Nie przechowuj haseł w raporcie.',
      tools:['Karta naprawy i lista zgłoszonych objawów','Narzędzia diagnostyczne producenta','Macierz testów odbiorczych','System raportowania z ograniczonym dostępem'],
      step:'Przed testem końcowym odczytaj pierwotne zgłoszenie i ustal, które funkcje były objęte naprawą.',
      steps:['Wpisz pierwotny objaw i warunki jego występowania.','Wybierz test bezpośrednio odtwarzający problem klienta.','Wybierz kontrolę funkcji zależnych: porty, obraz, sieć, dźwięk, ładowanie lub chłodzenie.','Zapisz wersje systemu, sterowników i firmware, jeśli wpływają na wynik.','Zaznacz wynik każdej próby: zaliczona, niezaliczona albo niewykonana.','Przy teście niezaliczonym opisz dalszy plan i nie ukrywaj ograniczeń.','Przed wydaniem sprawdź obudowę, akcesoria, dane oraz uzgodniony zakres prac.'],
      body:'CEL LEKCJI\nStwórz test odbiorczy, który drugi technik może powtórzyć i uzyskać porównywalny wynik.\n\nMACIERZ\nKażdy test powinien mieć nazwę, warunki, kryterium akceptacji i rezultat. Brak możliwości wykonania testu należy opisać, nie oznaczać jako zaliczony.\n\nPRAKTYKA\nZrób macierz dla naprawy gniazda ładowania: zasilanie, ładowanie, stabilność wtyku, wykrywanie baterii, temperatura i test po zimnym starcie. Nie obciążaj urządzenia ponad bezpieczne warunki.',
      exercise:{scenario:'Wymieniono gniazdo zasilania laptopa. System uruchamia się, lecz nie przeprowadzono testu stabilności ładowania ani sprawdzenia baterii.',task:'Utwórz listę testów odbiorczych i kryteria zaliczenia.',deliverable:['Macierz testów z warunkami','Wyniki testów i ograniczenia','Raport końcowy bez danych poufnych'],acceptance:'Każdy wymagany test ma jawny rezultat; niewykonane próby nie są oznaczone jako zaliczone.'},
      quiz:[
        {q:'Czy sam start systemu potwierdza zakończenie naprawy?',options:['Tak zawsze','Nie, trzeba powtórzyć pierwotny objaw i funkcje zależne','Tylko w laptopach'],correct:1,explain:'Test końcowy powinien pokrywać zakres zgłoszenia i naprawy.'},
        {q:'Jak oznaczyć test, którego nie wykonano?',options:['Zaliczone','Niewykonane z podaniem przyczyny','Ukryć w raporcie'],correct:1,explain:'Raport powinien uczciwie oddzielać wykonane testy od pominiętych.'},
        {q:'Co powinien zawierać powtarzalny test?',options:['Warunki i kryterium akceptacji','Tylko słowo OK','Dane hasła klienta'],correct:0,explain:'Warunki i kryteria pozwalają odtworzyć test i zweryfikować wynik.'}
      ]
    },
    {
      id:'PRACTICE136-017', category:'Baterie i bezpieczeństwo', level:'Podstawowy → średni', minutes:25,
      title:'Wstępna ocena uszkodzenia baterii litowo-jonowej',
      description:'Rozpoznawanie objawów wymagających natychmiastowego przerwania pracy z pakietem baterii.',
      symptoms:'Obudowa jest wybrzuszona, touchpad lub spód laptopa unosi się, bateria nadmiernie się nagrzewa albo pojawia się nietypowy zapach.',
      diagnosis:'Deformacja, nagrzewanie, zapach lub uszkodzenie mechaniczne mogą oznaczać niebezpieczny stan ogniwa. Nie jest to zwykła usterka do testowania przez ładowanie.',
      repair:'Przerwij używanie i ładowanie, odizoluj urządzenie zgodnie z procedurą zakładową i skieruj baterię do właściwego procesu obsługi odpadów/serwisu.',
      verify:'Potwierdź bezpieczne przekazanie urządzenia i baterii; nie wykonuj testu ładowania uszkodzonego pakietu.',
      warning:'Nie przebijaj, nie ściskaj, nie wyginaj, nie zamrażaj i nie ładuj spuchniętej lub uszkodzonej baterii. Stosuj lokalne procedury bezpieczeństwa i przepisy.',
      tools:['Procedura BHP dla baterii Li-ion','Odpowiednie miejsce i pojemnik zgodny z lokalną procedurą','Środki ochrony wymagane przez zakład','Dokumentacja modelu i procesu utylizacji'],
      step:'Przy spuchnięciu, dymie, zapachu lub nadmiernym cieple przerwij pracę i nie podłączaj ładowarki.',
      steps:['Oceń z bezpiecznej odległości deformację, temperaturę, zapach i widoczne uszkodzenia.','Nie naciskaj obudowy i nie próbuj prostować pakietu.','Odłącz zasilacz, jeśli można to zrobić bez zbliżania się do niebezpiecznego pakietu.','Zastosuj zakładową procedurę izolacji i eskalacji.','Udokumentuj objaw bez manipulowania baterią i bez niepotrzebnego transportu.','Przekaż pakiet do uprawnionego procesu obsługi i utylizacji zgodnie z lokalnymi zasadami.','W raporcie oznacz urządzenie jako niebezpieczne do ładowania/testu.'],
      body:'CEL LEKCJI\nRozpoznaj sytuację, w której diagnostykę trzeba przerwać, zanim dojdzie do pożaru lub dalszego uszkodzenia.\n\nZASADA\nSpuchnięta, gorąca, przebita lub uszkodzona bateria nie jest materiałem do ćwiczeń. Nie wykonuj pomiarów ani testów ładowania na uszkodzonym pakiecie.\n\nPRAKTYKA\nĆwiczenie polega na rozpoznaniu objawów z dokumentacji fotograficznej lub na bezpiecznym modelu szkoleniowym, a następnie przećwiczeniu procedury zgłoszenia i eskalacji.',
      exercise:{scenario:'Klient zgłasza, że touchpad uniósł się nad obudowę, a dolna pokrywa laptopa jest wybrzuszona.',task:'Zdecyduj, jakie czynności są zabronione i jak bezpiecznie przerwać przyjęcie.',deliverable:['Lista rozpoznanych objawów','Zapis procedury izolacji','Potwierdzenie przekazania do bezpiecznego procesu'],acceptance:'Nie dochodzi do ładowania, naciskania, przebijania ani dalszego testowania baterii.'},
      quiz:[
        {q:'Co zrobić ze spuchniętą baterią?',options:['Naładować do 100%','Przerwać używanie i ładowanie oraz zastosować procedurę bezpieczeństwa','Docisnąć pokrywę'],correct:1,explain:'Deformacja jest sygnałem do przerwania pracy i bezpiecznej eskalacji.'},
        {q:'Czy można przebić pakiet, aby wypuścić gaz?',options:['Tak','Nie, to skrajnie niebezpieczne','Tylko cienką igłą'],correct:1,explain:'Przebicie może doprowadzić do zwarcia, pożaru i gwałtownej reakcji.'},
        {q:'Jaki test wykonuje się na uszkodzonej baterii?',options:['Test ładowania','Test obciążenia','Żaden — urządzenie jest wyłączone z testów do czasu bezpiecznej obsługi'],correct:2,explain:'Nie testuje się ładowania ani obciążenia uszkodzonego pakietu.'}
      ]
    },
    {
      id:'PRACTICE136-018', category:'Dokumentacja i organizacja serwisu', level:'Profesjonalny', minutes:25,
      title:'Karta diagnozy — od objawu do potwierdzonej przyczyny',
      description:'Przygotowanie notatki technicznej, która rozdziela obserwacje, pomiary, hipotezy i wnioski.',
      symptoms:'Po wielu próbach trudno ustalić, które wyniki są aktualne i dlaczego zalecono wymianę konkretnej części.',
      diagnosis:'Brak jednolitego zapisu powoduje powtarzanie testów, ryzyko błędnej wymiany i nieporozumienia z klientem.',
      repair:'Wprowadź stałą strukturę karty diagnozy i oznaczaj każdy wniosek statusem: obserwacja, pomiar, hipoteza lub potwierdzona przyczyna.',
      verify:'Drugi technik powinien móc odtworzyć kolejność, konfigurację i warunki testu na podstawie zapisu.',
      warning:'Nie umieszczaj w karcie haseł, kluczy BitLocker ani zbędnych danych osobowych. Ogranicz dostęp do dokumentacji klienta.',
      tools:['Karta przyjęcia i karta diagnostyczna','Aparat do dokumentacji stanu wejściowego','Szablon pomiarów z jednostkami','System przechowywania z kontrolą dostępu'],
      step:'Zapisuj wynik w chwili wykonania testu, z warunkami i konfiguracją.',
      steps:['Zapisz objaw słowami klienta i warunki jego występowania.','Dodaj model, rewizję, wersję systemu i istotne podzespoły.','Zapisz stan początkowy, widoczne uszkodzenia i zgodę na zakres prac.','Dla każdego testu wpisz hipotezę, metodę, warunki i wynik.','Oddziel wynik pomiaru od interpretacji i hipotezy.','Po potwierdzeniu przyczyny zapisz uzasadnienie i proponowane działanie.','Dodaj test końcowy, ograniczenia i zalecenia dla klienta.'],
      body:'CEL LEKCJI\nNaucz się tworzyć dokumentację, która umożliwia kontrolę jakości i odtworzenie diagnozy.\n\nSTRUKTURA\nDobra karta obejmuje objaw, konfigurację, test bazowy, hipotezę, metodę, wynik, interpretację, decyzję oraz weryfikację po naprawie.\n\nPRAKTYKA\nNa ćwiczeniu wypełnij kartę dla losowego restartu komputera. Zadbaj, by osoba czytająca raport wiedziała, które elementy są faktem, a które wymagają dalszego sprawdzenia.',
      exercise:{scenario:'Dwa dni po naprawie komputer wraca z podobnym objawem. Poprzedni raport zawiera tylko wpis „wymieniono RAM — działa”.',task:'Przygotuj lepszy raport dla kolejnej naprawy, który pozwoli ocenić przyczynę i test końcowy.',deliverable:['Test bazowy i warunki','Wyniki prób z konfiguracją','Uzasadnienie diagnozy i wynik po naprawie'],acceptance:'Raport pozwala drugiemu technikowi zrozumieć, co potwierdzono, a czego nie.'},
      quiz:[
        {q:'Jak oznaczyć przypuszczalną przyczynę?',options:['Jako potwierdzoną bez testu','Jako hipotezę do sprawdzenia','Usunąć z raportu'],correct:1,explain:'Hipotezę należy oddzielić od obserwacji i pomiaru.'},
        {q:'Co powinno znaleźć się przy pomiarze?',options:['Jednostka, punkt, warunki i konfiguracja','Tylko liczba','Hasło klienta'],correct:0,explain:'Bez warunków wynik może być niemożliwy do porównania.'},
        {q:'Czy drugi technik powinien odtworzyć test z raportu?',options:['Tak','Nie, raport ma być wyłącznie skrótem','Tylko przy gwarancji'],correct:0,explain:'Odtwarzalność testu jest ważna dla jakości i diagnozy.'}
      ]
    }
  ];
  let added = 0;
  for (const lesson of lessons) {
    if (existing.has(lesson.id)) continue;
    data.courseLessons.push(lesson);
    existing.add(lesson.id);
    added++;
  }
  window.ACADEMY_PRACTICE_FIX136 = { added, total: data.courseLessons.length, ids: lessons.map(x=>x.id) };
})();
