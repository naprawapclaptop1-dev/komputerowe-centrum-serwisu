INSERT OR IGNORE INTO academy_knowledge (id,kind,category,title_pl,title_en,content_pl,content_en,tags,source_ref) VALUES
('lesson:ADV-001','lesson','BIOS / Firmware','Identyfikacja i kopia układu SPI BIOS','SPI BIOS chip identification and backup','Opis: Układ SPI przechowuje firmware platformy, ale nie każdy układ o podobnej obudowie ma ten sam pinout, napięcie ani pojemność. Zanim użyjesz programatora, odczytaj pełne oznaczenie układu, sprawdź rewizję płyty i dokumentację producenta. Najpierw wykonuje się kilka odczytów bez zapisu i porównuje sumy kontrolne. Kopia musi być opisana modelem, rewizją i datą. Nie wolno traktować pliku z innego egzemplarza jako uniwersalnego wsadu.

Objawy: Urządzenie nie przechodzi POST, firmware jest uszkodzony albo producent opisuje procedurę odzyskiwania BIOS. Sam brak obrazu nie dowodzi awarii kości SPI.

Tok diagnostyczny: Rozdziel problem zasilania, POST i firmware. Potwierdź dokładny model, rewizję PCB, oznaczenie kości, napięcie programowania i ewentualne szyfrowanie/regiony obrazu. Sprawdź czy platforma ma drugi układ, EC lub procedurę USB BIOS Flashback.

Kroki: 1. Zrób zdjęcie oznaczenia kości i całej płyty.
2. Znajdź dokumentację producenta dla dokładnego modelu i rewizji.
3. Porównaj oznaczenie układu z notą katalogową i sprawdź napięcie I/O.
4. Wykonaj co najmniej dwa odczyty bez zapisu i porównaj SHA-256.
5. Zachowaj oryginalne pliki kopii w dwóch niezależnych lokalizacjach.
6. Zapis lub weryfikację wykonuj wyłącznie według procedury producenta i po potwierdzeniu właściwego obrazu.

Naprawa: Jeśli procedura producenta dopuszcza programowanie zewnętrzne, użyj właściwego adaptera napięciowego i potwierdzonego obrazu. Nie kasuj oryginalnej kopii; po zapisie wykonaj pełny odczyt kontrolny i porównanie. W razie braku pewności zleć pracę serwisowi specjalizującemu się w firmware.

Weryfikacja: Płyta wykonuje kilka zimnych startów, przechodzi POST, zachowuje prawidłową konfigurację i identyfikację urządzeń. Zapisz numer wersji firmware i wynik weryfikacji pliku.

Ostrzeżenie: Nie podłączaj programatora do nieznanego układu pod napięciem. Błędne napięcie lub orientacja klipsa może trwale uszkodzić kość i płytę.

Źródło: https://uefi.org/specifications','Overview: SPI flash stores platform firmware, but packages that look alike may differ in pinout, voltage and capacity. Before using a programmer, read the full chip marking and confirm board revision and vendor documentation. Start with multiple read-only dumps and compare hashes. Label the backup with model, board revision and date. A dump from another unit is not a universal image.

Symptoms: No POST, corrupted firmware symptoms or a vendor-documented BIOS recovery case. A blank display alone does not prove SPI failure.

Diagnostic reasoning: Separate power, POST and firmware symptoms. Confirm exact model, PCB revision, chip marking, programming voltage and any image regions or protection. Check for a second flash device, EC dependency or vendor USB BIOS Flashback procedure.

Steps: 1. Photograph the chip marking and full board.
2. Find vendor documentation for the exact model and revision.
3. Match the chip marking to its datasheet and confirm I/O voltage.
4. Make at least two read-only dumps and compare SHA-256 hashes.
5. Keep original backups in two independent locations.
6. Only program or verify using the vendor procedure and a confirmed image.

Repair: If vendor procedure permits external programming, use the correct voltage adapter and verified image. Never discard the original dump; after programming, perform a full read-back and comparison. Refer uncertain cases to a firmware specialist.

Verification: The board completes repeated cold starts and POST, retains configuration and detects devices. Record firmware version and image verification result.

Warning: Do not connect a programmer to an unidentified powered circuit. Incorrect voltage or clip orientation can permanently damage the flash chip and board.

Source: https://uefi.org/specifications','SPI,BIOS,firmware,flash,backup','https://uefi.org/specifications'),
('lesson:ADV-002','lesson','Płyta główna / Zasilanie','Analiza sekwencji zasilania EC/KBC','EC/KBC power-sequence analysis','Opis: Kontroler EC/KBC zarządza częścią funkcji platformy: przyciskiem zasilania, klawiaturą, ładowaniem i etapami startu. Sekwencja zależy od modelu płyty i nie może być odtwarzana z uniwersalnej listy napięć. Technik porównuje sygnały standby, reset, power-good i enable z właściwym schematem oraz dokumentacją układów. Pojedynczy pomiar nie potwierdza uszkodzenia EC.

Objawy: Brak reakcji przycisku, krótkie mignięcie diody, brak startu wentylatora lub zatrzymanie przed POST. Objawy mogą też pochodzić z toru wejściowego albo zwarcia.

Tok diagnostyczny: Zidentyfikuj wejście zasilania, linie czuwania, warunki resetu EC i sygnały żądania startu. Ustal, czy EC ma prawidłowe zasilanie i zegar według dokumentacji, zanim rozważysz firmware lub wymianę układu.

Kroki: 1. Zapisz pełny model i rewizję płyty.
2. Przy odłączonym zasilaniu wykonaj oględziny złącza, korozji i uszkodzeń.
3. Odczytaj schemat blokowy i nazwy sygnałów dla tej płyty.
4. Zweryfikuj zasilanie standby oraz warunki resetu zgodnie z notą układu.
5. Obserwuj kolejność sygnałów oscyloskopem tylko na znanych punktach i przy bezpiecznych warunkach.
6. Porównaj wynik z dokumentacją lub sprawną płytą tej samej rewizji.

Naprawa: Naprawiaj przyczynę potwierdzoną pomiarami: zasilanie czuwania, uszkodzone połączenie, element resetu albo firmware zgodny z producentem. Wymiana EC/KBC wymaga zgodności układu, wsadu i narzędzi programujących.

Weryfikacja: Powtarzalny start, prawidłowa obsługa przycisku, klawiatury, ładowania i stanów uśpienia. Potwierdź brak nieoczekiwanych restartów.

Ostrzeżenie: Nie zwieraj nieznanych pinów ani nie podawaj napięcia na linie EC. Przerwij przy nadmiernym nagrzaniu lub niepewnym punkcie masy.

Źródło: https://uefi.org/specifications','Overview: The EC/KBC controls platform functions such as the power button, keyboard, charging and startup stages. The sequence is board-specific; it cannot be reconstructed from a universal voltage checklist. Compare standby, reset, power-good and enable signals with the matching schematic and component datasheets. One measurement does not prove an EC failure.

Symptoms: No power-button response, brief LED flash, no fan spin or halt before POST. Input power faults or a short may cause similar symptoms.

Diagnostic reasoning: Identify input power, standby rails, EC reset conditions and power-request signals. Confirm EC supply and clock against documentation before considering firmware or chip replacement.

Steps: 1. Record the exact model and board revision.
2. With power disconnected, inspect connectors, corrosion and damage.
3. Read the block diagram and signal names for this board.
4. Verify standby supply and reset conditions using the controller datasheet.
5. Observe signal order only at documented test points under safe conditions.
6. Compare results with documentation or a known-good board of the same revision.

Repair: Repair only the cause confirmed by measurements: standby supply, connection, reset component or vendor-matched firmware. EC/KBC replacement requires chip, firmware and programming-tool compatibility.

Verification: Repeatable startup and correct power-button, keyboard, charging and sleep-state behaviour. Confirm no unexpected resets.

Warning: Do not short unidentified pins or inject voltage into EC lines. Stop if abnormal heating or an uncertain ground reference is present.

Source: https://uefi.org/specifications','EC,KBC,standby,power sequence,POST','https://uefi.org/specifications'),
('lesson:ADV-003','lesson','Płyta główna / Elektronika','Diagnostyka przetwornicy buck VRM','Buck converter VRM diagnostics','Opis: Przetwornica buck obniża napięcie wejściowe do wartości wymaganej przez procesor, pamięć lub inne obciążenie. Jej topologia, sterownik, częstotliwość i punkty kontrolne zależą od platformy. Analiza powinna zaczynać się od identyfikacji kontrolera, cewek, faz, MOSFET-ów i kondensatorów na schemacie. Rezystancja niska na linii CPU nie oznacza automatycznie zwarcia — trzeba uwzględnić konstrukcję obciążenia.

Objawy: Brak POST, wyłączanie pod obciążeniem, cykliczny start, niestabilna praca lub nieprawidłowa temperatura sekcji zasilania.

Tok diagnostyczny: Porównaj sygnały enable, power-good i wyjście przetwornicy z dokumentacją sterownika. Oddziel uszkodzenie wejścia, sterownika, elementów mocy i przeciążenie odbiornika.

Kroki: 1. Zidentyfikuj kontroler i rewizję płyty.
2. Przy odłączonym zasilaniu obejrzyj MOSFET-y, cewki i kondensatory.
3. Znajdź w schemacie wejście, wyjście, masę i sygnały kontrolne.
4. Zmierz rezystancję tylko na odłączonej płycie i porównaj z projektem lub znaną sprawną płytą.
5. Pomiary oscyloskopowe wykonuj wyłącznie na udokumentowanych punktach przez technika.
6. Zapisz warunki testu i temperaturę przed oraz po naprawie.

Naprawa: Wymień wyłącznie element o potwierdzonej usterce i zachowaj parametry zgodne z projektem. Po naprawie zweryfikuj sterowanie, stabilność wyjścia i zachowanie w kontrolowanym obciążeniu.

Weryfikacja: Powtarzalny POST, brak restartów, stabilne działanie pod obciążeniem i brak nienormalnego nagrzewania. Porównaj parametry z dokumentacją platformy.

Ostrzeżenie: Sekcja VRM może mieć wysokie prądy. Nie wykonuj testów pod obciążeniem bez osłon, właściwych sond i kwalifikacji.

Źródło: https://www.infineon.com/cms/en/product/power/','Overview: A buck converter steps an input rail down for the CPU, memory or another load. Topology, controller, switching frequency and test points are platform-specific. Begin by identifying the controller, inductors, phases, MOSFETs and capacitors from the schematic. Low resistance on a CPU rail does not automatically mean a short; account for the load design.

Symptoms: No POST, shutdown under load, boot cycling, instability or abnormal VRM temperature.

Diagnostic reasoning: Compare enable, power-good and converter output with the controller datasheet. Separate input faults, controller faults, power-stage faults and an overloaded consumer.

Steps: 1. Identify the controller and board revision.
2. With power disconnected, inspect MOSFETs, inductors and capacitors.
3. Locate input, output, ground and control signals in the schematic.
4. Measure resistance only on an unpowered board and compare with design or a known-good board.
5. Scope measurements belong only on documented test points and should be performed by a qualified technician.
6. Record test conditions and temperatures before and after repair.

Repair: Replace only a component with a confirmed fault and maintain the design ratings. After repair verify control, output stability and behaviour under controlled load.

Verification: Repeatable POST, no resets, stable operation under load and no abnormal heating. Compare measurements with platform documentation.

Warning: VRM stages can carry high current. Do not perform loaded tests without proper probes, protection and qualification.

Source: https://www.infineon.com/cms/en/product/power/','VRM,buck,inductor,MOSFET,power rail','https://www.infineon.com/cms/en/product/power/'),
('lesson:ADV-004','lesson','Elektronika / Pomiary','Rozróżnianie zwarcia od niskiej rezystancji CPU','Distinguishing a short from low CPU rail resistance','Opis: Nowoczesne linie zasilania CPU i GPU mogą wykazywać bardzo niską rezystancję z powodu równoległych struktur półprzewodnikowych i kondensatorów. Brzęczyk ciągłości nie jest wystarczającą diagnozą. Wynik należy porównać z dokumentacją, znaną sprawną płytą tej samej rewizji i zachowaniem przy odłączonych odbiornikach, jeśli procedura na to pozwala. Metody wstrzykiwania prądu wymagają doświadczenia i nie są instrukcją dla początkujących.

Objawy: Bezpiecznik otwiera się ponownie, zasilacz wchodzi w zabezpieczenie albo płyta nie przechodzi startu. Niska rezystancja sama w sobie nie przesądza o zwarciu.

Tok diagnostyczny: Użyj pomiaru w obu polaryzacjach, obserwuj trend ładowania kondensatorów i porównaj z identyczną linią lub płytą. Uwzględnij rezystancję przewodów miernika i stan baterii miernika.

Kroki: 1. Zapisz dokładną nazwę linii i punkt pomiarowy.
2. Odłącz adapter, baterię i wszystkie źródła zasilania.
3. Sprawdź miernik, przewody oraz kompensację rezystancji końcówek.
4. Zmierz w obu polaryzacjach i odczekaj na ustalenie wyniku.
5. Porównaj z dokumentacją lub płytą o tym samym numerze i rewizji.
6. Za zwarcie uznaj dopiero wynik potwierdzony dodatkowymi testami i lokalizacją elementu.

Naprawa: Nie usuwaj kondensatorów ani procesora tylko na podstawie sygnału brzęczyka. Każda dalsza izolacja obciążenia musi wynikać ze schematu i procedury naprawy.

Weryfikacja: Po naprawie linia nie wykazuje nieprawidłowego poboru, układ przechodzi POST i działa stabilnie. Zanotuj punkt odniesienia pomiaru.

Ostrzeżenie: Nie wstrzykuj napięcia w linię CPU/GPU bez dokładnej procedury, ograniczenia prądu i kwalifikacji. Możesz zniszczyć procesor lub płytę.

Źródło: https://www.esda.org/esd-overview/esd-fundamentals/','Overview: Modern CPU and GPU rails can show very low resistance because of parallel semiconductor structures and capacitors. A continuity buzzer is not a sufficient diagnosis. Compare readings with documentation, a known-good board of the same revision and behaviour with loads isolated only where the procedure permits. Current-injection methods require specialist experience and are not beginner procedures.

Symptoms: A fuse opens again, the supply enters protection or the board will not start. Low resistance alone does not prove a short.

Diagnostic reasoning: Use both polarities, observe capacitor charging behaviour and compare with an equivalent rail or board. Account for meter-lead resistance and meter battery condition.

Steps: 1. Record the exact rail name and test point.
2. Disconnect adapter, battery and all power sources.
3. Check the meter, leads and lead-resistance compensation.
4. Measure in both polarities and allow readings to settle.
5. Compare with documentation or a board of the same part number and revision.
6. Call it a short only after additional tests and component localisation confirm it.

Repair: Do not remove capacitors or a CPU solely because the meter beeps. Any load isolation must follow the schematic and repair procedure.

Verification: After repair the rail shows no abnormal draw, the system passes POST and runs stably. Record the measurement baseline.

Warning: Do not inject voltage into CPU/GPU rails without a precise procedure, current limiting and qualification. You can destroy the processor or board.

Source: https://www.esda.org/esd-overview/esd-fundamentals/','short circuit,CPU rail,resistance,continuity','https://www.esda.org/esd-overview/esd-fundamentals/'),
('lesson:ADV-005','lesson','Porty / USB-C','USB-C: analiza negocjacji Power Delivery','USB-C: Power Delivery negotiation analysis','Opis: USB-C to typ złącza, a nie gwarancja określonej mocy, obrazu ani szybkości danych. Negocjacja USB Power Delivery opiera się na kanałach CC i możliwościach źródła, odbiornika oraz kabla. Kabel bez odpowiednich oznaczeń lub uszkodzony port może ograniczyć dostępne profile. Diagnoza powinna korzystać z analizatora PD i dokumentacji danego kontrolera, a nie z przypadkowego podawania napięcia na piny.

Objawy: Urządzenie ładuje się tylko w jednej orientacji wtyczki, pobiera małą moc, rozłącza się albo nie uruchamia ładowania.

Tok diagnostyczny: Porównaj znaną sprawną ładowarkę, kabel i urządzenie. Odczytaj zaakceptowany profil PD, status CC i e-marker. Brak wyższego profilu może wynikać z kabla lub polityki zasilania, a nie usterki płyty.

Kroki: 1. Zapisz model urządzenia, adaptera i przewodu.
2. Obejrzyj port pod powiększeniem i sprawdź luzy lub zabrudzenia bez metalowych narzędzi.
3. Porównaj obie orientacje wtyczki i drugi certyfikowany przewód.
4. Analizatorem zgodnym z PD zapisz profile Source_Capabilities i Request, jeśli sprzęt na to pozwala.
5. Sprawdź dokumentację kontrolera ładowania i obsługiwane limity.
6. Wymianę portu rozważ dopiero po potwierdzeniu uszkodzenia mechanicznego lub elektrycznego.

Naprawa: Napraw port, ścieżkę lub kontroler wyłącznie po potwierdzeniu wady. Zastosuj element zgodny z footprintem, parametrami prądowymi i zaleceniami producenta.

Weryfikacja: Potwierdź stabilne ładowanie, poprawną negocjację profilu, brak nadmiernego nagrzewania i zachowanie w obu orientacjach wtyczki.

Ostrzeżenie: Uszkodzony port lub przewód może się nagrzewać. Przerwij przy śladach nadpalenia, stopionym tworzywie lub zapachu spalenizny.

Źródło: https://www.usb.org/usb-charger-pd','Overview: USB-C is a connector type, not a guarantee of a particular power level, video or data speed. USB Power Delivery negotiation uses CC channels and the capabilities of the source, sink and cable. An unsuitable or damaged cable/port may limit available profiles. Diagnose with a PD analyser and the relevant controller documentation; never inject voltage into arbitrary pins.

Symptoms: The device charges only in one plug orientation, draws low power, disconnects or does not start charging.

Diagnostic reasoning: Compare a known-good charger, cable and device. Read negotiated PD profile, CC status and e-marker. Missing higher profiles may be caused by cable capability or power policy rather than a board fault.

Steps: 1. Record device, adapter and cable models.
2. Inspect the port under magnification; avoid metal tools.
3. Compare both plug orientations and a second certified cable.
4. Use a PD-compatible analyser to record Source_Capabilities and Request where supported.
5. Check the charging-controller datasheet and supported limits.
6. Consider port replacement only after mechanical or electrical damage is confirmed.

Repair: Repair the port, trace or controller only after confirming the fault. Use a part matching footprint, current ratings and vendor requirements.

Verification: Confirm stable charging, correct profile negotiation, no abnormal heating and operation in both plug orientations.

Warning: A damaged port or cable may overheat. Stop if there are burn marks, melted plastic or a burning smell.

Source: https://www.usb.org/usb-charger-pd','USB-C,PD,CC,e-marker,charger','https://www.usb.org/usb-charger-pd'),
('lesson:ADV-006','lesson','Porty / USB4','USB4 i Thunderbolt: brak urządzenia w porcie','USB4 and Thunderbolt device not detected','Opis: Port USB-C może obsługiwać ładowanie, USB, DisplayPort Alt Mode, USB4 lub Thunderbolt w różnych kombinacjach. Nie zakładaj, że każdy port ma pełny zestaw funkcji. Sprawdź oznaczenia producenta, kontroler, firmware docka, kabel i listę kompatybilności. Zdarzenie w Menedżerze urządzeń może wskazać problem sterownika lub enumeracji, ale nie zawsze potwierdza uszkodzenie portu.

Objawy: Dock działa tylko częściowo, monitor nie wykrywa obrazu, urządzenie PCIe nie pojawia się lub transfer jest ograniczony.

Tok diagnostyczny: Ustal, która funkcja jest nieobecna: zasilanie, USB, obraz, sieć czy PCIe tunnelling. Porównaj port, przewód i urządzenie na sprawnym komputerze oraz sprawdź firmware i sterowniki OEM.

Kroki: 1. Sprawdź dokumentację modelu i oznaczenia portu.
2. Użyj przewodu certyfikowanego dla wymaganej funkcji i długości.
3. Przetestuj oddzielnie urządzenie USB, monitor i ładowanie.
4. Zapisz identyfikatory kontrolera, błędy zdarzeń i wersje sterowników.
5. Zaktualizuj firmware docka i sterowniki tylko z oficjalnych stron OEM.
6. Porównaj zachowanie z drugim portem lub kompatybilnym komputerem.

Naprawa: Usuń przyczynę potwierdzoną testem: kabel, ustawienie firmware, sterownik, dock lub uszkodzenie portu. Nie aktualizuj kontrolera z plików nieprzeznaczonych do dokładnego modelu.

Weryfikacja: Potwierdź wszystkie deklarowane funkcje osobno, stabilność przez kilka minut i poprawne wznowienie po uśpieniu.

Ostrzeżenie: Nie otwieraj ani nie modyfikuj aktywnego docka pod napięciem. Zachowaj ostrożność przy aktualizacji firmware.

Źródło: https://www.usb.org/documents','Overview: A USB-C port may support charging, USB, DisplayPort Alt Mode, USB4 or Thunderbolt in different combinations. Do not assume every port supports every feature. Check vendor markings, controller, dock firmware, cable and compatibility list. Device Manager events may indicate driver or enumeration problems, but do not automatically prove a faulty port.

Symptoms: A dock works only partially, a display is not detected, a PCIe device is missing or transfer speed is limited.

Diagnostic reasoning: Determine which function is missing: power, USB, display, network or PCIe tunnelling. Compare the port, cable and device on a known-good computer and check OEM firmware and drivers.

Steps: 1. Check model documentation and port markings.
2. Use a certified cable suitable for the required function and length.
3. Test USB device, display and charging separately.
4. Record controller IDs, event errors and driver versions.
5. Update dock firmware and drivers only from official OEM sources.
6. Compare another port or a compatible computer.

Repair: Fix the cause proven by testing: cable, firmware setting, driver, dock or port damage. Never flash a controller with files not intended for the exact model.

Verification: Validate each advertised function separately, stability over several minutes and correct resume from sleep.

Warning: Do not open or modify a powered dock. Take care when updating firmware.

Source: https://www.usb.org/documents','USB4,Thunderbolt,PCIe,DisplayPort,dock','https://www.usb.org/documents'),
('lesson:ADV-007','lesson','Dyski / NVMe','NVMe: diagnostyka szerokości i szybkości łącza PCIe','NVMe: PCIe link width and speed diagnostics','Opis: Dysk NVMe M.2 może działać z mniejszą liczbą linii PCIe lub niższą generacją z powodu konstrukcji płyty, współdzielenia linii, ustawień BIOS, adaptera albo ograniczeń procesora. Prędkość marketingowa nośnika nie musi odpowiadać prędkości łącza w danym gnieździe. Należy porównać specyfikację slotu, model CPU, konfigurację pozostałych urządzeń i bieżący status linku.

Objawy: Dysk jest wykrywany, ale transfer jest znacznie niższy od oczekiwanego albo nośnik znika pod obciążeniem.

Tok diagnostyczny: Zacznij od ustalenia ograniczenia slotu. Oddziel limit łącza od throttlingu termicznego, obciążenia systemu, szyfrowania i limitów samego nośnika.

Kroki: 1. Sprawdź instrukcję płyty i konfigurację gniazd M.2.
2. Zidentyfikuj model CPU i dokładny model SSD.
3. Odczytaj status linku narzędziem diagnostycznym obsługującym PCIe.
4. Sprawdź współdzielenie linii z SATA, GPU lub innymi slotami.
5. Monitoruj temperaturę podczas powtarzalnego, nieinwazyjnego testu transferu.
6. Porównaj wynik z limitem slotu i specyfikacją urządzenia.

Naprawa: Popraw osadzenie, użyj slotu o odpowiedniej specyfikacji lub usuń potwierdzony problem termiczny/konfiguracyjny. Nie wymuszaj generacji PCIe, której platforma nie obsługuje.

Weryfikacja: Powtórz odczyt linku po zimnym starcie i benchmark o kontrolowanym czasie. Upewnij się, że temperatury i stabilność pozostają w granicach specyfikacji.

Ostrzeżenie: Przed demontażem wykonaj kopię danych i odłącz zasilanie. Nie używaj benchmarku na nośniku z objawami awarii.

Źródło: https://nvmexpress.org/specifications/','Overview: An NVMe M.2 drive may run with fewer PCIe lanes or a lower generation because of board design, lane sharing, BIOS settings, an adapter or CPU limitations. The advertised drive speed does not necessarily match the link available in a particular slot. Compare slot specification, CPU model, other installed devices and current link status.

Symptoms: The drive is detected but throughput is much lower than expected or the device disappears under load.

Diagnostic reasoning: First determine the slot limitation. Separate link limitations from thermal throttling, system load, encryption and drive limits.

Steps: 1. Check the motherboard manual and M.2 slot map.
2. Identify the CPU and exact SSD model.
3. Read link status using a PCIe-aware diagnostic tool.
4. Check lane sharing with SATA, GPU or other slots.
5. Monitor temperature during a repeatable, non-destructive throughput test.
6. Compare results with slot and device specifications.

Repair: Reseat the drive, use a correctly specified slot or fix a proven thermal/configuration issue. Do not force a PCIe generation unsupported by the platform.

Verification: Recheck link status after a cold boot and run a controlled benchmark. Confirm temperature and stability remain within specifications.

Warning: Back up data and disconnect power before removal. Do not benchmark a drive showing failure symptoms.

Source: https://nvmexpress.org/specifications/','NVMe,PCIe,lanes,link speed,M.2','https://nvmexpress.org/specifications/'),
('lesson:ADV-008','lesson','Dyski / Diagnostyka','NVMe: interpretacja SMART i health log','NVMe SMART and health log interpretation','Opis: NVMe SMART/Health Information Log zawiera m.in. temperaturę, procent zużycia, dostępne rezerwy, liczbę błędów nośnika i godziny pracy. Znaczenie pól zależy od specyfikacji i implementacji producenta. Nie należy oceniać zdrowia SSD po jednym liczniku ani porównywać pól z różnych producentów bez kontekstu. Przy ważnych danych priorytetem pozostaje kopia, a nie długi test powierzchni.

Objawy: Ostrzeżenie narzędzia producenta, wzrost błędów nośnika, przegrzewanie, spadek wydajności lub rozłączenia.

Tok diagnostyczny: Oceń trend w czasie, temperaturę i błędy krytyczne wraz z objawami użytkownika. Sprawdź firmware i warunki termiczne, ale nie utożsamiaj surowego atrybutu z uniwersalnym progiem awarii.

Kroki: 1. Zidentyfikuj dokładny model, firmware i interfejs.
2. Odczytaj health log narzędziem producenta lub zgodnym narzędziem NVMe.
3. Zapisz temperaturę, percentage used, media errors i unsafe shutdowns.
4. Porównaj z poprzednim odczytem i warunkami eksploatacji.
5. Przy ważnych danych wykonaj kopię lub obraz przed testami obciążeniowymi.
6. Sprawdź komunikaty producenta o znanych problemach firmware.

Naprawa: Jeśli producent publikuje poprawkę firmware dla dokładnego modelu, wykonaj ją dopiero po kopii danych i stabilizacji zasilania. W przypadku rosnących błędów lub zanikania nośnika rozważ wymianę po zabezpieczeniu danych.

Weryfikacja: Ponownie odczytaj health log, sprawdź stabilność po zimnym starcie i zweryfikuj odczyt kopii. Zachowaj raport przed/po.

Ostrzeżenie: Nie uruchamiaj długich zapisów na SSD z objawami awarii. Nie formatuj nośnika przed zabezpieczeniem danych.

Źródło: https://nvmexpress.org/SPECIFICATIONS/','Overview: The NVMe SMART/Health Information Log includes temperature, percentage used, available spare, media errors and power-on hours. Field meaning depends on the specification and vendor implementation. Do not judge an SSD by one counter or compare vendor fields without context. For important data, backup takes priority over long surface tests.

Symptoms: Vendor utility warning, rising media errors, overheating, performance decline or disconnects.

Diagnostic reasoning: Evaluate trends over time, temperature and critical errors together with user symptoms. Check firmware and thermal conditions, but do not treat a raw attribute as a universal failure threshold.

Steps: 1. Identify exact model, firmware and interface.
2. Read the health log using the vendor utility or a compatible NVMe tool.
3. Record temperature, percentage used, media errors and unsafe shutdowns.
4. Compare with the previous reading and operating conditions.
5. Back up or image important data before stress testing.
6. Check vendor advisories for known firmware issues.

Repair: If the vendor provides a firmware update for the exact model, apply it only after backup and stable power are confirmed. For increasing errors or disappearing drive, consider replacement after protecting data.

Verification: Re-read the health log, check cold-boot stability and verify backup readability. Keep before/after reports.

Warning: Do not run long write tests on a failing SSD. Do not format before protecting data.

Source: https://nvmexpress.org/SPECIFICATIONS/','NVMe,SMART,health log,media errors,wear','https://nvmexpress.org/SPECIFICATIONS/'),
('lesson:ADV-009','lesson','Dane / HDD','Odzyskiwanie danych z HDD wydającego odgłosy','Data recovery triage for a noisy HDD','Opis: Klikanie, tarcie lub cykliczne rozpędzanie talerzy może oznaczać problem mechaniczny, głowic lub zasilania. Każde ponowne uruchomienie może pogorszyć stan nośnika. Przed diagnostyką ustal wartość danych, zgodę klienta i istnienie kopii. Jeśli dane są niezastąpione, właściwym krokiem może być wyłączenie dysku i przekazanie go do laboratorium odzyskiwania, a nie próba naprawy logicznej.

Objawy: Klikanie, stukanie, powtarzający się spin-up, błędy odczytu, znikanie dysku lub bardzo wolny dostęp.

Tok diagnostyczny: Rozróżnij dźwięki mechaniczne od problemu obudowy/uchwytu. Nie wykonuj testu powierzchni ani CHKDSK na niestabilnym nośniku. Ocenę SMART wykonuj tylko wtedy, gdy nie zwiększa ryzyka.

Kroki: 1. Natychmiast przerwij zapisy i nie uruchamiaj ponownie bez planu.
2. Zapisz model, objawy, czas wystąpienia i historię upadku/zalania.
3. Sprawdź zasilanie i przewód tylko jeśli nie wymaga to wielokrotnego startu dysku.
4. Ustal z klientem priorytet danych i zgodę na dalsze działania.
5. Jeśli dane są krytyczne, przekaż nośnik do specjalistycznego laboratorium.
6. Jeżeli nośnik jest stabilny, wykonuj obraz sektorowy na drugi dysk, a nie naprawę oryginału.

Naprawa: Wymiana dysku jest niezależna od odzyskiwania danych. Nie otwieraj komory talerzy w zwykłym warsztacie i nie zamrażaj dysku.

Weryfikacja: Zweryfikuj kompletność obrazu i sumy kontrolne wybranych danych. Oryginalny nośnik pozostaje niezmieniony do czasu akceptacji klienta.

Ostrzeżenie: Przy klikaniu lub tarciu wyłącz nośnik. Nie próbuj wielokrotnych skanów; mogą doprowadzić do trwałej utraty danych.

Źródło: https://www.seagate.com/support/','Overview: Clicking, scraping or repeated spin-up may indicate mechanical, head or power problems. Each additional power cycle can worsen the condition. Before diagnosis, establish data value, client consent and backup availability. For irreplaceable data, power down and refer the drive to a recovery lab instead of attempting logical repair.

Symptoms: Clicking, knocking, repeated spin-up, read errors, disappearing drive or extremely slow access.

Diagnostic reasoning: Distinguish mechanical sounds from enclosure or mounting noise. Do not run surface tests or CHKDSK on an unstable drive. Read SMART only if doing so does not increase risk.

Steps: 1. Stop writes immediately and do not power-cycle without a plan.
2. Record model, symptoms, onset and any drop/liquid history.
3. Check power and cable only if it does not require repeated spin-up.
4. Agree on data priority and permission for further work.
5. Refer critical data to a specialist recovery lab.
6. If the drive is stable, image sectors to another drive rather than repairing the original.

Repair: Drive replacement is separate from data recovery. Do not open the platter chamber in a normal workshop and never freeze the drive.

Verification: Verify image completeness and hashes of selected files. Keep the original drive unchanged until client approval.

Warning: Power down a clicking or scraping drive. Repeated scans can cause permanent data loss.

Source: https://www.seagate.com/support/','HDD,clicking,data recovery,imaging','https://www.seagate.com/support/'),
('lesson:ADV-010','lesson','Dane / RAID','RAID 1: bezpieczna diagnostyka degradacji macierzy','RAID 1 degraded array safe diagnostics','Opis: RAID 1 utrzymuje kopię danych na więcej niż jednym nośniku, ale nie zastępuje kopii zapasowej. Degradacja może wynikać z awarii dysku, przewodu, portu, kontrolera lub błędu metadanych. Największym ryzykiem jest rozpoczęcie odbudowy na niewłaściwym dysku albo wymiana kolejności nośników bez identyfikacji. Przed operacją zrób kopię danych, zapisz seriale i stan macierzy.

Objawy: Kontroler zgłasza degraded, jeden dysk offline, błędy synchronizacji lub macierz przechodzi w tryb tylko do odczytu.

Tok diagnostyczny: Ustal, który dysk zawiera aktualną kopię danych, sprawdź logi kontrolera oraz SMART obu nośników. Nie zakładaj, że dysk offline jest jedynym uszkodzonym elementem.

Kroki: 1. Zapisz model kontrolera, konfigurację RAID i identyfikatory dysków.
2. Wstrzymaj automatyczne inicjowanie lub kasowanie macierzy.
3. Wykonaj kopię dostępnych danych, jeśli macierz jest czytelna.
4. Sprawdź przewody, zasilanie, porty i logi kontrolera.
5. Zweryfikuj, który nośnik jest źródłem prawidłowych danych przed rebuild.
6. Odbudowę uruchom dopiero po kopii, identyfikacji dysku docelowego i procedurze producenta.

Naprawa: Wymień wyłącznie nośnik potwierdzony jako uszkodzony i o parametrach dopuszczonych przez kontroler. Nie inicjuj nowej macierzy na danych klienta.

Weryfikacja: Poczekaj na zakończenie odbudowy, zweryfikuj stan wszystkich dysków, spójność danych i wykonaj niezależną kopię zapasową.

Ostrzeżenie: Błędna odbudowa może nadpisać jedyną prawidłową kopię. Przy niejasnym stanie macierzy zatrzymaj pracę i zabezpiecz dyski.

Źródło: https://learn.microsoft.com/en-us/windows-server/storage/storage-spaces/overview','Overview: RAID 1 mirrors data across multiple drives, but it is not a backup. Degradation may be caused by a failed drive, cable, port, controller or metadata issue. A major risk is rebuilding onto the wrong disk or changing drive order without identification. Back up data, record serials and array status before action.

Symptoms: The controller reports degraded state, one drive is offline, synchronization errors occur or the array becomes read-only.

Diagnostic reasoning: Determine which drive contains the current data, review controller logs and SMART for both drives. Do not assume the offline drive is the only failed component.

Steps: 1. Record controller model, RAID configuration and drive identifiers.
2. Prevent automatic initialization or array deletion.
3. Back up accessible data if the array is readable.
4. Check cables, power, ports and controller logs.
5. Verify which drive contains the valid data before rebuilding.
6. Start rebuild only after backup, target-drive identification and vendor procedure confirmation.

Repair: Replace only the drive proven faulty and use a model accepted by the controller. Never initialize a new array over client data.

Verification: Wait for rebuild completion, verify all drive states and data consistency, then create an independent backup.

Warning: A mistaken rebuild can overwrite the only valid copy. If array state is unclear, stop and preserve the drives.

Source: https://learn.microsoft.com/en-us/windows-server/storage/storage-spaces/overview','RAID,mirror,rebuild,degraded,backup','https://learn.microsoft.com/en-us/windows-server/storage/storage-spaces/overview'),
('lesson:ADV-011','lesson','Windows / Szyfrowanie','BitLocker przed wymianą płyty głównej','BitLocker preparation before motherboard replacement','Opis: BitLocker może wymagać klucza odzyskiwania po zmianie TPM, płyty, firmware lub ustawień Secure Boot. Przed naprawą sprawdź stan szyfrowania i upewnij się, że właściciel ma dostęp do klucza 48-cyfrowego. Serwis nie powinien prosić o przesłanie klucza przez czat, e-mail ani formularz publiczny. Warto zapisać tylko fakt potwierdzenia kopii klucza, bez samego sekretu.

Objawy: Po wymianie płyty lub aktualizacji firmware pojawia się ekran BitLocker Recovery.

Tok diagnostyczny: Ustal, czy zmienił się TPM, Secure Boot, tryb rozruchu lub profil firmware. Potwierdź, że klucz recovery jest dostępny u właściciela zanim wykonasz operację mogącą zmienić pomiar TPM.

Kroki: 1. Przed demontażem zapisz status BitLocker bez kopiowania klucza.
2. Poproś właściciela o samodzielne potwierdzenie dostępu do klucza.
3. Zapisz ustawienia UEFI/Secure Boot i konfigurację TPM.
4. Po naprawie uruchom system i pozwól właścicielowi wprowadzić klucz samodzielnie.
5. Zweryfikuj status ochrony i poprawne działanie TPM.
6. Udokumentuj zmianę płyty/firmware bez zapisywania klucza w raporcie.

Naprawa: Jeśli klucz jest niedostępny, nie wykonuj pochopnego resetu TPM ani czyszczenia zabezpieczeń. Uzgodnij z właścicielem bezpieczną ścieżkę odzyskania dostępu.

Weryfikacja: Właściciel potwierdza dostęp do danych, Windows startuje normalnie, a status BitLocker jest zgodny z zamierzoną konfiguracją.

Ostrzeżenie: Nigdy nie zapisuj klucza BitLocker, hasła ani danych klienta w czacie Akademii lub dokumentacji publicznej.

Źródło: https://support.microsoft.com/en-us/windows/security/encryption/find-your-bitlocker-recovery-key','Overview: BitLocker may request a recovery key after TPM, motherboard, firmware or Secure Boot changes. Before service, check encryption status and ensure the owner can access the 48-digit recovery key. A repair shop should never ask customers to send the key through chat, email or public forms. Record only that the key backup was confirmed, never the secret itself.

Symptoms: BitLocker Recovery appears after motherboard replacement or firmware update.

Diagnostic reasoning: Determine whether TPM, Secure Boot, boot mode or firmware profile changed. Confirm the owner has the recovery key before an operation that may change TPM measurements.

Steps: 1. Record BitLocker status before disassembly without copying the key.
2. Ask the owner to confirm access to the recovery key personally.
3. Record UEFI/Secure Boot settings and TPM configuration.
4. After repair, let the owner enter the key themselves.
5. Verify protection status and correct TPM operation.
6. Document board/firmware changes without storing the recovery key.

Repair: If the key is unavailable, do not casually clear TPM or reset security. Agree on a safe recovery path with the owner.

Verification: The owner confirms data access, Windows boots normally and BitLocker status matches the intended configuration.

Warning: Never store a BitLocker key, password or client data in Academy chat or public documentation.

Source: https://support.microsoft.com/en-us/windows/security/encryption/find-your-bitlocker-recovery-key','BitLocker,recovery key,TPM,motherboard','https://support.microsoft.com/en-us/windows/security/encryption/find-your-bitlocker-recovery-key'),
('lesson:ADV-012','lesson','Windows / Rozruch','UEFI: diagnostyka wpisów rozruchowych','UEFI boot entry diagnostics','Opis: UEFI przechowuje wpisy rozruchowe w NVRAM, a pliki rozruchowe systemu znajdują się zwykle na partycji EFI. Usunięty wpis nie musi oznaczać utraty systemu, a brak Windows Boot Manager może wynikać ze zmiany trybu UEFI/CSM, kolejności bootowania lub stanu partycji EFI. Zmiany wykonuj po zabezpieczeniu danych i potwierdzeniu właściwego dysku.

Objawy: BIOS wykrywa SSD, ale nie ma Windows Boot Manager lub system wraca do UEFI.

Tok diagnostyczny: Rozdziel brak wykrycia dysku od braku wpisu UEFI i uszkodzenia plików boot. Zapisz tryb kontrolera SATA, UEFI/CSM, Secure Boot i strukturę partycji.

Kroki: 1. Sprawdź, czy dysk jest wykrywany w UEFI.
2. Zapisz tryb UEFI/CSM i ustawienia kontrolera dysku.
3. Uruchom WinRE z odpowiedniego nośnika i zidentyfikuj partycje bez formatowania.
4. Sprawdź obecność partycji EFI oraz plików rozruchowych.
5. Wybierz procedurę odtworzenia wpisu zgodną z wersją systemu i dokumentacją Microsoft.
6. Po zmianach zweryfikuj kolejność startu i kilka zimnych uruchomień.

Naprawa: Przywróć tylko brakujące wpisy i pliki, nie zmieniaj bez potrzeby trybu partycji ani kontrolera. Nie formatuj partycji EFI bez pewności i kopii danych.

Weryfikacja: Windows uruchamia się kilka razy, UEFI widzi prawidłowy wpis, a dodatkowe systemy lub dyski pozostają dostępne.

Ostrzeżenie: Nie wykonuj poleceń czyszczących partycje lub BCD, jeżeli nie zidentyfikowano dysku systemowego.

Źródło: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/bcdboot-command-line-options','Overview: UEFI stores boot entries in NVRAM while operating-system boot files are usually on the EFI System Partition. A missing entry does not necessarily mean Windows is lost; Windows Boot Manager may disappear after a UEFI/CSM change, boot-order change or EFI partition issue. Back up data and identify the correct disk before making changes.

Symptoms: Firmware detects the SSD but Windows Boot Manager is missing or the system returns to UEFI.

Diagnostic reasoning: Separate missing drive detection from missing UEFI entry and damaged boot files. Record storage mode, UEFI/CSM, Secure Boot and partition layout.

Steps: 1. Check whether the drive is detected in UEFI.
2. Record UEFI/CSM and storage-controller mode.
3. Boot WinRE from appropriate media and identify partitions without formatting.
4. Check for the EFI System Partition and boot files.
5. Use a boot-entry repair procedure matching the OS version and Microsoft guidance.
6. Verify boot order and several cold starts after repair.

Repair: Restore only missing entries and files. Do not casually change partition or controller mode. Never format the EFI partition without certainty and a backup.

Verification: Windows boots repeatedly, UEFI shows the correct entry and other operating systems or drives remain available.

Warning: Do not run partition- or BCD-cleaning commands until the OS disk is positively identified.

Source: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/bcdboot-command-line-options','UEFI,boot entry,EFI,NVRAM,boot manager','https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/bcdboot-command-line-options'),
('lesson:ADV-013','lesson','Windows / Diagnostyka','Windows: analiza dziennika WHEA','Windows WHEA event log analysis','Opis: Windows Hardware Error Architecture raportuje część błędów sprzętowych, m.in. związanych z procesorem, pamięcią, magistralą PCIe lub korekcją błędów. Wpis WHEA nie jest automatycznie wskazaniem konkretnej części. Potrzebne są pełny identyfikator zdarzenia, bank/status, kontekst platformy, wersje BIOS i sterowników oraz powtarzalność pod określonym obciążeniem.

Objawy: Losowe restarty, BSOD, wpisy WHEA-Logger, zawieszenia lub błędy PCIe.

Tok diagnostyczny: Porównaj kody zdarzeń, źródło błędu i czas wystąpienia z testami CPU, RAM i PCIe. Sprawdź najpierw ustawienia niestandardowe, temperatury, zasilanie i sterowniki OEM.

Kroki: 1. Wyeksportuj zdarzenia System z Podglądu zdarzeń.
2. Zapisz Event ID, źródło, szczegóły XML i dokładny czas.
3. Sprawdź, czy błędy pojawiają się w spoczynku czy pod konkretnym obciążeniem.
4. Przywróć ustawienia fabryczne CPU/RAM bez OC, jeśli to bezpieczne i uzgodnione.
5. Uruchom niezależne testy pamięci i diagnostykę producenta.
6. Porównaj wyniki po jednej zmianie; nie zmieniaj wielu elementów naraz.

Naprawa: Zaktualizuj BIOS lub sterownik wyłącznie, gdy producent wymienia poprawkę dla danego problemu. Wymieniaj część dopiero po korelacji błędów z potwierdzonym testem.

Weryfikacja: Wykonaj test odbiorczy w warunkach, które wcześniej wywoływały błąd. Sprawdź dziennik, temperatury i stabilność.

Ostrzeżenie: Nie wyciągaj wniosków z pojedynczego WHEA. Testy obciążeniowe przerwij przy przegrzaniu lub niestabilnym zasilaniu.

Źródło: https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/','Overview: Windows Hardware Error Architecture reports some hardware errors involving CPU, memory, PCIe or error correction. A WHEA event is not automatically a verdict against a component. Collect the complete event ID, bank/status, platform context, BIOS and driver versions and repeatability under a defined workload.

Symptoms: Random restarts, BSOD, WHEA-Logger events, freezes or PCIe errors.

Diagnostic reasoning: Correlate event codes, error source and timestamps with CPU, RAM and PCIe tests. First check custom settings, temperature, power and OEM drivers.

Steps: 1. Export System events from Event Viewer.
2. Record Event ID, provider, XML details and exact time.
3. Determine whether errors occur at idle or under a specific load.
4. Return CPU/RAM to documented stock settings where safe and agreed.
5. Run independent memory tests and vendor diagnostics.
6. Compare results after one change at a time.

Repair: Update BIOS or drivers only when the vendor lists a fix for the issue. Replace hardware only after correlating events with a confirming test.

Verification: Repeat the acceptance test under the conditions that previously triggered the error. Check logs, temperatures and stability.

Warning: Do not conclude from one WHEA event. Stop stress tests if overheating or unstable power occurs.

Source: https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/','WHEA,hardware error,event viewer,CPU,PCIe','https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/'),
('lesson:ADV-014','lesson','Grafika / Windows','GPU: diagnoza błędów TDR i resetów sterownika','GPU: TDR and driver-reset diagnosis','Opis: TDR (Timeout Detection and Recovery) oznacza, że Windows wykrył brak odpowiedzi GPU w określonym czasie i próbował odzyskać sterownik. Przyczyna może być programowa lub sprzętowa: sterownik, przegrzewanie, niestabilne OC, zasilanie, VRAM, PCIe albo aplikacja. Sam kod zdarzenia nie wskazuje automatycznie karty do wymiany.

Objawy: Czarny ekran na kilka sekund, komunikat o odzyskaniu sterownika, migotanie lub zamknięcie gry/aplikacji.

Tok diagnostyczny: Zapisz wersję sterownika, model GPU, obciążenie, temperatury, zasilanie i dokładny moment zdarzenia. Porównaj powtarzalność w kilku aplikacjach i po czystym uruchomieniu.

Kroki: 1. Zapisz dziennik zdarzeń i raport awarii aplikacji.
2. Sprawdź aktualność sterownika w kontekście wersji OEM i systemu.
3. Przywróć ustawienia GPU do fabrycznych, wyłącz OC/UV testowo.
4. Monitoruj temperatury, zegary i limit mocy podczas krótkiego testu.
5. Porównaj z inną aplikacją lub sprawnym komputerem.
6. Jeśli błąd trwa, wykonaj diagnostykę GPU/VRAM zgodnie z narzędziem producenta.

Naprawa: Zainstaluj stabilny sterownik z oficjalnego źródła lub usuń przyczynę przegrzewania. Nie zwiększaj arbitralnie limitu TDR jako substytutu diagnozy sprzętu.

Weryfikacja: Kilka przebiegów testu i typowe aplikacje działają bez resetów, artefaktów oraz błędów w dzienniku.

Ostrzeżenie: Przerwij test, gdy temperatura przekracza limit producenta, pojawiają się artefakty lub zasilanie staje się niestabilne.

Źródło: https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery','Overview: Timeout Detection and Recovery means Windows detected a GPU timeout and attempted to reset the driver. Causes may be software or hardware: driver, overheating, unstable overclock, power, VRAM, PCIe or the application. The event alone does not prove the GPU must be replaced.

Symptoms: Brief black screen, driver recovery message, flicker or game/application crash.

Diagnostic reasoning: Record driver version, GPU model, load, temperatures, power and exact event time. Compare reproducibility across applications and a clean boot.

Steps: 1. Record event logs and the application crash report.
2. Check driver version in the context of OEM and OS support.
3. Return GPU to stock settings and temporarily disable OC/UV.
4. Monitor temperature, clocks and power limit during a short test.
5. Compare with another application or known-good system.
6. If persistent, run vendor-supported GPU/VRAM diagnostics.

Repair: Install a stable driver from an official source or fix proven cooling issues. Do not arbitrarily raise TDR limits as a substitute for hardware diagnosis.

Verification: Repeat test runs and normal applications complete without resets, artifacts or related event errors.

Warning: Stop if temperature exceeds vendor limits, artifacts appear or power becomes unstable.

Source: https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery','GPU,TDR,display driver,NVIDIA,AMD','https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery'),
('lesson:ADV-015','lesson','Grafika / VRAM','GPU: różnicowanie artefaktów VRAM i obrazu','GPU: differentiating VRAM artifacts from display faults','Opis: Artefakty mogą pochodzić z GPU, VRAM, pamięci podręcznej, sterownika, kabla, monitora lub toru obrazu. Wzory artefaktów są wskazówką, a nie pewnym rozpoznaniem. Sprawdź, czy problem pojawia się już w UEFI/BIOS, na zrzucie ekranu, na innym monitorze i na innym przewodzie. Rozróżnij artefakty renderowania od uszkodzenia panelu lub połączenia.

Objawy: Kolorowe piksele, pasy, migotanie, szachownica, błędy tekstur lub zniekształcony obraz.

Tok diagnostyczny: Jeśli artefakty są na zrzucie ekranu, problem może powstawać przed wyjściem obrazu. Jeśli nie ma ich na zrzucie, sprawdź kabel, port, matrycę i monitor. Sprawdź też zachowanie po wyłączeniu akceleracji aplikacji.

Kroki: 1. Zrób zdjęcie ekranu i zrzut systemowy dla porównania.
2. Sprawdź inny kabel, port i monitor.
3. Porównaj obraz w UEFI oraz po załadowaniu sterownika.
4. Przywróć fabryczne zegary i sprawdź temperatury.
5. Uruchom krótki, oficjalny test diagnostyczny GPU/VRAM.
6. Zapisz warunki i częstotliwość występowania artefaktów.

Naprawa: Napraw kabel, złącze, sterownik lub chłodzenie, jeżeli test potwierdzi problem. Uszkodzenie VRAM lub GPU wymaga potwierdzenia na stanowisku serwisowym.

Weryfikacja: Obraz jest czysty w UEFI i systemie, w kilku aplikacjach oraz na wyjściach wideo przewidzianych dla urządzenia.

Ostrzeżenie: Nie wykonuj długich testów obciążeniowych na karcie z artefaktami lub niestabilnym chłodzeniem.

Źródło: https://www.nvidia.com/en-us/support/','Overview: Artifacts may originate from the GPU, VRAM, cache, driver, cable, monitor or display path. Artifact patterns are clues, not definitive diagnoses. Check whether the issue appears in UEFI/BIOS, in screenshots, on another monitor and with another cable. Separate rendering artifacts from panel or connection faults.

Symptoms: Colored pixels, lines, flicker, checkerboards, texture errors or distorted output.

Diagnostic reasoning: If artifacts appear in a screenshot, the issue may originate before the display output. If not, check cable, port, panel and monitor. Also compare behaviour with application acceleration disabled.

Steps: 1. Take a photo of the screen and a system screenshot for comparison.
2. Try another cable, port and monitor.
3. Compare the image in UEFI and after the driver loads.
4. Return clocks to stock and monitor temperatures.
5. Run a short vendor-supported GPU/VRAM diagnostic.
6. Record test conditions and artifact frequency.

Repair: Repair cable, connector, driver or cooling if tests confirm the cause. VRAM/GPU faults require confirmation on a service bench.

Verification: Image is clean in UEFI and OS, across several applications and the device-supported video outputs.

Warning: Do not run prolonged stress tests on a card with artifacts or unstable cooling.

Source: https://www.nvidia.com/en-us/support/','VRAM,artifacts,display,cable,GPU','https://www.nvidia.com/en-us/support/'),
('lesson:ADV-016','lesson','RAM / DDR5','Diagnostyka pamięci RAM DDR5 i treningu pamięci','DDR5 memory and memory-training diagnostics','Opis: Platformy DDR5 mogą wykonywać trening pamięci po zmianie modułów, ustawień lub firmware. Pierwszy start może potrwać dłużej niż zwykle, a kontrolki DRAM mogą świecić w czasie treningu. Czas i sekwencja zależą od płyty, CPU, liczby modułów oraz wersji BIOS. Nie przerywaj zasilania bez sprawdzenia instrukcji producenta.

Objawy: Długi pierwszy start po zmianie RAM, brak POST, pętla restartów lub niestabilność po włączeniu XMP/EXPO.

Tok diagnostyczny: Najpierw ustal zgodność modułów i listę obsługiwanych konfiguracji. Oddziel problem treningu od niezgodności profilu, obciążenia kontrolera pamięci i uszkodzenia modułu/slotu.

Kroki: 1. Zapisz model CPU, płyty, wersję BIOS i oznaczenia RAM.
2. Sprawdź liczbę modułów i zalecane sloty w instrukcji.
3. Przywróć ustawienia pamięci do JEDEC/fabrycznych.
4. Pozwól wykonać trening zgodnie z instrukcją platformy.
5. Testuj moduł pojedynczo i zapisuj kombinację slotu.
6. Dopiero po stabilnym teście rozważ profil XMP/EXPO zgodny z platformą.

Naprawa: W razie niestabilności pozostaw parametry bazowe lub dobierz zestaw zatwierdzony dla platformy. Nie zwiększaj napięcia bez dokumentacji i doświadczenia.

Weryfikacja: Pełny test pamięci bez błędów, kilka zimnych startów i stabilność w docelowej konfiguracji.

Ostrzeżenie: Nie wyjmuj pamięci przy podłączonym zasilaniu. Nie traktuj długiego treningu jako awarii bez sprawdzenia instrukcji.

Źródło: https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html','Overview: DDR5 platforms may perform memory training after module, setting or firmware changes. The first boot may take longer and DRAM LEDs may remain lit during training. Timing and sequence depend on motherboard, CPU, module count and BIOS. Do not interrupt power without checking vendor guidance.

Symptoms: Long first boot after RAM changes, no POST, restart loop or instability after enabling XMP/EXPO.

Diagnostic reasoning: First verify module compatibility and supported configurations. Separate training behaviour from profile incompatibility, memory-controller load and faulty module/slot.

Steps: 1. Record CPU, board, BIOS version and RAM part numbers.
2. Check module count and recommended slots in the manual.
3. Return memory settings to JEDEC/default values.
4. Allow training according to platform instructions.
5. Test one module at a time and record slot combinations.
6. Only after stable testing consider a platform-supported XMP/EXPO profile.

Repair: If unstable, keep baseline settings or choose a validated kit. Do not raise voltage without documentation and experience.

Verification: Full memory test passes, several cold boots succeed and the intended configuration is stable.

Warning: Never remove memory while power is connected. Do not label a long training cycle as failure without checking the manual.

Source: https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html','DDR5,memory training,XMP,EXPO,SPD','https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html'),
('lesson:ADV-017','lesson','Dyski / Chłodzenie','Kontrola temperatury i throttlingu SSD NVMe','NVMe SSD temperature and thermal-throttling checks','Opis: Kontroler NVMe i pamięć NAND mogą ograniczać wydajność przy wysokiej temperaturze. Wynik benchmarku krótkiego może różnić się od długiego transferu. Oceń temperaturę kontrolera, otoczenia, radiatora, przepływ powietrza i ustawienie termopadu. Grubość i położenie termopadu muszą odpowiadać konstrukcji konkretnego gniazda.

Objawy: Szybki transfer początkowy, potem spadek prędkości, wysokie temperatury lub ostrzeżenie narzędzia producenta.

Tok diagnostyczny: Porównaj temperaturę w spoczynku i pod kontrolowanym obciążeniem. Sprawdź, czy termopad ma kontakt, radiator jest przykręcony i nie ma folii ochronnej pozostawionej przez montaż.

Kroki: 1. Zapisz model SSD i wartości limitów z dokumentacji.
2. Sprawdź montaż radiatora i zgodność termopadu.
3. Oczyść kanał powietrza przy odłączonym zasilaniu.
4. Wykonaj krótki test transferu monitorując temperaturę.
5. Porównaj zachowanie po ostygnięciu i z innym slotem, jeśli jest to bezpieczne.
6. Nie powtarzaj benchmarku na nośniku z błędami odczytu.

Naprawa: Popraw montaż chłodzenia zgodnie z instrukcją płyty i producenta SSD. Nie układaj wielu termopadów ani nie dobieraj ich grubości na oko.

Weryfikacja: Powtórzony transfer ma stabilną charakterystykę, temperatura pozostaje w specyfikacji, a SMART nie wykazuje nowych błędów.

Ostrzeżenie: Przed demontażem odłącz zasilanie. Nadmierny nacisk radiatora może uszkodzić SSD lub złącze M.2.

Źródło: https://nvmexpress.org/specifications/','Overview: NVMe controllers and NAND may throttle performance at high temperature. A short benchmark may differ from a sustained transfer. Assess controller temperature, ambient airflow, heatsink and thermal-pad contact. Pad thickness and placement must match the exact slot design.

Symptoms: High initial transfer followed by slowdown, elevated temperature or vendor utility warning.

Diagnostic reasoning: Compare idle and controlled-load temperatures. Check thermal-pad contact, heatsink mounting and whether any protective film was left in place.

Steps: 1. Record the SSD model and documented temperature limits.
2. Check heatsink mounting and thermal-pad compatibility.
3. Clear airflow paths with power disconnected.
4. Run a short transfer test while monitoring temperature.
5. Compare after cool-down and with another slot where safe.
6. Do not repeat benchmarks on a drive with read errors.

Repair: Correct heatsink installation using the motherboard and SSD instructions. Do not stack pads or guess pad thickness.

Verification: Repeated transfer has stable behaviour, temperature remains within specification and SMART shows no new errors.

Warning: Disconnect power before removal. Excessive heatsink pressure can damage the SSD or M.2 connector.

Source: https://nvmexpress.org/specifications/','NVMe,thermal throttling,heatsink,temperature','https://nvmexpress.org/specifications/'),
('lesson:ADV-018','lesson','Zasilanie / Baterie','Analiza baterii laptopa: pojemność i zużycie','Laptop battery health: capacity and wear analysis','Opis: Raport baterii pokazuje m.in. pojemność projektową, ostatnią pojemność pełnego ładowania i cykle, ale interpretacja zależy od firmware i producenta. Szybkie wyłączanie może wynikać z ogniw, złącza, kalibracji, ładowarki lub płyty. Nie rozbieraj pakietu litowo-jonowego i nie mierz bezpośrednio ogniw bez kwalifikacji.

Objawy: Laptop wyłącza się bez ostrzeżenia, poziom baterii skacze lub urządzenie nie ładuje się do deklarowanego poziomu.

Tok diagnostyczny: Porównaj raport systemowy z narzędziem OEM, obserwuj temperaturę oraz zachowanie na oryginalnym zasilaczu. Ustal, czy problem występuje wyłącznie na baterii czy także na zasilaczu.

Kroki: 1. Zapisz model baterii i urządzenia.
2. Wygeneruj raport battery report i odczytaj dane OEM.
3. Porównaj design capacity, full charge capacity oraz liczbę cykli.
4. Przetestuj ładowanie na zgodnym, sprawnym adapterze.
5. Obserwuj nagłe spadki procentu i temperaturę.
6. Przy deformacji lub puchnięciu przerwij używanie i wymień pakiet według procedury.

Naprawa: Wymień baterię tylko na zgodną część i po potwierdzeniu problemu. Nie próbuj „regenerować” pakietu przez przypadkowe rozładowania lub zwarcia.

Weryfikacja: Urządzenie ładuje się i pracuje stabilnie, raport jest zgodny z nową baterią, a temperatura pozostaje prawidłowa.

Ostrzeżenie: Przy puchnięciu, zapachu, dymie lub nadmiernym nagrzaniu odłącz urządzenie, nie naciskaj ogniw i zastosuj procedurę BHP baterii.

Źródło: https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery','Overview: A battery report may show design capacity, last full-charge capacity and cycle count, but interpretation depends on firmware and vendor. Sudden shutdown may be caused by cells, connector, calibration, charger or board. Do not open a lithium-ion pack or probe cells without qualification.

Symptoms: Laptop shuts down unexpectedly, battery percentage jumps or charging does not reach the expected level.

Diagnostic reasoning: Compare OS reports with the OEM utility, monitor temperature and behaviour on the original adapter. Determine whether the issue occurs on battery only or also on AC.

Steps: 1. Record battery and device model.
2. Generate a battery report and read OEM data.
3. Compare design capacity, full-charge capacity and cycle count.
4. Test charging with a compatible known-good adapter.
5. Observe sudden percentage drops and temperature.
6. If swelling or deformation is present, stop use and replace the pack by the service procedure.

Repair: Replace the battery only with a compatible part after confirming the fault. Do not attempt pack recovery through random discharge cycles or shorts.

Verification: The device charges and runs stably, the report is consistent with the replacement pack and temperature is normal.

Warning: For swelling, odour, smoke or abnormal heat, disconnect the device, do not press cells and follow battery safety procedure.

Source: https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery','battery health,cycle count,capacity,charging','https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery'),
('lesson:ADV-019','lesson','Chłodzenie / Wentylatory','Diagnostyka wentylatora PWM i sygnału tach','PWM fan control and tachometer diagnostics','Opis: Wentylatory 4-pin zwykle wykorzystują zasilanie, masę, sygnał tach i sterowanie PWM, lecz parametry i układ złącza trzeba potwierdzić dla konkretnego urządzenia. Nie zakładaj, że pompa AIO i wentylator mają identyczną charakterystykę. Brak odczytu RPM może wynikać z przewodu tach, adaptera, trybu sterowania lub samego wentylatora.

Objawy: Wentylator pracuje stale na pełnych obrotach, nie startuje lub aplikacja pokazuje 0 RPM.

Tok diagnostyczny: Porównaj działanie w BIOS oraz systemie. Sprawdź typ złącza, kontrolę DC/PWM, profile i sygnał tach zgodnie z dokumentacją płyty.

Kroki: 1. Zidentyfikuj dokładny model wentylatora lub pompy.
2. Sprawdź instrukcję złącza i dostępne tryby sterowania.
3. Oczyść wentylator przy odłączonym zasilaniu i sprawdź swobodę ruchu.
4. Porównaj odczyt RPM w BIOS i narzędziu OEM.
5. Testuj tylko zgodny wentylator na znanym sprawnym złączu.
6. Zapisz temperatury przy różnych bezpiecznych profilach pracy.

Naprawa: Wymień uszkodzony wentylator lub przewód. Ustaw profil zgodny z typem sterowania i nie wyłączaj ochrony termicznej.

Weryfikacja: RPM reaguje na zmianę profilu, brak nietypowych dźwięków, a temperatury pozostają w limitach OEM.

Ostrzeżenie: Nie zatrzymuj wentylatora palcem podczas pracy. Nie podawaj napięcia na nieznany pin.

Źródło: https://www.intel.com/content/www/us/en/support/topics/thermal-management.html','Overview: Four-wire fans commonly use power, ground, tach and PWM control, but pinout and parameters must be confirmed for the exact device. Do not assume an AIO pump and fan have identical characteristics. Missing RPM may be caused by tach wiring, adapter, control mode or the fan itself.

Symptoms: Fan runs at full speed, fails to start or software reports 0 RPM.

Diagnostic reasoning: Compare operation in BIOS and OS. Check connector type, DC/PWM control, profiles and tach signal according to the board documentation.

Steps: 1. Identify the exact fan or pump model.
2. Check connector documentation and supported control modes.
3. Clean the fan with power disconnected and check free movement.
4. Compare RPM readings in BIOS and OEM software.
5. Test only a compatible fan on a known-good header.
6. Record temperatures across safe operating profiles.

Repair: Replace a confirmed faulty fan or cable. Use a control profile matching the fan type and never disable thermal protection.

Verification: RPM responds to profile changes, no abnormal noise is present and temperatures stay within OEM limits.

Warning: Do not stop a running fan with a finger. Do not apply voltage to an unidentified pin.

Source: https://www.intel.com/content/www/us/en/support/topics/thermal-management.html','PWM,tachometer,fan,EC,BIOS','https://www.intel.com/content/www/us/en/support/topics/thermal-management.html'),
('lesson:ADV-020','lesson','Obraz / Matryce','Diagnostyka matrycy eDP bez podświetlenia','eDP display diagnosis with no backlight','Opis: Brak podświetlenia może wystąpić mimo obecnego obrazu. Usterka może dotyczyć panelu, taśmy eDP, zasilania podświetlenia, czujnika pokrywy, ustawienia jasności lub płyty. Nie podłączaj i nie odłączaj taśmy matrycy przy podłączonej baterii. Pinout i napięcia zależą od panelu i platformy.

Objawy: Ekran jest czarny, ale pod latarką widać słaby obraz, albo obraz pojawia się na monitorze zewnętrznym.

Tok diagnostyczny: Najpierw określ, czy obraz jest renderowany. Sprawdź jasność, czujnik pokrywy, zachowanie zewnętrznego ekranu i uszkodzenia mechaniczne przewodu. Używaj dokumentacji panelu.

Kroki: 1. Zapisz model panelu i laptopa.
2. Sprawdź obraz na monitorze zewnętrznym.
3. Wykonaj test latarką bez naciskania matrycy.
4. Wyłącz urządzenie, odłącz adapter i baterię przed inspekcją taśmy.
5. Obejrzyj złącza eDP i prowadzenie przewodu w zawiasie.
6. Porównaj panel lub przewód tylko z częścią o potwierdzonej zgodności.

Naprawa: Napraw mechaniczne uszkodzenie przewodu lub wymień potwierdzony wadliwy panel. Nie wymieniaj płyty głównej, jeśli problem jest w przewodzie lub panelu.

Weryfikacja: Obraz i podświetlenie działają w pełnym zakresie jasności, po poruszeniu pokrywą i po kilku zimnych startach.

Ostrzeżenie: Złącze matrycy może mieć odsłonięte styki. Nigdy nie wykonuj hot-plug taśmy eDP.

Źródło: https://www.dell.com/support/home/','Overview: Backlight may be absent while image data is present. Causes include panel, eDP cable, backlight power, lid sensor, brightness setting or board. Never connect or disconnect the display cable with the battery connected. Pinout and voltages depend on panel and platform.

Symptoms: Screen appears black but a faint image is visible with a flashlight, or external display works.

Diagnostic reasoning: First determine whether image data is being generated. Check brightness, lid sensor, external display and mechanical cable damage. Use panel documentation.

Steps: 1. Record panel and laptop models.
2. Check an external monitor.
3. Perform a flashlight test without pressing the panel.
4. Power off and disconnect adapter and battery before inspecting the cable.
5. Inspect eDP connectors and cable routing through the hinge.
6. Compare panel or cable only with a confirmed compatible part.

Repair: Repair cable damage or replace a confirmed faulty panel. Do not replace the motherboard if the fault lies in the cable or panel.

Verification: Image and backlight work across the brightness range, when moving the lid and after several cold starts.

Warning: Display connectors may expose contacts. Never hot-plug an eDP cable.

Source: https://www.dell.com/support/home/','eDP,backlight,display,panel,cable','https://www.dell.com/support/home/'),
('lesson:ADV-021','lesson','Bezpieczeństwo / Zalanie','Diagnostyka uszkodzeń po zalaniu: triage płyty','Liquid-damage triage for a motherboard','Opis: Po zalaniu urządzenie należy wyłączyć i odłączyć od zasilania. Dalsze uruchamianie może zwiększać korozję i uszkodzenia elektrochemiczne. Triage obejmuje ustalenie rodzaju cieczy, czasu zdarzenia, stanu baterii, obszaru zalania i priorytetu odzyskania danych. Nie stosuj ryżu, suszarki ani przypadkowych środków czyszczących.

Objawy: Urządzenie wyłącza się, klawiatura działa losowo, występuje korozja, zapach lub ślady cieczy.

Tok diagnostyczny: Określ, czy ciecz dostała się do płyty, baterii, złączy lub ekranu. Dokumentuj stan przed czyszczeniem. Wyciek baterii i zalanie cieczą przewodzącą wymagają szczególnej ostrożności.

Kroki: 1. Odłącz zasilacz i wyłącz urządzenie; nie próbuj ponownego startu.
2. Jeśli bateria jest spuchnięta lub gorąca, nie demontuj jej samodzielnie.
3. Zrób fotografie obszaru zalania i śladów korozji.
4. Zidentyfikuj rodzaj cieczy i czas od zdarzenia.
5. Po odłączeniu wszystkich źródeł zasilania technik ocenia złącza i elementy pod powiększeniem.
6. Ustal z właścicielem, czy priorytetem jest odzyskanie danych czy pełna naprawa.

Naprawa: Proces czyszczenia i naprawy wymaga właściwych materiałów, kontroli ESD i oceny uszkodzeń. Nie włączaj płyty, dopóki technik nie potwierdzi bezpieczeństwa i braku pozostałości przewodzących.

Weryfikacja: Po naprawie wykonaj kontrolę zasilania, test funkcjonalny wszystkich portów i klawiatury, test baterii oraz dokumentację zakresu uszkodzeń.

Ostrzeżenie: Przerwij przy dymie, spuchniętej baterii, zapachu chemicznym lub podwyższonej temperaturze. Nie ogrzewaj ogniw.

Źródło: https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery','Overview: After liquid ingress, power the device down and disconnect it. Further operation may accelerate corrosion and electrochemical damage. Triage records liquid type, incident time, battery state, affected area and data-recovery priority. Do not use rice, hair dryers or random cleaning chemicals.

Symptoms: The device shuts down, keyboard behaves erratically, corrosion, odour or liquid marks are present.

Diagnostic reasoning: Determine whether liquid reached the board, battery, connectors or display. Document the condition before cleaning. Battery leakage and conductive liquids require special care.

Steps: 1. Disconnect the adapter and power the device off; do not attempt another boot.
2. If the battery is swollen or hot, do not remove it yourself.
3. Photograph the affected area and corrosion traces.
4. Identify liquid type and incident time.
5. After all power sources are disconnected, a technician inspects connectors and components under magnification.
6. Agree whether data recovery or full repair is the priority.

Repair: Cleaning and repair require suitable materials, ESD controls and damage assessment. Do not power the board until a technician confirms safety and absence of conductive residue.

Verification: After repair, test power, all ports, keyboard, battery and document the extent of damage.

Warning: Stop for smoke, swollen battery, chemical odour or abnormal temperature. Never heat cells.

Source: https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery','liquid damage,corrosion,inspection,board','https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery'),
('lesson:ADV-022','lesson','Sieci / Ethernet','Ethernet: diagnostyka PHY i negocjacji linku','Ethernet PHY and link-negotiation diagnostics','Opis: Brak linku Ethernet może być skutkiem kabla, gniazda, magnetics, PHY, sterownika lub konfiguracji switcha. Warto rozdzielić brak linku fizycznego od problemu DHCP/DNS. Kontrolki portu i wynik negocjacji szybko zawężają obszar, ale nie zastępują testu znanym sprawnym przewodem i portem.

Objawy: Brak diod link/act, prędkość spada do 100 Mb/s lub połączenie zanika pod obciążeniem.

Tok diagnostyczny: Sprawdź przewód, port switcha i kartę na innym urządzeniu. Jeśli link fizyczny działa, dopiero potem badaj adresację, DHCP, DNS i sterownik.

Kroki: 1. Sprawdź ten sam kabel z innym urządzeniem.
2. Sprawdź drugi port switcha lub routera.
3. Zapisz wynegocjowaną prędkość i duplex.
4. Sprawdź stan adaptera i błędy sterownika.
5. Porównaj z innym adapterem USB-Ethernet lub portem.
6. Jeśli podejrzewasz PHY, dokumentuj objaw przed demontażem płyty.

Naprawa: Wymień kabel lub adapter po potwierdzeniu. Naprawa PHY/magnetics wymaga dokumentacji płyty i sprzętu serwisowego.

Weryfikacja: Połączenie negocjuje oczekiwaną prędkość, przechodzi test transferu i pozostaje stabilne przez dłuższy okres.

Ostrzeżenie: Nie podłączaj portu do nieznanego okablowania przemysłowego ani instalacji z niepotwierdzonym napięciem.

Źródło: https://learn.microsoft.com/en-us/windows-server/networking/','Overview: No Ethernet link may result from cable, jack, magnetics, PHY, driver or switch configuration. Separate physical link failure from DHCP/DNS issues. Port LEDs and negotiated link speed help narrow the fault but do not replace testing with a known-good cable and switch port.

Symptoms: No link/activity LEDs, speed falls to 100 Mb/s or connection drops under load.

Diagnostic reasoning: Test the cable, switch port and adapter on another device. If physical link works, then investigate addressing, DHCP, DNS and driver.

Steps: 1. Test the same cable with another device.
2. Try another switch or router port.
3. Record negotiated speed and duplex.
4. Check adapter state and driver errors.
5. Compare with a USB-Ethernet adapter or another port.
6. If PHY is suspected, document the symptom before board disassembly.

Repair: Replace cable or adapter after confirmation. PHY/magnetics repair requires board documentation and service equipment.

Verification: Link negotiates the expected speed, passes a transfer test and remains stable over time.

Warning: Do not connect to unknown industrial cabling or an installation with unverified voltage.

Source: https://learn.microsoft.com/en-us/windows-server/networking/','Ethernet,PHY,link,autonegotiation,cable','https://learn.microsoft.com/en-us/windows-server/networking/'),
('lesson:ADV-023','lesson','Sieci / Wi-Fi','Wi-Fi: diagnostyka anten i przewodów RF','Wi-Fi antenna and RF cable diagnostics','Opis: Słaby sygnał może wynikać z anten, przewodów koncentrycznych, złącz MHF, konfiguracji, zakłóceń lub punktu dostępowego. Zmiana anteny bez weryfikacji pasma, złącza i toru RF może pogorszyć działanie. Przed demontażem sprawdź sterownik, poziom sygnału i działanie w znanej lokalizacji.

Objawy: Wi-Fi działa tylko blisko routera, rozłącza się po poruszeniu pokrywą lub nie wykrywa jednego pasma.

Tok diagnostyczny: Porównaj RSSI w kilku lokalizacjach, sprawdź pasma obsługiwane przez kartę i router, a następnie obejrzyj przewody antenowe i złącza.

Kroki: 1. Zapisz model karty Wi-Fi i systemu antenowego.
2. Sprawdź działanie w pobliżu routera i w innym miejscu.
3. Porównaj 2,4 GHz, 5 GHz i inne wspierane pasma.
4. Zweryfikuj sterownik i ustawienia oszczędzania energii.
5. Odłącz zasilanie przed inspekcją przewodów w ekranie.
6. Sprawdź mocowanie anten bez naciągania przewodów.

Naprawa: Wymień przewód lub antenę tylko na zgodny element. Nie zmieniaj mocy nadajnika poza lokalne limity prawne.

Weryfikacja: Przetestuj roaming, transfer i stabilność na typowej odległości oraz po kilku cyklach uśpienia.

Ostrzeżenie: Złącza RF są delikatne. Nie wciskaj ich na siłę ani nie używaj metalowych narzędzi przy podłączonej baterii.

Źródło: https://www.intel.com/content/www/us/en/support/products/59485/wireless.html','Overview: Weak signal may be caused by antennas, coax cables, MHF connectors, configuration, interference or the access point. Replacing an antenna without checking band, connector and RF path may make performance worse. Before disassembly, check driver, signal level and operation at a known location.

Symptoms: Wi-Fi works only near the router, disconnects when the lid moves or fails to detect one band.

Diagnostic reasoning: Compare RSSI in several locations, check bands supported by adapter and router, then inspect antenna leads and connectors.

Steps: 1. Record Wi-Fi adapter and antenna-system model.
2. Test near the router and in another location.
3. Compare 2.4 GHz, 5 GHz and other supported bands.
4. Check driver and power-saving settings.
5. Disconnect power before inspecting display-lid wiring.
6. Check antenna mounting without stretching leads.

Repair: Replace a cable or antenna only with a compatible part. Do not exceed local legal transmitter-power limits.

Verification: Test roaming, transfer and stability at a normal distance and after several sleep cycles.

Warning: RF connectors are delicate. Do not force them or use metal tools while the battery is connected.

Source: https://www.intel.com/content/www/us/en/support/products/59485/wireless.html','Wi-Fi,antenna,RF,cable,signal','https://www.intel.com/content/www/us/en/support/products/59485/wireless.html'),
('lesson:ADV-024','lesson','Porty / USB','Diagnostyka portu USB: odróżnianie zasilania od danych','USB port: separating power faults from data faults','Opis: Port USB może dostarczać zasilanie, ale nie wykrywać danych, albo odwrotnie. Przyczyna może dotyczyć gniazda, linii VBUS, zabezpieczenia ESD, kontrolera, sterownika lub urządzenia. Testuj znanym sprawnym urządzeniem i przewodem, oddzielnie sprawdzając ładowanie, enumerację i transfer.

Objawy: Urządzenie ładuje się, ale nie pojawia się w systemie; port jest luźny albo działa tylko pod określonym kątem.

Tok diagnostyczny: Wyklucz urządzenie i przewód, sprawdź inne porty oraz logi systemowe. Mechaniczne luzy i przerwy w połączeniu mogą wymagać inspekcji pod mikroskopem.

Kroki: 1. Przetestuj co najmniej dwa znane sprawne urządzenia.
2. Użyj dwóch przewodów o potwierdzonej obsłudze danych.
3. Sprawdź zasilanie portu testerem USB bez przekraczania limitów.
4. Odczytaj błędy kontrolera i enumeracji w systemie.
5. Obejrzyj gniazdo i luty przy odłączonym zasilaniu.
6. Oddziel uszkodzenie gniazda od kontrolera hosta.

Naprawa: Wymień gniazdo lub element ochronny tylko po potwierdzeniu uszkodzenia. Po naprawie sprawdź transfer, ładowanie i stabilność mechanicznego połączenia.

Weryfikacja: Port wykrywa urządzenia, utrzymuje połączenie i działa w obu orientacjach, jeśli standard to przewiduje.

Ostrzeżenie: Nie zwieraj VBUS z liniami danych ani masą. Przerwij przy nadmiernym nagrzewaniu lub stopionym złączu.

Źródło: https://www.usb.org/documents','Overview: A USB port may provide power but fail data enumeration, or the reverse. Causes include connector, VBUS, ESD protection, controller, driver or peripheral. Test with known-good devices and cables, checking charging, enumeration and data transfer separately.

Symptoms: Device charges but is not detected; port is loose or works only at a certain angle.

Diagnostic reasoning: Rule out the peripheral and cable, test other ports and review system logs. Mechanical looseness or intermittent connection may require microscope inspection.

Steps: 1. Test at least two known-good devices.
2. Use two cables confirmed to support data.
3. Check port power with a USB tester without exceeding ratings.
4. Review controller and enumeration errors in the OS.
5. Inspect the connector and solder joints with power disconnected.
6. Separate connector damage from host-controller faults.

Repair: Replace the port or protection component only after confirming damage. After repair test transfer, charging and mechanical stability.

Verification: The port enumerates devices, maintains connection and works in both orientations where the standard provides for it.

Warning: Do not short VBUS to data lines or ground. Stop for abnormal heating or a melted connector.

Source: https://www.usb.org/documents','USB,VBUS,data lines,enumeration,port','https://www.usb.org/documents'),
('lesson:ADV-025','lesson','Windows / BSOD','Analiza BSOD: zrzuty pamięci i WinDbg','BSOD analysis: crash dumps and WinDbg','Opis: Zrzut pamięci BSOD zawiera kontekst błędu i może wskazać sterownik lub moduł, ale nazwa pliku w stack trace nie zawsze oznacza rzeczywistą przyczynę. Analizę łącz z czasem zdarzenia, wersją sterowników, sprzętem i wynikami testów. Wrażliwe zrzuty mogą zawierać fragmenty danych — nie udostępniaj ich publicznie bez anonimizacji.

Objawy: Powtarzające się BSOD, różne kody STOP lub restarty podczas określonej aplikacji.

Tok diagnostyczny: Porównaj kilka zrzutów, parametry bugcheck, moduły, sterowniki i zdarzenia WHEA. Ustal, czy awaria jest powtarzalna w podobnych warunkach.

Kroki: 1. Zabezpiecz logi i minidumpy, nie publikując danych osobowych.
2. Zapisz kod STOP, parametry i czas awarii.
3. Użyj WinDbg i symboli Microsoft do analizy stosu.
4. Sprawdź wersję sterownika wskazanego w analizie.
5. Porównaj z testami RAM, dysku, CPU i GPU.
6. Wykonaj jedną kontrolowaną zmianę i sprawdź, czy objaw ustąpił.

Naprawa: Przywróć znany stabilny sterownik lub usuń potwierdzony konflikt. Nie usuwaj wielu sterowników naraz i nie wyłączaj zabezpieczeń systemu.

Weryfikacja: Przeprowadź test w warunkach wcześniejszej awarii, monitoruj zdarzenia i zachowaj raport porównawczy.

Ostrzeżenie: Nie wklejaj publicznie pełnych dumpów zawierających dane klienta. Klucze, hasła i prywatne pliki należy usunąć.

Źródło: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/','Overview: A BSOD dump contains crash context and may identify a driver or module, but a filename in the stack trace is not always the root cause. Correlate analysis with event time, driver versions, hardware and test results. Dumps can contain sensitive fragments; do not publish them without sanitization.

Symptoms: Repeated BSODs, varying STOP codes or restarts during a specific application.

Diagnostic reasoning: Compare multiple dumps, bugcheck parameters, modules, drivers and WHEA events. Determine whether the crash repeats under similar conditions.

Steps: 1. Preserve logs and minidumps without publishing personal data.
2. Record STOP code, parameters and crash time.
3. Use WinDbg and Microsoft symbols to analyse the stack.
4. Check the version of the driver identified by analysis.
5. Compare with RAM, disk, CPU and GPU tests.
6. Make one controlled change and check whether the symptom disappears.

Repair: Return to a known-stable driver or resolve a confirmed conflict. Do not remove many drivers at once or disable system protections.

Verification: Retest under the conditions that caused the crash, monitor events and keep a comparison report.

Warning: Do not publicly paste full dumps containing client data. Remove keys, passwords and private files.

Source: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/','BSOD,minidump,WinDbg,crash dump,driver','https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/'),
('lesson:ADV-026','lesson','Windows / Naprawa systemu','DISM i SFC: kolejność naprawy magazynu komponentów','DISM and SFC: component-store repair sequence','Opis: SFC sprawdza integralność chronionych plików systemowych, a DISM naprawia obraz Windows i magazyn komponentów. Kolejność oraz dostępność źródła naprawy zależą od wersji systemu, aktualizacji i stanu obrazu. Przed naprawą zapisz kod błędu, wykonaj kopię danych i upewnij się, że system ma odpowiednie źródło plików.

Objawy: Błędy aktualizacji, uszkodzone składniki systemu, niepowodzenie SFC lub komunikat o uszkodzonym obrazie.

Tok diagnostyczny: Zapisz wersję Windows, wydanie, build i kod błędu. Przeanalizuj CBS.log oraz DISM.log zamiast powtarzać polecenia bez czytania wyniku.

Kroki: 1. Utwórz kopię ważnych danych i sprawdź wolne miejsce.
2. Zapisz wersję/build Windows i kod błędu.
3. Uruchom DISM /Online /Cleanup-Image /ScanHealth, jeśli wspierany.
4. Wykonaj DISM /Online /Cleanup-Image /RestoreHealth z właściwym źródłem.
5. Po udanym DISM uruchom sfc /scannow.
6. Zapisz logi i powtórz test aplikacji, która wcześniej zgłaszała problem.

Naprawa: Jeśli RestoreHealth nie może znaleźć źródła, dobierz oficjalne ISO zgodne z wydaniem, językiem i buildem. Nie podawaj przypadkowego obrazu systemu.

Weryfikacja: SFC nie raportuje nowych naruszeń, aktualizacje i aplikacje działają, a logi nie zawierają powtarzalnego błędu naprawy.

Ostrzeżenie: Nie używaj `/ResetBase` ani operacji usuwających pakiety bez kopii i zrozumienia konsekwencji.

Źródło: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image','Overview: SFC checks protected system files, while DISM repairs the Windows image and component store. Sequence and repair-source availability depend on OS version, updates and image state. Before repair record error codes, back up data and ensure a suitable source is available.

Symptoms: Update failures, damaged system components, SFC failures or a corrupted image message.

Diagnostic reasoning: Record Windows edition, build and error code. Review CBS.log and DISM.log instead of repeating commands without interpreting results.

Steps: 1. Back up important data and check free space.
2. Record Windows version/build and error code.
3. Run DISM /Online /Cleanup-Image /ScanHealth where supported.
4. Run DISM /Online /Cleanup-Image /RestoreHealth with a suitable source.
5. After successful DISM, run sfc /scannow.
6. Save logs and retest the application that showed the issue.

Repair: If RestoreHealth cannot find source files, select official media matching edition, language and build. Do not use a random image.

Verification: SFC reports no remaining violations, updates and apps work, and logs show no repeated repair failure.

Warning: Do not use `/ResetBase` or package-removal operations without a backup and understanding the consequences.

Source: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image','DISM,SFC,component store,Windows repair','https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image'),
('lesson:ADV-027','lesson','Windows / Sterowniki','Diagnostyka sterownika: konflikt wersji i rollback','Driver diagnostics: version conflict and rollback','Opis: Sterownik może być zgodny z układem, ale nie z konkretnym laptopem, firmware, funkcją OEM lub wersją Windows. W laptopach producent urządzenia może dostarczać zmodyfikowane pakiety dla ACPI, audio, grafiki hybrydowej i zasilania. Przed użyciem generycznego sterownika porównaj identyfikator sprzętu, wersję i uwagi wydania OEM.

Objawy: Nieznane urządzenie, kod 10/31/43, brak funkcji klawiszy, problemy z uśpieniem lub migotanie po aktualizacji.

Tok diagnostyczny: Zbierz hardware ID, wersję systemu, datę i wersję sterownika oraz zdarzenia urządzenia. Ustal, czy problem pojawił się bezpośrednio po aktualizacji.

Kroki: 1. Zapisz hardware ID i numer urządzenia.
2. Sprawdź historię Windows Update i wersję poprzedniego sterownika.
3. Pobierz sterownik ze strony OEM dla dokładnego modelu.
4. Utwórz punkt przywracania, jeśli wspierany, i zachowaj instalator.
5. Wykonaj kontrolowany rollback lub reinstalację jednego sterownika.
6. Przetestuj funkcje urządzenia, uśpienie i wznowienie.

Naprawa: Zostaw sterownik stabilny i wspierany przez producenta. Unikaj nieoficjalnych pakietów i automatycznych instalatorów o nieznanym źródle.

Weryfikacja: W Menedżerze urządzeń brak błędów, urządzenie działa po restarcie i po wznowieniu ze stanu uśpienia.

Ostrzeżenie: Nie pobieraj plików sterowników z przypadkowych serwisów. Zweryfikuj podpis i źródło.

Źródło: https://support.microsoft.com/windows/update-drivers-through-device-manager-in-windows-ec62f46c-ff14-c91d-eead-d7126dc1f7b6','Overview: A driver may support a chipset but not a specific laptop, firmware, OEM feature or Windows build. Laptop vendors may provide customized packages for ACPI, audio, hybrid graphics and power management. Before using a generic driver, compare hardware IDs, version and OEM release notes.

Symptoms: Unknown device, Code 10/31/43, missing hotkeys, sleep issues or flicker after an update.

Diagnostic reasoning: Collect hardware ID, OS version, driver version/date and device events. Determine whether the issue began immediately after an update.

Steps: 1. Record hardware ID and device instance.
2. Check Windows Update history and previous driver version.
3. Download the OEM driver for the exact model.
4. Create a restore point where supported and keep the installer.
5. Perform a controlled rollback or reinstall of one driver.
6. Test device functions, sleep and resume.

Repair: Keep a stable vendor-supported driver. Avoid unofficial packages and unknown automatic installers.

Verification: Device Manager shows no error and the device works after restart and resume from sleep.

Warning: Do not download drivers from random sites. Verify signature and source.

Source: https://support.microsoft.com/windows/update-drivers-through-device-manager-in-windows-ec62f46c-ff14-c91d-eead-d7126dc1f7b6','driver,rollback,OEM,WHQL,device manager','https://support.microsoft.com/windows/update-drivers-through-device-manager-in-windows-ec62f46c-ff14-c91d-eead-d7126dc1f7b6'),
('lesson:ADV-028','lesson','Dane / Kopie zapasowe','Kontrola integralności kopii zapasowej i hash SHA-256','Backup integrity verification and SHA-256 hashing','Opis: Komunikat o zakończeniu kopiowania nie dowodzi, że kopia jest kompletna i możliwa do odtworzenia. Weryfikuj liczby plików, rozmiar, log kopii, sumy kontrolne i próbne odtworzenie wybranych danych. Kopia powinna być odseparowana od oryginalnego nośnika i chroniona przed przypadkowym nadpisaniem lub ransomware.

Objawy: Kopia trwa nietypowo krótko, część plików nie otwiera się albo program zgłasza pominięte elementy.

Tok diagnostyczny: Porównaj manifest źródła i kopii, uprawnienia, ścieżki, rozmiary i sumy kontrolne. Uwzględnij pliki zablokowane lub pominięte.

Kroki: 1. Zapisz narzędzie, wersję i zakres kopii.
2. Wygeneruj manifest z listą plików i rozmiarami.
3. Oblicz SHA-256 dla kluczowych plików lub obrazów.
4. Porównaj manifest oraz logi pominiętych elementów.
5. Odtwórz próbkę do osobnej lokalizacji.
6. Zapisz datę, lokalizację i wynik testu odtworzenia.

Naprawa: Jeśli sumy się różnią, nie kasuj oryginału. Powtórz kopię na inny nośnik i ustal źródło błędu.

Weryfikacja: Próbne odtworzenie działa, hash jest zgodny, a kopia znajduje się w niezależnej lokalizacji.

Ostrzeżenie: Nie zapisuj kopii jedynych danych na tym samym nośniku, z którego je odzyskujesz.

Źródło: https://www.nist.gov/publications/secure-hash-standard','Overview: A copy-complete message does not prove a backup is complete or restorable. Verify file counts, sizes, backup logs, checksums and a test restore. Keep backups separate from the original drive and protected from accidental overwrite or ransomware.

Symptoms: Backup finishes unusually quickly, some files will not open or the tool reports skipped items.

Diagnostic reasoning: Compare source and backup manifests, permissions, paths, sizes and checksums. Account for locked or skipped files.

Steps: 1. Record the tool, version and backup scope.
2. Generate a file manifest and sizes.
3. Calculate SHA-256 for key files or images.
4. Compare the manifest and skipped-item logs.
5. Restore a sample to a separate location.
6. Record date, location and restore-test result.

Repair: If hashes differ, do not delete the original. Repeat the backup to another destination and identify the cause.

Verification: Test restore works, hashes match and the backup is stored independently.

Warning: Do not store the only backup on the same drive from which you are recovering data.

Source: https://www.nist.gov/publications/secure-hash-standard','backup,SHA-256,integrity,restore,test','https://www.nist.gov/publications/secure-hash-standard'),
('lesson:ADV-029','lesson','Serwis / QA','Test odbiorczy komputera po naprawie płyty','Post-repair acceptance test after motherboard service','Opis: Test odbiorczy powinien potwierdzić funkcje związane z pierwotnym objawem oraz podstawowe elementy, które mogły zostać naruszone podczas demontażu. Lista zależy od modelu i zakresu naprawy. Nie ograniczaj się do jednego uruchomienia: sprawdź porty, pamięć, dyski, obraz, dźwięk, sieć, ładowanie, uśpienie i logi.

Objawy: Naprawa wydaje się zakończona, ale klient oczekuje potwierdzenia stabilności i zakresu prac.

Tok diagnostyczny: Porównaj pierwotny objaw z testem końcowym. Zaznacz, które funkcje zostały sprawdzone, a które nie były objęte naprawą.

Kroki: 1. Wykonaj kilka zimnych startów.
2. Sprawdź wykrywanie CPU, RAM, dysków i urządzeń w systemie.
3. Przetestuj porty i funkcje związane z naprawą.
4. Sprawdź temperatury i zachowanie pod lekkim, kontrolowanym obciążeniem.
5. Zweryfikuj Wi-Fi/Ethernet, audio, kamerę i ładowanie, jeśli występują.
6. Zapisz wyniki, ograniczenia testu i przekazane zalecenia klientowi.

Naprawa: Jeśli jakikolwiek objaw wraca, nie oznaczaj zlecenia jako zakończonego. Wróć do diagnozy i poinformuj klienta o dalszym zakresie.

Weryfikacja: Raport zawiera datę, model, wykonane testy, wyniki, części i ograniczenia. Dane klienta są przechowywane bezpiecznie.

Ostrzeżenie: Nie kopiuj danych klienta do publicznej bazy ani czatu edukacyjnego.

Źródło: https://www.nist.gov/privacy-framework','Overview: An acceptance test must confirm the functions related to the original symptom and components that may have been affected during disassembly. The checklist depends on model and repair scope. Do not rely on one boot: test ports, memory, storage, display, audio, network, charging, sleep and logs.

Symptoms: Repair appears complete, but the customer needs evidence of stability and work performed.

Diagnostic reasoning: Compare the original symptom with the final test. Mark which functions were checked and which were outside the repair scope.

Steps: 1. Perform several cold starts.
2. Check CPU, RAM, storage and device detection.
3. Test ports and functions related to the repair.
4. Check temperatures and behaviour under light controlled load.
5. Verify Wi-Fi/Ethernet, audio, camera and charging where fitted.
6. Record results, test limitations and customer advice.

Repair: If any symptom returns, do not mark the job complete. Return to diagnosis and inform the customer about the next scope.

Verification: The report includes date, model, tests, results, parts and limitations. Customer data is handled securely.

Warning: Do not copy customer data into the public knowledge base or educational chat.

Source: https://www.nist.gov/privacy-framework','QA,acceptance,test,repair report,quality','https://www.nist.gov/privacy-framework'),
('lesson:ADV-030','lesson','Serwis / Dokumentacja','Dokumentacja naprawy: zdjęcia, pomiary i identyfikacja części','Repair documentation: photos, measurements and part identification','Opis: Dobra dokumentacja pozwala odtworzyć tok diagnozy i ogranicza powtarzanie ryzykownych prób. Zapisuj model, rewizję, oznaczenie części, warunki pomiaru, użyty przyrząd, wynik oraz wniosek. Zdjęcia powinny pokazywać stan przed i po naprawie, ale nie mogą ujawniać danych klienta, numerów seryjnych lub prywatnych plików.

Objawy: Powracające zlecenia, brak pewności co było testowane lub rozbieżności między technikami.

Tok diagnostyczny: Raport rozdziela obserwacje, hipotezy, wyniki pomiarów, potwierdzoną przyczynę i czynności naprawcze. Nie zamieniaj hipotezy w fakt bez dowodu.

Kroki: 1. Zapisz model, rewizję i numer zlecenia w systemie serwisowym.
2. Fotografuj stan przed demontażem bez danych klienta.
3. Zapisz pomiar wraz z punktem, zakresem, trybem i stanem zasilania.
4. Oznacz część według pełnego numeru producenta.
5. Dołącz źródło dokumentacji i datę sprawdzenia.
6. W raporcie końcowym opisz test odbiorczy i ograniczenia.

Naprawa: Raport udostępniaj wyłącznie osobom upoważnionym. Do wspólnej bazy Akademii publikuj tylko zanonimizowany opis i materiały, do których masz prawa.

Weryfikacja: Inny technik może odtworzyć tok diagnozy bez ujawniania danych klienta. Załączniki są czytelne i mają właściwy dostęp.

Ostrzeżenie: Nie publikuj numerów seryjnych, adresów, loginów, haseł, kluczy odzyskiwania ani dokumentów klienta.

Źródło: https://www.nist.gov/privacy-framework','Overview: Good documentation makes the diagnostic path reproducible and reduces repeated risky tests. Record model, revision, part marking, measurement conditions, instrument, result and conclusion. Photos should show before/after condition but must not expose customer data, serial numbers or private files.

Symptoms: Repeat repairs, uncertainty about previous tests or disagreement between technicians.

Diagnostic reasoning: The report separates observations, hypotheses, measurements, confirmed cause and repair actions. Do not turn a hypothesis into fact without evidence.

Steps: 1. Record model, revision and service-job reference in the service system.
2. Photograph the pre-repair condition without customer data.
3. Record each measurement with point, range, mode and power state.
4. Identify parts using the full manufacturer number.
5. Include documentation source and date checked.
6. Describe acceptance tests and limitations in the final report.

Repair: Share reports only with authorized people. Publish only anonymized summaries and materials you have rights to in the Academy community base.

Verification: Another technician can follow the diagnostic path without exposing customer data. Attachments are readable and access-controlled.

Warning: Do not publish serial numbers, addresses, logins, passwords, recovery keys or customer documents.

Source: https://www.nist.gov/privacy-framework','service report,photos,measurements,part number','https://www.nist.gov/privacy-framework');
