(function (global, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!global) return;
  global.ACADEMY_FIX179_DATA = api;
  if (global.document) boot(global, api);
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';
  const lessons = [
    {
      id:'board-post', category:'Płyty główne', level:'Ekspert', minutes:18,
      title:'Sekwencja zasilania płyty głównej i diagnostyka braku POST',
      summary:'Od objawu „nie startuje” do uporządkowanej hipotezy: wejście zasilania, linie standby, sygnały sterujące i inicjalizacja platformy.',
      goals:['Rozdzielić brak zasilania, brak POST i brak obrazu.','Opracować mapę obserwacji bez zgadywania uszkodzonego układu.','Zrozumieć, dlaczego same napięcia nominalne nie potwierdzają poprawnej pracy płyty.'],
      theory:['Brak reakcji po naciśnięciu przycisku, start wentylatorów bez POST oraz POST bez obrazu to trzy różne klasy objawów. Zapisz zachowanie diod, wentylatorów, poboru mocy, sygnałów dźwiękowych i zmian po odłączeniu urządzeń zewnętrznych.','Sekwencja zasilania jest sterowana przez kontrolery i sygnały platformy. Obecność napięcia standby nie oznacza, że wszystkie kolejne szyny zostały uruchomione. W laptopach nazwy linii, kolejność i punkty pomiarowe zależą od schematu konkretnej rewizji płyty.','W diagnostyce płyt głównych ważniejsza jest korelacja zdarzeń niż pojedynczy odczyt. Zmierzony punkt, warunki pomiaru, stan urządzenia i moment wykonania muszą być zapisane, inaczej wynik jest trudny do odtworzenia.'],
      workflow:['Potwierdź dokładny model, rewizję PCB, adapter/zasilacz i historię zdarzenia.','Odłącz urządzenia peryferyjne oraz wykonaj oględziny bez zasilania; szukaj korozji, uszkodzeń mechanicznych i śladów przegrzania.','Sprawdź dokumentację serwisową i zidentyfikuj bezpieczne punkty testowe. Nie zakładaj pinoutu na podstawie podobnej płyty.','Zbuduj tabelę: stan spoczynku, próba startu, zachowanie sygnałów i czas wystąpienia objawu. Porównuj tylko pomiary wykonane w zgodnych warunkach.','Po każdej zmianie wykonuj jeden kontrolowany test i zapisuj, czy objaw się zmienił. Nie wymieniaj kilku elementów jednocześnie.'],
      cautions:['Nie wykonuj pomiarów pod napięciem bez kwalifikacji, właściwego wyposażenia i dokumentacji modelu.','Nie zwieraj przypadkowych padów ani pinów w celu „wymuszenia startu”.','Wyniki w symulatorze i przykładowe wartości nie są specyfikacją konkretnej płyty.'],
      quiz:[
        {q:'Wentylatory ruszają, ale komputer nie przechodzi POST. Jaki jest pierwszy właściwy krok?',a:['Spisać objawy, konfigurację i historię zmian, a następnie prowadzić diagnostykę etapami','Od razu przeprogramować BIOS','Wymienić procesor i płytę jednocześnie'],c:0,e:'Najpierw rozdziel objaw od hipotezy. Płyta może uruchamiać część zasilania, ale nie inicjalizować pamięci, CPU lub grafiki.'},
        {q:'Co oznacza obecność napięcia standby?',a:['Potwierdza poprawność całej sekwencji zasilania','Potwierdza jedynie obecność określonej części toru zasilania w danych warunkach','Dowodzi, że BIOS jest uszkodzony'],c:1,e:'Jedna linia nie potwierdza działania wszystkich pozostałych szyn i sygnałów sterujących.'},
        {q:'Dlaczego należy zapisywać warunki pomiaru?',a:['Aby można było powtórzyć i porównać obserwację','Wyłącznie dla estetyki raportu','Aby uniknąć sprawdzania dokumentacji'],c:0,e:'Model, rewizja, stan zasilania, punkt oraz czas pomiaru są niezbędne do interpretacji.'}
      ]
    },
    {
      id:'vrm-thermal', category:'Płyty główne', level:'Ekspert', minutes:16,
      title:'VRM, MOSFET-y i stabilność zasilania CPU/GPU',
      summary:'Rola kontrolera PWM, faz, dławików, kondensatorów, obciążenia i temperatur w układach regulacji napięcia.',
      goals:['Wyjaśnić rolę VRM i podstawowych elementów sekcji.','Odróżnić przeciążenie, przegrzewanie i problem sterowania.','Czytać objawy pod obciążeniem bez przypisywania winy jednemu elementowi.'],
      theory:['VRM przetwarza napięcie wejściowe na niższe, regulowane napięcie potrzebne procesorowi lub GPU. Typowa sekcja obejmuje kontroler, stopnie mocy, dławiki i kondensatory, ale konkretna topologia zależy od projektu płyty.','Liczba faz marketingowych nie jest pełnym opisem jakości sekcji. Znaczenie mają zastosowane elementy, sterowanie, chłodzenie, limity prądowe i sposób rozdziału obciążenia.','Nagły spadek taktowania może być skutkiem limitu mocy, temperatury rdzenia, temperatury VRM, ograniczeń firmware albo problemu z zasilaniem. Rozstrzygnięcie wymaga zestawienia logów, temperatur, zegarów i obciążenia.'],
      workflow:['Zapisz model płyty, CPU/GPU, wersję BIOS/UEFI i konfigurację chłodzenia.','Zbierz logi temperatur, taktowań, limitów mocy i obciążenia w spoczynku oraz w kontrolowanym teście.','Porównaj objaw z ograniczeniami producenta i sprawdź przepływ powietrza oraz montaż radiatorów.','Oddziel limit termiczny od limitu mocy i błędu sterownika; zmieniaj jedną zmienną naraz.','Po naprawie wykonaj powtarzalny test, zapisz warunki i porównaj wyniki przed/po.'],
      cautions:['Nie dotykaj sekcji zasilania podczas pracy.','Nie zwiększaj napięć ani limitów mocy w celu maskowania usterki.','Wartości graniczne odczytuj z dokumentacji konkretnego komponentu.'],
      quiz:[
        {q:'Który zestaw danych najlepiej pomaga odróżnić throttling termiczny od limitu mocy?',a:['Tylko nazwa karty graficznej','Temperatura, taktowanie, pobór mocy, obciążenie i flagi limitów w jednym logu','Kolor podświetlenia wentylatorów'],c:1,e:'Potrzebne są równoczesne odczyty pozwalające powiązać spadek zegara z warunkami pracy.'},
        {q:'Czy większa liczba faz zawsze oznacza lepszą sekcję VRM?',a:['Tak, bez wyjątków','Nie; liczą się też elementy, sterowanie, chłodzenie i projekt','Tak, ale tylko w laptopach'],c:1,e:'Liczba faz bez kontekstu projektu nie pozwala ocenić jakości sekcji.'},
        {q:'Co należy zrobić po wykryciu przegrzewania VRM?',a:['Zwiększyć napięcie CPU','Przerwać test, sprawdzić przepływ powietrza i dokumentację chłodzenia','Wyłączyć wszystkie zabezpieczenia'],c:1,e:'Nie maskuj objawu. Najpierw przywróć bezpieczne warunki chłodzenia i sprawdź specyfikację.'}
      ]
    },
    {
      id:'meter-advanced', category:'Elektronika', level:'Zaawansowany', minutes:15,
      title:'Multimetr w serwisie: ciągłość, rezystancja i napięcie — interpretacja',
      summary:'Dobór trybu pomiaru, wpływ obwodu równoległego, polaryzacji i błędów operatora.',
      goals:['Rozróżnić pomiar napięcia, rezystancji i ciągłości.','Rozpoznać sytuacje, w których pomiar w obwodzie jest mylący.','Zapisać wynik wraz z warunkami i ograniczeniami.'],
      theory:['Woltomierz mierzy różnicę potencjałów i jest włączany równolegle. Omomierz wykorzystuje własny prąd pomiarowy, dlatego rezystancję mierzy się w obwodzie odłączonym od zasilania i po przygotowaniu zgodnym z procedurą.','Wynik rezystancji na płycie może obejmować wiele ścieżek równoległych, elementy półprzewodnikowe i kondensatory. Odczyt zależy od polaryzacji sond, zakresu oraz czasu ustalania się wskazania.','Test ciągłości jest wskaźnikiem niskiej rezystancji według progu danego miernika. Nie potwierdza obciążalności ścieżki ani poprawnej pracy układu w warunkach dynamicznych.'],
      workflow:['Sprawdź stan miernika, przewodów i kategorię bezpieczeństwa odpowiednią do środowiska pracy.','Zidentyfikuj punkt pomiarowy z dokumentacji, nie z podobieństwa wyglądu.','Przed rezystancją odłącz źródła zasilania i przygotuj obwód zgodnie z instrukcją producenta.','Zapisz tryb, zakres, polaryzację, punkt oraz stabilny wynik.','Zweryfikuj odczyt inną metodą lub w innym punkcie, gdy pomiar w obwodzie może być zafałszowany.'],
      cautions:['Nie mierz rezystancji w zasilonym obwodzie.','Nie używaj nieizolowanych końcówek w ciasnych obszarach, gdzie łatwo zewrzeć sąsiednie punkty.','Nie traktuj sygnału brzęczyka jako dowodu sprawności całej ścieżki pod obciążeniem.'],
      quiz:[
        {q:'Dlaczego nie mierzy się rezystancji na zasilonym obwodzie?',a:['Miernik może podać błędny wynik i ulec uszkodzeniu; grozi to także uszkodzeniem badanego układu','Bo rezystancja nie istnieje podczas pracy','Bo każdy multimetr automatycznie wyłącza zasilanie'],c:0,e:'Omomierz wykorzystuje własny sygnał pomiarowy. Obce napięcie może zaburzyć pomiar i uszkodzić sprzęt.'},
        {q:'Co potwierdza test ciągłości?',a:['Pełną sprawność ścieżki przy dowolnym prądzie','Niską rezystancję względem progu danego miernika','Poprawność firmware'],c:1,e:'Brzęczyk nie określa obciążalności ani jakości połączenia w dynamicznych warunkach.'},
        {q:'Dlaczego pomiar rezystancji na płycie może być mylący?',a:['Ponieważ inne elementy mogą tworzyć ścieżki równoległe','Bo płyta nie zawiera rezystorów','Ponieważ wynik zawsze wynosi zero'],c:0,e:'Wynik może obejmować wiele równoległych dróg, elementy półprzewodnikowe i kondensatory.'}
      ]
    },
    {
      id:'scope-signals', category:'Elektronika', level:'Ekspert', minutes:20,
      title:'Oscyloskop: tętnienia, przebiegi i analiza sygnału',
      summary:'Podstawy osi czasu i napięcia, sprzężenia AC/DC, sondy, pasma i bezpiecznej interpretacji przebiegów.',
      goals:['Odczytać skalę czasu i napięcia.','Wyjaśnić różnicę między pomiarem DC i AC.','Zrozumieć ograniczenia sondy i obciążenie badanego punktu.'],
      theory:['Oscyloskop pokazuje zmianę sygnału w czasie. Ustawienia podstawy czasu, skali pionowej, wyzwalania i sprzężenia wpływają na to, co widać na ekranie. Nieprawidłowy dobór może ukryć krótkie zdarzenie lub stworzyć pozorną niestabilność.','Sprzężenie DC pozwala obserwować składową stałą i zmienną, a AC odcina składową stałą, dzięki czemu łatwiej analizować niewielkie tętnienia na dużym napięciu. Interpretacja wymaga znajomości toru pomiarowego.','Sonda, masa i przewody mogą zmieniać zachowanie mierzonego obwodu. W urządzeniach sieciowych i układach o różnych potencjałach masy niewłaściwe podłączenie może być niebezpieczne.'],
      workflow:['Zacznij od schematu, instrukcji oscyloskopu i określenia bezpiecznego punktu odniesienia.','Dobierz sondę, jej tłumienie i kompensację zgodnie z urządzeniem.','Ustaw zakres tak, aby obserwowany przebieg nie był obcięty; kontroluj wyzwalanie.','Porównaj przebiegi w kilku warunkach, notując obciążenie i ustawienia.','Nie wyciągaj wniosku o uszkodzeniu z pojedynczego obrazu bez punktu odniesienia lub dokumentacji.'],
      cautions:['Nie łącz masy oscyloskopu z nieznanym punktem potencjału.','Do pomiarów w układach nieizolowanych używaj wyłącznie właściwej, zatwierdzonej metody i wyposażenia.','Nie traktuj przykładowych przebiegów jako uniwersalnych norm.'],
      quiz:[
        {q:'Co zwykle pozwala zobaczyć sprzężenie AC?',a:['Składową zmienną bez składowej stałej','Tylko średnią wartość napięcia','Temperaturę elementu'],c:0,e:'AC odcina składową stałą, co ułatwia obserwację małych tętnień.'},
        {q:'Co może zmienić wynik pomiaru oscyloskopem?',a:['Sonda i przewód masy','Tylko kolor ekranu','Wyłącznie nazwa pliku zrzutu'],c:0,e:'Sonda ma określoną pojemność i impedancję; źle podłączona masa może zaburzyć obwód.'},
        {q:'Jak interpretować przebieg bez specyfikacji płyty?',a:['Jako pewną diagnozę uszkodzonego układu','Jako obserwację wymagającą porównania z dokumentacją lub punktem odniesienia','Jako dowód, że sprzęt jest sprawny'],c:1,e:'Bez odniesienia nie można ocenić, czy obserwowany sygnał mieści się w normie dla danej rewizji.'}
      ]
    },
    {
      id:'memory-training', category:'Pamięć RAM', level:'Zaawansowany', minutes:14,
      title:'DDR4/DDR5: trening pamięci, XMP/EXPO i niestabilność',
      summary:'Kanały, moduły, profile, trening kontrolera, testy długotrwałe i rozdzielanie problemów RAM/CPU/płyty.',
      goals:['Rozumieć wpływ konfiguracji modułów na kontroler pamięci.','Odróżnić profil pamięci od gwarantowanej pracy każdego zestawu.','Przygotować plan testów bez zmieniania wielu parametrów naraz.'],
      theory:['Kontroler pamięci znajduje się w procesorze, a stabilność zależy od CPU, płyty, BIOS/UEFI, modułów, liczby rang, obsadzenia slotów oraz parametrów sygnałowych. Zgodność typu DDR nie wystarcza do gwarancji stabilności.','XMP i EXPO są profilami rozszerzonymi. Ich zastosowanie może przekraczać ustawienia bazowe kontrolera i zależy od jakości zestawu oraz platformy. Stabilność należy potwierdzić w konkretnym komputerze.','Błędy pamięci mogą wynikać z modułu, slotu, kontrolera CPU, ustawień firmware, temperatur lub zasilania. Jeden test pozytywny nie daje gwarancji braku błędów w każdym obciążeniu.'],
      workflow:['Zapisz dokładny numer zestawu RAM, obsadzenie slotów, płytę, CPU i wersję BIOS.','Przywróć ustawienia bazowe przed porównaniem z profilem XMP/EXPO.','Testuj moduły i sloty według instrukcji płyty, pojedynczo, a potem w konfiguracji docelowej.','Zapisz błędy, czas testu, częstotliwość, timingi i temperatury; powtarzaj test po każdej zmianie.','W razie błędów wróć do bezpiecznych ustawień i zweryfikuj listę QVL oraz aktualizacje firmware.'],
      cautions:['Nie zmieniaj napięć i timingów bez dokumentacji i świadomości ryzyka.','Nie uznawaj braku błędu w krótkim teście za pełną certyfikację stabilności.','Zabezpiecz ważne dane przed eksperymentami z niestabilną platformą.'],
      quiz:[
        {q:'Co najlepiej zrobić, gdy błędy pojawiły się po włączeniu EXPO?',a:['Porównać działanie na ustawieniach bazowych, a następnie testować konfigurację etapami','Od razu zwiększyć wszystkie napięcia','Zignorować błędy, jeśli Windows startuje'],c:0,e:'Kontrolowany powrót do ustawień bazowych pozwala sprawdzić związek między profilem a niestabilnością.'},
        {q:'Czy zgodny typ DDR gwarantuje stabilność całej konfiguracji?',a:['Tak, zawsze','Nie; znaczenie mają także CPU, płyta, BIOS, moduły i obsadzenie slotów','Tylko gdy obudowa ma chłodzenie wodne'],c:1,e:'Stabilność to cecha całej platformy, a nie jedynie samego modułu.'},
        {q:'Jak dokumentować test pamięci?',a:['Tylko zapisać „działa”','Zapisać moduły, sloty, BIOS, profil, czas i wynik testu','Zrobić zdjęcie obudowy bez wyniku'],c:1,e:'Pełny kontekst pozwala powtórzyć test i odtworzyć konfigurację.'}
      ]
    },
    {
      id:'nvme-pcie', category:'Dyski i dane', level:'Ekspert', minutes:18,
      title:'NVMe PCIe: SMART, temperatury, throttling i wydajność',
      summary:'Ocena nośników NVMe bez mylenia wskaźników kondycji, temperatury, błędów łącza i chwilowych spadków transferu.',
      goals:['Interpretować najważniejsze grupy danych SMART/NVMe.','Rozpoznać wpływ temperatury i łącza PCIe.','Ułożyć bezpieczny plan, gdy nośnik znika lub zgłasza błędy.'],
      theory:['SMART jest zbiorem wskaźników producenta. Wartości i nazwy atrybutów mogą się różnić między urządzeniami; pojedynczy procent „health” nie zastępuje odczytu liczników błędów, temperatur, zapisów i historii zdarzeń.','NVMe pracuje przez PCIe. Szerokość łącza, generacja, współdzielenie linii, ustawienia firmware i ograniczenia platformy wpływają na prędkość. Wynik testu sekwencyjnego nie opisuje wszystkich zadań użytkownika.','Przy długim obciążeniu kontroler może ograniczyć wydajność z powodu temperatury. Znikanie dysku może jednak wskazywać także problem slotu, zasilania, firmware, płyty lub samego nośnika.'],
      workflow:['Zabezpiecz ważne dane przed testami obciążeniowymi.','Zapisz model, firmware, temperaturę, licznik zapisów/odczytów i błędy kontrolera.','Zweryfikuj slot, obsługiwaną generację PCIe i współdzielenie linii w dokumentacji płyty.','Wykonaj krótki, kontrolowany test tylko wtedy, gdy stan nośnika i dane na to pozwalają; obserwuj temperaturę i logi.','Przy niestabilności ogranicz zbędne próby, zabezpiecz obraz/kopię i nie uruchamiaj napraw zapisujących na źródle.'],
      cautions:['Nie wykonuj długich testów zapisu na nośniku z objawami awarii i ważnymi danymi.','Nie aktualizuj firmware SSD podczas niestabilnego zasilania.','Odczyt SMART nie gwarantuje, że dysk nie ulegnie awarii.'],
      quiz:[
        {q:'Dysk NVMe znika po nagrzaniu pod obciążeniem. Co należy zestawić?',a:['Temperaturę, logi kontrolera, parametry łącza PCIe i zachowanie w znanych warunkach','Tylko wolne miejsce na partycji','Kolor radiatora SSD'],c:0,e:'Trzeba oddzielić throttling od rozłączenia, błędów łącza i awarii nośnika.'},
        {q:'Czy status SMART „dobry” wyklucza awarię?',a:['Tak','Nie; SMART nie wykrywa każdej możliwej usterki','Tak, pod warunkiem że dysk ma NVMe'],c:1,e:'SMART jest użyteczny, ale nie stanowi gwarancji bezawaryjności.'},
        {q:'Co zrobić przy znikającym nośniku z ważnymi danymi?',a:['Wykonać wielokrotne benchmarki zapisu','Ograniczyć dalsze próby i dobrać bezpieczną metodę obrazowania/odzysku','Zainicjować dysk ponownie'],c:1,e:'Dalsze obciążanie może pogorszyć sytuację. Priorytetem jest bezpieczeństwo danych.'}
      ]
    },
    {
      id:'data-imaging', category:'Dyski i dane', level:'Ekspert', minutes:19,
      title:'Odzyskiwanie danych: triage, obraz nośnika i praca na kopii',
      summary:'Jak odróżnić awarię logiczną od fizycznej, ograniczać zapisy i dokumentować łańcuch pracy z danymi.',
      goals:['Ocenić ryzyko dalszej pracy na nośniku.','Wyjaśnić, dlaczego obrazowanie poprzedza eksperymenty logiczne.','Zrozumieć ograniczenia SSD, TRIM i szyfrowania.'],
      theory:['Pierwsza decyzja w odzyskiwaniu danych dotyczy ryzyka. Przy klikaniu, rozłączaniu, błędach SMART lub nietypowych dźwiękach należy ograniczyć zbędne uruchomienia. Ważne dane mogą wymagać wyspecjalizowanej usługi.','Obraz sektorowy pozwala zachować stan źródła i wykonywać analizę na kopii. Dziennik powinien opisywać źródło, cel, narzędzie, parametry i błędy odczytu; integralność kopii warto weryfikować sumą kontrolną tam, gdzie jest to wykonalne.','W SSD mechanizmy TRIM i garbage collection mogą ograniczyć szanse odzyskania usuniętych danych. Szyfrowanie oznacza, że bez prawidłowego klucza odzyskane bloki mogą pozostać nieczytelne. Nie należy obiecywać obejścia szyfrowania.'],
      workflow:['Ustal, które dane są krytyczne, czy istnieje kopia i czy nośnik jest stabilny.','Nie zapisuj nowych plików na źródle ani nie instaluj na nim oprogramowania do odzysku.','Wybierz metodę odczytu adekwatną do stanu urządzenia; przy fizycznej niestabilności rozważ specjalistyczne obrazowanie.','Wykonaj kopię/obraz na innym nośniku i zapisz błędy, przerwania oraz użyte parametry.','Analizuj system plików i odzyskane pliki na kopii; zweryfikuj integralność i poinformuj o ograniczeniach.'],
      cautions:['Nie formatuj, nie inicjuj i nie uruchamiaj napraw systemu plików na źródle przed zabezpieczeniem danych.','Nie rozbieraj nośników hermetycznych ani nie wykonuj pracy laboratoryjnej bez specjalistycznego zaplecza.','Nie przechowuj haseł i kluczy odzyskiwania w notatkach szkoleniowych.'],
      quiz:[
        {q:'Dlaczego analiza powinna odbywać się na kopii?',a:['Aby zachować źródło i ograniczyć ryzyko zmian na oryginale','Bo kopia zawsze jest szybsza','Ponieważ oryginalny dysk nie ma systemu plików'],c:0,e:'Praca na kopii zmniejsza ryzyko dalszego uszkodzenia lub nadpisania danych źródłowych.'},
        {q:'Jak TRIM wpływa na odzyskiwanie danych SSD?',a:['Zawsze zwiększa szanse odzysku','Może sprawić, że usunięte bloki przestaną być dostępne do odzyskania','Nie ma żadnego wpływu'],c:1,e:'TRIM może umożliwić kontrolerowi zwolnienie bloków i utrudnić odzysk.'},
        {q:'Co należy komunikować klientowi?',a:['Gwarancję odzyskania 100% danych','Uczciwe ograniczenia i ryzyko zależne od stanu nośnika oraz szyfrowania','Obietnicę obejścia każdego hasła'],c:1,e:'Odzysk nie jest gwarantowany. Należy jasno opisać ryzyko i granice techniczne.'}
      ]
    },
    {
      id:'uefi-boot', category:'Windows i UEFI', level:'Zaawansowany', minutes:16,
      title:'UEFI, GPT, ESP i BCD: pełny łańcuch rozruchu Windows',
      summary:'Zależność między firmware, wpisami UEFI, partycją EFI, boot managerem i magazynem BCD.',
      goals:['Opisać kolejne etapy startu w trybie UEFI.','Dopasować sposób naprawy do GPT/MBR i trybu firmware.','Nie modyfikować partycji przed inwentaryzacją i kopią.'],
      theory:['W typowej instalacji UEFI Windows używa dysku GPT oraz partycji systemowej EFI (ESP) z plikami rozruchowymi. Firmware uruchamia wskazany plik EFI, a Windows Boot Manager korzysta z konfiguracji BCD.','Zmiana trybu UEFI/Legacy bez analizy układu dysku może spowodować, że prawidłowa instalacja przestanie być widoczna jako urządzenie rozruchowe. Nie należy losowo przełączać ustawień ani konwertować tablicy partycji.','Awaria startu może wynikać z wpisu firmware, plików ESP, BCD, systemu plików, uszkodzenia nośnika lub zmiany sprzętowej. Kod błędu i stan partycji pomagają wybrać najmniej inwazyjną procedurę.'],
      workflow:['Sprawdź, czy firmware działa w trybie UEFI, jaki jest układ GPT/MBR i czy dysk jest stabilny.','Zapisz listę partycji, ich rozmiary i typy przed jakąkolwiek zmianą.','Zweryfikuj istnienie i zawartość ESP oraz wpisy rozruchowe według dokumentacji Windows.','Dobierz procedurę WinRE/BCD do wykrytego układu; nie kopiuj poleceń bez sprawdzenia numerów woluminów i liter.','Po naprawie wykonaj kilka kontrolowanych restartów i sprawdź logi oraz możliwość odzyskiwania.'],
      cautions:['Nie formatuj ESP ani nie usuwaj partycji EFI „na próbę”.','Nie zmieniaj GPT na MBR bez kopii, planu i potwierdzenia wymagań sprzętowych.','Przed operacją BCD sprawdź, który wolumin zawiera rzeczywistą instalację Windows.'],
      quiz:[
        {q:'Typowy rozruch Windows w trybie UEFI wymaga czego?',a:['ESP z plikami EFI i odpowiednich wpisów rozruchowych','Wyłącznie aktywnej partycji MBR','Tylko wyłączonego Secure Boot'],c:0,e:'UEFI uruchamia program EFI z partycji systemowej, a Boot Manager korzysta z konfiguracji BCD.'},
        {q:'Co zrobić przed naprawą BCD?',a:['Ustalić układ partycji, woluminy i lokalizację instalacji','Usunąć wszystkie wpisy firmware','Zmienić losowo UEFI na Legacy'],c:0,e:'Bez identyfikacji woluminów można zmodyfikować niewłaściwą instalację lub partycję.'},
        {q:'Dlaczego nie należy losowo przełączać UEFI/Legacy?',a:['Może to uniemożliwić rozruch zgodnej instalacji i nie rozwiązuje źródła problemu','Ponieważ zmienia kolor ekranu','Bo każda płyta obsługuje wyłącznie Legacy'],c:0,e:'Tryb firmware musi być zgodny z układem instalacji i wpisami rozruchowymi.'}
      ]
    },
    {
      id:'windows-servicing', category:'Windows i UEFI', level:'Zaawansowany', minutes:17,
      title:'DISM, SFC, WinRE i logi: naprawa systemu bez zgadywania',
      summary:'Kolejność diagnozy uszkodzeń składników Windows, magazynu komponentów, aktualizacji i problemów rozruchu.',
      goals:['Rozróżnić kontrolę plików systemowych i magazynu komponentów.','Wybrać źródło naprawy i zapisać kod błędu.','Ustalić, kiedy przerwać naprawę i zabezpieczyć dane.'],
      theory:['SFC sprawdza chronione pliki systemowe i korzysta ze źródła naprawy dostępnego w systemie. DISM obsługuje obraz Windows i magazyn składników. Polecenia te nie naprawiają fizycznie uszkodzonego SSD ani nie zastępują kopii danych.','Nieudana naprawa może wynikać z braku źródła, błędów magazynu, niezgodnej wersji obrazu, problemu z usługami lub sprzętem. Kod zwrotny i logi są ważniejsze niż automatyczne powtarzanie poleceń.','WinRE zapewnia środowisko odzyskiwania, ale działania takie jak cofanie aktualizacji, odbudowa rozruchu i przywracanie systemu mają różne skutki. Przed wyborem trzeba ocenić, czy dane są zabezpieczone i czy dysk jest stabilny.'],
      workflow:['Zapisz objaw, moment początku, ostatnie aktualizacje i kody błędów.','Sprawdź stan dysku oraz kopię danych przed naprawą systemu.','Oceń integralność obrazu i dobierz źródło naprawy zgodne z wersją/buildem Windows.','Uruchom wspieraną procedurę, zachowaj logi DISM/SFC i analizuj konkretny kod błędu.','Wykonaj kontrolę po restarcie: aktualizacje, dziennik zdarzeń, sterowniki i funkcje objęte naprawą.'],
      cautions:['Nie usuwaj ręcznie katalogów systemowych i magazynu komponentów.','Nie wykonuj napraw zapisujących na niestabilnym nośniku przed zabezpieczeniem danych.','Nie zakładaj, że komunikat „operacja zakończona” oznacza usunięcie pierwotnej przyczyny.'],
      quiz:[
        {q:'Jaka jest właściwa rola SFC?',a:['Kontrola i naprawa chronionych plików systemowych','Testowanie fizycznej powierzchni dysku','Aktualizacja BIOS'],c:0,e:'SFC dotyczy chronionych plików systemowych, a nie diagnostyki sprzętowej.'},
        {q:'Co jest ważne przed użyciem DISM jako źródła naprawy?',a:['Zgodność źródła z wersją i buildem systemu','Kolor obudowy','Liczba wentylatorów'],c:0,e:'Niezgodny obraz może uniemożliwić prawidłową naprawę magazynu komponentów.'},
        {q:'Co zrobić, gdy SSD zgłasza błędy i Windows jest niestabilny?',a:['Najpierw zabezpieczyć dane i ocenić nośnik','Wielokrotnie powtarzać naprawę systemu','Uruchomić benchmark zapisu'],c:0,e:'Naprawa systemu nie może zwiększyć ryzyka utraty danych.'}
      ]
    },
    {
      id:'gpu-artifacts', category:'GPU i obraz', level:'Ekspert', minutes:18,
      title:'GPU: artefakty, VRAM, sterownik, zasilanie i throttling',
      summary:'Metody rozdzielania problemów karty, sterownika, toru obrazu, temperatur i zasilania.',
      goals:['Odróżnić artefakty obrazu od problemu monitora lub przewodu.','Zestawić temperatury, zegary, obciążenie i błędy sterownika.','Zaplanować test A/B bez ryzykownego podkręcania.'],
      theory:['Artefakty mogą pochodzić z GPU/VRAM, niestabilnego profilu, sterownika, kabla, portu, monitora lub toru obrazu. Pierwsza obserwacja wymaga odnotowania, czy błąd widać na zrzucie ekranu, drugim monitorze i poza systemem.','Temperatura rdzenia nie zawsze opisuje temperaturę pamięci lub hotspotu. Odczyty i ich dostępność zależą od modelu i czujników udostępnianych przez producenta.','Awaria pod obciążeniem może wynikać z zasilania, temperatur, sterownika lub sprzętu. Test należy prowadzić przy ustawieniach fabrycznych i monitorować zachowanie w powtarzalnych warunkach.'],
      workflow:['Zapisz model GPU, sterownik, BIOS karty, monitor, przewód, port i ustawienia obrazu.','Przetestuj znany dobry przewód/port/monitor oraz porównaj zrzut ekranu z fotografią obrazu.','Przywróć ustawienia fabryczne GPU i usuń niestandardowe profile.','Wykonaj krótki test w kontrolowanych warunkach, rejestrując temperatury, zegary, pobór mocy i zdarzenia sterownika.','Porównaj wynik z drugim komputerem lub komponentem tylko wtedy, gdy jest to bezpieczne i zgodne ze specyfikacją.'],
      cautions:['Nie zwiększaj napięć i limitów mocy w celu wymuszenia testu.','Przerwij test przy artefaktach, zapachu przegrzania lub niestabilnym zasilaniu.','Nie zakładaj, że każdy błąd obrazu oznacza uszkodzenie GPU.'],
      quiz:[
        {q:'Artefakty widać na monitorze, ale nie ma ich na zrzucie ekranu. Co warto sprawdzić?',a:['Przewód, port i monitor przed diagnozą samego GPU','Wyłącznie dysk systemowy','Tylko profil dźwięku'],c:0,e:'Brak artefaktów na zrzucie może kierować uwagę na tor wyjściowy, kabel lub monitor.'},
        {q:'Jak prowadzić test GPU?',a:['Przy ustawieniach fabrycznych i z zapisem temperatur, zegarów oraz zdarzeń','Z maksymalnym podniesieniem napięcia','Bez monitorowania, aż komputer się wyłączy'],c:0,e:'Kontrolowany, powtarzalny test pozwala bezpieczniej porównać wyniki.'},
        {q:'Czy temperatura rdzenia zawsze wystarcza?',a:['Tak, opisuje wszystkie elementy karty','Nie, pamięć i hotspot mogą mieć inne odczyty','Tak, jeśli wentylatory obracają się'],c:1,e:'Różne czujniki mierzą różne obszary i nie każdy model udostępnia wszystkie dane.'}
      ]
    },
    {
      id:'usb-c-pd', category:'Zasilanie i USB-C', level:'Ekspert', minutes:17,
      title:'USB-C Power Delivery: negocjacja profilu i analiza braku ładowania',
      summary:'Rola CC, przewodu, adaptera, profili PD i ograniczeń urządzenia.',
      goals:['Wyjaśnić, dlaczego sam kształt wtyku nie gwarantuje zasilania.','Ustalić bezpieczną kolejność testów adaptera i przewodu.','Rozróżnić problem negocjacji PD od usterki gniazda lub płyty.'],
      theory:['USB-C opisuje kształt złącza, a nie jedną moc ani funkcję. Obsługa USB Power Delivery zależy od urządzenia, adaptera, przewodu, kontrolera i wynegocjowanego profilu.','Linie CC służą między innymi do wykrywania podłączenia i negocjacji. Przewód o niewłaściwych parametrach może ograniczać funkcje i moc. Zgodność należy sprawdzić w specyfikacji sprzętu.','Brak ładowania może wynikać z adaptera, przewodu, gniazda, kontrolera PD, baterii, firmware albo systemu. Wymiana płyty bez testów nie jest diagnozą.'],
      workflow:['Zapisz model laptopa, obsługiwane porty, wymagany profil zasilania i specyfikację adaptera.','Sprawdź zgodny, sprawny adapter i przewód o potwierdzonych parametrach.','Porównaj zachowanie portów, stan baterii i komunikaty systemu/UEFI.','Oceń gniazdo i mocowanie bez podłączonego zasilania; pomiary elektroniczne wykonuj tylko według dokumentacji.','Po ustaleniu przyczyny wykonaj test ładowania i pracy pod kontrolowanym obciążeniem.'],
      cautions:['Nie wymuszaj napięcia ani profilu niezgodnego z urządzeniem.','Nie zwieraj pinów CC/ VBUS i nie wykonuj przypadkowych pomiarów przy podłączonym źródle.','Nie otwieraj adapterów sieciowych.'],
      quiz:[
        {q:'Czy każdy port USB-C obsługuje ładowanie laptopa?',a:['Tak, zawsze','Nie; funkcje i profile zależą od projektu urządzenia','Tak, jeśli ma niebieską wkładkę'],c:1,e:'USB-C to typ złącza. Obsługa zasilania i PD musi być potwierdzona w dokumentacji.'},
        {q:'Jaki jest właściwy pierwszy test przy braku ładowania?',a:['Sprawdzić zgodny, znany dobry adapter i przewód o odpowiednich parametrach','Wymienić kontroler PD bez diagnozy','Włączyć dowolny profil napięcia'],c:0,e:'Test A/B adaptera i przewodu eliminuje najprostsze przyczyny.'},
        {q:'Co może odpowiadać za brak negocjacji PD?',a:['Adapter, przewód, linie CC, kontroler lub port','Tylko głośnik','Wyłącznie dysk SATA'],c:0,e:'Negocjacja jest zależna od wielu elementów po obu stronach połączenia.'}
      ]
    },
    {
      id:'edp-display', category:'Laptopy i matryce', level:'Zaawansowany', minutes:15,
      title:'Tor obrazu laptopa: eDP, podświetlenie, matryca i zawiasy',
      summary:'Diagnostyka czarnego ekranu z rozdzieleniem problemu panelu, taśmy, zasilania podświetlenia i grafiki.',
      goals:['Rozdzielić problem obrazu od problemu podświetlenia.','Wykorzystać test zewnętrznego monitora jako wskazówkę, nie ostateczny werdykt.','Zrozumieć znaczenie dokumentacji konkretnej konstrukcji.'],
      theory:['Tor obrazu może obejmować GPU, wyjście eDP, taśmę, złącza, panel oraz układ podświetlenia. Objaw „czarny ekran” jest zbyt ogólny, by od razu wymieniać matrycę.','Obraz widoczny pod mocnym światłem może wskazywać na brak podświetlenia, ale wymaga dalszej weryfikacji. Brak obrazu na panelu przy działającym wyjściu zewnętrznym kieruje uwagę na wewnętrzny tor, lecz nie wskazuje jednego elementu.','Taśma eDP może być uszkodzona lub przetarta w okolicy zawiasu. W wielu konstrukcjach przebieg przewodów, złącza i procedura demontażu są specyficzne dla modelu.'],
      workflow:['Zapisz dokładny model i sprawdź serwisówkę, typ panelu oraz procedurę odłączania baterii.','Ustal, czy urządzenie przechodzi POST i czy reaguje na klawiaturę oraz system.','Sprawdź obraz zewnętrzny, latarką oceń obecność słabego obrazu i porównaj jasność/OSD.','Przy odłączonym zasilaniu i baterii skontroluj wizualnie taśmę, złącza i okolice zawiasów zgodnie z instrukcją.','Po ponownym montażu zweryfikuj pełny zakres jasności, rozdzielczość, uśpienie i zmianę kąta ekranu.'],
      cautions:['Nigdy nie odłączaj taśmy matrycy przy włączonym zasilaniu.','Nie podważaj panelu ani ramki bez poznania mocowań danego modelu.','Nie zakładaj, że działający monitor zewnętrzny całkowicie wyklucza problem GPU.'],
      quiz:[
        {q:'Obraz widać pod latarką, ale ekran jest bardzo ciemny. Co należy rozważyć?',a:['Problem z podświetleniem lub jego zasilaniem, wymagający dalszej weryfikacji','Pewną awarię dysku','Pewne uszkodzenie klawiatury'],c:0,e:'Słaby obraz może sugerować brak podświetlenia, ale potrzebna jest kontrola toru panelu.'},
        {q:'Kiedy można odłączać taśmę eDP?',a:['Przy włączonym laptopie','Po pełnym wyłączeniu i odłączeniu zasilania/baterii zgodnie z serwisówką','Podczas aktualizacji BIOS'],c:1,e:'Podłączanie taśmy przy zasilaniu może uszkodzić panel lub płytę.'},
        {q:'Co daje test z monitorem zewnętrznym?',a:['Wskazówkę, czy system generuje obraz na innym wyjściu','Gwarancję sprawności GPU','Pomiar pojemności baterii'],c:0,e:'To test lokalizujący, a nie pełny dowód sprawności całego toru grafiki.'}
      ]
    },
    {
      id:'bios-recovery', category:'BIOS i firmware', level:'Ekspert', minutes:18,
      title:'BIOS/UEFI: aktualizacja, kopia konfiguracji i procedury recovery',
      summary:'Dobór obrazu firmware, kontrola modelu i rewizji, ryzyko przerwania oraz plan przywracania.',
      goals:['Zweryfikować właściwy plik firmware.','Przygotować urządzenie do bezpiecznej aktualizacji.','Opracować plan awaryjny przed wykonaniem operacji.'],
      theory:['Firmware musi odpowiadać dokładnemu modelowi, rewizji płyty i wariantowi sprzętowego. Podobna nazwa produktu nie wystarcza. Niektóre pakiety mają różne regiony, rewizje lub ścieżki aktualizacji.','Aktualizacja może zmienić mikrokod, obsługę CPU/RAM, poprawki bezpieczeństwa i ustawienia. Może też wyczyścić lub zresetować konfigurację, w tym kolejność rozruchu i profile.','Mechanizmy recovery (USB BIOS Flashback, dual BIOS, recovery block) są zależne od producenta i modelu. Nie wolno zakładać, że procedura z jednej płyty działa na innej.'],
      workflow:['Zweryfikuj model, rewizję PCB, wersję obecną, wersję docelową i wymagany etap pośredni.','Pobierz firmware wyłącznie z oficjalnego źródła; sprawdź sumę kontrolną lub podpis, gdy producent je udostępnia.','Zapisz ustawienia UEFI, klucze odzyskiwania wymagane do późniejszego dostępu oraz ważne parametry — bez przechowywania sekretów w notatkach.','Zapewnij stabilne zasilanie i zastosuj procedurę aktualizacji opisaną przez producenta. Nie przerywaj procesu.','Po aktualizacji zweryfikuj wersję, ustawienia, TPM/Secure Boot, wykrywanie dysków i stabilność.'],
      cautions:['Nie instaluj BIOS-u dla podobnego modelu ani nie zmieniaj regionu/rewizji.','Nie aktualizuj przy niestabilnym zasilaniu, przegrzewaniu lub podejrzeniu uszkodzenia płyty.','Nie obiecuj odzyskania po nieudanym flashu bez potwierdzenia mechanizmu recovery.'],
      quiz:[
        {q:'Jaki identyfikator jest kluczowy przy doborze BIOS-u?',a:['Dokładny model i rewizja sprzętowa zgodna z pakietem','Dowolny model z tej samej marki','Kolor PCB'],c:0,e:'Nazwa handlowa może obejmować różne rewizje i warianty.'},
        {q:'Co należy zrobić przed aktualizacją?',a:['Zapisać konfigurację, potwierdzić plik i zapewnić stabilne zasilanie','Wyłączyć wszystkie zabezpieczenia','Odłączyć zasilanie w trakcie zapisu'],c:0,e:'Przygotowanie ogranicza ryzyko i pozwala odtworzyć ustawienia.'},
        {q:'Czy procedura Flashback jest uniwersalna?',a:['Tak','Nie; zależy od modelu i instrukcji producenta','Tak, na każdym laptopie'],c:1,e:'Obsługa recovery jest specyficzna dla konstrukcji.'}
      ]
    },
    {
      id:'network-vlan', category:'Sieci komputerowe', level:'Ekspert', minutes:18,
      title:'Sieci PRO: DHCP, DNS, routing, VLAN i diagnostyka Wi-Fi',
      summary:'Ścieżka pakietu od klienta do Internetu, rozdzielenie problemu warstwy łącza, IP, DNS i routingu.',
      goals:['Czytać konfigurację IP i bramę domyślną.','Odróżnić błąd DHCP, DNS i routingu.','Zrozumieć izolację VLAN i wpływ kanału Wi-Fi.'],
      theory:['DHCP przekazuje klientowi adres, maskę, bramę i serwery DNS. Adres APIPA 169.254.x.x zwykle oznacza, że klient nie uzyskał dzierżawy IPv4, ale przyczynę trzeba ustalić w konkretnej sieci.','DNS rozwiązuje nazwy na adresy, routing przekazuje pakiety między podsieciami, a VLAN logicznie rozdziela domeny rozgłoszeniowe. Komputer może mieć poprawny adres, ale nie mieć dostępu przez błędną bramę lub regułę sieciową.','W Wi-Fi wydajność zależy od pasma, kanału, szerokości kanału, zakłóceń, odległości, anten i liczby klientów. Sam wskaźnik siły sygnału nie opisuje jakości całego połączenia.'],
      workflow:['Zapisz adres IP, maskę, bramę, DNS, interfejs, VLAN/SSID i czas problemu.','Zweryfikuj link fizyczny lub połączenie radiowe, a następnie dzierżawę DHCP.','Testuj kolejno: adres lokalny, bramę, adres publiczny i rozwiązywanie nazwy.','Porównaj klienta z innym urządzeniem i sprawdź VLAN, routing, zaporę oraz reguły DNS.','W Wi-Fi porównaj pasmo/kanał i warunki w miejscu pracy; po zmianach wykonaj test powtarzalny.'],
      cautions:['Nie wyłączaj na stałe zapory ani zabezpieczeń routera w celu testu.','Nie zmieniaj VLAN ani konfiguracji DHCP bez kopii ustawień i dostępu administracyjnego.','Nie publikuj publicznie haseł Wi-Fi, adresów MAC i danych dostępowych.'],
      quiz:[
        {q:'Co najczęściej sugeruje adres 169.254.x.x w IPv4?',a:['Brak uzyskanej dzierżawy DHCP','Potwierdzony dostęp do Internetu','Uszkodzenie DNS na pewno'],c:0,e:'APIPA jest używane, gdy klient nie uzyskał konfiguracji DHCP.'},
        {q:'IP bramy odpowiada, ale nazwy domen nie działają. Co testować dalej?',a:['Rozwiązywanie DNS i konfigurację resolvera','Wymienić RAM','Zmienić rozdzielczość monitora'],c:0,e:'Dostęp do bramy nie potwierdza prawidłowego DNS.'},
        {q:'Jaki jest cel VLAN?',a:['Logiczne rozdzielenie sieci na osobne domeny rozgłoszeniowe','Zwiększenie taktowania CPU','Szyfrowanie dysku'],c:0,e:'VLAN pozwala segmentować sieć logicznie.'}
      ]
    },
    {
      id:'malware-ir', category:'Bezpieczeństwo', level:'Ekspert', minutes:20,
      title:'Reagowanie na infekcję: izolacja, triage, kopie i odtwarzanie',
      summary:'Bezpieczne postępowanie przy podejrzeniu malware, ransomware lub kradzieży poświadczeń.',
      goals:['Odseparować urządzenie bez niszczenia śladów.','Rozpoznać, kiedy eskalować incydent.','Przywracać system z zaufanego źródła i weryfikować konta.'],
      theory:['Podejrzenie infekcji wymaga najpierw ograniczenia ryzyka rozprzestrzeniania i utraty danych. Decyzja o odłączeniu sieci, wyłączeniu urządzenia lub zachowaniu stanu zależy od typu incydentu, roli urządzenia i procedury organizacji.','Ransomware i kradzież poświadczeń mogą dotyczyć nie tylko jednego komputera, ale również kont, udziałów sieciowych, kopii i innych urządzeń. Nie należy podłączać kopii zapasowej do potencjalnie zainfekowanego środowiska bez analizy.','Odtwarzanie z kopii wymaga potwierdzenia jej integralności i tego, że powstała przed incydentem. Poświadczenia resetuje się z czystego urządzenia; aktywne sesje i tokeny mogą wymagać unieważnienia.'],
      workflow:['Zapisz objawy, czas, zakres i komunikaty; nie wpisuj poufnych danych do publicznych narzędzi.','Zastosuj procedurę izolacji urządzenia i zgłoś incydent właściwemu administratorowi lub właścicielowi danych.','Nie kasuj pochopnie logów ani plików, jeżeli wymagane jest zachowanie materiału do analizy.','Przeskanuj środowisko narzędziami z zaufanego źródła i oceń konta, kopie oraz urządzenia współdzielone.','Odtwarzaj na czystym systemie z wiarygodnego obrazu, aktualizuj zabezpieczenia i monitoruj nawroty.'],
      cautions:['Nie płać okupu i nie obiecuj odzyskania danych.','Nie uruchamiaj podejrzanych plików „dla sprawdzenia”.','Przy incydencie firmowym przestrzegaj procedury i obowiązków zgłoszeniowych organizacji.'],
      quiz:[
        {q:'Jaka jest podstawowa zasada przy podejrzeniu ransomware?',a:['Ograniczyć rozprzestrzenianie i uruchomić procedurę incydentu','Podłączyć wszystkie kopie do komputera','Usunąć dzienniki zdarzeń'],c:0,e:'Priorytetem jest containment i ochrona kopii oraz pozostałych zasobów.'},
        {q:'Kiedy resetować hasła?',a:['Z zaufanego, czystego urządzenia, z uwzględnieniem unieważnienia sesji','Na podejrzanym komputerze podczas infekcji','Nigdy'],c:0,e:'Zainfekowane środowisko może przechwytywać nowe hasła i sesje.'},
        {q:'Co potwierdza bezpieczną kopię?',a:['Sam fakt, że plik istnieje','Integralność, właściwa data, odizolowanie i możliwość testowego odtworzenia','To, że znajduje się na tym samym komputerze'],c:1,e:'Kopia musi być sprawdzona i odporna na ten sam incydent.'}
      ]
    },
    {
      id:'thermal-analysis', category:'Chłodzenie i diagnostyka', level:'Zaawansowany', minutes:13,
      title:'Termika PRO: hotspot, throttling, przepływ powietrza i pasta',
      summary:'Analiza temperatury w czasie, rozkładu obciążenia i wpływu montażu chłodzenia.',
      goals:['Rozumieć różnice między temperaturą CPU, GPU, hotspotem i pamięcią.','Rozpoznawać throttling i niewłaściwy przepływ powietrza.','Planować kontrolę po czyszczeniu i wymianie materiałów termicznych.'],
      theory:['Temperatura jest wielkością zależną od obciążenia, otoczenia, profilu wentylatorów i konstrukcji chłodzenia. Pojedynczy odczyt bez czasu i obciążenia ma ograniczoną wartość diagnostyczną.','Hotspot i temperatura średnia mogą różnić się znacząco. Różnica może wynikać z rozkładu ciepła, nacisku radiatora, pasty, podkładek lub konstrukcji układu.','Throttling może być termiczny, energetyczny lub firmware. Analizuj zegary, limity i temperatury jednocześnie; nie zakładaj, że niższa temperatura sama w sobie oznacza poprawną naprawę.'],
      workflow:['Zapisz temperaturę otoczenia, model sprzętu i ustawienia wentylatorów.','Wykonaj pomiar spoczynkowy po ustabilizowaniu systemu.','Przeprowadź kontrolowany test i loguj temperatury, zegary oraz flagi limitów.','Sprawdź drożność kanałów, poprawność montażu i specyfikację materiałów termicznych.','Po naprawie powtórz ten sam test i porównaj przebieg czasowy, a nie tylko maksimum.'],
      cautions:['Nie dobieraj grubości padów termicznych na oko — zbyt grube mogą pogorszyć docisk rdzenia.','Nie uruchamiaj długiego testu przy szybkim wzroście temperatury lub hałasie mechanicznym.','Nie używaj past i materiałów przewodzących bez wiedzy o ryzyku zwarcia.'],
      quiz:[
        {q:'Co jest lepsze do oceny skuteczności chłodzenia?',a:['Porównanie tych samych testów i logów w podobnych warunkach','Jedna temperatura po uruchomieniu','Ocena dotykiem radiatora'],c:0,e:'Powtarzalne warunki umożliwiają porównanie wyników.'},
        {q:'Dlaczego grubość thermal pad jest istotna?',a:['Może zmienić docisk radiatora i kontakt termiczny','Wpływa wyłącznie na kolor płyty','Nie ma znaczenia'],c:0,e:'Nieprawidłowy pad może podnieść radiator i pogorszyć kontakt z rdzeniem.'},
        {q:'Czy spadek zegara zawsze oznacza przegrzewanie?',a:['Tak','Nie; może to być limit mocy, prądu lub firmware','Tylko gdy karta jest nowa'],c:1,e:'Warto analizować wszystkie flagi limitów i warunki pracy.'}
      ]
    },
    {
      id:'virtualization', category:'Windows i UEFI', level:'Zaawansowany', minutes:15,
      title:'Wirtualizacja serwisowa: Hyper-V, VHDX, snapshoty i testy offline',
      summary:'Budowa odizolowanego środowiska do odtwarzania problemów Windows bez ryzykowania głównego systemu.',
      goals:['Wyjaśnić różnicę między dyskiem VHDX a migawką.','Zaprojektować izolowaną maszynę testową.','Rozpoznać ryzyka sieciowe i przechowywania danych.'],
      theory:['Maszyna wirtualna pozwala odtworzyć część scenariuszy systemowych, ale nie odwzorowuje wszystkich zachowań fizycznego sprzętu. Rzeczywiste sterowniki, firmware, GPU i kontrolery mogą działać inaczej.','VHDX jest plikiem wirtualnego dysku. Checkpoint/migawka pozwala wrócić do wcześniejszego stanu, lecz nie zastępuje kopii zapasowej i może zwiększać zapotrzebowanie na miejsce.','Izolacja sieciowa powinna być dobrana do celu testu. Nie uruchamiaj podejrzanych obrazów w sieci produkcyjnej ani z dostępem do danych klientów.'],
      workflow:['Określ cel testu, wersję systemu i wymagane zasoby VM.','Utwórz kopię bazowego obrazu i sprawdź integralność pliku.','Skonfiguruj sieć odizolowaną lub wewnętrzną, bez niepotrzebnego dostępu do LAN.','Utwórz migawkę przed testem, zapisz stan i wykonuj jedną zmianę na raz.','Po teście przywróć stan bazowy i usuń dane tymczasowe zgodnie z polityką retencji.'],
      cautions:['Nie montuj nieznanego VHDX z uprawnieniami zapisu do danych hosta.','Nie traktuj checkpointu jako jedynej kopii ważnych danych.','Pamiętaj, że VM nie jest pełnym substytutem testu na fizycznym sprzęcie.'],
      quiz:[
        {q:'Do czego służy VHDX?',a:['Do przechowywania wirtualnego dysku maszyny','Do aktualizacji BIOS','Do pomiaru temperatury'],c:0,e:'VHDX jest formatem pliku wirtualnego dysku.'},
        {q:'Czy checkpoint zastępuje kopię zapasową?',a:['Tak','Nie; służy do powrotu w ramach środowiska VM i ma inne ograniczenia','Tylko dla serwerów'],c:1,e:'Migawka nie jest niezależną kopią i może zależeć od plików łańcucha dysków.'},
        {q:'Jak testować podejrzane obrazy?',a:['W odizolowanej maszynie z ograniczoną siecią','Na komputerze z danymi klientów','Na produkcyjnym serwerze'],c:0,e:'Izolacja ogranicza ryzyko przeniesienia zagrożenia.'}
      ]
    },
    {
      id:'secureboot-tpm', category:'Bezpieczeństwo', level:'Zaawansowany', minutes:14,
      title:'TPM 2.0, Secure Boot, BitLocker i odzyskiwanie dostępu',
      summary:'Powiązanie stanu platformy, pomiarów rozruchu i kluczy odzyskiwania z bezpieczną obsługą komputera.',
      goals:['Wyjaśnić rolę TPM i Secure Boot.','Rozpoznać, dlaczego zmiana firmware może wywołać żądanie klucza BitLocker.','Stosować procedurę ochrony kluczy i danych.'],
      theory:['TPM może przechowywać lub chronić materiał kryptograficzny i uczestniczyć w pomiarach stanu platformy. Secure Boot weryfikuje zaufane składniki łańcucha rozruchu zgodnie z bazami kluczy.','BitLocker może wiązać automatyczne odblokowanie z pomiarami platformy. Zmiana trybu UEFI, Secure Boot, kolejności rozruchu lub firmware może zmienić stan i spowodować żądanie klucza odzyskiwania.','Klucz odzyskiwania jest wrażliwym sekretem. Serwisant powinien ustalić, czy właściciel ma legalny dostęp do niego, ale nie kopiować go do raportu, czatu ani dziennika ćwiczeń.'],
      workflow:['Przed zmianą firmware/UEFI ustal, czy wolumin jest chroniony BitLockerem.','Potwierdź, że właściciel ma dostęp do klucza odzyskiwania w zaufanym miejscu.','Zapisz stan Secure Boot, TPM, tryb rozruchu i wersję firmware bez kopiowania sekretów.','Wykonaj wyłącznie zaplanowaną zmianę i sprawdź, czy system uruchamia się prawidłowo.','Po operacji zweryfikuj ochronę, stan TPM i ponowne zabezpieczenie woluminu.'],
      cautions:['Nigdy nie proś o przesłanie klucza BitLocker przez publiczny czat.','Nie czyść TPM i nie zmieniaj ustawień Secure Boot bez potwierdzenia skutków.','Nie obiecuj obejścia szyfrowania bez klucza.'],
      quiz:[
        {q:'Dlaczego po aktualizacji BIOS może pojawić się ekran BitLocker Recovery?',a:['Zmienił się mierzony stan platformy lub ustawienia rozruchu','Zawsze uszkodzony jest dysk','Bo TPM nie ma żadnej roli'],c:0,e:'Zmiana firmware i konfiguracji rozruchu może wpłynąć na automatyczne odblokowanie.'},
        {q:'Gdzie należy przechowywać klucz odzyskiwania?',a:['W bezpiecznym, zaufanym miejscu kontrolowanym przez właściciela','W publicznym dzienniku napraw','W tytule zgłoszenia serwisowego'],c:0,e:'Klucz to poufny sekret, nie powinien trafiać do zwykłych notatek.'},
        {q:'Co zrobić przed zmianą trybu UEFI/Secure Boot?',a:['Ustalić stan szyfrowania i dostępność klucza odzyskiwania','Od razu wyczyścić TPM','Usunąć partycję EFI'],c:0,e:'Planowanie zapobiega utracie dostępu do zaszyfrowanych danych.'}
      ]
    },
    {
      id:'professional-report', category:'Serwis i dokumentacja', level:'Zaawansowany', minutes:12,
      title:'Raport techniczny PRO: objaw, hipoteza, dowód, naprawa i test',
      summary:'Jak tworzyć dokumentację, którą inny technik może odtworzyć i na której klient może oprzeć decyzję.',
      goals:['Oddzielić obserwację od wniosku.','Zapisać test potwierdzający i ograniczenia diagnozy.','Przygotować czytelny raport bez danych poufnych.'],
      theory:['Dobry raport zawiera model, konfigurację, opis objawu, warunki odtworzenia, wykonane testy i ich wyniki. Nie wpisuj tylko „naprawiono”; wskaż, co konkretnie potwierdziło przyczynę.','Hipoteza jest propozycją wyjaśnienia, a dowód wynika z powtarzalnego testu lub pomiaru. Raport powinien oznaczać, które elementy są potwierdzone, prawdopodobne lub nadal niezweryfikowane.','Wynik po naprawie musi odnosić się do pierwotnego problemu. Gdy usterka jest okresowa, opisz czas testu i warunki, zamiast deklarować absolutną pewność.'],
      workflow:['Zapisz dokładny model i wersję sprzętu oraz neutralny opis objawu.','Zbuduj listę hipotez i przy każdej wskaż test, który ją potwierdzi lub wykluczy.','Zapisz narzędzia, ustawienia, warunki i wyniki testów.','Oddziel wykonane czynności od rekomendacji i rzeczy, których nie udało się sprawdzić.','Przed wydaniem sprzętu wykonaj kontrolę końcową i przekaż klientowi zrozumiałe wnioski.'],
      cautions:['Nie umieszczaj haseł, kluczy, danych logowania ani zbędnych danych osobowych.','Nie przedstawiaj przypuszczenia jako potwierdzonej przyczyny.','Nie obiecuj braku przyszłych awarii na podstawie krótkiego testu.'],
      quiz:[
        {q:'Który zapis jest najbardziej wartościowy?',a:['„Naprawione”','„Objaw odtworzono w X; po zmianie Y wykonano test Z przez określony czas, bez ponownego wystąpienia”','„Na pewno było uszkodzone”'],c:1,e:'Raport powinien zawierać odtwarzalny dowód, warunki i ograniczenia.'},
        {q:'Jak oznaczać hipotezę?',a:['Jako potwierdzony fakt','Jako przypuszczenie wymagające testu','Usunąć ją z dokumentacji'],c:1,e:'Czytelne rozróżnienie hipotezy i dowodu zwiększa wiarygodność diagnozy.'},
        {q:'Co należy zrobić z kluczem BitLocker w raporcie?',a:['Wpisać pełny klucz','Nie zapisywać sekretu; opisać jedynie fakt potwierdzenia dostępu','Umieścić go w nazwie pliku'],c:1,e:'Raport powinien minimalizować dane poufne.'}
      ]
    },
    {
      id:'usb-firmware', category:'BIOS i firmware', level:'Zaawansowany', minutes:14,
      title:'Firmware urządzeń i kontrolery: SSD, EC, docki i peryferia',
      summary:'Zasady oceny aktualizacji firmware urządzenia, zgodności, zasilania i planu rollbacku.',
      goals:['Odróżnić sterownik od firmware.','Ocenić ryzyko aktualizacji urządzenia peryferyjnego.','Przygotować kontrolę wersji i procedurę odzyskania.'],
      theory:['Sterownik działa w systemie operacyjnym i udostępnia funkcje urządzenia. Firmware jest kodem wykonywanym przez samo urządzenie lub jego kontroler. Aktualizacja firmware może mieć inne ryzyko niż instalacja sterownika.','Wiele urządzeń ma kilka kontrolerów i niezależne wersje firmware. Producent może publikować pakiety dla konkretnego SKU, regionu lub rewizji. Należy czytać release notes i warunki aktualizacji.','Niektóre aktualizacje nie mają wspieranej ścieżki powrotu. Utrata zasilania, odłączenie urządzenia lub błędny plik mogą zakończyć się trwałą utratą funkcji.'],
      workflow:['Zidentyfikuj urządzenie po dokładnym modelu, numerze produktu i rewizji.','Odczytaj aktualną wersję i sprawdź oficjalne informacje o wydaniu.','Zweryfikuj warunki producenta, zasilanie, połączenie i wymagane wersje pośrednie.','Zapisz konfigurację i zaplanuj sposób odzyskania przed startem.','Po aktualizacji sprawdź wersję, funkcje, logi i stabilność po ponownym podłączeniu.'],
      cautions:['Nie korzystaj z firmware dla urządzenia o podobnej nazwie.','Nie odłączaj urządzenia w czasie zapisu.','Nie zakładaj możliwości rollbacku, jeśli producent go nie opisuje.'],
      quiz:[
        {q:'Czym różni się firmware od sterownika?',a:['Firmware jest kodem urządzenia/kontrolera, sterownik działa po stronie systemu','To dokładnie to samo','Sterownik jest zawsze zapisany w BIOS płyty'],c:0,e:'Aktualizacje firmware i sterowników mają odmienny zakres i ryzyko.'},
        {q:'Co należy zweryfikować przed aktualizacją?',a:['Dokładny model/SKU, wersję, release notes i warunki producenta','Wyłącznie markę urządzenia','Dowolny plik znaleziony w sieci'],c:0,e:'Wariant sprzętu i procedura są kluczowe.'},
        {q:'Czy rollback jest zawsze dostępny?',a:['Tak','Nie, zależy od urządzenia i producenta','Tak, przez odłączenie zasilania'],c:1,e:'Niektóre urządzenia nie wspierają powrotu do poprzedniego firmware.'}
      ]
    },
    {
      id:'pcie-lanes', category:'Płyty główne', level:'Ekspert', minutes:16,
      title:'PCIe, M.2 i współdzielenie linii: topologia platformy',
      summary:'Jak czytać instrukcję płyty, rozdział linii CPU/chipset i ograniczenia slotów.',
      goals:['Rozumieć różnicę między fizycznym x16 a elektrycznym x4.','Odnaleźć współdzielone porty w dokumentacji płyty.','Rozpoznać, dlaczego dodanie urządzenia wyłącza inny port.'],
      theory:['Złącze PCIe może mieć fizyczną długość x16, ale elektrycznie obsługiwać mniejszą liczbę linii. Liczba linii i generacja wpływają na przepustowość, a ich dostępność zależy od CPU i chipsetu.','Sloty M.2 mogą współdzielić linie z portami SATA lub innymi slotami PCIe. Instrukcja płyty opisuje, które porty są wyłączane lub ograniczane przy określonej konfiguracji.','Transfer SSD lub karta rozszerzeń mogą działać poniżej maksymalnej wartości z powodu topologii, generacji, szerokości łącza, temperatury lub ograniczeń platformy.'],
      workflow:['Zapisz model płyty, CPU i wszystkie zainstalowane urządzenia PCIe/M.2/SATA.','Odszukaj tabelę współdzielenia linii w instrukcji płyty.','Sprawdź generację i szerokość łącza raportowaną przez system pod obciążeniem.','Porównaj wynik z konfiguracją i instrukcją; wyklucz oszczędzanie energii i ograniczenia termiczne.','Zmieniaj slot tylko po wyłączeniu i odłączeniu zasilania, zgodnie z dokumentacją.'],
      cautions:['Nie wkładaj modułów do slotu bez sprawdzenia klucza, długości i zgodności.','Nie zakładaj, że każdy slot M.2 obsługuje NVMe — część może być SATA-only.','Nie oceniaj wydajności wyłącznie na podstawie syntetycznego transferu.'],
      quiz:[
        {q:'Co oznacza fizyczny slot x16 pracujący elektrycznie jako x4?',a:['Złącze ma długość x16, ale dostępne są cztery linie PCIe','Urządzenie ma szesnaście kontrolerów','Płyta jest uszkodzona'],c:0,e:'Fizyczny rozmiar nie gwarantuje liczby aktywnych linii.'},
        {q:'Dlaczego port SATA może przestać działać po instalacji M.2?',a:['Płyta może współdzielić linie/porty zgodnie z topologią','Zawsze przez wirusa','Bo SATA nie obsługuje dysków'],c:0,e:'Konkretną mapę współdzielenia opisuje instrukcja płyty.'},
        {q:'Czy każdy slot M.2 obsługuje NVMe?',a:['Tak','Nie; może obsługiwać SATA, NVMe lub określony wariant','Tylko przy Wi-Fi 6'],c:1,e:'Interfejs i kluczowanie należy zweryfikować dla danego slotu.'}
      ]
    },
    {
      id:'wifi-spectrum', category:'Sieci komputerowe', level:'Zaawansowany', minutes:14,
      title:'Wi-Fi PRO: kanały, szerokość, zakłócenia i roaming',
      summary:'Diagnoza niestabilności bez pochopnej wymiany routera lub karty sieciowej.',
      goals:['Wyjaśnić różnice między pasmami 2,4/5/6 GHz.','Ocenić wpływ kanału, szerokości i zakłóceń.','Zaproponować kontrolowany test zasięgu i przepustowości.'],
      theory:['Pasmo 2,4 GHz zapewnia zwykle większy zasięg, ale ma ograniczoną liczbę kanałów i jest bardziej zatłoczone. Pasma 5 i 6 GHz mogą oferować większą przepustowość przy mniejszym zasięgu i zależności od przeszkód.','Szerokość kanału wpływa na możliwą przepustowość i podatność na zakłócenia. W zatłoczonym środowisku szerszy kanał nie zawsze daje lepszy wynik.','Roaming, band steering, sterowniki i anteny wpływają na doświadczenie użytkownika. Test należy wykonać w kilku lokalizacjach, o podobnej porze i z tym samym serwerem testowym.'],
      workflow:['Zapisz model routera, punkt dostępu, kartę Wi-Fi, sterownik, pasmo i kanał.','Porównaj test blisko routera i w miejscu występowania problemu.','Sprawdź obciążenie kanału, szerokość, RSSI i ponowne połączenia.','Wykonaj zmianę jednej cechy konfiguracji i powtórz identyczny test.','Po zmianie monitoruj stabilność, opóźnienia i roaming, nie tylko maksymalny transfer.'],
      cautions:['Nie wyłączaj szyfrowania Wi-Fi dla testu.','Nie ustawiaj automatycznie najszerszego kanału w zatłoczonym środowisku.','Nie publikuj haseł ani konfiguracji dostępowej.'],
      quiz:[
        {q:'Czy najszerszy kanał Wi-Fi zawsze jest najlepszy?',a:['Tak','Nie; zakłócenia i zatłoczenie mogą obniżyć stabilność','Tak, ale tylko w 2,4 GHz'],c:1,e:'Szerokość kanału trzeba dobrać do warunków radiowych.'},
        {q:'Jak porównać zasięg i wydajność?',a:['W kilku lokalizacjach w powtarzalnych warunkach','Jednym testem obok routera','Wyłącznie po liczbie kresek'],c:0,e:'Testy w kilku punktach ujawniają wpływ odległości i przeszkód.'},
        {q:'Dlaczego 2,4 GHz bywa wolniejsze?',a:['Często jest bardziej zatłoczone i ma mniej dostępnych kanałów','Ponieważ nie przesyła danych','Bo nie działa z laptopami'],c:0,e:'Współdzielenie pasma i zakłócenia obniżają jakość transmisji.'}
      ]
    },
    {
      id:'battery-health', category:'Laptopy i matryce', level:'Zaawansowany', minutes:13,
      title:'Baterie laptopów: raport, cykle, kalibracja i bezpieczna ocena',
      summary:'Odczyt pojemności projektowej i pełnej, cykli oraz ograniczenia raportów systemowych.',
      goals:['Interpretować pojemność projektową i aktualną.','Rozpoznać objawy fizycznego uszkodzenia baterii.','Unikać niebezpiecznych prób regeneracji pakietów.'],
      theory:['Raport baterii może pokazywać pojemność projektową, pełną pojemność ładowania, historię i szacowany czas. Wyniki zależą od firmware baterii i nie zastępują profesjonalnego testera.','Zużycie pojemności nie jest jedynym kryterium bezpieczeństwa. Spuchnięcie, zapach, nadmierne nagrzewanie lub uszkodzenie mechaniczne wymagają przerwania użytkowania i zastosowania procedury producenta.','Kalibracja może poprawić dokładność wskaźnika poziomu w niektórych modelach, ale nie przywraca chemicznie utraconej pojemności. Nie należy rozładowywać uszkodzonej baterii do zera.'],
      workflow:['Zapisz model baterii, raport systemowy i zachowanie przy zasilaniu sieciowym.','Porównaj pojemność projektową i pełną oraz historię cykli.','Oceń obudowę i touchpad pod kątem oznak spuchnięcia, bez naciskania ogniw.','Zweryfikuj zalecenia producenta i ewentualną procedurę diagnostyczną.','Wymień baterię na zgodny, certyfikowany wariant; zutylizuj uszkodzoną według lokalnych zasad.'],
      cautions:['Nie przebijaj, nie ściskaj i nie otwieraj pakietu baterii.','Nie wykonuj „regeneracji” przez zwieranie styków lub ładowanie poza procedurą.','Przy spuchnięciu przerwij użytkowanie i nie montuj ponownie pakietu.'],
      quiz:[
        {q:'Czy kalibracja przywraca chemiczną pojemność zużytej baterii?',a:['Tak','Nie; może poprawić wskazanie poziomu, ale nie odwraca zużycia ogniw','Tak, jeśli laptop ma USB-C'],c:1,e:'Kalibracja dotyczy estymacji, a nie regeneracji chemicznej.'},
        {q:'Co zrobić przy spuchniętej baterii?',a:['Przerwać używanie i zastosować procedurę bezpiecznej wymiany/utylizacji','Docisnąć obudowę','Przebić pakiet, aby usunąć gaz'],c:0,e:'Spuchnięta bateria stanowi zagrożenie i nie powinna być dalej używana.'},
        {q:'Co porównać w raporcie baterii?',a:['Pojemność projektową, pełną pojemność i historię','Wyłącznie jasność ekranu','Tylko nazwę producenta laptopa'],c:0,e:'Te dane pomagają oszacować zużycie w kontekście zachowania baterii.'}
      ]
    },
    {
      id:'root-cause', category:'Serwis i dokumentacja', level:'Ekspert', minutes:16,
      title:'Analiza przyczyny źródłowej: testy A/B, regresja i hipotezy',
      summary:'Metodyczne rozwiązywanie usterek okresowych oraz zapobieganie wymianie sprawnych części.',
      goals:['Tworzyć hipotezy oparte na objawach.','Projektować testy rozdzielające przyczyny.','Potwierdzać naprawę testem regresji.'],
      theory:['Objaw i przyczyna nie są tym samym. Restart pod obciążeniem może wskazywać zasilanie, temperaturę, pamięć, sterownik lub problem płyty. Diagnoza powinna określać, jakie obserwacje wspierają każdą hipotezę.','Test A/B polega na zmianie jednej kontrolowanej zmiennej — na przykład przewodu, modułu RAM, portu lub profilu sterownika. Jeżeli zmienia się kilka elementów naraz, wynik nie wskazuje, który z nich miał znaczenie.','Test regresji sprawdza, czy naprawa nie pogorszyła innych funkcji. Weryfikacja powinna obejmować pierwotny objaw i sąsiednie funkcje, które mogły zostać naruszone.'],
      workflow:['Zdefiniuj objaw w sposób mierzalny i zapisz warunki odtworzenia.','Utwórz listę hipotez od najbezpieczniejszych i najłatwiejszych do sprawdzenia.','Dla każdej hipotezy opisz przewidywany wynik testu potwierdzającego i wykluczającego.','Wykonaj test A/B, zmieniając jedną zmienną; zachowaj oryginalne ustawienie do porównania.','Po naprawie wykonaj test regresji i zapisz ograniczenia diagnozy.'],
      cautions:['Nie wymieniaj drogich podzespołów na podstawie pojedynczego objawu.','Nie wykonuj testów niszczących dane bez zgody i kopii.','Nie ukrywaj wyników sprzecznych z pierwotną hipotezą.'],
      quiz:[
        {q:'Dlaczego test A/B powinien zmieniać jedną zmienną?',a:['Aby wynik wskazywał, która zmiana miała wpływ','Aby skrócić raport do jednego słowa','Bo kilka zmian jest zawsze zabronionych'],c:0,e:'Jedna zmienna ułatwia odróżnienie przyczyny od korelacji.'},
        {q:'Czym jest test regresji?',a:['Sprawdzeniem, czy naprawa nie wprowadziła nowych problemów i czy funkcje nadal działają','Formatowaniem dysku','Zmianą nazwy komputera'],c:0,e:'Test regresji sprawdza skutki naprawy poza samym objawem.'},
        {q:'Co zrobić, gdy wynik testu przeczy hipotezie?',a:['Zignorować go','Zaktualizować hipotezy i zaplanować kolejny test','Wymienić losową część'],c:1,e:'Diagnoza wymaga reagowania na nowe dowody.'}
      ]
    }
  ];

  const cases = [
    {id:'case-post-ram',title:'Laptop: wentylatory startują, brak POST po rozbudowie RAM',domain:'Płyta / RAM',symptom:'Po wymianie pamięci laptop włącza wentylator, dioda miga, ekran pozostaje czarny. Przed naprawą działał. Dostępna jest dokumentacja producenta, a dane na dysku są ważne.',
      stages:[
        {name:'Diagnoza',prompt:'Która hipoteza jest najbardziej uzasadniona na tym etapie?',options:['Niezgodny moduł, obsadzenie slotu lub nieudany trening pamięci; trzeba wrócić do konfiguracji bazowej','Pewna awaria GPU i konieczność wymiany płyty','Uszkodzenie systemu Windows'],correct:0,why:'Objaw pojawił się bezpośrednio po zmianie RAM. Najpierw należy odwrócić tę zmianę i zweryfikować konfigurację.'},
        {name:'Plan',prompt:'Jaki plan testów najlepiej rozdzieli przyczyny?',options:['Sprawdzić zgodność modułu i sloty według instrukcji, przywrócić poprzedni zestaw, testować jedną zmianę naraz','Aktualizować BIOS i wymieniać CPU jednocześnie','Formatować dysk i instalować Windows'],correct:0,why:'Test A/B z poprzednią konfiguracją oraz pojedynczymi modułami pozwala ocenić wpływ RAM bez ryzyka dla danych.'},
        {name:'Walidacja',prompt:'Co potwierdza zakończenie naprawy?',options:['Kilka poprawnych zimnych startów, rozpoznanie całej pamięci i test stabilności bez błędów','Jedno uruchomienie pulpitu','Samo obrócenie wentylatora'],correct:0,why:'Potrzebny jest powtarzalny start i kontrola pamięci w konfiguracji docelowej.'}
      ]},
    {id:'case-nvme-drop',title:'PC: dysk NVMe znika po kilkunastu minutach pracy',domain:'Dysk / PCIe',symptom:'System działa poprawnie po uruchomieniu. Po kopiowaniu dużych plików SSD znika z systemu, a dziennik zawiera błędy kontrolera. Dane są ważne.',
      stages:[
        {name:'Diagnoza',prompt:'Jaka jest najważniejsza decyzja?',options:['Ograniczyć dalsze obciążanie i zabezpieczyć dane; równolegle ocenić logi i temperaturę','Wykonać wielogodzinny benchmark zapisu','Zainicjować dysk i ponownie utworzyć partycje'],correct:0,why:'Znikanie nośnika i ważne dane wymagają najpierw ograniczenia ryzyka utraty danych.'},
        {name:'Plan',prompt:'Co powinno wejść do planu?',options:['Ocena SMART/NVMe, temperatury, firmware, slotu i linii PCIe; obrazowanie zależnie od stabilności','Od razu sformatować dysk','Wyłączyć logowanie zdarzeń'],correct:0,why:'Przyczyny obejmują nośnik, temperaturę, slot, firmware i platformę. Dane trzeba zabezpieczyć przed testami.'},
        {name:'Walidacja',prompt:'Jaka walidacja jest rozsądna po wymianie lub zmianie?',options:['Powtarzalny test kontrolowany, logi bez rozłączeń i weryfikacja danych z kopii','Jeden test prędkości bez monitoringu','Sprawdzenie wyłącznie wolnego miejsca'],correct:0,why:'Potwierdź stabilność w warunkach, które wcześniej wywoływały objaw, bez ryzykowania oryginalnych danych.'}
      ]},
    {id:'case-gpu-artifact',title:'Stacja robocza: artefakty po rozgrzaniu GPU',domain:'GPU / chłodzenie',symptom:'Po 20 minutach pracy 3D pojawiają się kolorowe punkty. Na zrzucie ekranu artefakty są widoczne. Temperatura rdzenia wygląda prawidłowo, ale nie ma logu hotspotu ani pamięci.',
      stages:[
        {name:'Diagnoza',prompt:'Która hipoteza i dalsza obserwacja są właściwe?',options:['Możliwy problem GPU/VRAM, profilu, sterownika lub zasilania; należy zebrać pełne logi i wykluczyć ustawienia niestandardowe','Pewny problem monitora, mimo artefaktów na zrzucie','Uszkodzenie dysku systemowego'],correct:0,why:'Artefakty w zrzucie kierują uwagę do ścieżki renderowania, ale nie rozstrzygają, czy winny jest GPU, VRAM, sterownik czy profil.'},
        {name:'Plan',prompt:'Jak przygotować test?',options:['Przywrócić ustawienia fabryczne, sprawdzić sterownik i przewód, krótko testować z logiem temperatur, zegarów i mocy','Podnieść napięcie i limit mocy do maksimum','Powtarzać test aż do wyłączenia komputera'],correct:0,why:'Test ma być kontrolowany i bezpieczny. Zmiana napięć może pogorszyć usterkę.'},
        {name:'Walidacja',prompt:'Co powinno zakończyć naprawę?',options:['Brak artefaktów w powtarzalnym teście, stabilne logi oraz test w typowych zadaniach','Samo zniknięcie artefaktów po restarcie','Zamiana kabla bez ponownego testu'],correct:0,why:'Należy potwierdzić poprawę w warunkach odtworzenia objawu i opisać zakres testów.'}
      ]},
    {id:'case-bsod-xmp',title:'PC: BSOD i błędy aplikacji po włączeniu profilu XMP',domain:'RAM / platforma',symptom:'Po aktywacji profilu XMP system uruchamia się, ale czasem występują BSOD i błędy kompilacji. Na ustawieniach bazowych komputer nie był jeszcze testowany.',
      stages:[
        {name:'Diagnoza',prompt:'Co jest najbardziej prawdopodobnym kierunkiem?',options:['Niestabilność konfiguracji pamięci lub kontrolera po zmianie profilu','Pewny malware','Awaria monitora'],correct:0,why:'Związek czasowy z XMP jest silną wskazówką, którą należy zweryfikować testem bazowym.'},
        {name:'Plan',prompt:'Jaki test rozdziela hipotezę?',options:['Przywrócić ustawienia bazowe, wykonać test pamięci, potem stopniowo ocenić profil i QVL','Zwiększyć kilka napięć i timingi jednocześnie','Wymienić kartę graficzną'],correct:0,why:'Przywrócenie bazowych ustawień daje punkt odniesienia, a testy pamięci weryfikują stabilność.'},
        {name:'Walidacja',prompt:'Co jest wystarczającym kryterium?',options:['Brak błędów w powtarzanych testach i pracy typowej, przy zapisanej konfiguracji','Jedno uruchomienie systemu','Wyłączenie raportowania BSOD'],correct:0,why:'Stabilność wymaga powtarzalnych testów, nie ukrywania objawów.'}
      ]},
    {id:'case-usbc-charge',title:'Laptop: nie ładuje przez USB-C, ładuje z innego portu',domain:'USB-C / zasilanie',symptom:'Laptop obsługuje ładowanie przez dwa porty USB-C. Jeden port nie przyjmuje zasilania. Znany dobry adapter i przewód działają z drugim portem.',
      stages:[
        {name:'Diagnoza',prompt:'Co wynika z porównania portów?',options:['Problem może dotyczyć konkretnego portu, jego gniazda lub toru PD; trzeba ocenić specyfikację obu portów','Wszystkie adaptery są uszkodzone','Pewna awaria baterii'],correct:0,why:'Działający drugi port i znany dobry adapter zawężają problem do ścieżki konkretnego portu.'},
        {name:'Plan',prompt:'Jaki jest bezpieczny następny krok?',options:['Sprawdzić funkcje portów w dokumentacji, oględziny przy odłączonym zasilaniu i dalszą diagnostykę zgodnie ze schematem','Wymusić wyższy profil PD','Zewrzeć piny CC'],correct:0,why:'Porty mogą mieć różne funkcje. Nie należy wymuszać profilu ani zwierać pinów.'},
        {name:'Walidacja',prompt:'Jak potwierdzić naprawę?',options:['Sprawdzić negocjację zgodnego profilu, ładowanie i stabilność obu portów zgodnie ze specyfikacją','Sprawdzić tylko ikonę baterii','Uruchomić test GPU'],correct:0,why:'Weryfikacja musi obejmować właściwy port, profil i działanie w czasie.'}
      ]},
    {id:'case-boot-loop',title:'Windows: pętla naprawy po aktualizacji, dane użytkownika są ważne',domain:'Windows / UEFI',symptom:'Komputer po aktualizacji przechodzi do WinRE. Dysk jest wykrywany, lecz nie sprawdzono SMART. Użytkownik nie ma aktualnej kopii.',
      stages:[
        {name:'Diagnoza',prompt:'Jaka powinna być pierwsza decyzja?',options:['Zabezpieczyć dane i ocenić stan dysku przed naprawą rozruchu','Od razu wykonać reset komputera','Usunąć partycję EFI'],correct:0,why:'Dane są ważne, a stan nośnika nieznany. Najpierw trzeba ograniczyć ryzyko.'},
        {name:'Plan',prompt:'Co należy sprawdzić przed operacjami BCD?',options:['SMART/stan nośnika, układ GPT/MBR, ESP i lokalizację instalacji Windows','Tylko nazwę komputera','Tylko ustawienia tapety'],correct:0,why:'Naprawa musi być dostosowana do stanu dysku i faktycznej konfiguracji rozruchu.'},
        {name:'Walidacja',prompt:'Jak sprawdzić rezultat?',options:['Kontrolowany restart, dostęp do danych, aktualizacje i logi; zachowanie kopii','Wyłącznie zniknięcie komunikatu WinRE','Samo otwarcie BIOS'],correct:0,why:'Trzeba potwierdzić uruchomienie oraz dostęp do danych i funkcji systemu.'}
      ]},
    {id:'case-black-screen',title:'Laptop: czarny ekran, system prawdopodobnie startuje',domain:'Matryca / eDP',symptom:'Dioda zasilania świeci, słychać dźwięk logowania. Ekran jest czarny, na monitorze zewnętrznym pojawia się pulpit.',
      stages:[
        {name:'Diagnoza',prompt:'Jaki obszar należy sprawdzić w pierwszej kolejności?',options:['Wewnętrzny tor obrazu: panel, eDP, złącze i podświetlenie','Dysk NVMe bez żadnych innych objawów','Klawiaturę'],correct:0,why:'Wyjście zewnętrzne sugeruje, że system generuje obraz, ale nie rozstrzyga konkretnej części wewnętrznego toru.'},
        {name:'Plan',prompt:'Jak przygotować inspekcję?',options:['Sprawdzić serwisówkę, wyłączyć sprzęt i odłączyć baterię przed kontrolą taśmy','Odłączyć taśmę przy pracującym laptopie','Wymienić matrycę bez oględzin'],correct:0,why:'Bezpieczna inspekcja wymaga wyłączenia i odłączenia zasilania oraz znajomości konstrukcji.'},
        {name:'Walidacja',prompt:'Co powinien obejmować test końcowy?',options:['Obraz, jasność, zmianę kąta pokrywy, uśpienie/wybudzanie i stabilność po restarcie','Tylko wyjście HDMI','Tylko dźwięk startowy'],correct:0,why:'Test musi objąć funkcje wewnętrznego wyświetlacza, które mogły być naruszone.'}
      ]},
    {id:'case-malware',title:'Podejrzenie kradzieży konta i infekcji stacji roboczej',domain:'Bezpieczeństwo',symptom:'Użytkownik zgłasza nieznane logowanie i wyskakujące okno z żądaniem okupu. Komputer ma dostęp do udziałów sieciowych i kopii zapasowych.',
      stages:[
        {name:'Diagnoza',prompt:'Jaka jest właściwa reakcja?',options:['Uruchomić procedurę incydentu, ograniczyć rozprzestrzenianie i nie podłączać kopii','Zignorować alert i kontynuować pracę','Wprowadzić hasła do podejrzanego okna'],correct:0,why:'Ryzyko obejmuje konta i udziały, nie tylko pojedynczy komputer.'},
        {name:'Plan',prompt:'Co powinien zawierać plan?',options:['Izolacja według procedury, zachowanie istotnych logów, analiza z zaufanego środowiska i ocena kopii','Wyłączenie wszystkich zabezpieczeń','Podłączenie dysku backupu i uruchomienie plików'],correct:0,why:'Najpierw containment, dowody i ocena kopii. Działania muszą być zgodne z procedurą organizacji.'},
        {name:'Walidacja',prompt:'Jak wznowić pracę?',options:['Odtworzyć na czystym systemie ze sprawdzonej kopii, zabezpieczyć konta i monitorować','Zapłacić okup i założyć, że problem zniknął','Przywrócić system bez sprawdzenia kopii'],correct:0,why:'Trzeba potwierdzić czystość środowiska, integralność kopii i bezpieczeństwo tożsamości.'}
      ]}
  ];

  const glossary = [
    ['BCD','Boot Configuration Data — magazyn konfiguracji rozruchu Windows.'],
    ['ESP','EFI System Partition — partycja z plikami rozruchowymi dla UEFI.'],
    ['VRM','Voltage Regulator Module — układ regulacji napięcia dla CPU/GPU.'],
    ['POST','Power-On Self-Test — etap kontroli i inicjalizacji sprzętu przy starcie.'],
    ['SMART','Zestaw wskaźników stanu nośnika; nie jest gwarancją braku awarii.'],
    ['TRIM','Polecenie informujące SSD o blokach, które nie muszą być zachowywane.'],
    ['NVMe','Protokół dostępu do pamięci masowej, zwykle przez PCIe.'],
    ['QVL','Qualified Vendor List — lista zweryfikowanych konfiguracji/modułów producenta płyty.'],
    ['XMP / EXPO','Profile rozszerzonych parametrów pamięci RAM.'],
    ['eDP','Embedded DisplayPort — interfejs obrazu używany często w laptopach.'],
    ['USB PD','USB Power Delivery — negocjacja profilu zasilania przez USB-C.'],
    ['TPM','Trusted Platform Module — moduł funkcji bezpieczeństwa i ochrony kluczy.'],
    ['Secure Boot','Mechanizm UEFI weryfikujący zaufane składniki łańcucha rozruchu.'],
    ['VHDX','Format pliku wirtualnego dysku Hyper-V.'],
    ['VLAN','Logiczny segment sieci w ramach infrastruktury przełączanej.'],
    ['DHCP','Protokół automatycznego przydzielania konfiguracji IP.'],
    ['DNS','System tłumaczący nazwy domenowe na rekordy, m.in. adresy IP.'],
    ['Throttling','Automatyczne ograniczenie wydajności, np. z powodu temperatury lub limitu mocy.'],
    ['Test A/B','Porównanie dwóch wariantów przy kontrolowanej zmianie jednej zmiennej.'],
    ['Root cause','Przyczyna źródłowa usterki, potwierdzona dowodami, nie sam objaw.'],
    ['ESD','Wyładowanie elektrostatyczne mogące uszkodzić elektronikę.'],
    ['PCIe lanes','Linie transmisyjne PCI Express; ich liczba i generacja wpływają na przepustowość.']
  ];
  return { version:'6.8.0', fix:179, lessons, cases, glossary };
});

