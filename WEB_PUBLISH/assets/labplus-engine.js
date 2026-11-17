(function () {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value == null ? fallback : value; } catch (_) { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const toast = message => { const node = $('#toast'); if (!node) return; node.textContent = message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2600); };
  const parts = [
    {id:'cpu',title:'Procesor CPU',code:'U_CPU',glyph:'▦',category:'compute',group:'Układy obliczeniowe',role:'Wykonuje instrukcje i współpracuje z kontrolerami platformy. W laptopach może być lutowany w obudowie BGA, a w komputerach stacjonarnych często montowany w gnieździe.',fn:'Obliczenia, sterowanie i komunikacja z pamięcią',sym:'Brak POST, wyłączanie pod obciążeniem, błędy obliczeń',checks:'Sekwencja zasilania, sygnały reset/clock, chłodzenie i socket',caution:'Nie podgrzewaj układu bez potwierdzonej diagnozy i właściwego profilu procesu.',tags:'CPU procesor core VCORE socket BGA LGA'},
    {id:'vrm',title:'Sekcja zasilania VRM',code:'VRM / PU',glyph:'ϟ',category:'power',group:'Zasilanie',role:'Przetwarza napięcie wejściowe na stabilizowane szyny wymagane przez CPU, GPU i inne domeny.',fn:'Regulacja napięcia i prądu dla odbiorników',sym:'Brak startu, restart, przegrzewanie, brak jednej z szyn',checks:'Wejście regulatora, sygnał EN, power-good, cewki i MOSFET-y',caution:'Nazwy szyn i wartości zależą od platformy — korzystaj ze schematu właściwej rewizji.',tags:'VRM regulator PWM power phase VCORE'},
    {id:'ram',title:'Pamięć RAM',code:'DIMM / DRAM',glyph:'▥',category:'memory',group:'Pamięci',role:'Przechowuje bieżące dane i instrukcje używane przez procesor. Może występować jako moduły DIMM/SO-DIMM lub układy wlutowane.',fn:'Pamięć operacyjna i kanały danych',sym:'Pętle restartów, błędy POST, BSOD, niestabilność',checks:'Zgodność modułu, styki, slot, test pamięci i szyny zasilania',caution:'Testuj pojedyncze moduły i sloty zgodnie z procedurą producenta.',tags:'RAM DDR4 DDR5 SO-DIMM DIMM DRAM'},
    {id:'bios',title:'Pamięć BIOS / SPI flash',code:'U_BIOS',glyph:'▤',category:'interface',group:'Firmware',role:'Przechowuje firmware startowy platformy. W części urządzeń firmware jest podzielony pomiędzy kilka kości lub obszarów.',fn:'Firmware UEFI/BIOS i dane platformy',sym:'Brak POST po aktualizacji, pętla startowa, brak obrazu',checks:'Oznaczenie układu, zgodność wsadu, zasilanie, komunikacja SPI',caution:'Przed programowaniem wykonaj kopię oryginalnego wsadu i sprawdź platformę oraz rewizję.',tags:'BIOS UEFI SPI flash firmware ROM'},
    {id:'ec',title:'Kontroler EC / KBC',code:'U_EC',glyph:'⌘',category:'interface',group:'Kontrolery',role:'Zarządza wybranymi funkcjami platformy, klawiaturą, przyciskiem zasilania, wentylatorem i częścią sekwencji startowej laptopa.',fn:'Sterowanie platformą, zdarzenia i sekwencje',sym:'Brak reakcji na power, nietypowe zachowanie klawiatury, brak ładowania',checks:'Zasilanie EC, reset, zegar, linie komunikacyjne i sygnały przycisku',caution:'Nie wgrywaj firmware EC z innego wariantu płyty.',tags:'EC KBC embedded controller laptop'},
    {id:'pch',title:'Chipset / PCH',code:'U_PCH',glyph:'▧',category:'compute',group:'Układy obliczeniowe',role:'Zestaw funkcji wejścia/wyjścia platformy. Współczesne architektury integrują wiele funkcji w CPU lub SoC.',fn:'Interfejsy, magistrale, zarządzanie platformą',sym:'Brak urządzeń I/O, brak startu, błędy komunikacji',checks:'Zasilania, reset, zegary i komunikacja z pozostałymi blokami',caution:'Objaw nie przesądza o uszkodzeniu chipsetu — najpierw zweryfikuj linie i sygnały.',tags:'PCH chipset SoC southbridge'},
    {id:'gpu',title:'Układ graficzny GPU',code:'U_GPU',glyph:'◈',category:'compute',group:'Grafika',role:'Przetwarza grafikę i zadania równoległe. Może być układem dedykowanym lub częścią procesora.',fn:'Renderowanie i obliczenia graficzne',sym:'Artefakty, czarny ekran, reset sterownika, brak wykrycia',checks:'Zasilania GPU, pamięć VRAM, chłodzenie, magistrala i sterownik',caution:'Najpierw wyklucz RAM, ekran, przewód, zasilanie i problem programowy.',tags:'GPU graphics karta graficzna AMD NVIDIA'},
    {id:'usbc',title:'Kontroler USB-C / Power Delivery',code:'U_PD',glyph:'⌁',category:'interface',group:'Interfejsy',role:'Obsługuje negocjację zasilania USB-C, wykrywanie orientacji wtyku i wybrane funkcje portu.',fn:'USB-C, PD, role zasilania i komunikacja',sym:'Brak ładowania, ładowanie tylko w jednej orientacji, brak danych',checks:'Port i linie CC, zabezpieczenia, VBUS oraz dokumentacja kontrolera',caution:'Nie zwieraj pinów portu. Weryfikuj parametry zasilacza i procedurę PD.',tags:'USB-C PD type c power delivery'},
    {id:'mosfet',title:'Tranzystor MOSFET',code:'PQ / Q',glyph:'ϟ',category:'power',group:'Zasilanie',role:'Półprzewodnikowy przełącznik lub element regulacyjny w torach zasilania.',fn:'Przełączanie i sterowanie przepływem energii',sym:'Zwarcie dren–źródło, grzanie, brak przełączania',checks:'Pinout, rezystancje, bramka, źródło, dren i warunki sterowania',caution:'Pomiar w układzie może być zafałszowany przez elementy równoległe.',tags:'MOSFET PQ Q N-channel P-channel transistor'},
    {id:'inductor',title:'Cewka / dławik',code:'PL / L',glyph:'∿',category:'passive',group:'Elementy pasywne',role:'Magazynuje energię w polu magnetycznym i współpracuje z przetwornicą impulsową.',fn:'Filtracja i magazynowanie energii w DC-DC',sym:'Uszkodzenie mechaniczne, przerwa, przegrzewanie obwodu',checks:'Ciągłość uzwojenia, lutowania, zwarcia szyny i elementy sąsiednie',caution:'Niska rezystancja cewki nie oznacza automatycznie zwarcia.',tags:'cewka dławik inductor coil PL'},
    {id:'capacitor',title:'Kondensator',code:'PC / C',glyph:'Ⅱ',category:'passive',group:'Elementy pasywne',role:'Magazynuje ładunek i filtruje zakłócenia w obwodach zasilania i sygnałowych.',fn:'Filtracja, odsprzęganie i stabilizacja',sym:'Pęknięcie, upływność, zwarcie, niestabilna szyna',checks:'Oględziny, zwarcie do masy, pojemność i ESR odpowiednim miernikiem',caution:'Wartości i dielektryk muszą odpowiadać projektowi obwodu.',tags:'kondensator capacitor MLCC tantal polymer PC'},
    {id:'resistor',title:'Rezystor',code:'PR / R',glyph:'▱',category:'passive',group:'Elementy pasywne',role:'Ustala prąd, dzieli napięcie, realizuje pomiary prądu lub polaryzację wejść.',fn:'Ograniczanie prądu, dzielniki, pull-up i sensing',sym:'Przerwa, zmiana wartości, przebarwienie',checks:'Pomiar rezystancji po odłączeniu zasilania i analiza połączeń',caution:'Nie mierz rezystancji w aktywnym obwodzie.',tags:'rezystor resistor resistor array shunt PR'},
    {id:'pwm',title:'Kontroler PWM',code:'PU / PWM',glyph:'▤',category:'power',group:'Zasilanie',role:'Steruje przetwornicą, dobiera wypełnienie impulsów i reaguje na sprzężenie zwrotne.',fn:'Sterowanie przetwornicą impulsową',sym:'Brak EN, brak przebiegu sterującego, niestabilna szyna',checks:'Zasilanie układu, EN, FB, bootstrap i elementy mocy',caution:'Sygnały i warunki startu są specyficzne dla kontrolera.',tags:'PWM controller buck regulator PU'},
    {id:'fuse',title:'Bezpiecznik / polyfuse',code:'PF / F',glyph:'—',category:'power',group:'Zabezpieczenia',role:'Chroni wybrany obwód przed nadmiernym prądem. Występują bezpieczniki jednorazowe i resetowalne.',fn:'Ochrona obwodu nadprądowego',sym:'Przerwa w torze, brak napięcia za zabezpieczeniem',checks:'Ciągłość po odłączeniu zasilania i przyczyna zadziałania',caution:'Nie mostkuj zabezpieczenia i nie montuj wyższej wartości bez analizy projektu.',tags:'fuse bezpiecznik PF F polyfuse'},
    {id:'battery',title:'Złącze baterii i tor ładowania',code:'J_BAT / CHG',glyph:'▣',category:'power',group:'Zasilanie',role:'Łączy akumulator z układem zarządzania ładowaniem i zasilaniem platformy.',fn:'Zasilanie bateryjne i ładowanie',sym:'Brak ładowania, wyłączanie po odłączeniu zasilacza',checks:'Stan baterii, złącze, identyfikacja baterii i kontroler ładowania',caution:'Uszkodzone, spuchnięte lub gorące baterie wymagają przerwania pracy i właściwej procedury.',tags:'battery bateria charger charge connector'},
    {id:'dcin',title:'Gniazdo DC-IN',code:'JDC / DC-IN',glyph:'⊙',category:'interface',group:'Złącza',role:'Doprowadza napięcie z zasilacza do płyty lub modułu wejściowego.',fn:'Wejście zasilania urządzenia',sym:'Przerywane ładowanie, luźne gniazdo, brak reakcji',checks:'Mocowanie mechaniczne, styki, przewód, polaryzacja i tor wejściowy',caution:'Nie zakładaj polaryzacji ani napięcia — sprawdź oznaczenia modelu.',tags:'DC IN gniazdo zasilania jack'},
    {id:'vram',title:'Pamięć VRAM',code:'U_VRAM',glyph:'▥',category:'memory',group:'Pamięci',role:'Lokalna pamięć układu graficznego. Rodzaj i organizacja zależą od generacji GPU.',fn:'Bufory i dane graficzne',sym:'Artefakty, błędy pamięci, niestabilność pod obciążeniem',checks:'Temperatura, zasilanie, ślady korozji i testy diagnostyczne GPU',caution:'Reballing lub wymiana wymaga potwierdzenia uszkodzenia i kontroli procesu.',tags:'VRAM GDDR6 GDDR5 graphics memory'},
    {id:'ssd',title:'SSD M.2 / NVMe',code:'M2 / U_NVME',glyph:'▰',category:'interface',group:'Pamięć masowa',role:'Nośnik danych w standardzie M.2; może korzystać z PCIe/NVMe lub SATA, zależnie od modelu.',fn:'Przechowywanie danych i komunikacja z hostem',sym:'Brak wykrycia, błędy I/O, przegrzewanie, spadki wydajności',checks:'Zgodność klucza i interfejsu, SMART, temperatura i gniazdo',caution:'Przed testami destrukcyjnymi wykonaj kopię danych.',tags:'SSD M.2 NVMe SATA storage'},
    {id:'fan',title:'Wentylator i układ chłodzenia',code:'FAN / THERMAL',glyph:'✥',category:'interface',group:'Chłodzenie',role:'Odprowadza ciepło z CPU/GPU i innych elementów, sterowany przez układ platformy.',fn:'Kontrola temperatur i przepływu powietrza',sym:'Wysokie temperatury, throttling, hałas, brak obrotów',checks:'Złącze, przewody tach/PWM, drożność radiatora i kontakt termiczny',caution:'Nie blokuj wentylatora podczas pracy i nie używaj sprężonego powietrza bez kontroli obrotów.',tags:'fan wentylator cooling thermal PWM'},
    {id:'connector',title:'Złącza FFC / eDP / taśmowe',code:'J / CN',glyph:'⊞',category:'interface',group:'Złącza',role:'Zapewniają połączenie modułów: matrycy, klawiatury, touchpada i dodatkowych podzespołów.',fn:'Połączenie sygnałowe i zasilające moduły',sym:'Brak obrazu, migotanie, niedziałająca klawiatura lub touchpad',checks:'Zatrzask, styki, taśma, pinout i oznaczenia złącza',caution:'Odłącz baterię i zasilanie przed manipulacją taśmami.',tags:'FFC FPC eDP LVDS connector złącze'},
    {id:'crystal',title:'Rezonator / oscylator zegarowy',code:'X / Y',glyph:'◌',category:'interface',group:'Zegary',role:'Dostarcza sygnał odniesienia dla kontrolerów i bloków logicznych.',fn:'Generowanie sygnału zegarowego',sym:'Brak startu wybranego bloku, brak komunikacji',checks:'Obecność zasilania, oscylacja odpowiednią sondą i otoczenie układu',caution:'Sonda o zbyt dużej pojemności może zakłócić pomiar.',tags:'crystal oscillator clock zegar X Y'}
  ];
  const partById = Object.fromEntries(parts.map(part => [part.id, part]));
  const cases = [
    {id:'no-power',title:'Laptop całkowicie martwy',level:'PODSTAWY / ZASILANIE',symptom:'Brak diody, brak reakcji na przycisk POWER.',steps:['Potwierdź sprawność zasilacza i zgodność parametrów z dokumentacją urządzenia.','Obejrzyj gniazdo DC-IN/USB-C, przewód i okolice wejścia zasilania.','Po odłączeniu źródeł energii wykonaj oględziny i sprawdź ciągłość zabezpieczeń zgodnie ze schematem.','Porównaj obecność szyn standby oraz sygnały przycisku POWER z dokumentacją płyty.','Zapisz wyniki i dopiero wtedy zawężaj obszar do toru wejściowego, ładowania lub EC.'],hypothesis:'Możliwy problem w torze wejściowym, zabezpieczeniu, zasilaniu standby lub sterowaniu EC. Sam objaw nie wskazuje jednej części.',accept:'Potwierdzone prawidłowe zasilanie wejściowe, sekwencja startowa i stabilny test uruchomienia.'},
    {id:'no-charge',title:'Laptop nie ładuje baterii',level:'ZASILANIE / USB-C PD',symptom:'Urządzenie działa na zasilaczu, ale poziom baterii nie rośnie.',steps:['Sprawdź komunikat systemu, rozpoznanie zasilacza i stan baterii.','Zweryfikuj zgodność mocy zasilacza oraz profil USB-C PD, jeśli urządzenie go używa.','Obejrzyj port i złącza; poszukaj uszkodzeń mechanicznych i korozji.','W oparciu o schemat sprawdź sygnały wykrycia adaptera i kontrolera ładowania.','Oddziel problem baterii, adaptera, portu i sekcji ładowania przed zamówieniem części.'],hypothesis:'Przyczyną może być bateria, adapter, port, linie CC/PD lub kontroler ładowania.',accept:'Urządzenie rozpoznaje właściwy adapter, ładuje stabilnie i przechodzi test na baterii.'},
    {id:'gpu-artifact',title:'Artefakty obrazu / problemy GPU',level:'GPU / VRAM',symptom:'Kolorowe piksele, pasy, błędy sterownika lub czarny ekran pod obciążeniem.',steps:['Wyklucz przewód, monitor, port i ustawienia obrazu.','Sprawdź temperatury, wentylatory i stabilność zasilania karty.','Porównaj zachowanie na innym systemie lub sterowniku, bez pochopnej reinstalacji.','Uruchom kontrolowany test pamięci/układu zgodny z kartą, zapisując warunki i temperatury.','Dopiero na podstawie wyników rozważ GPU, VRAM, VRM, BGA lub problem programowy.'],hypothesis:'Możliwy problem sterownika, przegrzewania, pamięci VRAM, układu GPU lub toru zasilania.',accept:'Brak artefaktów w kontrolowanym teście i stabilna praca w temperaturach dopuszczonych przez producenta.'},
    {id:'ram-post',title:'Brak POST / błąd pamięci RAM',level:'RAM / DIAGNOSTYKA',symptom:'Komputer nie przechodzi POST albo sygnalizuje błąd pamięci.',steps:['Odłącz zasilanie, zachowaj ESD i sprawdź prawidłowy montaż modułu.','Uruchom z jednym sprawdzonym modułem w slocie wskazanym przez instrukcję.','Powtórz test z innym modułem i slotem, zapisując kombinacje.','Sprawdź zgodność pamięci i ustawienia firmware; przy pamięci lutowanej rozszerz diagnozę na płytę.','Po uruchomieniu wykonaj pełny test pamięci i sprawdź logi błędów.'],hypothesis:'Możliwa niezgodność modułu, uszkodzony slot, pamięć, kontroler lub problem treningu pamięci.',accept:'Powtarzalny POST oraz test pamięci bez błędów w zalecanym czasie.'},
    {id:'overheat',title:'Przegrzewanie i throttling',level:'TERMAL / CHŁODZENIE',symptom:'Wysokie temperatury, spadki taktowania, głośna praca lub wyłączanie.',steps:['Odczytaj temperatury i obciążenie w spoczynku oraz pod kontrolowanym obciążeniem.','Sprawdź drożność radiatora, wentylator, filtr i przepływ powietrza.','Zweryfikuj docisk radiatora, stan materiału termicznego i kompletność śrub.','Sprawdź sterowanie wentylatorem i ewentualne ograniczenia firmware.','Po czyszczeniu wykonaj powtarzalny test porównawczy i zapisz temperatury.'],hypothesis:'Najczęściej należy wykluczyć zabrudzenie, niewłaściwy kontakt termiczny, wentylator lub wysokie obciążenie.',accept:'Stabilne temperatury i brak nieoczekiwanego throttlingu w teście porównywalnym z pomiarem początkowym.'},
    {id:'liquid',title:'Laptop po zalaniu',level:'BHP / KOROZJA',symptom:'Urządzenie było narażone na ciecz, pojawiają się niestabilność lub ślady korozji.',steps:['Natychmiast odłącz zasilacz; nie uruchamiaj urządzenia „na próbę”.','Jeżeli można to bezpiecznie wykonać, odłącz baterię zgodnie z instrukcją serwisową.','Udokumentuj zakres zalania i wykonaj oględziny pod mikroskopem.','Zlokalizuj pozostałości cieczy i korozji; oczyść płytę odpowiednim procesem dla danego materiału.','Po pełnym wysuszeniu i kontroli wykonuj pomiary bez zasilania, a uruchomienie dopiero po usunięciu przyczyny.'],hypothesis:'Korozja może tworzyć upływności i zwarcia także pod układami oraz złączami. Zakres szkód nie zawsze jest widoczny z góry.',accept:'Brak pozostałości korozji, poprawne pomiary w obwodach i stabilny test funkcjonalny po kontroli.'}
  ];
  const training = [
    {id:'electronics',title:'Elektronika dla serwisanta',desc:'Prawo Ohma, napięcie, prąd, rezystancja, symbole i ESD.',steps:['Rozróżniam napięcie, prąd i rezystancję.','Czytam symbole rezystora, kondensatora, cewki i diody.','Umiem przygotować stanowisko ESD.','Dobieram tryb i zakres multimetru.']},
    {id:'board',title:'Diagnostyka płyty głównej',desc:'Identyfikacja bloków, linie zasilania, sygnały i sekwencja startu.',steps:['Odczytuję numer i rewizję PCB.','Rozpoznaję wejście zasilania i zabezpieczenia.','Identyfikuję szyny standby i ich źródło.','Układam kolejność diagnostyki na podstawie schematu.']},
    {id:'smd',title:'Lutowanie SMD / THT',desc:'Topnik, dobór grotu, kontrola temperatury i inspekcja połączeń.',steps:['Dobieram grot, topnik i stop lutowniczy do zadania.','Przygotowuję płytę i zabezpieczam sąsiednie elementy.','Wykonuję ćwiczenie na płytce treningowej.','Sprawdzam zwilżanie, mostki i jakość połączeń.']},
    {id:'bga',title:'BGA / reballing — teoria procesu',desc:'Profil termiczny, preheat, stencil, kulki i kontrola jakości.',steps:['Identyfikuję obudowę i warunki producenta.','Rozumiem rolę preheatera i kontroli temperatury.','Przygotowuję pola i narzędzia do ćwiczenia.','Oceniam jakość połączeń metodą właściwą dla stanowiska.']},
    {id:'gpu',title:'GPU / VRAM / VRM',desc:'Artefakty, zasilanie, pamięć, chłodzenie i testy porównawcze.',steps:['Oddzielam objawy programowe od sprzętowych.','Weryfikuję chłodzenie i temperatury.','Rozpoznaję sekcję VRM oraz pamięci.','Dokumentuję test przed i po naprawie.']},
    {id:'laptop',title:'Laptop — naprawa od A do Z',desc:'Demontaż, gniazda, USB-C, matryce, chłodzenie i kontrola.',steps:['Zabezpieczam dane i zasilanie przed demontażem.','Dokumentuję śruby, taśmy i położenie elementów.','Rozpoznaję moduły oraz punkty ryzyka.','Wykonuję test końcowy wszystkich funkcji.']},
    {id:'socket',title:'CPU / Socket LGA — inspekcja pinów',desc:'Mikroskopowa ocena pinów, identyfikacja uszkodzeń i ćwiczenia na gnieździe treningowym.',steps:['Potwierdzam dokładny typ socketu i zgodność procesora z platformą.','Wykonuję zdjęcia i inspekcję pod mikroskopem przy kilku kątach oświetlenia.','Porównuję geometrię rzędów pinów i zaznaczam miejsce odchylenia.','Ćwiczę korektę wyłącznie na gnieździe treningowym właściwym narzędziem, bez nacisku na sąsiednie piny.','Ponownie kontroluję geometrię i stan pola; nie montuję CPU przed potwierdzeniem poprawności.']},
    {id:'usb-c',title:'USB-C / DC-IN — tor zasilania',desc:'Gniazda, linie CC, negocjacja PD, zabezpieczenia i wejściowy tor ładowania.',steps:['Odczytuję specyfikację urządzenia i wymagany profil zasilacza.','Oglądam port, mocowanie, piny CC/VBUS i elementy zabezpieczające.','Rozpoznaję bezpiecznik, MOSFET-y wejściowe i kontroler PD na schemacie.','Weryfikuję komunikację PD oraz pomiary zgodnie z procedurą i limitami przyrządu.','Wykonuję test ładowania, danych i stabilności pod zgodnym obciążeniem.']},
    {id:'bios',title:'BIOS / UEFI / EC — firmware',desc:'Identyfikacja kości, kopia wsadu, zgodność platformy i kontrola programowania.',steps:['Identyfikuję oznaczenie płyty, rewizję oraz dokładny układ firmware.','Zapisuję oryginalny wsad w co najmniej dwóch kopiach i porównuję pliki.','Dobieram firmware wyłącznie do zgodnego wariantu płyty i platformy.','Sprawdzam napięcie układu, pinout, adapter i procedurę programatora.','Po zapisie weryfikuję odczyt kontrolny, sumę kontrolną i sekwencję uruchomienia.']}
  ];
  const triagePlans = {
    'no-power': {title:'Brak reakcji na zasilanie',risk:'Najpierw potwierdź źródło zasilania. Nie podawaj napięcia na nieznane punkty.',steps:['Sprawdź zasilacz, przewód i zgodność parametrów z tabliczką urządzenia.','Obejrzyj wejście DC-IN lub USB-C, złącza i okolice zabezpieczeń.','Odłącz zasilanie; wykonaj oględziny ESD i pomiary pasywne zgodnie ze schematem.','Sprawdź szyny standby, sygnały enable i sekwencję EC/POWER według dokumentacji.','Zapisz każdy wynik i dopiero wtedy zawężaj obszar usterki.'],next:'Po ustaleniu, czy wejście i szyny standby są poprawne, przejdź do przypadku „Laptop całkowicie martwy”.'},
    'no-image': {title:'Brak obrazu / brak POST',risk:'Brak obrazu nie musi oznaczać uszkodzenia GPU. Wyklucz tor wyświetlania i pamięć.',steps:['Sprawdź monitor, przewód, wybrane wejście i jasność podświetlenia.','Ustal, czy komputer wykonuje POST: diody diagnostyczne, sygnały dźwiękowe i reakcja systemu.','Testuj RAM pojedynczo, w zalecanych slotach i z modułem zgodnym z platformą.','Zweryfikuj wyjście obrazu, matrycę/taśmę oraz konfigurację grafiki.','Dopiero na podstawie dowodów przejdź do zasilania GPU, firmware i sygnałów płyty.'],next:'Dalsza ścieżka: przypadek „Brak POST / błąd pamięci RAM” lub „Artefakty obrazu / problemy GPU”.'},
    'no-charge': {title:'Brak ładowania baterii',risk:'Nie używaj baterii spuchniętej, gorącej ani uszkodzonej mechanicznie.',steps:['Zweryfikuj zasilacz, moc, przewód oraz rozpoznanie adaptera przez urządzenie.','Sprawdź stan baterii i komunikaty systemowe/firmware.','Obejrzyj port, gniazdo i złącze baterii przy odłączonym zasilaniu.','Dla USB-C sprawdź zgodność profilu PD i linie CC zgodnie z procedurą.','Na podstawie schematu analizuj tor wejściowy, kontroler ładowania i sygnały wykrywania.'],next:'Dalsza ścieżka: przypadek „Laptop nie ładuje baterii”.'},
    'artifacts': {title:'Artefakty grafiki',risk:'Przerwij test, gdy karta osiąga niebezpieczną temperaturę lub występuje zapach/odgłos uszkodzenia.',steps:['Wyklucz monitor, kabel, adapter, port i ustawienia obrazu.','Sprawdź temperatury GPU/VRAM, wentylatory i stan chłodzenia.','Porównaj zachowanie na znanym, stabilnym sterowniku i w innym obciążeniu.','Zapisz moment wystąpienia artefaktów, temperatury i kod błędu sterownika.','W dalszej kolejności rozdziel diagnozę GPU, VRAM, VRM i toru zasilania.'],next:'Dalsza ścieżka: przypadek „Artefakty obrazu / problemy GPU”.'},
    'overheat': {title:'Przegrzewanie i throttling',risk:'Nie blokuj wentylatorów i nie wykonuj długiego testu, gdy temperatura gwałtownie rośnie.',steps:['Zapisz temperaturę w spoczynku i pod krótkim, kontrolowanym obciążeniem.','Oceń drożność radiatora, wentylatora, filtrów i przepływ powietrza.','Sprawdź docisk radiatora, kompletność śrub i kontakt termiczny.','Zweryfikuj obroty, sygnał tach/PWM i ustawienia sterowania chłodzeniem.','Po czynnościach wykonaj ten sam test i porównaj wyniki.'],next:'Dalsza ścieżka: przypadek „Przegrzewanie i throttling”.'},
    'liquid': {title:'Urządzenie po zalaniu',risk:'STOP: nie uruchamiaj urządzenia i nie podłączaj zasilacza. Zabezpiecz baterię zgodnie z procedurą.',steps:['Odłącz zasilacz; nie naciskaj POWER i nie wykonuj testu „czy działa”.','Jeśli jest to bezpieczne i zgodne z instrukcją, odłącz akumulator.','Udokumentuj zakres zalania i obejrzyj płytę, złącza oraz okolice układów pod mikroskopem.','Usuń pozostałości właściwym procesem dla rodzaju zanieczyszczenia i materiałów.','Po pełnym wysuszeniu i kontroli wykonuj pomiary pasywne; uruchomienie dopiero po ocenie ryzyka.'],next:'Dalsza ścieżka: przypadek „Laptop po zalaniu”.'},
    'random-reset': {title:'Losowe restarty',risk:'Zabezpiecz dane przed testami obciążeniowymi i diagnostyką nośnika.',steps:['Sprawdź dzienniki systemowe i zanotuj kody błędów oraz czas restartu.','Odczytaj temperatury i zdarzenia termiczne.','Zweryfikuj RAM, SMART/zdrowie SSD oraz stabilność sterowników.','Sprawdź zasilacz, przewody i zachowanie pod kontrolowanym obciążeniem.','Zmieniaj tylko jedną zmienną naraz i zapisuj wyniki przed/po.'],next:'Utwórz kartę naprawy i porównaj wynik testu pamięci, dysku, temperatur oraz zasilania.'}
  };

  const questions = [
    {q:'Kiedy wolno mierzyć rezystancję obwodu?',a:['Gdy płyta jest odłączona od źródeł energii i rozładowana','Podczas pracy urządzenia','Tylko przy podłączonej baterii'],correct:0,explain:'Pomiar rezystancji i ciągłości wykonuje się na odpowiednio odłączonym i rozładowanym obwodzie.'},
    {q:'Co należy zrobić przed programowaniem kości BIOS?',a:['Wgrać pierwszy znaleziony wsad','Wykonać kopię oryginału i potwierdzić zgodność platformy','Zwiększyć napięcie programatora'],correct:1,explain:'Kopia oryginalnego wsadu i zgodność wariantu płyty są kluczowe.'},
    {q:'Czy niska rezystancja cewki zawsze oznacza zwarcie?',a:['Tak, zawsze','Nie — cewka może mieć bardzo niską rezystancję DC','Tylko gdy jest duża'],correct:1,explain:'Cewka w przetwornicy często ma bardzo niską rezystancję; ważna jest analiza całej szyny i dokumentacji.'},
    {q:'Co zrobić z baterią, która jest spuchnięta lub nadmiernie gorąca?',a:['Kontynuować testy pod obciążeniem','Przebić obudowę, żeby rozładować','Przerwać pracę i zastosować procedurę bezpieczeństwa dla baterii'],correct:2,explain:'Uszkodzona bateria wymaga przerwania pracy i właściwej procedury bezpieczeństwa.'},
    {q:'Na czym opierać dobór zamiennika MOSFET-u?',a:['Wyłącznie na wyglądzie obudowy','Na parametrach, pinoucie, funkcji i warunkach pracy','Na dowolnym elemencie o podobnym rozmiarze'],correct:1,explain:'Obudowa nie wystarcza. Trzeba porównać parametry elektryczne, termiczne, pinout i SOA.'}
  ];

  function openModal(title, kicker, html) {
    const backdrop = $('#contentModal');
    if (!backdrop) return;
    $('#modalTitle').textContent = title;
    $('#modalKicker').textContent = kicker;
    $('#modalBody').innerHTML = html;
    const modal = $('#contentModal .modal');
    if (modal) modal.classList.add('modal-wide');
    document.body.classList.add('modal-open');
    backdrop.classList.remove('hidden');
  }

  function renderPartDetail(part) {
    if (!part) return;
    $('#labPartCode').textContent = part.code;
    $('#labPartGlyph').textContent = part.glyph;
    $('#labPartTitle').textContent = part.title;
    $('#labPartRole').textContent = part.role;
    $('#labPartFunction').textContent = part.fn;
    $('#labPartSymptoms').textContent = part.sym;
    $('#labPartChecks').textContent = part.checks;
    $('#labPartCaution').textContent = part.caution;
    $$('.board-hotspot').forEach(btn => btn.classList.toggle('active', btn.dataset.part === part.id));
    $$('.lab44-part-card').forEach(btn => btn.classList.toggle('selected', btn.dataset.partCard === part.id));
    write('academyLabSelectedPart', part.id);
  }

  function renderParts() {
    const host = $('#labPartsGrid');
    if (!host) return;
    const query = ($('#labPartSearch')?.value || '').trim().toLocaleLowerCase('pl');
    const category = $('#labPartCategory')?.value || 'all';
    const filtered = parts.filter(part => (category === 'all' || part.category === category) && [part.title,part.code,part.role,part.sym,part.tags,part.group].join(' ').toLocaleLowerCase('pl').includes(query));
    $('#labPartCount').textContent = String(filtered.length);
    host.innerHTML = filtered.map(part => `<button type="button" class="lab44-part-card" data-part-card="${part.id}"><span class="lab44-part-card-top"><i>${safe(part.glyph)}</i><small>${safe(part.code)}</small></span><b>${safe(part.title)}</b><span>${safe(part.fn)}</span><em>${safe(part.group)} · ZOBACZ KARTĘ ↗</em></button>`).join('') || '<div class="lab44-empty">Nie znaleziono części. Zmień wyszukiwane hasło lub grupę.</div>';
  }

  const meterSamples = {
    diode: {rail:{value:'0.312',unit:'V',mode:'TEST DIODY',sub:'Przykładowe złącze półprzewodnikowe',result:'Odczyt przykładowy. Porównaj polaryzację, kierunek przewodzenia oraz wynik w przeciwnym kierunku. Wartość zależy od elementu i warunków pomiaru.'},short:{value:'0.018',unit:'V',mode:'TEST DIODY',sub:'Przykładowy niski spadek',result:'Bardzo niski odczyt może wskazywać na równoległą ścieżkę lub zwarcie. Nie wyciągaj wniosku bez sprawdzenia drugiego kierunku i schematu.'},open:{value:'OL',unit:'—',mode:'TEST DIODY',sub:'Przykład przerwy / poza zakresem',result:'OL oznacza przekroczenie zakresu lub brak przewodzenia w tym kierunku. Sprawdź styki, zakres i polaryzację.'},normal:{value:'0.560',unit:'V',mode:'TEST DIODY',sub:'Przykładowy spadek na złączu',result:'Przykładowy odczyt złącza. To nie jest uniwersalna wartość graniczna dla każdej diody.'}},
    resistance:{rail:{value:'42.0',unit:'Ω',mode:'REZYSTANCJA',sub:'Linia szkoleniowa — przykład',result:'Odczyt przykładowy. Interpretuj go względem konkretnej szyny, schematu, temperatury i czasu stabilizacji miernika.'},short:{value:'0.8',unit:'Ω',mode:'REZYSTANCJA',sub:'Przykład niskiej rezystancji',result:'Niska rezystancja może wskazywać na zwarcie, ale także wynikać z niskiej rezystancji odbiornika. Wymaga porównania i dalszej lokalizacji.'},open:{value:'OL',unit:'—',mode:'REZYSTANCJA',sub:'Przykład przerwy / poza zakresem',result:'Sprawdź ciągłość ścieżki i punkty pomiarowe. Upewnij się, że obwód jest odłączony i rozładowany.'},normal:{value:'128',unit:'Ω',mode:'REZYSTANCJA',sub:'Przykładowy obwód',result:'Wartość demonstracyjna, nie specyfikacja płyty. Porównaj z dokumentacją i sprawną płytą tego samego wariantu.'}},
    voltage:{rail:{value:'1.05',unit:'V',mode:'NAPIĘCIE DC',sub:'Przykładowa szyna niskonapięciowa',result:'Wartość demonstracyjna. Rzeczywiste napięcie i warunki pomiaru zawsze potwierdź schematem i dokumentacją konkretnej płyty.'},short:{value:'0.00',unit:'V',mode:'NAPIĘCIE DC',sub:'Przykład braku napięcia',result:'Brak odczytu może wynikać z braku enable, zabezpieczenia, braku wejścia albo usterki regulatora. Nie przesądza o awarii jednego elementu.'},open:{value:'0.02',unit:'V',mode:'NAPIĘCIE DC',sub:'Przykład szyny nieaktywnej',result:'Szyna może nie być aktywna w danym stanie zasilania. Sprawdź sekwencję startową i warunki włączenia.'},normal:{value:'3.30',unit:'V',mode:'NAPIĘCIE DC',sub:'Przykładowa linia standby',result:'Odczyt poglądowy; nazwy i wartości szyn są zależne od konstrukcji.'}},
    continuity:{rail:{value:'BEEP',unit:'OK',mode:'CIĄGŁOŚĆ',sub:'Przykładowe połączenie',result:'Sygnał brzęczyka wskazuje przewodzącą ścieżkę w warunkach testu. Nie potwierdza zdolności przenoszenia obciążenia.'},short:{value:'BEEP',unit:'UWAGA',mode:'CIĄGŁOŚĆ',sub:'Przykład niskiej rezystancji',result:'Brzęczyk może oznaczać połączenie z masą lub równoległą ścieżkę. Sprawdź schemat i rozłącz elementy tylko zgodnie z procedurą.'},open:{value:'OPEN',unit:'BRAK',mode:'CIĄGŁOŚĆ',sub:'Przykład przerwy',result:'Możliwa przerwa, zły styk sondy albo niewłaściwy punkt pomiarowy. Potwierdź na sąsiednich punktach.'},normal:{value:'BEEP',unit:'OK',mode:'CIĄGŁOŚĆ',sub:'Przykładowy tor połączenia',result:'Sprawdź również jakość mechanicznego połączenia i zachowanie pod odpowiednim obciążeniem.'}},
    thermal:{rail:{value:'42.0',unit:'°C',mode:'TERMOWIZJA',sub:'Przykładowa temperatura punktu',result:'Przykład odczytu powierzchniowego. Emisyjność, odbicie, odległość i obciążenie wpływają na wynik.'},short:{value:'78.0',unit:'°C',mode:'TERMOWIZJA',sub:'Przykładowy gorący punkt',result:'Wyższa temperatura może wskazywać obszar strat, ale nie dowodzi, że dany element jest przyczyną. Przerwij test, gdy występuje ryzyko uszkodzeń.'},open:{value:'24.0',unit:'°C',mode:'TERMOWIZJA',sub:'Przykładowe tło stanowiska',result:'Brak wyraźnego wzrostu temperatury nie wyklucza przerwy lub usterki bez strat mocy.'},normal:{value:'36.5',unit:'°C',mode:'TERMOWIZJA',sub:'Przykładowa temperatura',result:'Wartość poglądowa — oceniaj trend i porównuj podobne punkty w tych samych warunkach.'}},
    scope:{rail:{value:'25.0',unit:'MHz',mode:'OSCylOSKOP',sub:'Przykładowy sygnał zegarowy',result:'Przykładowa częstotliwość. Dobierz sondę, pasmo i punkt testowy do konkretnego układu.'},short:{value:'0.0',unit:'Vpp',mode:'OSCylOSKOP',sub:'Brak widocznego przebiegu — przykład',result:'Brak przebiegu może wynikać z braku zasilania, enable, resetu lub niewłaściwej konfiguracji sondy.'},open:{value:'NO CLK',unit:'—',mode:'OSCylOSKOP',sub:'Przykład braku zegara',result:'Potwierdź podstawę czasu, wyzwalanie, masę sondy i poprawny punkt pomiarowy.'},normal:{value:'1.8',unit:'Vpp',mode:'OSCylOSKOP',sub:'Przykładowa amplituda',result:'Amplituda i kształt przebiegu są zależne od sygnału, obciążenia i punktu pomiarowego.'}}
  };

  function runTriage() {
    const key = $('#labQuickSymptom')?.value || 'no-power';
    const device = $('#labQuickDevice')?.value || 'laptop';
    const plan = triagePlans[key]; if (!plan) return;
    const deviceNames = {laptop:'Laptop',desktop:'Komputer stacjonarny',gpu:'Karta graficzna',board:'Płyta główna / elektronika'};
    const deviceName = deviceNames[device] || 'Urządzenie';
    const deviceExtra = device === 'gpu' ? 'Dla karty graficznej dodatkowo sprawdź osadzenie, dodatkowe zasilanie PCIe, chłodzenie i zachowanie w innym komputerze.' : device === 'desktop' ? 'Dla komputera stacjonarnego zweryfikuj również zasilacz ATX, przewody EPS/PCIe i sygnały płyty zgodnie z instrukcją.' : device === 'board' ? 'Dla samej płyty skup się na numerze PCB, rewizji, schemacie, punktach testowych i sekwencji zasilania.' : 'Dla laptopa uwzględnij baterię, gniazdo DC-IN/USB-C, taśmy i kontroler EC.';
    const html = `<div class="lab44-triage-result-head"><span class="lab44-eyebrow">PLAN DIAGNOZY / ${safe(deviceName.toUpperCase())}</span><span class="lab44-case-badge">DO WERYFIKACJI</span></div><h3>${safe(plan.title)}</h3><div class="lab44-triage-risk"><b>Uwaga</b><p>${safe(plan.risk)}</p></div><ol>${plan.steps.map(step=>`<li>${safe(step)}</li>`).join('')}</ol><p class="lab44-triage-extra">${safe(deviceExtra)}</p><p class="lab44-triage-next">${safe(plan.next)}</p><small class="lab44-sim-label">WSTĘPNY PLAN EDUKACYJNY · NIE JEST AUTOMATYCZNĄ DIAGNOZĄ</small>`;
    $('#labQuickTriageResult').innerHTML = html;
    write('academyLabLastTriage',{key,device,createdAt:new Date().toISOString(),title:plan.title,steps:plan.steps});
  }

  function runMeter() {
    const mode = $('#labMeterMode')?.value || 'diode';
    const scenario = $('#labMeterScenario')?.value || 'rail';
    const sample = meterSamples[mode]?.[scenario];
    if (!sample) return;
    $('#labMeterModeLabel').textContent = sample.mode;
    $('#labMeterValue').textContent = sample.value;
    $('#labMeterUnit').textContent = sample.unit;
    $('#labMeterSub').textContent = sample.sub;
    $('#labMeterResult').innerHTML = `<b>Wynik ćwiczenia — ${safe(sample.mode)} / ${safe(scenario.toUpperCase())}</b><p>${safe(sample.result)}</p><small>SYMULACJA EDUKACYJNA · ODCZYT NIE POCHODZI Z FIZYCZNEGO URZĄDZENIA</small>`;
    const safety = mode === 'voltage' ? 'Pamiętaj: pomiar napięcia wykonuj wyłącznie według procedury dla danego urządzenia i przy użyciu odpowiedniej kategorii oraz zakresu przyrządu.' : 'Rezystancję, test diody i ciągłość ćwicz na obwodzie odłączonym i rozładowanym.';
    $('#labMeterResult').dataset.safety = safety;
  }

  function renderCases() {
    const host = $('#labCaseList'); if (!host) return;
    host.innerHTML = cases.map((item,index) => `<button type="button" class="lab44-case-button ${index===0?'active':''}" data-case="${item.id}"><span>0${index+1}</span><b>${safe(item.title)}</b><small>${safe(item.level)}</small><i>↗</i></button>`).join('');
    showCase(cases[0].id);
  }
  function showCase(id) {
    const item = cases.find(entry => entry.id === id); if (!item) return;
    $$('.lab44-case-button').forEach(button => button.classList.toggle('active',button.dataset.case===id));
    $('#labCaseDetail').innerHTML = `<div class="lab44-case-detail-head"><span class="lab44-eyebrow">CASE STUDY / ${safe(item.level)}</span><span class="lab44-case-badge">SCENARIUSZ EDUKACYJNY</span></div><h3>${safe(item.title)}</h3><p class="lab44-case-symptom">${safe(item.symptom)}</p><h4>Kolejność postępowania</h4><ol>${item.steps.map(step=>`<li>${safe(step)}</li>`).join('')}</ol><div class="lab44-case-conclusion"><b>Możliwe obszary przyczyny</b><p>${safe(item.hypothesis)}</p><b>Warunek zakończenia</b><p>${safe(item.accept)}</p></div>`;
  }

  function renderTraining() {
    const host = $('#labTrainingGrid'); if (!host) return;
    const saved = read('academyLabTraining', {});
    host.innerHTML = training.map(item => {
      const done = saved[item.id] || {};
      const totalDone = item.steps.filter((_,idx)=>done[idx]).length;
      const pct = Math.round(totalDone/item.steps.length*100);
      return `<article class="lab44-training-card" data-training="${item.id}"><div class="lab44-training-top"><span>TRAINING PATH / ${safe(item.id.toUpperCase())}</span><b>${pct}%</b></div><h3>${safe(item.title)}</h3><p>${safe(item.desc)}</p><div class="lab44-training-bar"><i style="width:${pct}%"></i></div><div class="lab44-training-steps">${item.steps.map((step,idx)=>`<label><input type="checkbox" data-training-id="${item.id}" data-training-step="${idx}" ${done[idx]?'checked':''}><span>${safe(step)}</span></label>`).join('')}</div></article>`;
    }).join('');
  }

  function renderModels() {
    const host = $('#labModelList'); if (!host) return;
    const models = read('academyLabModels', []);
    host.innerHTML = models.length ? models.slice().reverse().map(item => `<article class="lab44-model-row"><div><b>${safe(item.brand)} · ${safe(item.model)}</b><small>${safe(item.board || 'Brak oznaczenia PCB')} ${item.revision ? '· '+safe(item.revision) : ''}</small>${item.source?`<p>${safe(item.source)}</p>`:''}</div><button type="button" class="lab44-delete-button" data-delete-model="${safe(item.id)}" aria-label="Usuń wpis">Usuń</button></article>`).join('') : '<div class="lab44-empty">Nie zapisano jeszcze modeli. Dodaj pierwszy wpis powyżej.</div>';
  }

  function renderExam() {
    const host = $('#labExamQuestions'); if (!host) return;
    host.innerHTML = questions.map((item,index)=>`<fieldset class="lab44-question"><legend><span>0${index+1}</span>${safe(item.q)}</legend><div>${item.a.map((answer,answerIndex)=>`<label><input type="radio" name="labq${index}" value="${answerIndex}" required><span>${safe(answer)}</span></label>`).join('')}</div></fieldset>`).join('');
  }


  function bind() {
    document.addEventListener('click', event => {
      const hotspot = event.target.closest('[data-part]');
      if (hotspot && partById[hotspot.dataset.part]) { renderPartDetail(partById[hotspot.dataset.part]); return; }
      const partCard = event.target.closest('[data-part-card]');
      if (partCard && partById[partCard.dataset.partCard]) {
        const item = partById[partCard.dataset.partCard];
        openModal(item.title, `${item.code} / ENCYKLOPEDIA ELEMENTÓW`, `<p>${safe(item.role)}</p><div class="lab44-modal-facts"><div><small>FUNKCJA</small><b>${safe(item.fn)}</b></div><div><small>TYPOWE OBJAWY</small><b>${safe(item.sym)}</b></div><div><small>CO SPRAWDZIĆ</small><b>${safe(item.checks)}</b></div><div><small>UWAGA</small><b>${safe(item.caution)}</b></div></div><p><b>Słowa kluczowe:</b> ${safe(item.tags)}</p>`);
        return;
      }
      const caseButton = event.target.closest('[data-case]'); if (caseButton) { showCase(caseButton.dataset.case); return; }
      const delModel = event.target.closest('[data-delete-model]'); if (delModel) { const next=read('academyLabModels',[]).filter(x=>x.id!==delModel.dataset.deleteModel); write('academyLabModels',next); renderModels(); toast('Usunięto wpis modelu z tej przeglądarki.'); return; }
      const jump = event.target.closest('[data-lab-jump]'); if (jump) { const target=$(`#lab44-${jump.dataset.labJump}`); if (target) target.scrollIntoView({behavior:'smooth',block:'start'}); }
      const toParts = event.target.closest('#labPartToEncyclopedia'); if (toParts) { $('#lab44-parts')?.scrollIntoView({behavior:'smooth',block:'start'}); $('#labPartSearch')?.focus({preventScroll:true}); }
    });
    $('#labPartSearch')?.addEventListener('input',renderParts);
    $('#labPartCategory')?.addEventListener('change',renderParts);
    $('#runLabMeter')?.addEventListener('click',runMeter);
    $('#labQuickTriage')?.addEventListener('click',runTriage);
    $('#labTrainingGrid')?.addEventListener('change',event=>{
      const checkbox=event.target.closest('[data-training-id]'); if(!checkbox)return;
      const all=read('academyLabTraining',{}); const id=checkbox.dataset.trainingId; all[id]=all[id]||{}; all[id][checkbox.dataset.trainingStep]=checkbox.checked; write('academyLabTraining',all); renderTraining(); toast('Postęp szkolenia zapisany.');
    });
    $('#labModelForm')?.addEventListener('submit',event=>{
      event.preventDefault(); const form=event.currentTarget; const data=new FormData(form);
      const item={id:`m-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,brand:data.get('brand'),model:String(data.get('model')||'').trim(),board:String(data.get('board')||'').trim(),revision:String(data.get('revision')||'').trim(),source:String(data.get('source')||'').trim(),date:new Date().toLocaleDateString('pl-PL')};
      if(!item.model){toast('Wpisz model urządzenia.');return;} const models=read('academyLabModels',[]); models.push(item); write('academyLabModels',models); form.reset(); renderModels(); toast('Model dodany do lokalnego rejestru.');
    });
    $('#labExamForm')?.addEventListener('submit',event=>{
      event.preventDefault(); const answers=questions.map((_,index)=>Number(new FormData(event.currentTarget).get(`labq${index}`))); if(answers.some(Number.isNaN)){ $('#labExamStatus').textContent='Uzupełnij wszystkie odpowiedzi.'; return; }
      const score=answers.filter((answer,index)=>answer===questions[index].correct).length; const pct=Math.round(score/questions.length*100); const passed=pct>=80;
      $('#labExamStatus').textContent=`Wynik: ${score}/${questions.length} (${pct}%). ${passed?'ZALICZONO':'Spróbuj ponownie — wymagane 80%'}`;
      $('#labCertificateText').textContent=`Wynik: ${score}/${questions.length} (${pct}%) · ${new Date().toLocaleDateString('pl-PL')}`;
      $('#labCertificate').classList.toggle('hidden',!passed);
      const review=questions.map((q,index)=>`<p><b>${index+1}. ${answers[index]===q.correct?'✓ Poprawnie':'✕ Do poprawy'}:</b> ${safe(q.explain)}</p>`).join('');
      openModal(`Wynik egzaminu: ${pct}%`,'EGZAMIN SERWISANTA / INFORMACJA ZWROTNA',`${review}<p><b>${passed?'Gratulacje — zaliczyłeś ćwiczenie.':'Przejrzyj wyjaśnienia i spróbuj jeszcze raz.'}</b></p>`);
      write('academyLabExamLast',{score,pct,passed,date:new Date().toISOString()});
    });
    $('#labPrintCertificate')?.addEventListener('click',()=>window.print());

  }

  function init() {
    if (!$('#view-labplus') || $('#view-labplus').dataset.labInitialized === 'true') return;
    $('#view-labplus').dataset.labInitialized = 'true';
    renderPartDetail(partById[read('academyLabSelectedPart','cpu')] || partById.cpu);
    const stats=$$('.lab44-stats>div>b'); if(stats.length>=4){stats[0].textContent=String(parts.length);stats[1].textContent=String(cases.length);stats[2].textContent='6';stats[3].textContent=String(training.length);}
    renderParts(); renderCases(); renderTraining(); renderModels(); renderExam(); bind(); runTriage();
    const lastExam=read('academyLabExamLast',null); if(lastExam && $('#labExamStatus')) $('#labExamStatus').textContent=`Ostatni wynik: ${lastExam.score}/5 (${lastExam.pct}%) · ${lastExam.passed?'ZALICZONO':'NIEZALICZONO'}`;
    window.ACADEMY_LAB_PRO = {parts,cases,training,openPart:id=>{const part=partById[id]; if(part){renderPartDetail(part);$('#lab44-board')?.scrollIntoView({behavior:'smooth'});}},runMeter};
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