function boot(global, data) {
  'use strict';
  const doc = global.document;
  const root = doc.getElementById('a168ProfessionalSuite');
  if (!root || !doc.getElementById('a179LessonGrid')) return;
  const KEY = 'nauka-od-a-do-z-advanced-fix179-v1';
  const $ = id => doc.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => { try { const value = JSON.parse(global.localStorage.getItem(KEY) || '{}'); return { completed:Array.isArray(value.completed)?value.completed:[], notes:value.notes && typeof value.notes==='object'?value.notes:{}, caseScores:value.caseScores && typeof value.caseScores==='object'?value.caseScores:{}, points:Number(value.points)||0 }; } catch (_) { return {completed:[],notes:{},caseScores:{},points:0}; } };
  const state = read();
  const save = () => { try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { setStatus('Pamięć przeglądarki jest niedostępna. Wyniki pozostaną tylko do końca tej sesji.'); } renderProgress(); };
  const setStatus = message => { const el=$('a179Status'); if(el) el.textContent=message; };
  const award = (id, points, label) => {
    const key=`fix179-${id}`;
    if(state.completed.includes(key)) return false;
    state.completed.push(key); state.points+=points; save();
    if(typeof global.ACADEMY_FIX168_AWARD === 'function') {
      // The existing award callback already writes one journal entry; do not duplicate it.
      global.ACADEMY_FIX168_AWARD(key, points, `FIX179 · ${label}`);
    } else if(typeof global.ACADEMY_FIX168_ADD_JOURNAL === 'function') {
      global.ACADEMY_FIX168_ADD_JOURNAL('Akademia ekspercka FIX179', label, `Ukończono ćwiczenie eksperckie. Przyznano ${points} pkt. Zapis lokalny FIX179.`);
    }
    return true;
  };
  const renderProgress = () => {
    const count=state.completed.filter(x=>x.startsWith('fix179-lesson-')).length;
    const bar=$('a179ProgressBar'); if(bar) bar.style.width=`${Math.round(count/data.lessons.length*100)}%`;
    const a=$('a179ProgressCount'); if(a) a.textContent=`${count}/${data.lessons.length} lekcji zaliczonych`;
    const b=$('a179Points'); if(b) b.textContent=String(state.points);
    const c=$('a179CaseCount'); if(c) c.textContent=`${Object.keys(state.caseScores).length}/${data.cases.length} przypadków przeanalizowanych`;
  };
  let selectedLesson=data.lessons[0];
  let activeQuiz=[];
  const categoryOptions=['Wszystkie kategorie',...new Set(data.lessons.map(x=>x.category))];
  const cat=$('a179Category');
  if(cat) cat.innerHTML=categoryOptions.map((x,i)=>`<option value="${i===0?'all':esc(x)}">${esc(x)}</option>`).join('');
  const renderLessons = () => {
    const host=$('a179LessonGrid'); if(!host)return;
    const query=String($('a179Search')?.value||'').trim().toLocaleLowerCase('pl-PL');
    const category=$('a179Category')?.value||'all';
    const level=$('a179Level')?.value||'all';
    const items=data.lessons.filter(item=>(category==='all'||item.category===category)&&(level==='all'||item.level===level)&&(!query||`${item.title} ${item.summary} ${item.category} ${item.goals.join(' ')}`.toLocaleLowerCase('pl-PL').includes(query)));
    host.innerHTML=items.map(item=>{const done=state.completed.includes(`fix179-lesson-${item.id}`);return `<button type="button" class="a179-lesson-card ${selectedLesson?.id===item.id?'active':''}" data-a179-lesson="${esc(item.id)}"><span class="a179-lesson-meta">${esc(item.category)} · ${esc(item.level)} · ${item.minutes} min</span><strong>${esc(item.title)}</strong><span>${esc(item.summary)}</span><em>${done?'✓ ZALICZONO':'OTWÓRZ LEKCJĘ'} →</em></button>`;}).join('')||'<p class="a168-note">Nie znaleziono lekcji dla wybranych filtrów.</p>';
    host.querySelectorAll('[data-a179-lesson]').forEach(button=>button.addEventListener('click',()=>{const item=data.lessons.find(x=>x.id===button.dataset.a179Lesson);if(item)select(item);}));
  };
  const select = item => {
    selectedLesson=item; activeQuiz=item.quiz.map(()=>null);
    const host=$('a179LessonDetail'); if(!host)return;
    host.innerHTML=`<div class="a179-detail-head"><div><span class="a179-lesson-meta">${esc(item.category)} · ${esc(item.level)} · ${item.minutes} min</span><h4>${esc(item.title)}</h4><p>${esc(item.summary)}</p></div><span class="a179-lesson-status">${state.completed.includes(`fix179-lesson-${item.id}`)?'ZALICZONA':'NOWA LEKCJA'}</span></div>
      <div class="a179-content-grid"><section><h5>Cele nauki</h5><ul>${item.goals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h5>Materiał merytoryczny</h5>${item.theory.map((x,i)=>`<p class="a179-theory"><b>${i+1}.</b> ${esc(x)}</p>`).join('')}<h5>Procedura pracy krok po kroku</h5><ol>${item.workflow.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h5>Bezpieczeństwo i granice</h5><ul class="a179-cautions">${item.cautions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
      <aside class="a179-note-box"><h5>Notatki do tej lekcji</h5><textarea id="a179LessonNote" rows="9" maxlength="4000" placeholder="Wpisuj własne wnioski, ważne pojęcia i pytania. Nie wpisuj haseł ani danych klientów.">${esc(state.notes[item.id]||'')}</textarea><div class="a179-note-actions"><button type="button" class="a168-btn" id="a179SaveNote">Zapisz notatkę</button><button type="button" class="a168-btn" id="a179ExportNote">Eksportuj notatkę</button></div><p class="a168-note">Notatki są przechowywane lokalnie w tej przeglądarce.</p></aside></div>
      <div class="a179-quiz"><h5>Sprawdź wiedzę · 3 pytania</h5>${item.quiz.map((q,i)=>`<fieldset class="a179-question"><legend>${i+1}. ${esc(q.q)}</legend>${q.a.map((answer,j)=>`<label><input type="radio" name="a179q${i}" value="${j}"> <span>${esc(answer)}</span></label>`).join('')}<p class="a179-explain" id="a179Explain${i}" hidden></p></fieldset>`).join('')}<div class="a179-quiz-actions"><button type="button" class="a168-btn primary" id="a179CheckQuiz">Sprawdź odpowiedzi</button><span id="a179QuizStatus" role="status">Zaznacz odpowiedzi na wszystkie pytania.</span></div></div>`;
    $('a179SaveNote')?.addEventListener('click',()=>{state.notes[item.id]=String($('a179LessonNote')?.value||'').slice(0,4000);save();setStatus('Notatka do lekcji została zapisana lokalnie.');});
    $('a179ExportNote')?.addEventListener('click',()=>download(`Notatka_${item.id}_FIX179.txt`,`${item.title}\n\n${$('a179LessonNote')?.value||''}`,'text/plain;charset=utf-8'));
    $('a179CheckQuiz')?.addEventListener('click',()=>{
      const selected=item.quiz.map((_,i)=>{const checked=host.querySelector(`input[name="a179q${i}"]:checked`);return checked?Number(checked.value):null;});
      if(selected.some(x=>x===null)){ $('a179QuizStatus').textContent='Odpowiedz na wszystkie 3 pytania.';return; }
      let score=0;
      item.quiz.forEach((q,i)=>{const ok=selected[i]===q.c;if(ok)score++;const msg=$(`a179Explain${i}`);if(msg){msg.hidden=false;msg.className=`a179-explain ${ok?'good':'bad'}`;msg.textContent=`${ok?'Dobrze.':'Niepoprawnie.'} ${q.e}`;}});
      const passed=score>=2;
      $('a179QuizStatus').textContent=`Wynik ${score}/3 · ${passed?'zaliczone':'spróbuj ponownie — wymagane minimum 2/3'}`;
      if(passed){award(`lesson-${item.id}`,25,`Lekcja: ${item.title}`);$('a179LessonDetail').querySelector('.a179-lesson-status').textContent='ZALICZONA';renderLessons();}
      setStatus(passed?`Zaliczyłeś lekcję „${item.title}”.`:`Wynik ${score}/3. Przeczytaj wyjaśnienia i spróbuj jeszcze raz.`);
    });
    renderLessons();
  };
  $('a179Search')?.addEventListener('input',renderLessons);
  $('a179Category')?.addEventListener('change',renderLessons);
  $('a179Level')?.addEventListener('change',renderLessons);

  let activeCase=data.cases[0];
  const caseSelect=$('a179CaseSelect');
  if(caseSelect)caseSelect.innerHTML=data.cases.map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
  const renderCase=()=>{
    activeCase=data.cases.find(x=>x.id===caseSelect?.value)||data.cases[0];
    const host=$('a179CaseBody'); if(!host)return;
    host.innerHTML=`<span class="a179-lesson-meta">${esc(activeCase.domain)} · CASE STUDY</span><h4>${esc(activeCase.title)}</h4><p class="a179-case-symptom">${esc(activeCase.symptom)}</p>${activeCase.stages.map((stage,i)=>`<label class="a179-case-stage"><b>${i+1}. ${esc(stage.name)}</b><span>${esc(stage.prompt)}</span><select id="a179CaseAnswer${i}"><option value="">Wybierz decyzję…</option>${stage.options.map((option,j)=>`<option value="${j}">${esc(option)}</option>`).join('')}</select><p id="a179CaseWhy${i}" class="a179-explain" hidden></p></label>`).join('')}<div class="a179-quiz-actions"><button type="button" class="a168-btn primary" id="a179CaseEvaluate">Oceń przypadek</button><span id="a179CaseStatus" role="status">Punktacja: diagnoza 30 · plan 40 · walidacja 30.</span></div>`;
    $('a179CaseEvaluate')?.addEventListener('click',evaluateCase);
  };
  const evaluateCase=()=>{
    const answers=activeCase.stages.map((_,i)=>{const value=$(`a179CaseAnswer${i}`)?.value;return value===''||value==null?null:Number(value);});
    if(answers.some(x=>x===null)){ $('a179CaseStatus').textContent='Uzupełnij wszystkie trzy etapy przypadku.';return; }
    const weights=[30,40,30];let score=0;
    activeCase.stages.forEach((stage,i)=>{const ok=answers[i]===stage.correct;if(ok)score+=weights[i];const p=$(`a179CaseWhy${i}`);if(p){p.hidden=false;p.className=`a179-explain ${ok?'good':'bad'}`;p.textContent=`${ok?'Prawidłowa decyzja.':'Ta decyzja jest nieprawidłowa.'} ${stage.why}`;}});
    const passed=score>=70;state.caseScores[activeCase.id]={score,passed,at:new Date().toISOString()};save();
    $('a179CaseStatus').textContent=`Wynik ${score}/100 pkt · ${passed?'zaliczony':'niezaliczony — minimum 70 pkt'}`;
    if(passed)award(`case-${activeCase.id}`,40,`Case study: ${activeCase.title}`);
    setStatus(`Przypadek „${activeCase.title}”: ${score}/100 pkt.`);
  };
  caseSelect?.addEventListener('change',renderCase);renderCase();

  const renderGlossary=()=>{
    const host=$('a179GlossaryResults');if(!host)return;
    const q=String($('a179GlossarySearch')?.value||'').trim().toLocaleLowerCase('pl-PL');
    const items=data.glossary.filter(([term,desc])=>!q||`${term} ${desc}`.toLocaleLowerCase('pl-PL').includes(q));
    host.innerHTML=items.map(([term,desc])=>`<article class="a179-glossary-item"><b>${esc(term)}</b><span>${esc(desc)}</span></article>`).join('')||'<p class="a168-note">Nie znaleziono pojęcia.</p>';
  };
  $('a179GlossarySearch')?.addEventListener('input',renderGlossary);renderGlossary();
  const download=(filename,content,type)=>{try{const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=doc.createElement('a');a.href=url;a.download=filename;a.style.display='none';doc.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(_){setStatus('Przeglądarka zablokowała pobieranie pliku.');}};
  $('a179ExportReport')?.addEventListener('click',()=>{
    const completed=state.completed.filter(x=>x.startsWith('fix179-lesson-'));
    const report={generatedAt:new Date().toISOString(),productVersion:'6.8.0',fix:'FIX179',lessonCount:data.lessons.length,completedLessons:completed.map(key=>data.lessons.find(x=>`fix179-lesson-${x.id}`===key)?.title).filter(Boolean),notes:state.notes,caseScores:state.caseScores,points:state.points,disclaimer:'Raport szkoleniowy. Nie jest formalnym świadectwem kwalifikacji zawodowych.'};
    download('Raport_Akademia_Ekspercka_FIX179.json',JSON.stringify(report,null,2),'application/json;charset=utf-8');
  });
  renderLessons();select(data.lessons[0]);renderProgress();
  setStatus(`Gotowe: ${data.lessons.length} lekcji eksperckich, ${data.cases.length} trudnych przypadków i ${data.glossary.length} haseł słownika.`);
}
