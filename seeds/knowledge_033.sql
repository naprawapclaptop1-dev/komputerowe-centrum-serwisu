INSERT OR IGNORE INTO academy_knowledge (id,kind,category,title_pl,title_en,content_pl,content_en,tags,source_ref) VALUES
('lesson:LABX-001','lesson','Windows / sprzęt','Analiza dziennika WHEA','Analysing the WHEA event log','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Analiza dziennika WHEA.

Objawy i kontekst: Losowe restarty, zamrożenia lub wpisy WHEA-Logger 17, 18, 19 albo 46. Sam numer zdarzenia nie wskazuje automatycznie uszkodzonego CPU.

Tok diagnostyczny: Zapisz pełny identyfikator zdarzenia, źródło, APIC ID, typ błędu, czas oraz korelację z obciążeniem. Oddziel skorygowane błędy PCIe od nieskorygowanych błędów procesora.

Możliwe rozwiązanie: Zaktualizuj BIOS, chipset i sterowniki wyłącznie z właściwej strony OEM, sprawdź stabilność ustawień fabrycznych, temperatury i zasilanie. W razie wskazania konkretnego urządzenia PCIe przetestuj je osobno.

Kryterium odbioru: Po kilku pełnych cyklach obciążenia i bezczynności nie pojawiają się nowe błędy nieskorygowane; raport końcowy zawiera zdarzenia sprzed i po naprawie.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Losowe restarty, zamrożenia lub wpisy WHEA-Logger 17, 18, 19 albo 46. Sam numer zdarzenia nie wskazuje automatycznie uszkodzonego CPU.
Tok diagnostyczny: Zapisz pełny identyfikator zdarzenia, źródło, APIC ID, typ błędu, czas oraz korelację z obciążeniem. Oddziel skorygowane błędy PCIe od nieskorygowanych błędów procesora.
Rozwiązanie: Zaktualizuj BIOS, chipset i sterowniki wyłącznie z właściwej strony OEM, sprawdź stabilność ustawień fabrycznych, temperatury i zasilanie. W razie wskazania konkretnego urządzenia PCIe przetestuj je osobno.
Test końcowy: Po kilku pełnych cyklach obciążenia i bezczynności nie pojawiają się nowe błędy nieskorygowane; raport końcowy zawiera zdarzenia sprzed i po naprawie.
Ostrzeżenie: Nie podnoś napięć ani limitów mocy w celu ukrycia błędu. Najpierw wróć do ustawień fabrycznych i zabezpiecz dane.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Analysing the WHEA event log.

Symptoms and context: Losowe restarty, zamrożenia lub wpisy WHEA-Logger 17, 18, 19 albo 46. Sam numer zdarzenia nie wskazuje automatycznie uszkodzonego CPU.

Diagnostic reasoning: Zapisz pełny identyfikator zdarzenia, źródło, APIC ID, typ błędu, czas oraz korelację z obciążeniem. Oddziel skorygowane błędy PCIe od nieskorygowanych błędów procesora.

Possible remedy: Zaktualizuj BIOS, chipset i sterowniki wyłącznie z właściwej strony OEM, sprawdź stabilność ustawień fabrycznych, temperatury i zasilanie. W razie wskazania konkretnego urządzenia PCIe przetestuj je osobno.

Acceptance criteria: Po kilku pełnych cyklach obciążenia i bezczynności nie pojawiają się nowe błędy nieskorygowane; raport końcowy zawiera zdarzenia sprzed i po naprawie.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Losowe restarty, zamrożenia lub wpisy WHEA-Logger 17, 18, 19 albo 46. Sam numer zdarzenia nie wskazuje automatycznie uszkodzonego CPU.
Diagnostic reasoning: Zapisz pełny identyfikator zdarzenia, źródło, APIC ID, typ błędu, czas oraz korelację z obciążeniem. Oddziel skorygowane błędy PCIe od nieskorygowanych błędów procesora.
Remedy: Zaktualizuj BIOS, chipset i sterowniki wyłącznie z właściwej strony OEM, sprawdź stabilność ustawień fabrycznych, temperatury i zasilanie. W razie wskazania konkretnego urządzenia PCIe przetestuj je osobno.
Verification: Po kilku pełnych cyklach obciążenia i bezczynności nie pojawiają się nowe błędy nieskorygowane; raport końcowy zawiera zdarzenia sprzed i po naprawie.
Warning: Nie podnoś napięć ani limitów mocy w celu ukrycia błędu. Najpierw wróć do ustawień fabrycznych i zabezpiecz dane.','WHEA,Event Viewer,hardware,Windows','https://learn.microsoft.com/en-us/windows-hardware/drivers/whea/'),
('lesson:LABX-002','lesson','Windows / diagnostyka','Analiza minidump BSOD w WinDbg','Analysing BSOD minidumps in WinDbg','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Analiza minidump BSOD w WinDbg.

Objawy i kontekst: Niebieski ekran z kodem stop, ponowny start lub powtarzalny błąd po określonym sterowniku.

Tok diagnostyczny: Zbierz minidump, pełny kod stop, czas, ostatnie aktualizacje i konfigurację sprzętu. W WinDbg uruchom analizę !analyze -v, sprawdź moduł, stos i zgodność wersji sterownika; pojedynczy wskazany moduł nie zawsze jest pierwotną przyczyną.

Możliwe rozwiązanie: Odtwórz usterkę w kontrolowanych warunkach, porównaj kilka zrzutów, zaktualizuj lub wycofaj wyłącznie podejrzany sterownik i sprawdź pamięć oraz dysk.

Kryterium odbioru: Po ponownych testach nie występuje ten sam stop code; do protokołu dołącz plik analizy i wersję sterownika.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Niebieski ekran z kodem stop, ponowny start lub powtarzalny błąd po określonym sterowniku.
Tok diagnostyczny: Zbierz minidump, pełny kod stop, czas, ostatnie aktualizacje i konfigurację sprzętu. W WinDbg uruchom analizę !analyze -v, sprawdź moduł, stos i zgodność wersji sterownika; pojedynczy wskazany moduł nie zawsze jest pierwotną przyczyną.
Rozwiązanie: Odtwórz usterkę w kontrolowanych warunkach, porównaj kilka zrzutów, zaktualizuj lub wycofaj wyłącznie podejrzany sterownik i sprawdź pamięć oraz dysk.
Test końcowy: Po ponownych testach nie występuje ten sam stop code; do protokołu dołącz plik analizy i wersję sterownika.
Ostrzeżenie: Nie publikuj minidumpów bez sprawdzenia, czy nie zawierają ścieżek, nazw użytkowników lub danych klienta.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Analysing BSOD minidumps in WinDbg.

Symptoms and context: Niebieski ekran z kodem stop, ponowny start lub powtarzalny błąd po określonym sterowniku.

Diagnostic reasoning: Zbierz minidump, pełny kod stop, czas, ostatnie aktualizacje i konfigurację sprzętu. W WinDbg uruchom analizę !analyze -v, sprawdź moduł, stos i zgodność wersji sterownika; pojedynczy wskazany moduł nie zawsze jest pierwotną przyczyną.

Possible remedy: Odtwórz usterkę w kontrolowanych warunkach, porównaj kilka zrzutów, zaktualizuj lub wycofaj wyłącznie podejrzany sterownik i sprawdź pamięć oraz dysk.

Acceptance criteria: Po ponownych testach nie występuje ten sam stop code; do protokołu dołącz plik analizy i wersję sterownika.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Niebieski ekran z kodem stop, ponowny start lub powtarzalny błąd po określonym sterowniku.
Diagnostic reasoning: Zbierz minidump, pełny kod stop, czas, ostatnie aktualizacje i konfigurację sprzętu. W WinDbg uruchom analizę !analyze -v, sprawdź moduł, stos i zgodność wersji sterownika; pojedynczy wskazany moduł nie zawsze jest pierwotną przyczyną.
Remedy: Odtwórz usterkę w kontrolowanych warunkach, porównaj kilka zrzutów, zaktualizuj lub wycofaj wyłącznie podejrzany sterownik i sprawdź pamięć oraz dysk.
Verification: Po ponownych testach nie występuje ten sam stop code; do protokołu dołącz plik analizy i wersję sterownika.
Warning: Nie publikuj minidumpów bez sprawdzenia, czy nie zawierają ścieżek, nazw użytkowników lub danych klienta.','BSOD,WinDbg,minidump,debugger','https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/'),
('lesson:LABX-003','lesson','Windows / rozruch','Odbudowa BCD bez utraty danych','Rebuilding BCD without data loss','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Odbudowa BCD bez utraty danych.

Objawy i kontekst: Windows nie startuje, pojawia się komunikat Boot Configuration Data missing/corrupt albo automatyczna naprawa pętli.

Tok diagnostyczny: Sprawdź czy dysk jest widoczny w UEFI, czy partycja EFI istnieje, czy tryb UEFI/CSM i ustawienie AHCI/RAID nie uległy zmianie. Przed zapisem rozpoznaj literę woluminu Windows w WinRE.

Możliwe rozwiązanie: Wykonaj kopię danych lub obraz dysku. Użyj narzędzia Startup Repair, a ręczne odbudowanie plików rozruchowych wykonaj dopiero po identyfikacji partycji EFI i instalacji Windows.

Kryterium odbioru: UEFI wskazuje właściwy Windows Boot Manager, system startuje kilkukrotnie, a szyfrowany wolumin nadal jest dostępny z prawidłowym kluczem właściciela.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Windows nie startuje, pojawia się komunikat Boot Configuration Data missing/corrupt albo automatyczna naprawa pętli.
Tok diagnostyczny: Sprawdź czy dysk jest widoczny w UEFI, czy partycja EFI istnieje, czy tryb UEFI/CSM i ustawienie AHCI/RAID nie uległy zmianie. Przed zapisem rozpoznaj literę woluminu Windows w WinRE.
Rozwiązanie: Wykonaj kopię danych lub obraz dysku. Użyj narzędzia Startup Repair, a ręczne odbudowanie plików rozruchowych wykonaj dopiero po identyfikacji partycji EFI i instalacji Windows.
Test końcowy: UEFI wskazuje właściwy Windows Boot Manager, system startuje kilkukrotnie, a szyfrowany wolumin nadal jest dostępny z prawidłowym kluczem właściciela.
Ostrzeżenie: Nie formatuj partycji EFI i nie zmieniaj układu partycji bez kopii. Nie proś użytkownika o przesłanie klucza BitLocker.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Rebuilding BCD without data loss.

Symptoms and context: Windows nie startuje, pojawia się komunikat Boot Configuration Data missing/corrupt albo automatyczna naprawa pętli.

Diagnostic reasoning: Sprawdź czy dysk jest widoczny w UEFI, czy partycja EFI istnieje, czy tryb UEFI/CSM i ustawienie AHCI/RAID nie uległy zmianie. Przed zapisem rozpoznaj literę woluminu Windows w WinRE.

Possible remedy: Wykonaj kopię danych lub obraz dysku. Użyj narzędzia Startup Repair, a ręczne odbudowanie plików rozruchowych wykonaj dopiero po identyfikacji partycji EFI i instalacji Windows.

Acceptance criteria: UEFI wskazuje właściwy Windows Boot Manager, system startuje kilkukrotnie, a szyfrowany wolumin nadal jest dostępny z prawidłowym kluczem właściciela.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Windows nie startuje, pojawia się komunikat Boot Configuration Data missing/corrupt albo automatyczna naprawa pętli.
Diagnostic reasoning: Sprawdź czy dysk jest widoczny w UEFI, czy partycja EFI istnieje, czy tryb UEFI/CSM i ustawienie AHCI/RAID nie uległy zmianie. Przed zapisem rozpoznaj literę woluminu Windows w WinRE.
Remedy: Wykonaj kopię danych lub obraz dysku. Użyj narzędzia Startup Repair, a ręczne odbudowanie plików rozruchowych wykonaj dopiero po identyfikacji partycji EFI i instalacji Windows.
Verification: UEFI wskazuje właściwy Windows Boot Manager, system startuje kilkukrotnie, a szyfrowany wolumin nadal jest dostępny z prawidłowym kluczem właściciela.
Warning: Nie formatuj partycji EFI i nie zmieniaj układu partycji bez kopii. Nie proś użytkownika o przesłanie klucza BitLocker.','BCD,EFI,WinRE,boot','https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image'),
('lesson:LABX-004','lesson','Windows / serwis systemu','Bezpieczne użycie DISM RestoreHealth','Using DISM RestoreHealth safely','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Bezpieczne użycie DISM RestoreHealth.

Objawy i kontekst: SFC zgłasza niemożliwe do naprawienia pliki, aktualizacje kończą się błędem albo system ma uszkodzony magazyn składników.

Tok diagnostyczny: Sprawdź wersję, kompilację, język, edycję i stan aktualizacji Windows. Zbierz wynik DISM /ScanHealth, log CBS i wolne miejsce.

Możliwe rozwiązanie: Najpierw wykonaj kopię danych i kontrolę systemu plików. Uruchom DISM z właściwym źródłem obrazu odpowiadającym wersji, językowi i edycji, a następnie SFC. Zapisz kody wyjścia i logi.

Kryterium odbioru: DISM kończy się bez błędu, SFC nie wykrywa uszkodzeń wymagających naprawy, Windows Update i restart przechodzą poprawnie.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: SFC zgłasza niemożliwe do naprawienia pliki, aktualizacje kończą się błędem albo system ma uszkodzony magazyn składników.
Tok diagnostyczny: Sprawdź wersję, kompilację, język, edycję i stan aktualizacji Windows. Zbierz wynik DISM /ScanHealth, log CBS i wolne miejsce.
Rozwiązanie: Najpierw wykonaj kopię danych i kontrolę systemu plików. Uruchom DISM z właściwym źródłem obrazu odpowiadającym wersji, językowi i edycji, a następnie SFC. Zapisz kody wyjścia i logi.
Test końcowy: DISM kończy się bez błędu, SFC nie wykrywa uszkodzeń wymagających naprawy, Windows Update i restart przechodzą poprawnie.
Ostrzeżenie: Nie używaj losowego install.wim z innej wersji Windows; niedopasowany obraz może pogłębić problem.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Using DISM RestoreHealth safely.

Symptoms and context: SFC zgłasza niemożliwe do naprawienia pliki, aktualizacje kończą się błędem albo system ma uszkodzony magazyn składników.

Diagnostic reasoning: Sprawdź wersję, kompilację, język, edycję i stan aktualizacji Windows. Zbierz wynik DISM /ScanHealth, log CBS i wolne miejsce.

Possible remedy: Najpierw wykonaj kopię danych i kontrolę systemu plików. Uruchom DISM z właściwym źródłem obrazu odpowiadającym wersji, językowi i edycji, a następnie SFC. Zapisz kody wyjścia i logi.

Acceptance criteria: DISM kończy się bez błędu, SFC nie wykrywa uszkodzeń wymagających naprawy, Windows Update i restart przechodzą poprawnie.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: SFC zgłasza niemożliwe do naprawienia pliki, aktualizacje kończą się błędem albo system ma uszkodzony magazyn składników.
Diagnostic reasoning: Sprawdź wersję, kompilację, język, edycję i stan aktualizacji Windows. Zbierz wynik DISM /ScanHealth, log CBS i wolne miejsce.
Remedy: Najpierw wykonaj kopię danych i kontrolę systemu plików. Uruchom DISM z właściwym źródłem obrazu odpowiadającym wersji, językowi i edycji, a następnie SFC. Zapisz kody wyjścia i logi.
Verification: DISM kończy się bez błędu, SFC nie wykrywa uszkodzeń wymagających naprawy, Windows Update i restart przechodzą poprawnie.
Warning: Nie używaj losowego install.wim z innej wersji Windows; niedopasowany obraz może pogłębić problem.','DISM,SFC,CBS,Windows Update','https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image'),
('lesson:LABX-005','lesson','Windows / wydajność','Diagnostyka opóźnień DPC i ISR','Diagnosing DPC and ISR latency','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka opóźnień DPC i ISR.

Objawy i kontekst: Przycinanie dźwięku, skoki opóźnień, trzaski audio lub nieregularne mikroprzycięcia mimo niskiego użycia CPU.

Tok diagnostyczny: Zapisz scenariusz, urządzenia aktywne w chwili problemu oraz wynik pomiaru narzędziem diagnostycznym. Porównaj sterowniki sieci, audio, GPU i magazynu, a nie tylko najwyższy pojedynczy pik.

Możliwe rozwiązanie: Wyłączaj po jednym urządzeniu testowym, aktualizuj sterowniki OEM i porównuj wyniki w tych samych warunkach. Przywróć ustawienia po każdym teście.

Kryterium odbioru: W identycznym scenariuszu znikają trzaski i skoki, a urządzenia nadal działają prawidłowo.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/introduction-to-dpc-objects-and-windows-dpc-routines. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Przycinanie dźwięku, skoki opóźnień, trzaski audio lub nieregularne mikroprzycięcia mimo niskiego użycia CPU.
Tok diagnostyczny: Zapisz scenariusz, urządzenia aktywne w chwili problemu oraz wynik pomiaru narzędziem diagnostycznym. Porównaj sterowniki sieci, audio, GPU i magazynu, a nie tylko najwyższy pojedynczy pik.
Rozwiązanie: Wyłączaj po jednym urządzeniu testowym, aktualizuj sterowniki OEM i porównuj wyniki w tych samych warunkach. Przywróć ustawienia po każdym teście.
Test końcowy: W identycznym scenariuszu znikają trzaski i skoki, a urządzenia nadal działają prawidłowo.
Ostrzeżenie: Nie stosuj przypadkowych skryptów „optymalizujących” rejestr lub usług; mogą maskować problem i pogorszyć stabilność.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing DPC and ISR latency.

Symptoms and context: Przycinanie dźwięku, skoki opóźnień, trzaski audio lub nieregularne mikroprzycięcia mimo niskiego użycia CPU.

Diagnostic reasoning: Zapisz scenariusz, urządzenia aktywne w chwili problemu oraz wynik pomiaru narzędziem diagnostycznym. Porównaj sterowniki sieci, audio, GPU i magazynu, a nie tylko najwyższy pojedynczy pik.

Possible remedy: Wyłączaj po jednym urządzeniu testowym, aktualizuj sterowniki OEM i porównuj wyniki w tych samych warunkach. Przywróć ustawienia po każdym teście.

Acceptance criteria: W identycznym scenariuszu znikają trzaski i skoki, a urządzenia nadal działają prawidłowo.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/introduction-to-dpc-objects-and-windows-dpc-routines. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Przycinanie dźwięku, skoki opóźnień, trzaski audio lub nieregularne mikroprzycięcia mimo niskiego użycia CPU.
Diagnostic reasoning: Zapisz scenariusz, urządzenia aktywne w chwili problemu oraz wynik pomiaru narzędziem diagnostycznym. Porównaj sterowniki sieci, audio, GPU i magazynu, a nie tylko najwyższy pojedynczy pik.
Remedy: Wyłączaj po jednym urządzeniu testowym, aktualizuj sterowniki OEM i porównuj wyniki w tych samych warunkach. Przywróć ustawienia po każdym teście.
Verification: W identycznym scenariuszu znikają trzaski i skoki, a urządzenia nadal działają prawidłowo.
Warning: Nie stosuj przypadkowych skryptów „optymalizujących” rejestr lub usług; mogą maskować problem i pogorszyć stabilność.','DPC,ISR,audio,latency','https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/introduction-to-dpc-objects-and-windows-dpc-routines'),
('lesson:LABX-006','lesson','Dyski / NVMe','Diagnostyka SMART NVMe i logów urządzenia','Diagnosing NVMe SMART and device logs','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka SMART NVMe i logów urządzenia.

Objawy i kontekst: Dysk znika, system zawiesza się przy I/O, rośnie temperatura lub w SMART pojawiają się media errors i critical warnings.

Tok diagnostyczny: Zapisz model, firmware, pojemność, temperaturę, Critical Warning, Media and Data Integrity Errors, Percentage Used oraz Unsafe Shutdowns. Porównuj wzrost liczników w czasie.

Możliwe rozwiązanie: Przed testami wykonaj kopię lub obraz danych. Zweryfikuj chłodzenie, slot, firmware OEM i zgodność platformy. Testy pełnego zapisu wykonuj tylko na nośniku testowym lub po zabezpieczeniu danych.

Kryterium odbioru: Dysk pozostaje wykrywany po zimnym i ciepłym starcie, nie przybywa błędów, a test kontrolny i SMART są stabilne.

Źródło do dalszej nauki: https://nvmexpress.org/specifications/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Dysk znika, system zawiesza się przy I/O, rośnie temperatura lub w SMART pojawiają się media errors i critical warnings.
Tok diagnostyczny: Zapisz model, firmware, pojemność, temperaturę, Critical Warning, Media and Data Integrity Errors, Percentage Used oraz Unsafe Shutdowns. Porównuj wzrost liczników w czasie.
Rozwiązanie: Przed testami wykonaj kopię lub obraz danych. Zweryfikuj chłodzenie, slot, firmware OEM i zgodność platformy. Testy pełnego zapisu wykonuj tylko na nośniku testowym lub po zabezpieczeniu danych.
Test końcowy: Dysk pozostaje wykrywany po zimnym i ciepłym starcie, nie przybywa błędów, a test kontrolny i SMART są stabilne.
Ostrzeżenie: Nie uruchamiaj intensywnego testu zapisu na dysku z objawami awarii bez kopii. Nie traktuj jednego procentowego wskaźnika jako gwarancji zdrowia.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing NVMe SMART and device logs.

Symptoms and context: Dysk znika, system zawiesza się przy I/O, rośnie temperatura lub w SMART pojawiają się media errors i critical warnings.

Diagnostic reasoning: Zapisz model, firmware, pojemność, temperaturę, Critical Warning, Media and Data Integrity Errors, Percentage Used oraz Unsafe Shutdowns. Porównuj wzrost liczników w czasie.

Possible remedy: Przed testami wykonaj kopię lub obraz danych. Zweryfikuj chłodzenie, slot, firmware OEM i zgodność platformy. Testy pełnego zapisu wykonuj tylko na nośniku testowym lub po zabezpieczeniu danych.

Acceptance criteria: Dysk pozostaje wykrywany po zimnym i ciepłym starcie, nie przybywa błędów, a test kontrolny i SMART są stabilne.

Further reading: https://nvmexpress.org/specifications/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Dysk znika, system zawiesza się przy I/O, rośnie temperatura lub w SMART pojawiają się media errors i critical warnings.
Diagnostic reasoning: Zapisz model, firmware, pojemność, temperaturę, Critical Warning, Media and Data Integrity Errors, Percentage Used oraz Unsafe Shutdowns. Porównuj wzrost liczników w czasie.
Remedy: Przed testami wykonaj kopię lub obraz danych. Zweryfikuj chłodzenie, slot, firmware OEM i zgodność platformy. Testy pełnego zapisu wykonuj tylko na nośniku testowym lub po zabezpieczeniu danych.
Verification: Dysk pozostaje wykrywany po zimnym i ciepłym starcie, nie przybywa błędów, a test kontrolny i SMART są stabilne.
Warning: Nie uruchamiaj intensywnego testu zapisu na dysku z objawami awarii bez kopii. Nie traktuj jednego procentowego wskaźnika jako gwarancji zdrowia.','NVMe,SMART,SSD,health','https://nvmexpress.org/specifications/'),
('lesson:LABX-007','lesson','Dyski / SSD','Ocena zużycia i TBW dysku SSD','Assessing SSD wear and TBW','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ocena zużycia i TBW dysku SSD.

Objawy i kontekst: Wolne zapisy, spadek kondycji raportowanej przez SMART, komunikaty o końcu życia lub częste błędy nośnika.

Tok diagnostyczny: Odczytaj media, model, firmware, host writes, Percentage Used, spare blocks i temperatury. Porównaj wskaźniki z dokumentacją konkretnego modelu i gwarancją producenta.

Możliwe rozwiązanie: Zrób kopię danych, sprawdź firmware i temperaturę, zweryfikuj czy wolne tempo wynika z pełnego dysku, SLC cache czy problemu termicznego. Wymieniaj dysk dopiero po potwierdzeniu ryzyka.

Kryterium odbioru: Po wymianie lub poprawie chłodzenia test długotrwałego transferu jest stabilny, SMART nie przyrasta błędami, a kopia danych została zweryfikowana.

Źródło do dalszej nauki: https://nvmexpress.org/specifications/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Wolne zapisy, spadek kondycji raportowanej przez SMART, komunikaty o końcu życia lub częste błędy nośnika.
Tok diagnostyczny: Odczytaj media, model, firmware, host writes, Percentage Used, spare blocks i temperatury. Porównaj wskaźniki z dokumentacją konkretnego modelu i gwarancją producenta.
Rozwiązanie: Zrób kopię danych, sprawdź firmware i temperaturę, zweryfikuj czy wolne tempo wynika z pełnego dysku, SLC cache czy problemu termicznego. Wymieniaj dysk dopiero po potwierdzeniu ryzyka.
Test końcowy: Po wymianie lub poprawie chłodzenia test długotrwałego transferu jest stabilny, SMART nie przyrasta błędami, a kopia danych została zweryfikowana.
Ostrzeżenie: Nie zakładaj, że TBW jest bezpośrednią prognozą daty awarii; to parametr eksploatacyjny konkretnego modelu.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Assessing SSD wear and TBW.

Symptoms and context: Wolne zapisy, spadek kondycji raportowanej przez SMART, komunikaty o końcu życia lub częste błędy nośnika.

Diagnostic reasoning: Odczytaj media, model, firmware, host writes, Percentage Used, spare blocks i temperatury. Porównaj wskaźniki z dokumentacją konkretnego modelu i gwarancją producenta.

Possible remedy: Zrób kopię danych, sprawdź firmware i temperaturę, zweryfikuj czy wolne tempo wynika z pełnego dysku, SLC cache czy problemu termicznego. Wymieniaj dysk dopiero po potwierdzeniu ryzyka.

Acceptance criteria: Po wymianie lub poprawie chłodzenia test długotrwałego transferu jest stabilny, SMART nie przyrasta błędami, a kopia danych została zweryfikowana.

Further reading: https://nvmexpress.org/specifications/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Wolne zapisy, spadek kondycji raportowanej przez SMART, komunikaty o końcu życia lub częste błędy nośnika.
Diagnostic reasoning: Odczytaj media, model, firmware, host writes, Percentage Used, spare blocks i temperatury. Porównaj wskaźniki z dokumentacją konkretnego modelu i gwarancją producenta.
Remedy: Zrób kopię danych, sprawdź firmware i temperaturę, zweryfikuj czy wolne tempo wynika z pełnego dysku, SLC cache czy problemu termicznego. Wymieniaj dysk dopiero po potwierdzeniu ryzyka.
Verification: Po wymianie lub poprawie chłodzenia test długotrwałego transferu jest stabilny, SMART nie przyrasta błędami, a kopia danych została zweryfikowana.
Warning: Nie zakładaj, że TBW jest bezpośrednią prognozą daty awarii; to parametr eksploatacyjny konkretnego modelu.','SSD,TBW,wear,NVMe','https://nvmexpress.org/specifications/'),
('lesson:LABX-008','lesson','Dyski / SATA','Diagnostyka błędów SATA i CRC','Diagnosing SATA link and CRC errors','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka błędów SATA i CRC.

Objawy i kontekst: Dysk SATA rozłącza się, transfer spada, log pokazuje błędy CRC lub system rejestruje reset kontrolera.

Tok diagnostyczny: Zanotuj model dysku, port, kabel, liczbę błędów UDMA CRC i czas ich wzrostu. Rozróżnij błędy łącza od realnych błędów powierzchni/nośnika.

Możliwe rozwiązanie: Po zabezpieczeniu danych sprawdź kabel, mocowanie, port, zasilanie i temperaturę. Zmieniaj jeden element naraz; nie kasuj danych SMART tylko po to, by ukryć historię.

Kryterium odbioru: Po wymianie przewodu/portu nie przybywa błędów CRC w obserwacji, a test odczytu i SMART są stabilne.

Źródło do dalszej nauki: https://www.smartmontools.org/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Dysk SATA rozłącza się, transfer spada, log pokazuje błędy CRC lub system rejestruje reset kontrolera.
Tok diagnostyczny: Zanotuj model dysku, port, kabel, liczbę błędów UDMA CRC i czas ich wzrostu. Rozróżnij błędy łącza od realnych błędów powierzchni/nośnika.
Rozwiązanie: Po zabezpieczeniu danych sprawdź kabel, mocowanie, port, zasilanie i temperaturę. Zmieniaj jeden element naraz; nie kasuj danych SMART tylko po to, by ukryć historię.
Test końcowy: Po wymianie przewodu/portu nie przybywa błędów CRC w obserwacji, a test odczytu i SMART są stabilne.
Ostrzeżenie: Nie podłączaj i nie odłączaj wewnętrznych przewodów SATA pod napięciem, chyba że platforma wyraźnie wspiera hot-swap.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing SATA link and CRC errors.

Symptoms and context: Dysk SATA rozłącza się, transfer spada, log pokazuje błędy CRC lub system rejestruje reset kontrolera.

Diagnostic reasoning: Zanotuj model dysku, port, kabel, liczbę błędów UDMA CRC i czas ich wzrostu. Rozróżnij błędy łącza od realnych błędów powierzchni/nośnika.

Possible remedy: Po zabezpieczeniu danych sprawdź kabel, mocowanie, port, zasilanie i temperaturę. Zmieniaj jeden element naraz; nie kasuj danych SMART tylko po to, by ukryć historię.

Acceptance criteria: Po wymianie przewodu/portu nie przybywa błędów CRC w obserwacji, a test odczytu i SMART są stabilne.

Further reading: https://www.smartmontools.org/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Dysk SATA rozłącza się, transfer spada, log pokazuje błędy CRC lub system rejestruje reset kontrolera.
Diagnostic reasoning: Zanotuj model dysku, port, kabel, liczbę błędów UDMA CRC i czas ich wzrostu. Rozróżnij błędy łącza od realnych błędów powierzchni/nośnika.
Remedy: Po zabezpieczeniu danych sprawdź kabel, mocowanie, port, zasilanie i temperaturę. Zmieniaj jeden element naraz; nie kasuj danych SMART tylko po to, by ukryć historię.
Verification: Po wymianie przewodu/portu nie przybywa błędów CRC w obserwacji, a test odczytu i SMART są stabilne.
Warning: Nie podłączaj i nie odłączaj wewnętrznych przewodów SATA pod napięciem, chyba że platforma wyraźnie wspiera hot-swap.','SATA,CRC,SMART,cable','https://www.smartmontools.org/'),
('lesson:LABX-009','lesson','Dyski / RAID','Ocena macierzy RAID przed naprawą','Assessing a RAID array before repair','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ocena macierzy RAID przed naprawą.

Objawy i kontekst: Macierz jest degraded, offline, rebuild zatrzymuje się lub system prosi o inicjalizację dysku.

Tok diagnostyczny: Ustal kontroler, poziom RAID, kolejność członków, stan każdego nośnika i ostatnią prawidłową konfigurację. Zapisz seriale, sloty, metadata i dzienniki kontrolera.

Możliwe rozwiązanie: Zabezpiecz kopie sektorowe członków przed eksperymentami. Nie inicjalizuj i nie przebudowuj macierzy bez rozpoznania kolejności i dysków źródłowych. W razie uszkodzenia kilku członków skorzystaj z laboratorium odzyskiwania.

Kryterium odbioru: Odtworzona macierz przechodzi weryfikację spójności, system plików jest czytelny, a dane otwierają się z kopii kontrolnej.

Źródło do dalszej nauki: https://www.intel.com/content/www/us/en/support/articles/000006566/technologies.html. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Macierz jest degraded, offline, rebuild zatrzymuje się lub system prosi o inicjalizację dysku.
Tok diagnostyczny: Ustal kontroler, poziom RAID, kolejność członków, stan każdego nośnika i ostatnią prawidłową konfigurację. Zapisz seriale, sloty, metadata i dzienniki kontrolera.
Rozwiązanie: Zabezpiecz kopie sektorowe członków przed eksperymentami. Nie inicjalizuj i nie przebudowuj macierzy bez rozpoznania kolejności i dysków źródłowych. W razie uszkodzenia kilku członków skorzystaj z laboratorium odzyskiwania.
Test końcowy: Odtworzona macierz przechodzi weryfikację spójności, system plików jest czytelny, a dane otwierają się z kopii kontrolnej.
Ostrzeżenie: Błędne „Import foreign configuration”, force online lub rebuild może nadpisać metadane i zmniejszyć szanse odzysku.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Assessing a RAID array before repair.

Symptoms and context: Macierz jest degraded, offline, rebuild zatrzymuje się lub system prosi o inicjalizację dysku.

Diagnostic reasoning: Ustal kontroler, poziom RAID, kolejność członków, stan każdego nośnika i ostatnią prawidłową konfigurację. Zapisz seriale, sloty, metadata i dzienniki kontrolera.

Possible remedy: Zabezpiecz kopie sektorowe członków przed eksperymentami. Nie inicjalizuj i nie przebudowuj macierzy bez rozpoznania kolejności i dysków źródłowych. W razie uszkodzenia kilku członków skorzystaj z laboratorium odzyskiwania.

Acceptance criteria: Odtworzona macierz przechodzi weryfikację spójności, system plików jest czytelny, a dane otwierają się z kopii kontrolnej.

Further reading: https://www.intel.com/content/www/us/en/support/articles/000006566/technologies.html. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Macierz jest degraded, offline, rebuild zatrzymuje się lub system prosi o inicjalizację dysku.
Diagnostic reasoning: Ustal kontroler, poziom RAID, kolejność członków, stan każdego nośnika i ostatnią prawidłową konfigurację. Zapisz seriale, sloty, metadata i dzienniki kontrolera.
Remedy: Zabezpiecz kopie sektorowe członków przed eksperymentami. Nie inicjalizuj i nie przebudowuj macierzy bez rozpoznania kolejności i dysków źródłowych. W razie uszkodzenia kilku członków skorzystaj z laboratorium odzyskiwania.
Verification: Odtworzona macierz przechodzi weryfikację spójności, system plików jest czytelny, a dane otwierają się z kopii kontrolnej.
Warning: Błędne „Import foreign configuration”, force online lub rebuild może nadpisać metadane i zmniejszyć szanse odzysku.','RAID,storage,array,rebuild','https://www.intel.com/content/www/us/en/support/articles/000006566/technologies.html'),
('lesson:LABX-010','lesson','Odzyskiwanie danych','Obraz sektorowy dysku z błędami odczytu','Creating a sector image from a failing drive','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Obraz sektorowy dysku z błędami odczytu.

Objawy i kontekst: Dysk klika, spowalnia odczyt, ma bad sektory albo system zawiesza się podczas kopiowania.

Tok diagnostyczny: Ustal czy nośnik wydaje nietypowe dźwięki, czy elektronika się przegrzewa, jaki jest status SMART oraz czy dane są jedyną kopią. Przy objawach mechanicznych zatrzymaj testy.

Możliwe rozwiązanie: W warunkach laboratoryjnych wykonaj obraz na sprawny nośnik o odpowiedniej pojemności, używając narzędzia do pracy z błędami odczytu i mapą postępu. Analizę prowadź na kopii, nie na oryginale.

Kryterium odbioru: Plik obrazu i mapa błędów są zapisane, można odczytać kopię, a źródłowy nośnik nie był niepotrzebnie obciążany.

Źródło do dalszej nauki: https://www.gnu.org/software/ddrescue/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Dysk klika, spowalnia odczyt, ma bad sektory albo system zawiesza się podczas kopiowania.
Tok diagnostyczny: Ustal czy nośnik wydaje nietypowe dźwięki, czy elektronika się przegrzewa, jaki jest status SMART oraz czy dane są jedyną kopią. Przy objawach mechanicznych zatrzymaj testy.
Rozwiązanie: W warunkach laboratoryjnych wykonaj obraz na sprawny nośnik o odpowiedniej pojemności, używając narzędzia do pracy z błędami odczytu i mapą postępu. Analizę prowadź na kopii, nie na oryginale.
Test końcowy: Plik obrazu i mapa błędów są zapisane, można odczytać kopię, a źródłowy nośnik nie był niepotrzebnie obciążany.
Ostrzeżenie: Nie uruchamiaj CHKDSK ani defragmentacji na fizycznie uszkodzonym nośniku przed wykonaniem obrazu.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Creating a sector image from a failing drive.

Symptoms and context: Dysk klika, spowalnia odczyt, ma bad sektory albo system zawiesza się podczas kopiowania.

Diagnostic reasoning: Ustal czy nośnik wydaje nietypowe dźwięki, czy elektronika się przegrzewa, jaki jest status SMART oraz czy dane są jedyną kopią. Przy objawach mechanicznych zatrzymaj testy.

Possible remedy: W warunkach laboratoryjnych wykonaj obraz na sprawny nośnik o odpowiedniej pojemności, używając narzędzia do pracy z błędami odczytu i mapą postępu. Analizę prowadź na kopii, nie na oryginale.

Acceptance criteria: Plik obrazu i mapa błędów są zapisane, można odczytać kopię, a źródłowy nośnik nie był niepotrzebnie obciążany.

Further reading: https://www.gnu.org/software/ddrescue/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Dysk klika, spowalnia odczyt, ma bad sektory albo system zawiesza się podczas kopiowania.
Diagnostic reasoning: Ustal czy nośnik wydaje nietypowe dźwięki, czy elektronika się przegrzewa, jaki jest status SMART oraz czy dane są jedyną kopią. Przy objawach mechanicznych zatrzymaj testy.
Remedy: W warunkach laboratoryjnych wykonaj obraz na sprawny nośnik o odpowiedniej pojemności, używając narzędzia do pracy z błędami odczytu i mapą postępu. Analizę prowadź na kopii, nie na oryginale.
Verification: Plik obrazu i mapa błędów są zapisane, można odczytać kopię, a źródłowy nośnik nie był niepotrzebnie obciążany.
Warning: Nie uruchamiaj CHKDSK ani defragmentacji na fizycznie uszkodzonym nośniku przed wykonaniem obrazu.','imaging,ddrescue,recovery,HDD','https://www.gnu.org/software/ddrescue/'),
('lesson:LABX-011','lesson','Windows / dyski','Rozpoznawanie uszkodzeń systemu plików NTFS','Recognising NTFS file-system corruption','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Rozpoznawanie uszkodzeń systemu plików NTFS.

Objawy i kontekst: Windows wyświetla RAW, żąda formatowania, gubi foldery albo loguje błędy NTFS.

Tok diagnostyczny: Zapisz dokładny komunikat, stan SMART, identyfikator woluminu, BitLocker i schemat partycji. Ustal czy problem jest logiczny czy wynika z awarii sprzętu.

Możliwe rozwiązanie: Najpierw wykonaj kopię sektorową lub kopię plików, gdy nośnik jest stabilny. Nie formatuj i nie zapisuj na źródle. Naprawę struktury wykonuj na kopii lub dopiero po ocenie ryzyka.

Kryterium odbioru: Wolumin montuje się bez żądania formatowania, pliki kontrolne otwierają się, a dziennik systemu nie pokazuje nowych błędów I/O.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-server/storage/file-server/ntfs-overview. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Windows wyświetla RAW, żąda formatowania, gubi foldery albo loguje błędy NTFS.
Tok diagnostyczny: Zapisz dokładny komunikat, stan SMART, identyfikator woluminu, BitLocker i schemat partycji. Ustal czy problem jest logiczny czy wynika z awarii sprzętu.
Rozwiązanie: Najpierw wykonaj kopię sektorową lub kopię plików, gdy nośnik jest stabilny. Nie formatuj i nie zapisuj na źródle. Naprawę struktury wykonuj na kopii lub dopiero po ocenie ryzyka.
Test końcowy: Wolumin montuje się bez żądania formatowania, pliki kontrolne otwierają się, a dziennik systemu nie pokazuje nowych błędów I/O.
Ostrzeżenie: CHKDSK może modyfikować metadane i utrudnić odzyskanie plików. Nie uruchamiaj go w ciemno na jedynej kopii danych.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Recognising NTFS file-system corruption.

Symptoms and context: Windows wyświetla RAW, żąda formatowania, gubi foldery albo loguje błędy NTFS.

Diagnostic reasoning: Zapisz dokładny komunikat, stan SMART, identyfikator woluminu, BitLocker i schemat partycji. Ustal czy problem jest logiczny czy wynika z awarii sprzętu.

Possible remedy: Najpierw wykonaj kopię sektorową lub kopię plików, gdy nośnik jest stabilny. Nie formatuj i nie zapisuj na źródle. Naprawę struktury wykonuj na kopii lub dopiero po ocenie ryzyka.

Acceptance criteria: Wolumin montuje się bez żądania formatowania, pliki kontrolne otwierają się, a dziennik systemu nie pokazuje nowych błędów I/O.

Further reading: https://learn.microsoft.com/en-us/windows-server/storage/file-server/ntfs-overview. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Windows wyświetla RAW, żąda formatowania, gubi foldery albo loguje błędy NTFS.
Diagnostic reasoning: Zapisz dokładny komunikat, stan SMART, identyfikator woluminu, BitLocker i schemat partycji. Ustal czy problem jest logiczny czy wynika z awarii sprzętu.
Remedy: Najpierw wykonaj kopię sektorową lub kopię plików, gdy nośnik jest stabilny. Nie formatuj i nie zapisuj na źródle. Naprawę struktury wykonuj na kopii lub dopiero po ocenie ryzyka.
Verification: Wolumin montuje się bez żądania formatowania, pliki kontrolne otwierają się, a dziennik systemu nie pokazuje nowych błędów I/O.
Warning: CHKDSK może modyfikować metadane i utrudnić odzyskanie plików. Nie uruchamiaj go w ciemno na jedynej kopii danych.','NTFS,filesystem,volume,recovery','https://learn.microsoft.com/en-us/windows-server/storage/file-server/ntfs-overview'),
('lesson:LABX-012','lesson','Diagnostyka / Linux','Przygotowanie Linux Live do testów sprzętu','Preparing a Linux Live environment for hardware tests','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Przygotowanie Linux Live do testów sprzętu.

Objawy i kontekst: Potrzebujesz oddzielić awarię sprzętu od problemu Windows, sterownika lub instalacji systemu.

Tok diagnostyczny: Wybierz zaufany obraz dystrybucji, zweryfikuj sumę kontrolną i podpis wydania. Ustal czy urządzenie ma Secure Boot, szyfrowane dyski i specyficzne kontrolery.

Możliwe rozwiązanie: Uruchom system w trybie live bez instalacji. Zapisuj tylko dane diagnostyczne, unikaj montowania dysku źródłowego z prawem zapisu i nie uruchamiaj testów destrukcyjnych.

Kryterium odbioru: Podstawowe urządzenia są wykrywane, raport sprzętowy jest zapisany, a system hosta nie został zmodyfikowany.

Źródło do dalszej nauki: https://www.ubuntu.com/tutorials/try-ubuntu-before-you-install. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Potrzebujesz oddzielić awarię sprzętu od problemu Windows, sterownika lub instalacji systemu.
Tok diagnostyczny: Wybierz zaufany obraz dystrybucji, zweryfikuj sumę kontrolną i podpis wydania. Ustal czy urządzenie ma Secure Boot, szyfrowane dyski i specyficzne kontrolery.
Rozwiązanie: Uruchom system w trybie live bez instalacji. Zapisuj tylko dane diagnostyczne, unikaj montowania dysku źródłowego z prawem zapisu i nie uruchamiaj testów destrukcyjnych.
Test końcowy: Podstawowe urządzenia są wykrywane, raport sprzętowy jest zapisany, a system hosta nie został zmodyfikowany.
Ostrzeżenie: Nie uruchamiaj nieznanych skryptów jako root i nie montuj nośników klienta w trybie zapisu bez zgody.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Preparing a Linux Live environment for hardware tests.

Symptoms and context: Potrzebujesz oddzielić awarię sprzętu od problemu Windows, sterownika lub instalacji systemu.

Diagnostic reasoning: Wybierz zaufany obraz dystrybucji, zweryfikuj sumę kontrolną i podpis wydania. Ustal czy urządzenie ma Secure Boot, szyfrowane dyski i specyficzne kontrolery.

Possible remedy: Uruchom system w trybie live bez instalacji. Zapisuj tylko dane diagnostyczne, unikaj montowania dysku źródłowego z prawem zapisu i nie uruchamiaj testów destrukcyjnych.

Acceptance criteria: Podstawowe urządzenia są wykrywane, raport sprzętowy jest zapisany, a system hosta nie został zmodyfikowany.

Further reading: https://www.ubuntu.com/tutorials/try-ubuntu-before-you-install. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Potrzebujesz oddzielić awarię sprzętu od problemu Windows, sterownika lub instalacji systemu.
Diagnostic reasoning: Wybierz zaufany obraz dystrybucji, zweryfikuj sumę kontrolną i podpis wydania. Ustal czy urządzenie ma Secure Boot, szyfrowane dyski i specyficzne kontrolery.
Remedy: Uruchom system w trybie live bez instalacji. Zapisuj tylko dane diagnostyczne, unikaj montowania dysku źródłowego z prawem zapisu i nie uruchamiaj testów destrukcyjnych.
Verification: Podstawowe urządzenia są wykrywane, raport sprzętowy jest zapisany, a system hosta nie został zmodyfikowany.
Warning: Nie uruchamiaj nieznanych skryptów jako root i nie montuj nośników klienta w trybie zapisu bez zgody.','Linux,LiveUSB,hardware,test','https://www.ubuntu.com/tutorials/try-ubuntu-before-you-install'),
('lesson:LABX-013','lesson','GPU / Windows','Analiza błędu GPU TDR','Analysing GPU TDR failures','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Analiza błędu GPU TDR.

Objawy i kontekst: Sterownik ekranu przestaje odpowiadać, ekran miga, pojawia się komunikat driver stopped responding lub LiveKernelEvent.

Tok diagnostyczny: Sprawdź zdarzenia, wersję sterownika, temperaturę, częstotliwości, zasilanie i czy problem występuje tylko w jednej aplikacji. Zrób test na ustawieniach fabrycznych.

Możliwe rozwiązanie: Usuń konfliktowe profile OC/UV, zweryfikuj sterownik OEM lub producenta GPU, testuj różne obciążenia i osobno monitoruj VRAM, rdzeń i temperatury.

Kryterium odbioru: Kilka cykli testowych i realne zadania nie powodują TDR, artefaktów ani nowych błędów; konfiguracja pozostaje na stabilnych ustawieniach.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Sterownik ekranu przestaje odpowiadać, ekran miga, pojawia się komunikat driver stopped responding lub LiveKernelEvent.
Tok diagnostyczny: Sprawdź zdarzenia, wersję sterownika, temperaturę, częstotliwości, zasilanie i czy problem występuje tylko w jednej aplikacji. Zrób test na ustawieniach fabrycznych.
Rozwiązanie: Usuń konfliktowe profile OC/UV, zweryfikuj sterownik OEM lub producenta GPU, testuj różne obciążenia i osobno monitoruj VRAM, rdzeń i temperatury.
Test końcowy: Kilka cykli testowych i realne zadania nie powodują TDR, artefaktów ani nowych błędów; konfiguracja pozostaje na stabilnych ustawieniach.
Ostrzeżenie: Nie zwiększaj TDR delay w rejestrze jako pierwszego rozwiązania. Nie podnoś napięć w celu zamaskowania niestabilności.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Analysing GPU TDR failures.

Symptoms and context: Sterownik ekranu przestaje odpowiadać, ekran miga, pojawia się komunikat driver stopped responding lub LiveKernelEvent.

Diagnostic reasoning: Sprawdź zdarzenia, wersję sterownika, temperaturę, częstotliwości, zasilanie i czy problem występuje tylko w jednej aplikacji. Zrób test na ustawieniach fabrycznych.

Possible remedy: Usuń konfliktowe profile OC/UV, zweryfikuj sterownik OEM lub producenta GPU, testuj różne obciążenia i osobno monitoruj VRAM, rdzeń i temperatury.

Acceptance criteria: Kilka cykli testowych i realne zadania nie powodują TDR, artefaktów ani nowych błędów; konfiguracja pozostaje na stabilnych ustawieniach.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Sterownik ekranu przestaje odpowiadać, ekran miga, pojawia się komunikat driver stopped responding lub LiveKernelEvent.
Diagnostic reasoning: Sprawdź zdarzenia, wersję sterownika, temperaturę, częstotliwości, zasilanie i czy problem występuje tylko w jednej aplikacji. Zrób test na ustawieniach fabrycznych.
Remedy: Usuń konfliktowe profile OC/UV, zweryfikuj sterownik OEM lub producenta GPU, testuj różne obciążenia i osobno monitoruj VRAM, rdzeń i temperatury.
Verification: Kilka cykli testowych i realne zadania nie powodują TDR, artefaktów ani nowych błędów; konfiguracja pozostaje na stabilnych ustawieniach.
Warning: Nie zwiększaj TDR delay w rejestrze jako pierwszego rozwiązania. Nie podnoś napięć w celu zamaskowania niestabilności.','GPU,TDR,display,driver','https://learn.microsoft.com/en-us/windows-hardware/drivers/display/timeout-detection-and-recovery'),
('lesson:LABX-014','lesson','GPU / pamięć','Diagnostyka pamięci VRAM','Diagnosing graphics VRAM faults','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka pamięci VRAM.

Objawy i kontekst: Artefakty, migające tekstury, błędy renderowania, czarny ekran lub awarie pod obciążeniem pamięci.

Tok diagnostyczny: Oddziel problem kabla/monitora, sterownika, temperatury pamięci, rdzenia GPU i samej VRAM. Porównaj wyniki przy ustawieniach domyślnych i w różnych aplikacjach.

Możliwe rozwiązanie: Wykonaj test VRAM narzędziem, które raportuje adresy i liczbę błędów, monitoruj hotspot i temperatury. Zbierz logi przed rozbieraniem karty.

Kryterium odbioru: Długotrwały test VRAM przechodzi bez błędów, obraz jest stabilny w wielu aplikacjach i po zimnym starcie.

Źródło do dalszej nauki: https://www.nvidia.com/en-us/support/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Artefakty, migające tekstury, błędy renderowania, czarny ekran lub awarie pod obciążeniem pamięci.
Tok diagnostyczny: Oddziel problem kabla/monitora, sterownika, temperatury pamięci, rdzenia GPU i samej VRAM. Porównaj wyniki przy ustawieniach domyślnych i w różnych aplikacjach.
Rozwiązanie: Wykonaj test VRAM narzędziem, które raportuje adresy i liczbę błędów, monitoruj hotspot i temperatury. Zbierz logi przed rozbieraniem karty.
Test końcowy: Długotrwały test VRAM przechodzi bez błędów, obraz jest stabilny w wielu aplikacjach i po zimnym starcie.
Ostrzeżenie: Nie używaj ekstremalnego OC ani testu zapisującego na dysku klienta. Rozbieraj kartę tylko po odłączeniu i przy ochronie ESD.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing graphics VRAM faults.

Symptoms and context: Artefakty, migające tekstury, błędy renderowania, czarny ekran lub awarie pod obciążeniem pamięci.

Diagnostic reasoning: Oddziel problem kabla/monitora, sterownika, temperatury pamięci, rdzenia GPU i samej VRAM. Porównaj wyniki przy ustawieniach domyślnych i w różnych aplikacjach.

Possible remedy: Wykonaj test VRAM narzędziem, które raportuje adresy i liczbę błędów, monitoruj hotspot i temperatury. Zbierz logi przed rozbieraniem karty.

Acceptance criteria: Długotrwały test VRAM przechodzi bez błędów, obraz jest stabilny w wielu aplikacjach i po zimnym starcie.

Further reading: https://www.nvidia.com/en-us/support/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Artefakty, migające tekstury, błędy renderowania, czarny ekran lub awarie pod obciążeniem pamięci.
Diagnostic reasoning: Oddziel problem kabla/monitora, sterownika, temperatury pamięci, rdzenia GPU i samej VRAM. Porównaj wyniki przy ustawieniach domyślnych i w różnych aplikacjach.
Remedy: Wykonaj test VRAM narzędziem, które raportuje adresy i liczbę błędów, monitoruj hotspot i temperatury. Zbierz logi przed rozbieraniem karty.
Verification: Długotrwały test VRAM przechodzi bez błędów, obraz jest stabilny w wielu aplikacjach i po zimnym starcie.
Warning: Nie używaj ekstremalnego OC ani testu zapisującego na dysku klienta. Rozbieraj kartę tylko po odłączeniu i przy ochronie ESD.','VRAM,artifact,GPU,memory','https://www.nvidia.com/en-us/support/'),
('lesson:LABX-015','lesson','Zasilanie / ATX','Bezpieczna ocena zasilacza ATX','Safely evaluating an ATX power supply','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Bezpieczna ocena zasilacza ATX.

Objawy i kontekst: Komputer resetuje się pod obciążeniem, nie uruchamia GPU lub napięcia/telemetria wskazują niestabilność.

Tok diagnostyczny: Zapisz dokładny model i moc PSU, wiek, konfigurację GPU/CPU, użyte przewody i zdarzenia. Sprawdź czy użyto wyłącznie kabli modularnych przeznaczonych dla tego modelu.

Możliwe rozwiązanie: Użyj zatwierdzonego testera zasilacza lub profesjonalnego stanowiska według jego instrukcji. Porównaj działanie z pewnym, kompatybilnym zasilaczem; nie otwieraj obudowy PSU.

Kryterium odbioru: Zestaw przechodzi test obciążeniowy w granicach specyfikacji, nie ma resetów, a przewody i złącza nie przegrzewają się.

Źródło do dalszej nauki: https://www.intel.com/content/www/us/en/support/articles/000005721/boards-and-kits.html. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Komputer resetuje się pod obciążeniem, nie uruchamia GPU lub napięcia/telemetria wskazują niestabilność.
Tok diagnostyczny: Zapisz dokładny model i moc PSU, wiek, konfigurację GPU/CPU, użyte przewody i zdarzenia. Sprawdź czy użyto wyłącznie kabli modularnych przeznaczonych dla tego modelu.
Rozwiązanie: Użyj zatwierdzonego testera zasilacza lub profesjonalnego stanowiska według jego instrukcji. Porównaj działanie z pewnym, kompatybilnym zasilaczem; nie otwieraj obudowy PSU.
Test końcowy: Zestaw przechodzi test obciążeniowy w granicach specyfikacji, nie ma resetów, a przewody i złącza nie przegrzewają się.
Ostrzeżenie: Wewnątrz zasilacza mogą występować niebezpieczne napięcia także po odłączeniu. Nie otwieraj go i nie wykonuj pomiarów po stronie pierwotnej.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Safely evaluating an ATX power supply.

Symptoms and context: Komputer resetuje się pod obciążeniem, nie uruchamia GPU lub napięcia/telemetria wskazują niestabilność.

Diagnostic reasoning: Zapisz dokładny model i moc PSU, wiek, konfigurację GPU/CPU, użyte przewody i zdarzenia. Sprawdź czy użyto wyłącznie kabli modularnych przeznaczonych dla tego modelu.

Possible remedy: Użyj zatwierdzonego testera zasilacza lub profesjonalnego stanowiska według jego instrukcji. Porównaj działanie z pewnym, kompatybilnym zasilaczem; nie otwieraj obudowy PSU.

Acceptance criteria: Zestaw przechodzi test obciążeniowy w granicach specyfikacji, nie ma resetów, a przewody i złącza nie przegrzewają się.

Further reading: https://www.intel.com/content/www/us/en/support/articles/000005721/boards-and-kits.html. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Komputer resetuje się pod obciążeniem, nie uruchamia GPU lub napięcia/telemetria wskazują niestabilność.
Diagnostic reasoning: Zapisz dokładny model i moc PSU, wiek, konfigurację GPU/CPU, użyte przewody i zdarzenia. Sprawdź czy użyto wyłącznie kabli modularnych przeznaczonych dla tego modelu.
Remedy: Użyj zatwierdzonego testera zasilacza lub profesjonalnego stanowiska według jego instrukcji. Porównaj działanie z pewnym, kompatybilnym zasilaczem; nie otwieraj obudowy PSU.
Verification: Zestaw przechodzi test obciążeniowy w granicach specyfikacji, nie ma resetów, a przewody i złącza nie przegrzewają się.
Warning: Wewnątrz zasilacza mogą występować niebezpieczne napięcia także po odłączeniu. Nie otwieraj go i nie wykonuj pomiarów po stronie pierwotnej.','ATX,PSU,power,safety','https://www.intel.com/content/www/us/en/support/articles/000005721/boards-and-kits.html'),
('lesson:LABX-016','lesson','USB-C / zasilanie','Diagnostyka negocjacji USB Power Delivery','Diagnosing USB Power Delivery negotiation','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka negocjacji USB Power Delivery.

Objawy i kontekst: Laptop ładuje się tylko pod określonym kątem kabla, ogranicza moc, przerywa ładowanie lub rozpoznaje zasilacz jako niezgodny.

Tok diagnostyczny: Zapisz model laptopa, zasilacza, przewodu, moc, oznaczenia E-marker i zachowanie LED. Porównaj zasilacz i kabel z wymaganiami OEM, nie tylko z kształtem złącza.

Możliwe rozwiązanie: Sprawdź kabel i ładowarkę na znanym kompatybilnym zestawie, obejrzyj port pod kątem zabrudzeń i uszkodzeń, użyj miernika USB-PD tylko zgodnie z instrukcją.

Kryterium odbioru: Laptop negocjuje oczekiwany profil zasilania, nie przerywa ładowania podczas testu i nie przegrzewa złącza.

Źródło do dalszej nauki: https://www.usb.org/usb-charger-pd. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Laptop ładuje się tylko pod określonym kątem kabla, ogranicza moc, przerywa ładowanie lub rozpoznaje zasilacz jako niezgodny.
Tok diagnostyczny: Zapisz model laptopa, zasilacza, przewodu, moc, oznaczenia E-marker i zachowanie LED. Porównaj zasilacz i kabel z wymaganiami OEM, nie tylko z kształtem złącza.
Rozwiązanie: Sprawdź kabel i ładowarkę na znanym kompatybilnym zestawie, obejrzyj port pod kątem zabrudzeń i uszkodzeń, użyj miernika USB-PD tylko zgodnie z instrukcją.
Test końcowy: Laptop negocjuje oczekiwany profil zasilania, nie przerywa ładowania podczas testu i nie przegrzewa złącza.
Ostrzeżenie: Nie zwieraj pinów USB-C ani nie podawaj ręcznie napięcia na port. Uszkodzony lub nadpalony port wymaga przerwania testów.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing USB Power Delivery negotiation.

Symptoms and context: Laptop ładuje się tylko pod określonym kątem kabla, ogranicza moc, przerywa ładowanie lub rozpoznaje zasilacz jako niezgodny.

Diagnostic reasoning: Zapisz model laptopa, zasilacza, przewodu, moc, oznaczenia E-marker i zachowanie LED. Porównaj zasilacz i kabel z wymaganiami OEM, nie tylko z kształtem złącza.

Possible remedy: Sprawdź kabel i ładowarkę na znanym kompatybilnym zestawie, obejrzyj port pod kątem zabrudzeń i uszkodzeń, użyj miernika USB-PD tylko zgodnie z instrukcją.

Acceptance criteria: Laptop negocjuje oczekiwany profil zasilania, nie przerywa ładowania podczas testu i nie przegrzewa złącza.

Further reading: https://www.usb.org/usb-charger-pd. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Laptop ładuje się tylko pod określonym kątem kabla, ogranicza moc, przerywa ładowanie lub rozpoznaje zasilacz jako niezgodny.
Diagnostic reasoning: Zapisz model laptopa, zasilacza, przewodu, moc, oznaczenia E-marker i zachowanie LED. Porównaj zasilacz i kabel z wymaganiami OEM, nie tylko z kształtem złącza.
Remedy: Sprawdź kabel i ładowarkę na znanym kompatybilnym zestawie, obejrzyj port pod kątem zabrudzeń i uszkodzeń, użyj miernika USB-PD tylko zgodnie z instrukcją.
Verification: Laptop negocjuje oczekiwany profil zasilania, nie przerywa ładowania podczas testu i nie przegrzewa złącza.
Warning: Nie zwieraj pinów USB-C ani nie podawaj ręcznie napięcia na port. Uszkodzony lub nadpalony port wymaga przerwania testów.','USB-C,PD,E-marker,charging','https://www.usb.org/usb-charger-pd'),
('lesson:LABX-017','lesson','USB-C / obraz','Diagnostyka DisplayPort Alt Mode przez USB-C','Diagnosing USB-C DisplayPort Alt Mode','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka DisplayPort Alt Mode przez USB-C.

Objawy i kontekst: Monitor nie wykrywa obrazu przez USB-C, działa tylko ładowanie albo sygnał zanika po podłączeniu stacji dokującej.

Tok diagnostyczny: Sprawdź czy port laptopa obsługuje DisplayPort Alt Mode/USB4, czy kabel jest pełnofunkcyjny, jakie tryby rozdzielczości obsługuje monitor i dock.

Możliwe rozwiązanie: Testuj bezpośrednio laptop–monitor sprawdzonym przewodem, potem dołącz dock i dodatkowe urządzenia. Zaktualizuj firmware docka i sterownik grafiki tylko z oficjalnego źródła.

Kryterium odbioru: Obraz utrzymuje zadaną rozdzielczość i odświeżanie przez pełen test, również po uśpieniu i wznowieniu.

Źródło do dalszej nauki: https://www.usb.org/documents. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Monitor nie wykrywa obrazu przez USB-C, działa tylko ładowanie albo sygnał zanika po podłączeniu stacji dokującej.
Tok diagnostyczny: Sprawdź czy port laptopa obsługuje DisplayPort Alt Mode/USB4, czy kabel jest pełnofunkcyjny, jakie tryby rozdzielczości obsługuje monitor i dock.
Rozwiązanie: Testuj bezpośrednio laptop–monitor sprawdzonym przewodem, potem dołącz dock i dodatkowe urządzenia. Zaktualizuj firmware docka i sterownik grafiki tylko z oficjalnego źródła.
Test końcowy: Obraz utrzymuje zadaną rozdzielczość i odświeżanie przez pełen test, również po uśpieniu i wznowieniu.
Ostrzeżenie: Nie zakładaj, że każdy port USB-C przesyła obraz. Nie używaj niecertyfikowanych kabli do testów wysokiej przepustowości.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing USB-C DisplayPort Alt Mode.

Symptoms and context: Monitor nie wykrywa obrazu przez USB-C, działa tylko ładowanie albo sygnał zanika po podłączeniu stacji dokującej.

Diagnostic reasoning: Sprawdź czy port laptopa obsługuje DisplayPort Alt Mode/USB4, czy kabel jest pełnofunkcyjny, jakie tryby rozdzielczości obsługuje monitor i dock.

Possible remedy: Testuj bezpośrednio laptop–monitor sprawdzonym przewodem, potem dołącz dock i dodatkowe urządzenia. Zaktualizuj firmware docka i sterownik grafiki tylko z oficjalnego źródła.

Acceptance criteria: Obraz utrzymuje zadaną rozdzielczość i odświeżanie przez pełen test, również po uśpieniu i wznowieniu.

Further reading: https://www.usb.org/documents. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Monitor nie wykrywa obrazu przez USB-C, działa tylko ładowanie albo sygnał zanika po podłączeniu stacji dokującej.
Diagnostic reasoning: Sprawdź czy port laptopa obsługuje DisplayPort Alt Mode/USB4, czy kabel jest pełnofunkcyjny, jakie tryby rozdzielczości obsługuje monitor i dock.
Remedy: Testuj bezpośrednio laptop–monitor sprawdzonym przewodem, potem dołącz dock i dodatkowe urządzenia. Zaktualizuj firmware docka i sterownik grafiki tylko z oficjalnego źródła.
Verification: Obraz utrzymuje zadaną rozdzielczość i odświeżanie przez pełen test, również po uśpieniu i wznowieniu.
Warning: Nie zakładaj, że każdy port USB-C przesyła obraz. Nie używaj niecertyfikowanych kabli do testów wysokiej przepustowości.','USB-C,DisplayPort,AltMode,dock','https://www.usb.org/documents'),
('lesson:LABX-018','lesson','USB4 / Thunderbolt','Rozpoznawanie problemów USB4 i Thunderbolt','Diagnosing USB4 and Thunderbolt issues','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Rozpoznawanie problemów USB4 i Thunderbolt.

Objawy i kontekst: Stacja dokująca nie jest wykrywana, urządzenie działa tylko na jednym porcie, transfery są ograniczone lub ekran gaśnie.

Tok diagnostyczny: Ustal wersję portu, kontroler, certyfikację kabla, firmware docka i ustawienia bezpieczeństwa DMA. Sprawdź enumerację urządzeń i logi systemowe.

Możliwe rozwiązanie: Testuj pojedynczy element łańcucha, używaj krótkiego certyfikowanego kabla, aktualizuj firmware i sterowniki platformy. Weryfikuj polityki bezpieczeństwa bez wyłączania ich na stałe.

Kryterium odbioru: Urządzenia są wykrywane po zimnym starcie, uśpieniu i ponownym podłączeniu, a transfery i obraz są stabilne.

Źródło do dalszej nauki: https://www.usb.org/usb4. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Stacja dokująca nie jest wykrywana, urządzenie działa tylko na jednym porcie, transfery są ograniczone lub ekran gaśnie.
Tok diagnostyczny: Ustal wersję portu, kontroler, certyfikację kabla, firmware docka i ustawienia bezpieczeństwa DMA. Sprawdź enumerację urządzeń i logi systemowe.
Rozwiązanie: Testuj pojedynczy element łańcucha, używaj krótkiego certyfikowanego kabla, aktualizuj firmware i sterowniki platformy. Weryfikuj polityki bezpieczeństwa bez wyłączania ich na stałe.
Test końcowy: Urządzenia są wykrywane po zimnym starcie, uśpieniu i ponownym podłączeniu, a transfery i obraz są stabilne.
Ostrzeżenie: Nie wyłączaj ochrony DMA/Thunderbolt security w celu szybkiego obejścia problemu bez oceny ryzyka.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing USB4 and Thunderbolt issues.

Symptoms and context: Stacja dokująca nie jest wykrywana, urządzenie działa tylko na jednym porcie, transfery są ograniczone lub ekran gaśnie.

Diagnostic reasoning: Ustal wersję portu, kontroler, certyfikację kabla, firmware docka i ustawienia bezpieczeństwa DMA. Sprawdź enumerację urządzeń i logi systemowe.

Possible remedy: Testuj pojedynczy element łańcucha, używaj krótkiego certyfikowanego kabla, aktualizuj firmware i sterowniki platformy. Weryfikuj polityki bezpieczeństwa bez wyłączania ich na stałe.

Acceptance criteria: Urządzenia są wykrywane po zimnym starcie, uśpieniu i ponownym podłączeniu, a transfery i obraz są stabilne.

Further reading: https://www.usb.org/usb4. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Stacja dokująca nie jest wykrywana, urządzenie działa tylko na jednym porcie, transfery są ograniczone lub ekran gaśnie.
Diagnostic reasoning: Ustal wersję portu, kontroler, certyfikację kabla, firmware docka i ustawienia bezpieczeństwa DMA. Sprawdź enumerację urządzeń i logi systemowe.
Remedy: Testuj pojedynczy element łańcucha, używaj krótkiego certyfikowanego kabla, aktualizuj firmware i sterowniki platformy. Weryfikuj polityki bezpieczeństwa bez wyłączania ich na stałe.
Verification: Urządzenia są wykrywane po zimnym starcie, uśpieniu i ponownym podłączeniu, a transfery i obraz są stabilne.
Warning: Nie wyłączaj ochrony DMA/Thunderbolt security w celu szybkiego obejścia problemu bez oceny ryzyka.','USB4,Thunderbolt,dock,DMA','https://www.usb.org/usb4'),
('lesson:LABX-019','lesson','Sieci / Wi-Fi','Pomiar jakości Wi-Fi i roamingu','Measuring Wi-Fi quality and roaming','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Pomiar jakości Wi-Fi i roamingu.

Objawy i kontekst: Użytkownik ma dobry sygnał, ale połączenie zrywa się przy przechodzeniu między pokojami lub punktami dostępowymi.

Tok diagnostyczny: Zapisz pasmo, kanał, RSSI, SNR, szerokość kanału, BSSID, prędkość PHY i moment roam. Odróżnij niską moc sygnału od zakłóceń i przeciążenia.

Możliwe rozwiązanie: Wykonaj mapę pomiarów w kilku lokalizacjach, zmień jeden parametr sieci na raz i sprawdź roaming na znanym urządzeniu. Zachowaj poprzednią konfigurację.

Kryterium odbioru: Połączenie przełącza się bez utraty ważnych sesji, a test ping/transfer nie ma długich przerw w typowej trasie użytkownika.

Źródło do dalszej nauki: https://www.wi-fi.org/discover-wi-fi. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Użytkownik ma dobry sygnał, ale połączenie zrywa się przy przechodzeniu między pokojami lub punktami dostępowymi.
Tok diagnostyczny: Zapisz pasmo, kanał, RSSI, SNR, szerokość kanału, BSSID, prędkość PHY i moment roam. Odróżnij niską moc sygnału od zakłóceń i przeciążenia.
Rozwiązanie: Wykonaj mapę pomiarów w kilku lokalizacjach, zmień jeden parametr sieci na raz i sprawdź roaming na znanym urządzeniu. Zachowaj poprzednią konfigurację.
Test końcowy: Połączenie przełącza się bez utraty ważnych sesji, a test ping/transfer nie ma długich przerw w typowej trasie użytkownika.
Ostrzeżenie: Nie zmieniaj kanałów i mocy nadawania w ciemno; pamiętaj o ograniczeniach regulacyjnych dla pasma i kraju.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Measuring Wi-Fi quality and roaming.

Symptoms and context: Użytkownik ma dobry sygnał, ale połączenie zrywa się przy przechodzeniu między pokojami lub punktami dostępowymi.

Diagnostic reasoning: Zapisz pasmo, kanał, RSSI, SNR, szerokość kanału, BSSID, prędkość PHY i moment roam. Odróżnij niską moc sygnału od zakłóceń i przeciążenia.

Possible remedy: Wykonaj mapę pomiarów w kilku lokalizacjach, zmień jeden parametr sieci na raz i sprawdź roaming na znanym urządzeniu. Zachowaj poprzednią konfigurację.

Acceptance criteria: Połączenie przełącza się bez utraty ważnych sesji, a test ping/transfer nie ma długich przerw w typowej trasie użytkownika.

Further reading: https://www.wi-fi.org/discover-wi-fi. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Użytkownik ma dobry sygnał, ale połączenie zrywa się przy przechodzeniu między pokojami lub punktami dostępowymi.
Diagnostic reasoning: Zapisz pasmo, kanał, RSSI, SNR, szerokość kanału, BSSID, prędkość PHY i moment roam. Odróżnij niską moc sygnału od zakłóceń i przeciążenia.
Remedy: Wykonaj mapę pomiarów w kilku lokalizacjach, zmień jeden parametr sieci na raz i sprawdź roaming na znanym urządzeniu. Zachowaj poprzednią konfigurację.
Verification: Połączenie przełącza się bez utraty ważnych sesji, a test ping/transfer nie ma długich przerw w typowej trasie użytkownika.
Warning: Nie zmieniaj kanałów i mocy nadawania w ciemno; pamiętaj o ograniczeniach regulacyjnych dla pasma i kraju.','WiFi,roaming,RSSI,SNR','https://www.wi-fi.org/discover-wi-fi'),
('lesson:LABX-020','lesson','Sieci / LAN','Diagnostyka DHCP i konfliktów adresów IP','Diagnosing DHCP and IP address conflicts','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka DHCP i konfliktów adresów IP.

Objawy i kontekst: Urządzenie uzyskuje adres 169.254.x.x, ma konflikt IP, brak bramy lub okresowo traci łączność.

Tok diagnostyczny: Zapisz adres, maskę, bramę, DNS, serwer DHCP, lease time i MAC. Porównaj urządzenie działające i niedziałające w tej samej sieci.

Możliwe rozwiązanie: Sprawdź kabel/port/VLAN, pulę DHCP, rezerwacje i duplikaty. Odnawiaj dzierżawę dopiero po zapisaniu konfiguracji i w porozumieniu z administratorem sieci.

Kryterium odbioru: Klient uzyskuje unikalny adres z właściwej podsieci, odpowiada brama, DNS rozwiązuje nazwy, a po restarcie dzierżawa pozostaje stabilna.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-top. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Urządzenie uzyskuje adres 169.254.x.x, ma konflikt IP, brak bramy lub okresowo traci łączność.
Tok diagnostyczny: Zapisz adres, maskę, bramę, DNS, serwer DHCP, lease time i MAC. Porównaj urządzenie działające i niedziałające w tej samej sieci.
Rozwiązanie: Sprawdź kabel/port/VLAN, pulę DHCP, rezerwacje i duplikaty. Odnawiaj dzierżawę dopiero po zapisaniu konfiguracji i w porozumieniu z administratorem sieci.
Test końcowy: Klient uzyskuje unikalny adres z właściwej podsieci, odpowiada brama, DNS rozwiązuje nazwy, a po restarcie dzierżawa pozostaje stabilna.
Ostrzeżenie: Nie zmieniaj adresacji ani nie wyłączaj DHCP w sieci produkcyjnej bez zgody administratora.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing DHCP and IP address conflicts.

Symptoms and context: Urządzenie uzyskuje adres 169.254.x.x, ma konflikt IP, brak bramy lub okresowo traci łączność.

Diagnostic reasoning: Zapisz adres, maskę, bramę, DNS, serwer DHCP, lease time i MAC. Porównaj urządzenie działające i niedziałające w tej samej sieci.

Possible remedy: Sprawdź kabel/port/VLAN, pulę DHCP, rezerwacje i duplikaty. Odnawiaj dzierżawę dopiero po zapisaniu konfiguracji i w porozumieniu z administratorem sieci.

Acceptance criteria: Klient uzyskuje unikalny adres z właściwej podsieci, odpowiada brama, DNS rozwiązuje nazwy, a po restarcie dzierżawa pozostaje stabilna.

Further reading: https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-top. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Urządzenie uzyskuje adres 169.254.x.x, ma konflikt IP, brak bramy lub okresowo traci łączność.
Diagnostic reasoning: Zapisz adres, maskę, bramę, DNS, serwer DHCP, lease time i MAC. Porównaj urządzenie działające i niedziałające w tej samej sieci.
Remedy: Sprawdź kabel/port/VLAN, pulę DHCP, rezerwacje i duplikaty. Odnawiaj dzierżawę dopiero po zapisaniu konfiguracji i w porozumieniu z administratorem sieci.
Verification: Klient uzyskuje unikalny adres z właściwej podsieci, odpowiada brama, DNS rozwiązuje nazwy, a po restarcie dzierżawa pozostaje stabilna.
Warning: Nie zmieniaj adresacji ani nie wyłączaj DHCP w sieci produkcyjnej bez zgody administratora.','DHCP,IP,network,conflict','https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-top'),
('lesson:LABX-021','lesson','Sieci / DNS','Diagnostyka DNS i opóźnień rozwiązywania nazw','Diagnosing DNS resolution and latency','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka DNS i opóźnień rozwiązywania nazw.

Objawy i kontekst: Strony otwierają się wolno mimo poprawnego pingowania IP, aplikacje pokazują błędy nazw lub problem dotyczy tylko jednej domeny.

Tok diagnostyczny: Porównaj odpowiedź DNS lokalnego resolvera i zaufanego resolvera, sprawdź suffix, cache, rekordy i czy awaria dotyczy IPv4, IPv6 czy konkretnej domeny.

Możliwe rozwiązanie: Zapisz stan przed zmianą, wyczyść cache tylko gdy jest to uzasadnione, sprawdź konfigurację DHCP/DoH i zaporę. Zmiany serwera DNS wykonuj za zgodą właściciela sieci.

Kryterium odbioru: Nazwy rozwiązują się prawidłowo, czas odpowiedzi jest stabilny, a aplikacje działają bez błędów po restarcie.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-top. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Strony otwierają się wolno mimo poprawnego pingowania IP, aplikacje pokazują błędy nazw lub problem dotyczy tylko jednej domeny.
Tok diagnostyczny: Porównaj odpowiedź DNS lokalnego resolvera i zaufanego resolvera, sprawdź suffix, cache, rekordy i czy awaria dotyczy IPv4, IPv6 czy konkretnej domeny.
Rozwiązanie: Zapisz stan przed zmianą, wyczyść cache tylko gdy jest to uzasadnione, sprawdź konfigurację DHCP/DoH i zaporę. Zmiany serwera DNS wykonuj za zgodą właściciela sieci.
Test końcowy: Nazwy rozwiązują się prawidłowo, czas odpowiedzi jest stabilny, a aplikacje działają bez błędów po restarcie.
Ostrzeżenie: Nie wyłączaj filtrowania DNS ani kontroli rodzicielskiej bez zgody właściciela sieci.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing DNS resolution and latency.

Symptoms and context: Strony otwierają się wolno mimo poprawnego pingowania IP, aplikacje pokazują błędy nazw lub problem dotyczy tylko jednej domeny.

Diagnostic reasoning: Porównaj odpowiedź DNS lokalnego resolvera i zaufanego resolvera, sprawdź suffix, cache, rekordy i czy awaria dotyczy IPv4, IPv6 czy konkretnej domeny.

Possible remedy: Zapisz stan przed zmianą, wyczyść cache tylko gdy jest to uzasadnione, sprawdź konfigurację DHCP/DoH i zaporę. Zmiany serwera DNS wykonuj za zgodą właściciela sieci.

Acceptance criteria: Nazwy rozwiązują się prawidłowo, czas odpowiedzi jest stabilny, a aplikacje działają bez błędów po restarcie.

Further reading: https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-top. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Strony otwierają się wolno mimo poprawnego pingowania IP, aplikacje pokazują błędy nazw lub problem dotyczy tylko jednej domeny.
Diagnostic reasoning: Porównaj odpowiedź DNS lokalnego resolvera i zaufanego resolvera, sprawdź suffix, cache, rekordy i czy awaria dotyczy IPv4, IPv6 czy konkretnej domeny.
Remedy: Zapisz stan przed zmianą, wyczyść cache tylko gdy jest to uzasadnione, sprawdź konfigurację DHCP/DoH i zaporę. Zmiany serwera DNS wykonuj za zgodą właściciela sieci.
Verification: Nazwy rozwiązują się prawidłowo, czas odpowiedzi jest stabilny, a aplikacje działają bez błędów po restarcie.
Warning: Nie wyłączaj filtrowania DNS ani kontroli rodzicielskiej bez zgody właściciela sieci.','DNS,DoH,resolver,network','https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-top'),
('lesson:LABX-022','lesson','Sieci / router','Kontrola firmware routera i kopii konfiguracji','Checking router firmware and configuration backups','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Kontrola firmware routera i kopii konfiguracji.

Objawy i kontekst: Router restartuje się, ma błędy Wi-Fi, nie otrzymuje poprawek lub konfiguracja została naruszona.

Tok diagnostyczny: Ustal dokładny model, rewizję sprzętową, region, bieżący firmware i sposób zarządzania. Zweryfikuj, czy producent nadal wspiera urządzenie.

Możliwe rozwiązanie: Zrób zaszyfrowaną kopię konfiguracji, pobieraj firmware tylko z oficjalnego regionu OEM, sprawdź sumę kontrolną i procedurę aktualizacji. Po aktualizacji zmień domyślne hasło i sprawdź zdalne zarządzanie.

Kryterium odbioru: Router działa stabilnie, ma aktualny wspierany firmware, kopia konfiguracji została odczytana, a niepotrzebne usługi zdalne są wyłączone.

Źródło do dalszej nauki: https://www.cisa.gov/secure-our-world. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Router restartuje się, ma błędy Wi-Fi, nie otrzymuje poprawek lub konfiguracja została naruszona.
Tok diagnostyczny: Ustal dokładny model, rewizję sprzętową, region, bieżący firmware i sposób zarządzania. Zweryfikuj, czy producent nadal wspiera urządzenie.
Rozwiązanie: Zrób zaszyfrowaną kopię konfiguracji, pobieraj firmware tylko z oficjalnego regionu OEM, sprawdź sumę kontrolną i procedurę aktualizacji. Po aktualizacji zmień domyślne hasło i sprawdź zdalne zarządzanie.
Test końcowy: Router działa stabilnie, ma aktualny wspierany firmware, kopia konfiguracji została odczytana, a niepotrzebne usługi zdalne są wyłączone.
Ostrzeżenie: Nie aktualizuj firmware przeznaczonego dla innej rewizji lub regionu. Nie udostępniaj pliku konfiguracyjnego z hasłami.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Checking router firmware and configuration backups.

Symptoms and context: Router restartuje się, ma błędy Wi-Fi, nie otrzymuje poprawek lub konfiguracja została naruszona.

Diagnostic reasoning: Ustal dokładny model, rewizję sprzętową, region, bieżący firmware i sposób zarządzania. Zweryfikuj, czy producent nadal wspiera urządzenie.

Possible remedy: Zrób zaszyfrowaną kopię konfiguracji, pobieraj firmware tylko z oficjalnego regionu OEM, sprawdź sumę kontrolną i procedurę aktualizacji. Po aktualizacji zmień domyślne hasło i sprawdź zdalne zarządzanie.

Acceptance criteria: Router działa stabilnie, ma aktualny wspierany firmware, kopia konfiguracji została odczytana, a niepotrzebne usługi zdalne są wyłączone.

Further reading: https://www.cisa.gov/secure-our-world. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Router restartuje się, ma błędy Wi-Fi, nie otrzymuje poprawek lub konfiguracja została naruszona.
Diagnostic reasoning: Ustal dokładny model, rewizję sprzętową, region, bieżący firmware i sposób zarządzania. Zweryfikuj, czy producent nadal wspiera urządzenie.
Remedy: Zrób zaszyfrowaną kopię konfiguracji, pobieraj firmware tylko z oficjalnego regionu OEM, sprawdź sumę kontrolną i procedurę aktualizacji. Po aktualizacji zmień domyślne hasło i sprawdź zdalne zarządzanie.
Verification: Router działa stabilnie, ma aktualny wspierany firmware, kopia konfiguracji została odczytana, a niepotrzebne usługi zdalne są wyłączone.
Warning: Nie aktualizuj firmware przeznaczonego dla innej rewizji lub regionu. Nie udostępniaj pliku konfiguracyjnego z hasłami.','router,firmware,backup,security','https://www.cisa.gov/secure-our-world'),
('lesson:LABX-023','lesson','Laptop / bateria','Ocena zużycia baterii laptopa','Assessing laptop battery wear','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ocena zużycia baterii laptopa.

Objawy i kontekst: Krótki czas pracy, nagłe wyłączenia, duży spadek pojemności lub komunikat serwisowy baterii.

Tok diagnostyczny: Odczytaj raport baterii, design capacity, full charge capacity, cykle i temperaturę. Porównaj kilka odczytów; pojedynczy procent nie jest diagnozą.

Możliwe rozwiązanie: Sprawdź zasilacz, firmware EC/BIOS i aplikację producenta. Przy fizycznym puchnięciu, zapachu, grzaniu lub uszkodzeniu obudowy przerwij użytkowanie i zastosuj procedurę bezpiecznego serwisu.

Kryterium odbioru: Bateria nie wykazuje niebezpiecznych objawów, raport jest stabilny, ładowanie przebiega w zakresie OEM, a klient otrzymuje ocenę pojemności i ryzyka.

Źródło do dalszej nauki: https://support.microsoft.com/en-us/windows/caring-for-your-battery-in-windows. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Krótki czas pracy, nagłe wyłączenia, duży spadek pojemności lub komunikat serwisowy baterii.
Tok diagnostyczny: Odczytaj raport baterii, design capacity, full charge capacity, cykle i temperaturę. Porównaj kilka odczytów; pojedynczy procent nie jest diagnozą.
Rozwiązanie: Sprawdź zasilacz, firmware EC/BIOS i aplikację producenta. Przy fizycznym puchnięciu, zapachu, grzaniu lub uszkodzeniu obudowy przerwij użytkowanie i zastosuj procedurę bezpiecznego serwisu.
Test końcowy: Bateria nie wykazuje niebezpiecznych objawów, raport jest stabilny, ładowanie przebiega w zakresie OEM, a klient otrzymuje ocenę pojemności i ryzyka.
Ostrzeżenie: Nie naciskaj, nie przebijaj i nie doginaj spuchniętej baterii. Nie wyrzucaj ogniw do odpadów komunalnych.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Assessing laptop battery wear.

Symptoms and context: Krótki czas pracy, nagłe wyłączenia, duży spadek pojemności lub komunikat serwisowy baterii.

Diagnostic reasoning: Odczytaj raport baterii, design capacity, full charge capacity, cykle i temperaturę. Porównaj kilka odczytów; pojedynczy procent nie jest diagnozą.

Possible remedy: Sprawdź zasilacz, firmware EC/BIOS i aplikację producenta. Przy fizycznym puchnięciu, zapachu, grzaniu lub uszkodzeniu obudowy przerwij użytkowanie i zastosuj procedurę bezpiecznego serwisu.

Acceptance criteria: Bateria nie wykazuje niebezpiecznych objawów, raport jest stabilny, ładowanie przebiega w zakresie OEM, a klient otrzymuje ocenę pojemności i ryzyka.

Further reading: https://support.microsoft.com/en-us/windows/caring-for-your-battery-in-windows. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Krótki czas pracy, nagłe wyłączenia, duży spadek pojemności lub komunikat serwisowy baterii.
Diagnostic reasoning: Odczytaj raport baterii, design capacity, full charge capacity, cykle i temperaturę. Porównaj kilka odczytów; pojedynczy procent nie jest diagnozą.
Remedy: Sprawdź zasilacz, firmware EC/BIOS i aplikację producenta. Przy fizycznym puchnięciu, zapachu, grzaniu lub uszkodzeniu obudowy przerwij użytkowanie i zastosuj procedurę bezpiecznego serwisu.
Verification: Bateria nie wykazuje niebezpiecznych objawów, raport jest stabilny, ładowanie przebiega w zakresie OEM, a klient otrzymuje ocenę pojemności i ryzyka.
Warning: Nie naciskaj, nie przebijaj i nie doginaj spuchniętej baterii. Nie wyrzucaj ogniw do odpadów komunalnych.','battery,wear,laptop,powercfg','https://support.microsoft.com/en-us/windows/caring-for-your-battery-in-windows'),
('lesson:LABX-024','lesson','Laptop / elektronika','Ocena uszkodzeń po zalaniu laptopa','Assessing liquid damage in a laptop','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ocena uszkodzeń po zalaniu laptopa.

Objawy i kontekst: Urządzenie wyłącza się po kontakcie z cieczą, występuje korozja, brak startu, zwarcie lub nieprawidłowe działanie klawiatury.

Tok diagnostyczny: Ustal rodzaj i czas kontaktu z cieczą, czy urządzenie było zasilane, jakie obszary są zalane i czy bateria jest odłączona. Dokumentuj stan przed czyszczeniem.

Możliwe rozwiązanie: Odłącz zasilanie i baterię zgodnie z procedurą, nie próbuj uruchamiać. Wysusz i oczyść płytę metodą serwisową odpowiednią dla materiałów; przy korozji pod osłonami konieczna jest inspekcja mikroskopowa.

Kryterium odbioru: Po inspekcji i naprawie nie ma pozostałości korozji, linie zasilania nie wykazują anomalii, a testy funkcjonalne i stabilności przechodzą bez nawrotu.

Źródło do dalszej nauki: https://www.esda.org/esd-overview/esd-fundamentals/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Urządzenie wyłącza się po kontakcie z cieczą, występuje korozja, brak startu, zwarcie lub nieprawidłowe działanie klawiatury.
Tok diagnostyczny: Ustal rodzaj i czas kontaktu z cieczą, czy urządzenie było zasilane, jakie obszary są zalane i czy bateria jest odłączona. Dokumentuj stan przed czyszczeniem.
Rozwiązanie: Odłącz zasilanie i baterię zgodnie z procedurą, nie próbuj uruchamiać. Wysusz i oczyść płytę metodą serwisową odpowiednią dla materiałów; przy korozji pod osłonami konieczna jest inspekcja mikroskopowa.
Test końcowy: Po inspekcji i naprawie nie ma pozostałości korozji, linie zasilania nie wykazują anomalii, a testy funkcjonalne i stabilności przechodzą bez nawrotu.
Ostrzeżenie: Jeśli bateria jest uszkodzona, gorąca lub spuchnięta, nie manipuluj nią. Nie używaj ryżu ani domowego piekarnika.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Assessing liquid damage in a laptop.

Symptoms and context: Urządzenie wyłącza się po kontakcie z cieczą, występuje korozja, brak startu, zwarcie lub nieprawidłowe działanie klawiatury.

Diagnostic reasoning: Ustal rodzaj i czas kontaktu z cieczą, czy urządzenie było zasilane, jakie obszary są zalane i czy bateria jest odłączona. Dokumentuj stan przed czyszczeniem.

Possible remedy: Odłącz zasilanie i baterię zgodnie z procedurą, nie próbuj uruchamiać. Wysusz i oczyść płytę metodą serwisową odpowiednią dla materiałów; przy korozji pod osłonami konieczna jest inspekcja mikroskopowa.

Acceptance criteria: Po inspekcji i naprawie nie ma pozostałości korozji, linie zasilania nie wykazują anomalii, a testy funkcjonalne i stabilności przechodzą bez nawrotu.

Further reading: https://www.esda.org/esd-overview/esd-fundamentals/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Urządzenie wyłącza się po kontakcie z cieczą, występuje korozja, brak startu, zwarcie lub nieprawidłowe działanie klawiatury.
Diagnostic reasoning: Ustal rodzaj i czas kontaktu z cieczą, czy urządzenie było zasilane, jakie obszary są zalane i czy bateria jest odłączona. Dokumentuj stan przed czyszczeniem.
Remedy: Odłącz zasilanie i baterię zgodnie z procedurą, nie próbuj uruchamiać. Wysusz i oczyść płytę metodą serwisową odpowiednią dla materiałów; przy korozji pod osłonami konieczna jest inspekcja mikroskopowa.
Verification: Po inspekcji i naprawie nie ma pozostałości korozji, linie zasilania nie wykazują anomalii, a testy funkcjonalne i stabilności przechodzą bez nawrotu.
Warning: Jeśli bateria jest uszkodzona, gorąca lub spuchnięta, nie manipuluj nią. Nie używaj ryżu ani domowego piekarnika.','liquid,corrosion,board,cleaning','https://www.esda.org/esd-overview/esd-fundamentals/'),
('lesson:LABX-025','lesson','Chłodzenie / GPU','Prawidłowy dobór termopadów','Selecting and replacing thermal pads','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Prawidłowy dobór termopadów.

Objawy i kontekst: Po serwisie GPU lub laptopa temperatury pamięci/VRM rosną, radiator nie styka się albo elementy mają ślady nierównego docisku.

Tok diagnostyczny: Zidentyfikuj dokładny model i rewizję chłodzenia. Sprawdź grubości z dokumentacji lub zmierz oryginalny materiał; oceń kompresję i powierzchnię kontaktu.

Możliwe rozwiązanie: Użyj właściwego materiału i grubości, zachowaj układ padów, nie układaj warstw przypadkowo. Zastosuj pastę tylko na powierzchniach do tego przeznaczonych.

Kryterium odbioru: Po złożeniu kontakt jest równomierny, temperatury rdzenia/hotspot/VRAM mieszczą się w specyfikacji OEM i nie ma throttlingu.

Źródło do dalszej nauki: https://www.nvidia.com/en-us/support/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Po serwisie GPU lub laptopa temperatury pamięci/VRM rosną, radiator nie styka się albo elementy mają ślady nierównego docisku.
Tok diagnostyczny: Zidentyfikuj dokładny model i rewizję chłodzenia. Sprawdź grubości z dokumentacji lub zmierz oryginalny materiał; oceń kompresję i powierzchnię kontaktu.
Rozwiązanie: Użyj właściwego materiału i grubości, zachowaj układ padów, nie układaj warstw przypadkowo. Zastosuj pastę tylko na powierzchniach do tego przeznaczonych.
Test końcowy: Po złożeniu kontakt jest równomierny, temperatury rdzenia/hotspot/VRAM mieszczą się w specyfikacji OEM i nie ma throttlingu.
Ostrzeżenie: Za gruby pad może wygiąć PCB lub odsunąć radiator od rdzenia. Nie dobieraj grubości wyłącznie „na oko”.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Selecting and replacing thermal pads.

Symptoms and context: Po serwisie GPU lub laptopa temperatury pamięci/VRM rosną, radiator nie styka się albo elementy mają ślady nierównego docisku.

Diagnostic reasoning: Zidentyfikuj dokładny model i rewizję chłodzenia. Sprawdź grubości z dokumentacji lub zmierz oryginalny materiał; oceń kompresję i powierzchnię kontaktu.

Possible remedy: Użyj właściwego materiału i grubości, zachowaj układ padów, nie układaj warstw przypadkowo. Zastosuj pastę tylko na powierzchniach do tego przeznaczonych.

Acceptance criteria: Po złożeniu kontakt jest równomierny, temperatury rdzenia/hotspot/VRAM mieszczą się w specyfikacji OEM i nie ma throttlingu.

Further reading: https://www.nvidia.com/en-us/support/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Po serwisie GPU lub laptopa temperatury pamięci/VRM rosną, radiator nie styka się albo elementy mają ślady nierównego docisku.
Diagnostic reasoning: Zidentyfikuj dokładny model i rewizję chłodzenia. Sprawdź grubości z dokumentacji lub zmierz oryginalny materiał; oceń kompresję i powierzchnię kontaktu.
Remedy: Użyj właściwego materiału i grubości, zachowaj układ padów, nie układaj warstw przypadkowo. Zastosuj pastę tylko na powierzchniach do tego przeznaczonych.
Verification: Po złożeniu kontakt jest równomierny, temperatury rdzenia/hotspot/VRAM mieszczą się w specyfikacji OEM i nie ma throttlingu.
Warning: Za gruby pad może wygiąć PCB lub odsunąć radiator od rdzenia. Nie dobieraj grubości wyłącznie „na oko”.','thermal-pad,GPU,VRAM,cooling','https://www.nvidia.com/en-us/support/'),
('lesson:LABX-026','lesson','Laptop / mechanika','Serwis układu zawiasów i mocowań matrycy','Servicing display hinges and mounting points','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Serwis układu zawiasów i mocowań matrycy.

Objawy i kontekst: Pokrywa skrzypi, pęka przy zawiasie, matryca się rozwarstwia lub przewód ekranu jest naprężony.

Tok diagnostyczny: Sprawdź obie strony zawiasów, gwinty, wkładki w obudowie, przebieg eDP, anteny Wi-Fi i ramkę. Ustal czy pęknięcie wynika z zawiasu, plastiku czy wcześniejszej naprawy.

Możliwe rozwiązanie: Zabezpiecz matrycę i przewody, wymień elementy o uszkodzonych mocowaniach, używaj części zgodnych z dokładnym modelem. Nie wkręcaj dłuższych śrub bez potwierdzenia ich długości.

Kryterium odbioru: Pokrywa porusza się równomiernie, przewody nie są ściskane, ekran zachowuje obraz przy zmianie kąta, a mocowania nie pracują.

Źródło do dalszej nauki: https://www.ifixit.com/Device/Laptop. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Pokrywa skrzypi, pęka przy zawiasie, matryca się rozwarstwia lub przewód ekranu jest naprężony.
Tok diagnostyczny: Sprawdź obie strony zawiasów, gwinty, wkładki w obudowie, przebieg eDP, anteny Wi-Fi i ramkę. Ustal czy pęknięcie wynika z zawiasu, plastiku czy wcześniejszej naprawy.
Rozwiązanie: Zabezpiecz matrycę i przewody, wymień elementy o uszkodzonych mocowaniach, używaj części zgodnych z dokładnym modelem. Nie wkręcaj dłuższych śrub bez potwierdzenia ich długości.
Test końcowy: Pokrywa porusza się równomiernie, przewody nie są ściskane, ekran zachowuje obraz przy zmianie kąta, a mocowania nie pracują.
Ostrzeżenie: Nie wyginaj zawiasu przy zamontowanej i niezabezpieczonej matrycy; ryzyko pęknięcia panelu i uszkodzenia przewodów.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Servicing display hinges and mounting points.

Symptoms and context: Pokrywa skrzypi, pęka przy zawiasie, matryca się rozwarstwia lub przewód ekranu jest naprężony.

Diagnostic reasoning: Sprawdź obie strony zawiasów, gwinty, wkładki w obudowie, przebieg eDP, anteny Wi-Fi i ramkę. Ustal czy pęknięcie wynika z zawiasu, plastiku czy wcześniejszej naprawy.

Possible remedy: Zabezpiecz matrycę i przewody, wymień elementy o uszkodzonych mocowaniach, używaj części zgodnych z dokładnym modelem. Nie wkręcaj dłuższych śrub bez potwierdzenia ich długości.

Acceptance criteria: Pokrywa porusza się równomiernie, przewody nie są ściskane, ekran zachowuje obraz przy zmianie kąta, a mocowania nie pracują.

Further reading: https://www.ifixit.com/Device/Laptop. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Pokrywa skrzypi, pęka przy zawiasie, matryca się rozwarstwia lub przewód ekranu jest naprężony.
Diagnostic reasoning: Sprawdź obie strony zawiasów, gwinty, wkładki w obudowie, przebieg eDP, anteny Wi-Fi i ramkę. Ustal czy pęknięcie wynika z zawiasu, plastiku czy wcześniejszej naprawy.
Remedy: Zabezpiecz matrycę i przewody, wymień elementy o uszkodzonych mocowaniach, używaj części zgodnych z dokładnym modelem. Nie wkręcaj dłuższych śrub bez potwierdzenia ich długości.
Verification: Pokrywa porusza się równomiernie, przewody nie są ściskane, ekran zachowuje obraz przy zmianie kąta, a mocowania nie pracują.
Warning: Nie wyginaj zawiasu przy zamontowanej i niezabezpieczonej matrycy; ryzyko pęknięcia panelu i uszkodzenia przewodów.','hinge,display,mechanical,eDP','https://www.ifixit.com/Device/Laptop'),
('lesson:LABX-027','lesson','Laptop / ekran','Diagnostyka taśmy eDP i podświetlenia','Diagnosing eDP cables and backlight issues','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka taśmy eDP i podświetlenia.

Objawy i kontekst: Czarny ekran, obraz zależny od kąta pokrywy, migotanie lub brak podświetlenia przy widocznym obrazie pod latarką.

Tok diagnostyczny: Rozdziel awarię matrycy, przewodu, złącza, podświetlenia i GPU. Sprawdź obraz na monitorze zewnętrznym i wykonaj oględziny przewodu bez zasilania.

Możliwe rozwiązanie: Zdemontuj pokrywę zgodnie z dokumentacją, odłącz baterię, obejrzyj złącza pod powiększeniem i porównaj numer panelu oraz przewodu. Nie podawaj napięcia na nieznane piny.

Kryterium odbioru: Obraz i podświetlenie działają przy różnych kątach, test zewnętrzny i wewnętrzny jest stabilny, brak śladów zwarcia w złączach.

Źródło do dalszej nauki: https://www.edp.org/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Czarny ekran, obraz zależny od kąta pokrywy, migotanie lub brak podświetlenia przy widocznym obrazie pod latarką.
Tok diagnostyczny: Rozdziel awarię matrycy, przewodu, złącza, podświetlenia i GPU. Sprawdź obraz na monitorze zewnętrznym i wykonaj oględziny przewodu bez zasilania.
Rozwiązanie: Zdemontuj pokrywę zgodnie z dokumentacją, odłącz baterię, obejrzyj złącza pod powiększeniem i porównaj numer panelu oraz przewodu. Nie podawaj napięcia na nieznane piny.
Test końcowy: Obraz i podświetlenie działają przy różnych kątach, test zewnętrzny i wewnętrzny jest stabilny, brak śladów zwarcia w złączach.
Ostrzeżenie: Matryce mogą mieć różne pinouty mimo zgodnego rozmiaru i złącza. Potwierdź dokładny numer części.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing eDP cables and backlight issues.

Symptoms and context: Czarny ekran, obraz zależny od kąta pokrywy, migotanie lub brak podświetlenia przy widocznym obrazie pod latarką.

Diagnostic reasoning: Rozdziel awarię matrycy, przewodu, złącza, podświetlenia i GPU. Sprawdź obraz na monitorze zewnętrznym i wykonaj oględziny przewodu bez zasilania.

Possible remedy: Zdemontuj pokrywę zgodnie z dokumentacją, odłącz baterię, obejrzyj złącza pod powiększeniem i porównaj numer panelu oraz przewodu. Nie podawaj napięcia na nieznane piny.

Acceptance criteria: Obraz i podświetlenie działają przy różnych kątach, test zewnętrzny i wewnętrzny jest stabilny, brak śladów zwarcia w złączach.

Further reading: https://www.edp.org/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Czarny ekran, obraz zależny od kąta pokrywy, migotanie lub brak podświetlenia przy widocznym obrazie pod latarką.
Diagnostic reasoning: Rozdziel awarię matrycy, przewodu, złącza, podświetlenia i GPU. Sprawdź obraz na monitorze zewnętrznym i wykonaj oględziny przewodu bez zasilania.
Remedy: Zdemontuj pokrywę zgodnie z dokumentacją, odłącz baterię, obejrzyj złącza pod powiększeniem i porównaj numer panelu oraz przewodu. Nie podawaj napięcia na nieznane piny.
Verification: Obraz i podświetlenie działają przy różnych kątach, test zewnętrzny i wewnętrzny jest stabilny, brak śladów zwarcia w złączach.
Warning: Matryce mogą mieć różne pinouty mimo zgodnego rozmiaru i złącza. Potwierdź dokładny numer części.','eDP,display,backlight,cable','https://www.edp.org/'),
('lesson:LABX-028','lesson','RAM / platforma','Test kontrolera pamięci i konfiguracji DIMM','Testing the memory controller and DIMM configuration','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Test kontrolera pamięci i konfiguracji DIMM.

Objawy i kontekst: System nie przechodzi POST z dwiema kośćmi, profil XMP/EXPO jest niestabilny albo pojemność pamięci jest niepełna.

Tok diagnostyczny: Zapisz CPU, płytę, BIOS, zestaw DIMM, obsadę slotów i częstotliwość. Sprawdź listę QVL i zależności między liczbą modułów, rankami i kontrolerem.

Możliwe rozwiązanie: Wyłącz profil OC i wróć do ustawień standardowych. Przetestuj każdą kość i slot pojedynczo, a następnie właściwą konfigurację według instrukcji płyty.

Kryterium odbioru: Pełna pojemność jest rozpoznana, test długi nie wykazuje błędów i system przechodzi zimny start oraz wybudzanie.

Źródło do dalszej nauki: https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: System nie przechodzi POST z dwiema kośćmi, profil XMP/EXPO jest niestabilny albo pojemność pamięci jest niepełna.
Tok diagnostyczny: Zapisz CPU, płytę, BIOS, zestaw DIMM, obsadę slotów i częstotliwość. Sprawdź listę QVL i zależności między liczbą modułów, rankami i kontrolerem.
Rozwiązanie: Wyłącz profil OC i wróć do ustawień standardowych. Przetestuj każdą kość i slot pojedynczo, a następnie właściwą konfigurację według instrukcji płyty.
Test końcowy: Pełna pojemność jest rozpoznana, test długi nie wykazuje błędów i system przechodzi zimny start oraz wybudzanie.
Ostrzeżenie: Nie zwiększaj napięć pamięci lub kontrolera poza specyfikację. Nie mieszaj zestawów o różnych parametrach bez testów.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Testing the memory controller and DIMM configuration.

Symptoms and context: System nie przechodzi POST z dwiema kośćmi, profil XMP/EXPO jest niestabilny albo pojemność pamięci jest niepełna.

Diagnostic reasoning: Zapisz CPU, płytę, BIOS, zestaw DIMM, obsadę slotów i częstotliwość. Sprawdź listę QVL i zależności między liczbą modułów, rankami i kontrolerem.

Possible remedy: Wyłącz profil OC i wróć do ustawień standardowych. Przetestuj każdą kość i slot pojedynczo, a następnie właściwą konfigurację według instrukcji płyty.

Acceptance criteria: Pełna pojemność jest rozpoznana, test długi nie wykazuje błędów i system przechodzi zimny start oraz wybudzanie.

Further reading: https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: System nie przechodzi POST z dwiema kośćmi, profil XMP/EXPO jest niestabilny albo pojemność pamięci jest niepełna.
Diagnostic reasoning: Zapisz CPU, płytę, BIOS, zestaw DIMM, obsadę slotów i częstotliwość. Sprawdź listę QVL i zależności między liczbą modułów, rankami i kontrolerem.
Remedy: Wyłącz profil OC i wróć do ustawień standardowych. Przetestuj każdą kość i slot pojedynczo, a następnie właściwą konfigurację według instrukcji płyty.
Verification: Pełna pojemność jest rozpoznana, test długi nie wykazuje błędów i system przechodzi zimny start oraz wybudzanie.
Warning: Nie zwiększaj napięć pamięci lub kontrolera poza specyfikację. Nie mieszaj zestawów o różnych parametrach bez testów.','DIMM,DDR5,XMP,EXPO,IMC','https://www.intel.com/content/www/us/en/support/topics/memory-and-storage.html'),
('lesson:LABX-029','lesson','Płyta / PCIe','Diagnostyka PCIe link speed i szerokości','Diagnosing PCIe link speed and width','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka PCIe link speed i szerokości.

Objawy i kontekst: GPU lub NVMe działa z niższą generacją albo szerokością linku, a wydajność jest niższa od oczekiwanej.

Tok diagnostyczny: Sprawdź generację i szerokość obsługiwaną przez CPU, płytę, slot i urządzenie. Ustal wpływ współdzielonych linii, M.2, bifurkacji i ustawień BIOS.

Możliwe rozwiązanie: Użyj narzędzia do odczytu bieżącego i maksymalnego linku, sprawdź osadzenie karty i czystość slotu po odłączeniu zasilania. Testuj zmianę slotu tylko zgodnie z instrukcją płyty.

Kryterium odbioru: Link osiąga oczekiwany tryb przy obciążeniu i nie pojawiają się błędy WHEA/PCIe.

Źródło do dalszej nauki: https://pcisig.com/specifications. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: GPU lub NVMe działa z niższą generacją albo szerokością linku, a wydajność jest niższa od oczekiwanej.
Tok diagnostyczny: Sprawdź generację i szerokość obsługiwaną przez CPU, płytę, slot i urządzenie. Ustal wpływ współdzielonych linii, M.2, bifurkacji i ustawień BIOS.
Rozwiązanie: Użyj narzędzia do odczytu bieżącego i maksymalnego linku, sprawdź osadzenie karty i czystość slotu po odłączeniu zasilania. Testuj zmianę slotu tylko zgodnie z instrukcją płyty.
Test końcowy: Link osiąga oczekiwany tryb przy obciążeniu i nie pojawiają się błędy WHEA/PCIe.
Ostrzeżenie: Nie wymuszaj generacji PCIe ani ustawień napięcia bez dokumentacji; nie czyść slotu metalowymi narzędziami.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing PCIe link speed and width.

Symptoms and context: GPU lub NVMe działa z niższą generacją albo szerokością linku, a wydajność jest niższa od oczekiwanej.

Diagnostic reasoning: Sprawdź generację i szerokość obsługiwaną przez CPU, płytę, slot i urządzenie. Ustal wpływ współdzielonych linii, M.2, bifurkacji i ustawień BIOS.

Possible remedy: Użyj narzędzia do odczytu bieżącego i maksymalnego linku, sprawdź osadzenie karty i czystość slotu po odłączeniu zasilania. Testuj zmianę slotu tylko zgodnie z instrukcją płyty.

Acceptance criteria: Link osiąga oczekiwany tryb przy obciążeniu i nie pojawiają się błędy WHEA/PCIe.

Further reading: https://pcisig.com/specifications. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: GPU lub NVMe działa z niższą generacją albo szerokością linku, a wydajność jest niższa od oczekiwanej.
Diagnostic reasoning: Sprawdź generację i szerokość obsługiwaną przez CPU, płytę, slot i urządzenie. Ustal wpływ współdzielonych linii, M.2, bifurkacji i ustawień BIOS.
Remedy: Użyj narzędzia do odczytu bieżącego i maksymalnego linku, sprawdź osadzenie karty i czystość slotu po odłączeniu zasilania. Testuj zmianę slotu tylko zgodnie z instrukcją płyty.
Verification: Link osiąga oczekiwany tryb przy obciążeniu i nie pojawiają się błędy WHEA/PCIe.
Warning: Nie wymuszaj generacji PCIe ani ustawień napięcia bez dokumentacji; nie czyść slotu metalowymi narzędziami.','PCIe,link,width,bandwidth','https://pcisig.com/specifications'),
('lesson:LABX-030','lesson','Bezpieczeństwo / Windows','Diagnostyka TPM i problemów z BitLocker','Diagnosing TPM and BitLocker recovery issues','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka TPM i problemów z BitLocker.

Objawy i kontekst: Po aktualizacji BIOS lub zmianie sprzętu Windows żąda klucza odzyskiwania BitLocker albo TPM jest niedostępny.

Tok diagnostyczny: Ustal status szyfrowania, protectorów, TPM, Secure Boot, trybu rozruchu i ostatnich zmian firmware. Nie zbieraj ani nie wysyłaj klucza odzyskiwania.

Możliwe rozwiązanie: Właściciel urządzenia powinien potwierdzić dostęp do kopii klucza przed zmianami firmware. Zapisz stan ochrony, wykonaj kopię danych i stosuj procedurę OEM; po zmianie ponownie zweryfikuj protectory.

Kryterium odbioru: TPM jest widoczny, system uruchamia się bez nieoczekiwanych promptów, a właściciel zachowuje dostęp do danych i klucza.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Po aktualizacji BIOS lub zmianie sprzętu Windows żąda klucza odzyskiwania BitLocker albo TPM jest niedostępny.
Tok diagnostyczny: Ustal status szyfrowania, protectorów, TPM, Secure Boot, trybu rozruchu i ostatnich zmian firmware. Nie zbieraj ani nie wysyłaj klucza odzyskiwania.
Rozwiązanie: Właściciel urządzenia powinien potwierdzić dostęp do kopii klucza przed zmianami firmware. Zapisz stan ochrony, wykonaj kopię danych i stosuj procedurę OEM; po zmianie ponownie zweryfikuj protectory.
Test końcowy: TPM jest widoczny, system uruchamia się bez nieoczekiwanych promptów, a właściciel zachowuje dostęp do danych i klucza.
Ostrzeżenie: Nigdy nie proś o przesłanie klucza BitLocker na czat lub formularz. Nie czyść TPM bez kopii klucza i zgody właściciela.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing TPM and BitLocker recovery issues.

Symptoms and context: Po aktualizacji BIOS lub zmianie sprzętu Windows żąda klucza odzyskiwania BitLocker albo TPM jest niedostępny.

Diagnostic reasoning: Ustal status szyfrowania, protectorów, TPM, Secure Boot, trybu rozruchu i ostatnich zmian firmware. Nie zbieraj ani nie wysyłaj klucza odzyskiwania.

Possible remedy: Właściciel urządzenia powinien potwierdzić dostęp do kopii klucza przed zmianami firmware. Zapisz stan ochrony, wykonaj kopię danych i stosuj procedurę OEM; po zmianie ponownie zweryfikuj protectory.

Acceptance criteria: TPM jest widoczny, system uruchamia się bez nieoczekiwanych promptów, a właściciel zachowuje dostęp do danych i klucza.

Further reading: https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Po aktualizacji BIOS lub zmianie sprzętu Windows żąda klucza odzyskiwania BitLocker albo TPM jest niedostępny.
Diagnostic reasoning: Ustal status szyfrowania, protectorów, TPM, Secure Boot, trybu rozruchu i ostatnich zmian firmware. Nie zbieraj ani nie wysyłaj klucza odzyskiwania.
Remedy: Właściciel urządzenia powinien potwierdzić dostęp do kopii klucza przed zmianami firmware. Zapisz stan ochrony, wykonaj kopię danych i stosuj procedurę OEM; po zmianie ponownie zweryfikuj protectory.
Verification: TPM jest widoczny, system uruchamia się bez nieoczekiwanych promptów, a właściciel zachowuje dostęp do danych i klucza.
Warning: Nigdy nie proś o przesłanie klucza BitLocker na czat lub formularz. Nie czyść TPM bez kopii klucza i zgody właściciela.','TPM,BitLocker,SecureBoot,keys','https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/'),
('lesson:LABX-031','lesson','BIOS / bezpieczeństwo','Weryfikacja Secure Boot po aktualizacji firmware','Verifying Secure Boot after firmware updates','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Weryfikacja Secure Boot po aktualizacji firmware.

Objawy i kontekst: Po aktualizacji BIOS system zgłasza zmianę Secure Boot, nie uruchamia się podpisany loader lub certyfikaty wymagają odświeżenia.

Tok diagnostyczny: Sprawdź tryb UEFI, stan Secure Boot, klucze PK/KEK/db/dbx, wersję firmware i komunikaty OEM. Zanotuj bieżący stan przed modyfikacją.

Możliwe rozwiązanie: Używaj wyłącznie oficjalnej procedury producenta i aktualizacji przeznaczonej dla modelu. Zabezpiecz klucz BitLocker i kopię danych, jeśli zmiana może wpłynąć na TPM measurements.

Kryterium odbioru: System startuje w trybie Secure Boot, łańcuch podpisów jest prawidłowy i nie pojawiają się nieoczekiwane żądania odzyskiwania.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/troubleshoot/windows-client/windows-security/update-secure-boot-certificates. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Po aktualizacji BIOS system zgłasza zmianę Secure Boot, nie uruchamia się podpisany loader lub certyfikaty wymagają odświeżenia.
Tok diagnostyczny: Sprawdź tryb UEFI, stan Secure Boot, klucze PK/KEK/db/dbx, wersję firmware i komunikaty OEM. Zanotuj bieżący stan przed modyfikacją.
Rozwiązanie: Używaj wyłącznie oficjalnej procedury producenta i aktualizacji przeznaczonej dla modelu. Zabezpiecz klucz BitLocker i kopię danych, jeśli zmiana może wpłynąć na TPM measurements.
Test końcowy: System startuje w trybie Secure Boot, łańcuch podpisów jest prawidłowy i nie pojawiają się nieoczekiwane żądania odzyskiwania.
Ostrzeżenie: Nie importuj kluczy Secure Boot z przypadkowego źródła i nie wyłączaj Secure Boot jako stałego obejścia.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Verifying Secure Boot after firmware updates.

Symptoms and context: Po aktualizacji BIOS system zgłasza zmianę Secure Boot, nie uruchamia się podpisany loader lub certyfikaty wymagają odświeżenia.

Diagnostic reasoning: Sprawdź tryb UEFI, stan Secure Boot, klucze PK/KEK/db/dbx, wersję firmware i komunikaty OEM. Zanotuj bieżący stan przed modyfikacją.

Possible remedy: Używaj wyłącznie oficjalnej procedury producenta i aktualizacji przeznaczonej dla modelu. Zabezpiecz klucz BitLocker i kopię danych, jeśli zmiana może wpłynąć na TPM measurements.

Acceptance criteria: System startuje w trybie Secure Boot, łańcuch podpisów jest prawidłowy i nie pojawiają się nieoczekiwane żądania odzyskiwania.

Further reading: https://learn.microsoft.com/en-us/troubleshoot/windows-client/windows-security/update-secure-boot-certificates. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Po aktualizacji BIOS system zgłasza zmianę Secure Boot, nie uruchamia się podpisany loader lub certyfikaty wymagają odświeżenia.
Diagnostic reasoning: Sprawdź tryb UEFI, stan Secure Boot, klucze PK/KEK/db/dbx, wersję firmware i komunikaty OEM. Zanotuj bieżący stan przed modyfikacją.
Remedy: Używaj wyłącznie oficjalnej procedury producenta i aktualizacji przeznaczonej dla modelu. Zabezpiecz klucz BitLocker i kopię danych, jeśli zmiana może wpłynąć na TPM measurements.
Verification: System startuje w trybie Secure Boot, łańcuch podpisów jest prawidłowy i nie pojawiają się nieoczekiwane żądania odzyskiwania.
Warning: Nie importuj kluczy Secure Boot z przypadkowego źródła i nie wyłączaj Secure Boot jako stałego obejścia.','UEFI,SecureBoot,certificates,firmware','https://learn.microsoft.com/en-us/troubleshoot/windows-client/windows-security/update-secure-boot-certificates'),
('lesson:LABX-032','lesson','Serwis / prawo autorskie','Prawa do dokumentacji i schematów serwisowych','Rights and licensing for service documentation','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Prawa do dokumentacji i schematów serwisowych.

Objawy i kontekst: Technik chce dodać schemat, BoardView, zdjęcie, fragment instrukcji lub plik firmware do bazy edukacyjnej.

Tok diagnostyczny: Ustal autora, właściciela praw, licencję, zakres dozwolonego wykorzystania i czy licencja pozwala na publiczne hostowanie, tłumaczenie lub wykorzystanie przez AI.

Możliwe rozwiązanie: Publikuj własne opisy i zdjęcia, krótkie cytaty w granicach prawa z podaniem źródła lub linkuj oryginalne materiały. Pełne schematy, podręczniki, firmware, logo i specyfikacje hostuj tylko na podstawie wyraźnej licencji.

Kryterium odbioru: Każdy dodany materiał ma zapis autora/licencji/źródła, a materiały bez praw są zastąpione linkiem do strony właściciela.

Źródło do dalszej nauki: https://uefi.org/specifications. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Technik chce dodać schemat, BoardView, zdjęcie, fragment instrukcji lub plik firmware do bazy edukacyjnej.
Tok diagnostyczny: Ustal autora, właściciela praw, licencję, zakres dozwolonego wykorzystania i czy licencja pozwala na publiczne hostowanie, tłumaczenie lub wykorzystanie przez AI.
Rozwiązanie: Publikuj własne opisy i zdjęcia, krótkie cytaty w granicach prawa z podaniem źródła lub linkuj oryginalne materiały. Pełne schematy, podręczniki, firmware, logo i specyfikacje hostuj tylko na podstawie wyraźnej licencji.
Test końcowy: Każdy dodany materiał ma zapis autora/licencji/źródła, a materiały bez praw są zastąpione linkiem do strony właściciela.
Ostrzeżenie: Dostęp do publicznego PDF lub strony nie oznacza prawa do kopiowania, rehostowania ani używania w komercyjnym AI. UEFI i PCI-SIG publikują własne ograniczenia dostępu i licencji.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Rights and licensing for service documentation.

Symptoms and context: Technik chce dodać schemat, BoardView, zdjęcie, fragment instrukcji lub plik firmware do bazy edukacyjnej.

Diagnostic reasoning: Ustal autora, właściciela praw, licencję, zakres dozwolonego wykorzystania i czy licencja pozwala na publiczne hostowanie, tłumaczenie lub wykorzystanie przez AI.

Possible remedy: Publikuj własne opisy i zdjęcia, krótkie cytaty w granicach prawa z podaniem źródła lub linkuj oryginalne materiały. Pełne schematy, podręczniki, firmware, logo i specyfikacje hostuj tylko na podstawie wyraźnej licencji.

Acceptance criteria: Każdy dodany materiał ma zapis autora/licencji/źródła, a materiały bez praw są zastąpione linkiem do strony właściciela.

Further reading: https://uefi.org/specifications. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Technik chce dodać schemat, BoardView, zdjęcie, fragment instrukcji lub plik firmware do bazy edukacyjnej.
Diagnostic reasoning: Ustal autora, właściciela praw, licencję, zakres dozwolonego wykorzystania i czy licencja pozwala na publiczne hostowanie, tłumaczenie lub wykorzystanie przez AI.
Remedy: Publikuj własne opisy i zdjęcia, krótkie cytaty w granicach prawa z podaniem źródła lub linkuj oryginalne materiały. Pełne schematy, podręczniki, firmware, logo i specyfikacje hostuj tylko na podstawie wyraźnej licencji.
Verification: Każdy dodany materiał ma zapis autora/licencji/źródła, a materiały bez praw są zastąpione linkiem do strony właściciela.
Warning: Dostęp do publicznego PDF lub strony nie oznacza prawa do kopiowania, rehostowania ani używania w komercyjnym AI. UEFI i PCI-SIG publikują własne ograniczenia dostępu i licencji.','copyright,licence,boardview,documentation','https://uefi.org/specifications'),
('lesson:LABX-033','lesson','Serwis / dokumentacja','Przygotowanie protokołu naprawy dla klienta','Preparing a customer repair report','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Przygotowanie protokołu naprawy dla klienta.

Objawy i kontekst: Zlecenie wymaga jasnego opisu stanu przed naprawą, wykonanych czynności, wymienionych części i wyników odbioru.

Tok diagnostyczny: Zapisz identyfikator zlecenia, model, stan wizualny, akcesoria, zgłoszony objaw, zakres zgody i dane diagnostyczne minimalne do obsługi sprawy.

Możliwe rozwiązanie: Oddziel fakty od hipotez, dołącz wyniki przed/po, wersje narzędzi i numery części. Nie wpisuj haseł, kluczy odzyskiwania ani zbędnych danych osobowych.

Kryterium odbioru: Klient otrzymuje czytelny raport z diagnozą, naprawą, testami, ograniczeniami i zaleceniami; dane są przechowywane zgodnie z przyjętą polityką.

Źródło do dalszej nauki: https://www.nist.gov/privacy-framework. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Zlecenie wymaga jasnego opisu stanu przed naprawą, wykonanych czynności, wymienionych części i wyników odbioru.
Tok diagnostyczny: Zapisz identyfikator zlecenia, model, stan wizualny, akcesoria, zgłoszony objaw, zakres zgody i dane diagnostyczne minimalne do obsługi sprawy.
Rozwiązanie: Oddziel fakty od hipotez, dołącz wyniki przed/po, wersje narzędzi i numery części. Nie wpisuj haseł, kluczy odzyskiwania ani zbędnych danych osobowych.
Test końcowy: Klient otrzymuje czytelny raport z diagnozą, naprawą, testami, ograniczeniami i zaleceniami; dane są przechowywane zgodnie z przyjętą polityką.
Ostrzeżenie: Nie publikuj raportów z danymi klienta jako materiałów szkoleniowych bez anonimizacji i odrębnej podstawy prawnej.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Preparing a customer repair report.

Symptoms and context: Zlecenie wymaga jasnego opisu stanu przed naprawą, wykonanych czynności, wymienionych części i wyników odbioru.

Diagnostic reasoning: Zapisz identyfikator zlecenia, model, stan wizualny, akcesoria, zgłoszony objaw, zakres zgody i dane diagnostyczne minimalne do obsługi sprawy.

Possible remedy: Oddziel fakty od hipotez, dołącz wyniki przed/po, wersje narzędzi i numery części. Nie wpisuj haseł, kluczy odzyskiwania ani zbędnych danych osobowych.

Acceptance criteria: Klient otrzymuje czytelny raport z diagnozą, naprawą, testami, ograniczeniami i zaleceniami; dane są przechowywane zgodnie z przyjętą polityką.

Further reading: https://www.nist.gov/privacy-framework. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Zlecenie wymaga jasnego opisu stanu przed naprawą, wykonanych czynności, wymienionych części i wyników odbioru.
Diagnostic reasoning: Zapisz identyfikator zlecenia, model, stan wizualny, akcesoria, zgłoszony objaw, zakres zgody i dane diagnostyczne minimalne do obsługi sprawy.
Remedy: Oddziel fakty od hipotez, dołącz wyniki przed/po, wersje narzędzi i numery części. Nie wpisuj haseł, kluczy odzyskiwania ani zbędnych danych osobowych.
Verification: Klient otrzymuje czytelny raport z diagnozą, naprawą, testami, ograniczeniami i zaleceniami; dane są przechowywane zgodnie z przyjętą polityką.
Warning: Nie publikuj raportów z danymi klienta jako materiałów szkoleniowych bez anonimizacji i odrębnej podstawy prawnej.','repair-report,privacy,service,documentation','https://www.nist.gov/privacy-framework'),
('lesson:LABX-034','lesson','Elektronika / pomiary','Kalibracja miernika i kontrola sond','Checking multimeter calibration and probes','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Kalibracja miernika i kontrola sond.

Objawy i kontekst: Wyniki pomiarów są rozbieżne, miernik pokazuje skaczące wartości lub sonda ma uszkodzoną izolację.

Tok diagnostyczny: Sprawdź kategorię CAT, zakresy, stan bezpieczników, przewody, izolację, końcówki, baterię i termin kalibracji. Porównaj z przyrządem odniesienia.

Możliwe rozwiązanie: Nie używaj miernika z uszkodzoną obudową lub przewodem. Wykonuj test ciągłości przewodów i znanego źródła tylko w zakresie dopuszczonym przez producenta.

Kryterium odbioru: Przyrząd przechodzi kontrolę przewodów i podstawowe porównanie ze wzorcem, a pomiary są powtarzalne.

Źródło do dalszej nauki: https://www.nist.gov/pml. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Wyniki pomiarów są rozbieżne, miernik pokazuje skaczące wartości lub sonda ma uszkodzoną izolację.
Tok diagnostyczny: Sprawdź kategorię CAT, zakresy, stan bezpieczników, przewody, izolację, końcówki, baterię i termin kalibracji. Porównaj z przyrządem odniesienia.
Rozwiązanie: Nie używaj miernika z uszkodzoną obudową lub przewodem. Wykonuj test ciągłości przewodów i znanego źródła tylko w zakresie dopuszczonym przez producenta.
Test końcowy: Przyrząd przechodzi kontrolę przewodów i podstawowe porównanie ze wzorcem, a pomiary są powtarzalne.
Ostrzeżenie: Nie mierz napięć sieciowych, jeśli nie masz kwalifikacji, właściwej kategorii CAT i procedury; nie otwieraj miernika pod napięciem.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Checking multimeter calibration and probes.

Symptoms and context: Wyniki pomiarów są rozbieżne, miernik pokazuje skaczące wartości lub sonda ma uszkodzoną izolację.

Diagnostic reasoning: Sprawdź kategorię CAT, zakresy, stan bezpieczników, przewody, izolację, końcówki, baterię i termin kalibracji. Porównaj z przyrządem odniesienia.

Possible remedy: Nie używaj miernika z uszkodzoną obudową lub przewodem. Wykonuj test ciągłości przewodów i znanego źródła tylko w zakresie dopuszczonym przez producenta.

Acceptance criteria: Przyrząd przechodzi kontrolę przewodów i podstawowe porównanie ze wzorcem, a pomiary są powtarzalne.

Further reading: https://www.nist.gov/pml. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Wyniki pomiarów są rozbieżne, miernik pokazuje skaczące wartości lub sonda ma uszkodzoną izolację.
Diagnostic reasoning: Sprawdź kategorię CAT, zakresy, stan bezpieczników, przewody, izolację, końcówki, baterię i termin kalibracji. Porównaj z przyrządem odniesienia.
Remedy: Nie używaj miernika z uszkodzoną obudową lub przewodem. Wykonuj test ciągłości przewodów i znanego źródła tylko w zakresie dopuszczonym przez producenta.
Verification: Przyrząd przechodzi kontrolę przewodów i podstawowe porównanie ze wzorcem, a pomiary są powtarzalne.
Warning: Nie mierz napięć sieciowych, jeśli nie masz kwalifikacji, właściwej kategorii CAT i procedury; nie otwieraj miernika pod napięciem.','multimeter,calibration,probe,measurement','https://www.nist.gov/pml'),
('lesson:LABX-035','lesson','Serwis / BHP','Przygotowanie stanowiska ESD i audyt ochrony','Auditing ESD workstation protection','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Przygotowanie stanowiska ESD i audyt ochrony.

Objawy i kontekst: Serwis wykonuje częste naprawy płyt, modułów pamięci i urządzeń wrażliwych na wyładowania elektrostatyczne.

Tok diagnostyczny: Sprawdź matę, opaskę, przewód, wspólny punkt uziemienia, powierzchnie, pojemniki, transport i okres testowania wyposażenia.

Możliwe rozwiązanie: Wprowadź procedurę codziennej kontroli, zapis wyników i oznaczenia stanowisk. Części przechowuj w opakowaniach ESD, nie na zwykłych plastikowych tackach.

Kryterium odbioru: Każde stanowisko ma sprawdzony punkt uziemienia, dostępne środki ochronne i zapis kontroli zgodnie z procedurą firmy.

Źródło do dalszej nauki: https://www.esda.org/esd-overview/esd-fundamentals/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Serwis wykonuje częste naprawy płyt, modułów pamięci i urządzeń wrażliwych na wyładowania elektrostatyczne.
Tok diagnostyczny: Sprawdź matę, opaskę, przewód, wspólny punkt uziemienia, powierzchnie, pojemniki, transport i okres testowania wyposażenia.
Rozwiązanie: Wprowadź procedurę codziennej kontroli, zapis wyników i oznaczenia stanowisk. Części przechowuj w opakowaniach ESD, nie na zwykłych plastikowych tackach.
Test końcowy: Każde stanowisko ma sprawdzony punkt uziemienia, dostępne środki ochronne i zapis kontroli zgodnie z procedurą firmy.
Ostrzeżenie: Ochrona ESD nie zastępuje odłączenia energii. Nie łącz opaski ESD z niezweryfikowanym punktem zasilania.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Auditing ESD workstation protection.

Symptoms and context: Serwis wykonuje częste naprawy płyt, modułów pamięci i urządzeń wrażliwych na wyładowania elektrostatyczne.

Diagnostic reasoning: Sprawdź matę, opaskę, przewód, wspólny punkt uziemienia, powierzchnie, pojemniki, transport i okres testowania wyposażenia.

Possible remedy: Wprowadź procedurę codziennej kontroli, zapis wyników i oznaczenia stanowisk. Części przechowuj w opakowaniach ESD, nie na zwykłych plastikowych tackach.

Acceptance criteria: Każde stanowisko ma sprawdzony punkt uziemienia, dostępne środki ochronne i zapis kontroli zgodnie z procedurą firmy.

Further reading: https://www.esda.org/esd-overview/esd-fundamentals/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Serwis wykonuje częste naprawy płyt, modułów pamięci i urządzeń wrażliwych na wyładowania elektrostatyczne.
Diagnostic reasoning: Sprawdź matę, opaskę, przewód, wspólny punkt uziemienia, powierzchnie, pojemniki, transport i okres testowania wyposażenia.
Remedy: Wprowadź procedurę codziennej kontroli, zapis wyników i oznaczenia stanowisk. Części przechowuj w opakowaniach ESD, nie na zwykłych plastikowych tackach.
Verification: Każde stanowisko ma sprawdzony punkt uziemienia, dostępne środki ochronne i zapis kontroli zgodnie z procedurą firmy.
Warning: Ochrona ESD nie zastępuje odłączenia energii. Nie łącz opaski ESD z niezweryfikowanym punktem zasilania.','ESD,audit,grounding,safety','https://www.esda.org/esd-overview/esd-fundamentals/'),
('lesson:LABX-036','lesson','Windows / sterowniki','Analiza problemów z aktualizacją sterownika','Analysing driver update failures','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Analiza problemów z aktualizacją sterownika.

Objawy i kontekst: Sterownik nie instaluje się, Windows Update cofa zmianę lub urządzenie otrzymuje kod błędu w Menedżerze urządzeń.

Tok diagnostyczny: Zapisz identyfikator sprzętowy, wersję sterownika, kod błędu, dziennik instalacji i model urządzenia. Ustal czy sterownik pochodzi od OEM czy producenta układu.

Możliwe rozwiązanie: Utwórz punkt przywracania lub kopię, pobierz właściwy pakiet, usuń tylko konfliktowy sterownik zgodnie z instrukcją, a instalację wykonaj bez równoległych aktualizacji.

Kryterium odbioru: Urządzenie działa po zimnym starcie i wznowieniu, kod błędu znika, a wersja sterownika jest zgodna z platformą.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/drivers/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Sterownik nie instaluje się, Windows Update cofa zmianę lub urządzenie otrzymuje kod błędu w Menedżerze urządzeń.
Tok diagnostyczny: Zapisz identyfikator sprzętowy, wersję sterownika, kod błędu, dziennik instalacji i model urządzenia. Ustal czy sterownik pochodzi od OEM czy producenta układu.
Rozwiązanie: Utwórz punkt przywracania lub kopię, pobierz właściwy pakiet, usuń tylko konfliktowy sterownik zgodnie z instrukcją, a instalację wykonaj bez równoległych aktualizacji.
Test końcowy: Urządzenie działa po zimnym starcie i wznowieniu, kod błędu znika, a wersja sterownika jest zgodna z platformą.
Ostrzeżenie: Nie korzystaj z przypadkowych „driver updaterów” ani pakietów z niezweryfikowanych stron.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Analysing driver update failures.

Symptoms and context: Sterownik nie instaluje się, Windows Update cofa zmianę lub urządzenie otrzymuje kod błędu w Menedżerze urządzeń.

Diagnostic reasoning: Zapisz identyfikator sprzętowy, wersję sterownika, kod błędu, dziennik instalacji i model urządzenia. Ustal czy sterownik pochodzi od OEM czy producenta układu.

Possible remedy: Utwórz punkt przywracania lub kopię, pobierz właściwy pakiet, usuń tylko konfliktowy sterownik zgodnie z instrukcją, a instalację wykonaj bez równoległych aktualizacji.

Acceptance criteria: Urządzenie działa po zimnym starcie i wznowieniu, kod błędu znika, a wersja sterownika jest zgodna z platformą.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/drivers/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Sterownik nie instaluje się, Windows Update cofa zmianę lub urządzenie otrzymuje kod błędu w Menedżerze urządzeń.
Diagnostic reasoning: Zapisz identyfikator sprzętowy, wersję sterownika, kod błędu, dziennik instalacji i model urządzenia. Ustal czy sterownik pochodzi od OEM czy producenta układu.
Remedy: Utwórz punkt przywracania lub kopię, pobierz właściwy pakiet, usuń tylko konfliktowy sterownik zgodnie z instrukcją, a instalację wykonaj bez równoległych aktualizacji.
Verification: Urządzenie działa po zimnym starcie i wznowieniu, kod błędu znika, a wersja sterownika jest zgodna z platformą.
Warning: Nie korzystaj z przypadkowych „driver updaterów” ani pakietów z niezweryfikowanych stron.','drivers,device-manager,hardware-id','https://learn.microsoft.com/en-us/windows-hardware/drivers/'),
('lesson:LABX-037','lesson','Firmware / bezpieczeństwo','Weryfikacja integralności pobranego firmware','Verifying downloaded firmware integrity','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Weryfikacja integralności pobranego firmware.

Objawy i kontekst: Serwis pobrał BIOS, firmware SSD, routera lub kontrolera i musi potwierdzić, że plik jest właściwy i nieuszkodzony.

Tok diagnostyczny: Potwierdź model, rewizję, region, wersję, datę, podpis cyfrowy i sumę kontrolną publikowaną przez producenta. Sprawdź źródło pobrania i adres HTTPS.

Możliwe rozwiązanie: Porównaj SHA-256 z wartością na oficjalnej stronie, zweryfikuj podpis, archiwum i zgodność pakietu. Przed flashowaniem wykonaj kopię danych i plan odzyskiwania.

Kryterium odbioru: Plik jest autentyczny, przeznaczony dla dokładnego modelu, a procedura OEM została spełniona. Raport zapisuje nazwę i sumę pliku.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Serwis pobrał BIOS, firmware SSD, routera lub kontrolera i musi potwierdzić, że plik jest właściwy i nieuszkodzony.
Tok diagnostyczny: Potwierdź model, rewizję, region, wersję, datę, podpis cyfrowy i sumę kontrolną publikowaną przez producenta. Sprawdź źródło pobrania i adres HTTPS.
Rozwiązanie: Porównaj SHA-256 z wartością na oficjalnej stronie, zweryfikuj podpis, archiwum i zgodność pakietu. Przed flashowaniem wykonaj kopię danych i plan odzyskiwania.
Test końcowy: Plik jest autentyczny, przeznaczony dla dokładnego modelu, a procedura OEM została spełniona. Raport zapisuje nazwę i sumę pliku.
Ostrzeżenie: Poprawna suma SHA-256 sama nie dowodzi, że plik jest odpowiedni — musi pochodzić z zaufanego źródła i pasować do modelu.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Verifying downloaded firmware integrity.

Symptoms and context: Serwis pobrał BIOS, firmware SSD, routera lub kontrolera i musi potwierdzić, że plik jest właściwy i nieuszkodzony.

Diagnostic reasoning: Potwierdź model, rewizję, region, wersję, datę, podpis cyfrowy i sumę kontrolną publikowaną przez producenta. Sprawdź źródło pobrania i adres HTTPS.

Possible remedy: Porównaj SHA-256 z wartością na oficjalnej stronie, zweryfikuj podpis, archiwum i zgodność pakietu. Przed flashowaniem wykonaj kopię danych i plan odzyskiwania.

Acceptance criteria: Plik jest autentyczny, przeznaczony dla dokładnego modelu, a procedura OEM została spełniona. Raport zapisuje nazwę i sumę pliku.

Further reading: https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Serwis pobrał BIOS, firmware SSD, routera lub kontrolera i musi potwierdzić, że plik jest właściwy i nieuszkodzony.
Diagnostic reasoning: Potwierdź model, rewizję, region, wersję, datę, podpis cyfrowy i sumę kontrolną publikowaną przez producenta. Sprawdź źródło pobrania i adres HTTPS.
Remedy: Porównaj SHA-256 z wartością na oficjalnej stronie, zweryfikuj podpis, archiwum i zgodność pakietu. Przed flashowaniem wykonaj kopię danych i plan odzyskiwania.
Verification: Plik jest autentyczny, przeznaczony dla dokładnego modelu, a procedura OEM została spełniona. Raport zapisuje nazwę i sumę pliku.
Warning: Poprawna suma SHA-256 sama nie dowodzi, że plik jest odpowiedni — musi pochodzić z zaufanego źródła i pasować do modelu.','firmware,SHA256,signature,integrity','https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/'),
('lesson:LABX-038','lesson','Serwis / odbiór','Test odbiorczy komputera po naprawie','Final acceptance testing after PC repair','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Test odbiorczy komputera po naprawie.

Objawy i kontekst: Naprawa została wykonana, ale urządzenie wymaga pełnego potwierdzenia stabilności i kompletności funkcji przed przekazaniem.

Tok diagnostyczny: Ustal zgłoszony objaw, zakres naprawy, elementy ruszane podczas serwisu i testy dopasowane do ryzyka. Zdefiniuj czas oraz kryterium zaliczenia.

Możliwe rozwiązanie: Wykonaj zimny start, restart, uśpienie/wznowienie, test pamięci, krótki i długi test obciążenia, SMART, porty, sieć, audio, obraz i ładowanie. Zapisz temperatury i logi.

Kryterium odbioru: Wszystkie funkcje objęte naprawą działają, nie ma nowych błędów, dane klienta są nienaruszone, a raport zawiera wyniki i odstępstwa.

Źródło do dalszej nauki: https://www.nist.gov/privacy-framework. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Naprawa została wykonana, ale urządzenie wymaga pełnego potwierdzenia stabilności i kompletności funkcji przed przekazaniem.
Tok diagnostyczny: Ustal zgłoszony objaw, zakres naprawy, elementy ruszane podczas serwisu i testy dopasowane do ryzyka. Zdefiniuj czas oraz kryterium zaliczenia.
Rozwiązanie: Wykonaj zimny start, restart, uśpienie/wznowienie, test pamięci, krótki i długi test obciążenia, SMART, porty, sieć, audio, obraz i ładowanie. Zapisz temperatury i logi.
Test końcowy: Wszystkie funkcje objęte naprawą działają, nie ma nowych błędów, dane klienta są nienaruszone, a raport zawiera wyniki i odstępstwa.
Ostrzeżenie: Nie przeprowadzaj testów destrukcyjnych ani długiego zapisu na dysku klienta bez kopii i zgody.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Final acceptance testing after PC repair.

Symptoms and context: Naprawa została wykonana, ale urządzenie wymaga pełnego potwierdzenia stabilności i kompletności funkcji przed przekazaniem.

Diagnostic reasoning: Ustal zgłoszony objaw, zakres naprawy, elementy ruszane podczas serwisu i testy dopasowane do ryzyka. Zdefiniuj czas oraz kryterium zaliczenia.

Possible remedy: Wykonaj zimny start, restart, uśpienie/wznowienie, test pamięci, krótki i długi test obciążenia, SMART, porty, sieć, audio, obraz i ładowanie. Zapisz temperatury i logi.

Acceptance criteria: Wszystkie funkcje objęte naprawą działają, nie ma nowych błędów, dane klienta są nienaruszone, a raport zawiera wyniki i odstępstwa.

Further reading: https://www.nist.gov/privacy-framework. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Naprawa została wykonana, ale urządzenie wymaga pełnego potwierdzenia stabilności i kompletności funkcji przed przekazaniem.
Diagnostic reasoning: Ustal zgłoszony objaw, zakres naprawy, elementy ruszane podczas serwisu i testy dopasowane do ryzyka. Zdefiniuj czas oraz kryterium zaliczenia.
Remedy: Wykonaj zimny start, restart, uśpienie/wznowienie, test pamięci, krótki i długi test obciążenia, SMART, porty, sieć, audio, obraz i ładowanie. Zapisz temperatury i logi.
Verification: Wszystkie funkcje objęte naprawą działają, nie ma nowych błędów, dane klienta są nienaruszone, a raport zawiera wyniki i odstępstwa.
Warning: Nie przeprowadzaj testów destrukcyjnych ani długiego zapisu na dysku klienta bez kopii i zgody.','acceptance-test,QA,repair,report','https://www.nist.gov/privacy-framework'),
('lesson:LABX-039','lesson','Serwis / bezpieczeństwo danych','Ochrona danych przed testami obciążeniowymi','Protecting customer data before stress testing','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ochrona danych przed testami obciążeniowymi.

Objawy i kontekst: Testy dysku, pamięci, GPU lub CPU mogą spowodować utratę niezapisanych danych albo ujawnić dane klienta w raportach.

Tok diagnostyczny: Ustal, czy urządzenie zawiera jedyną kopię danych, czy dysk jest szyfrowany, jakie są ograniczenia klienta i które testy zapisują dane.

Możliwe rozwiązanie: Wykonaj kopię lub uzyskaj potwierdzenie kopii klienta, unikaj testów zapisu na źródłowym nośniku, anonimizuj raporty i ogranicz dostęp do logów.

Kryterium odbioru: Testy są wykonane na bezpiecznej kopii lub po udokumentowanej zgodzie, dane są dostępne, a raport nie zawiera poufnych informacji.

Źródło do dalszej nauki: https://www.nist.gov/privacy-framework. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Testy dysku, pamięci, GPU lub CPU mogą spowodować utratę niezapisanych danych albo ujawnić dane klienta w raportach.
Tok diagnostyczny: Ustal, czy urządzenie zawiera jedyną kopię danych, czy dysk jest szyfrowany, jakie są ograniczenia klienta i które testy zapisują dane.
Rozwiązanie: Wykonaj kopię lub uzyskaj potwierdzenie kopii klienta, unikaj testów zapisu na źródłowym nośniku, anonimizuj raporty i ogranicz dostęp do logów.
Test końcowy: Testy są wykonane na bezpiecznej kopii lub po udokumentowanej zgodzie, dane są dostępne, a raport nie zawiera poufnych informacji.
Ostrzeżenie: Nie proś klienta o hasło lub klucz BitLocker w publicznym czacie. Używaj mechanizmu przekazania sekretu poza Akademią.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Protecting customer data before stress testing.

Symptoms and context: Testy dysku, pamięci, GPU lub CPU mogą spowodować utratę niezapisanych danych albo ujawnić dane klienta w raportach.

Diagnostic reasoning: Ustal, czy urządzenie zawiera jedyną kopię danych, czy dysk jest szyfrowany, jakie są ograniczenia klienta i które testy zapisują dane.

Possible remedy: Wykonaj kopię lub uzyskaj potwierdzenie kopii klienta, unikaj testów zapisu na źródłowym nośniku, anonimizuj raporty i ogranicz dostęp do logów.

Acceptance criteria: Testy są wykonane na bezpiecznej kopii lub po udokumentowanej zgodzie, dane są dostępne, a raport nie zawiera poufnych informacji.

Further reading: https://www.nist.gov/privacy-framework. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Testy dysku, pamięci, GPU lub CPU mogą spowodować utratę niezapisanych danych albo ujawnić dane klienta w raportach.
Diagnostic reasoning: Ustal, czy urządzenie zawiera jedyną kopię danych, czy dysk jest szyfrowany, jakie są ograniczenia klienta i które testy zapisują dane.
Remedy: Wykonaj kopię lub uzyskaj potwierdzenie kopii klienta, unikaj testów zapisu na źródłowym nośniku, anonimizuj raporty i ogranicz dostęp do logów.
Verification: Testy są wykonane na bezpiecznej kopii lub po udokumentowanej zgodzie, dane są dostępne, a raport nie zawiera poufnych informacji.
Warning: Nie proś klienta o hasło lub klucz BitLocker w publicznym czacie. Używaj mechanizmu przekazania sekretu poza Akademią.','privacy,backup,stress-test,customer','https://www.nist.gov/privacy-framework'),
('lesson:LABX-040','lesson','Windows / zasilanie','Diagnostyka problemów z uśpieniem i wybudzaniem','Diagnosing sleep and wake failures','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka problemów z uśpieniem i wybudzaniem.

Objawy i kontekst: Laptop nie wybudza się, sam się uruchamia, traci baterię w uśpieniu lub wymaga twardego wyłączenia.

Tok diagnostyczny: Zapisz tryb Modern Standby/S3, urządzenia wake source, zdarzenia zasilania, sterowniki i BIOS. Odróżnij brak wybudzenia od szybkiego rozładowania.

Możliwe rozwiązanie: Sprawdź powercfg /a, historię uśpienia, wake timers i urządzenia wybudzające. Aktualizuj sterowniki i firmware w kolejności OEM, testuj po jednej zmianie.

Kryterium odbioru: Kilka cykli uśpienia i wznowienia działa stabilnie, bateria nie traci nieoczekiwanie energii, a dziennik nie zawiera nowych błędów.

Źródło do dalszej nauki: https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Laptop nie wybudza się, sam się uruchamia, traci baterię w uśpieniu lub wymaga twardego wyłączenia.
Tok diagnostyczny: Zapisz tryb Modern Standby/S3, urządzenia wake source, zdarzenia zasilania, sterowniki i BIOS. Odróżnij brak wybudzenia od szybkiego rozładowania.
Rozwiązanie: Sprawdź powercfg /a, historię uśpienia, wake timers i urządzenia wybudzające. Aktualizuj sterowniki i firmware w kolejności OEM, testuj po jednej zmianie.
Test końcowy: Kilka cykli uśpienia i wznowienia działa stabilnie, bateria nie traci nieoczekiwanie energii, a dziennik nie zawiera nowych błędów.
Ostrzeżenie: Nie wyłączaj losowo urządzeń krytycznych ani zabezpieczeń zasilania; zapisz poprzednią konfigurację.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing sleep and wake failures.

Symptoms and context: Laptop nie wybudza się, sam się uruchamia, traci baterię w uśpieniu lub wymaga twardego wyłączenia.

Diagnostic reasoning: Zapisz tryb Modern Standby/S3, urządzenia wake source, zdarzenia zasilania, sterowniki i BIOS. Odróżnij brak wybudzenia od szybkiego rozładowania.

Possible remedy: Sprawdź powercfg /a, historię uśpienia, wake timers i urządzenia wybudzające. Aktualizuj sterowniki i firmware w kolejności OEM, testuj po jednej zmianie.

Acceptance criteria: Kilka cykli uśpienia i wznowienia działa stabilnie, bateria nie traci nieoczekiwanie energii, a dziennik nie zawiera nowych błędów.

Further reading: https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Laptop nie wybudza się, sam się uruchamia, traci baterię w uśpieniu lub wymaga twardego wyłączenia.
Diagnostic reasoning: Zapisz tryb Modern Standby/S3, urządzenia wake source, zdarzenia zasilania, sterowniki i BIOS. Odróżnij brak wybudzenia od szybkiego rozładowania.
Remedy: Sprawdź powercfg /a, historię uśpienia, wake timers i urządzenia wybudzające. Aktualizuj sterowniki i firmware w kolejności OEM, testuj po jednej zmianie.
Verification: Kilka cykli uśpienia i wznowienia działa stabilnie, bateria nie traci nieoczekiwanie energii, a dziennik nie zawiera nowych błędów.
Warning: Nie wyłączaj losowo urządzeń krytycznych ani zabezpieczeń zasilania; zapisz poprzednią konfigurację.','sleep,ModernStandby,wake,power','https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby'),
('lesson:LABX-041','lesson','Laptop / audio','Diagnostyka problemów z mikrofonem i kodekiem audio','Diagnosing microphone and audio codec issues','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Diagnostyka problemów z mikrofonem i kodekiem audio.

Objawy i kontekst: Brak dźwięku, mikrofon nie działa, urządzenie znika po uśpieniu lub poziom nagrania jest zbyt niski.

Tok diagnostyczny: Sprawdź urządzenie domyślne, prywatność mikrofonu, kodek, sterownik OEM, gniazdo combo i logi. Porównaj mikrofon wewnętrzny, USB i słuchawki.

Możliwe rozwiązanie: Wykonaj test nagrania w aplikacji systemowej, sprawdź sterownik i ustawienia przetwarzania. Przy podejrzeniu taśmy/gniazda wykonaj kontrolę sprzętową bez zasilania.

Kryterium odbioru: Nagrywanie i odtwarzanie działają po restarcie, wznowieniu i w aplikacji kontrolnej, nie występują trzaski ani zaniki.

Źródło do dalszej nauki: https://support.microsoft.com/windows. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Brak dźwięku, mikrofon nie działa, urządzenie znika po uśpieniu lub poziom nagrania jest zbyt niski.
Tok diagnostyczny: Sprawdź urządzenie domyślne, prywatność mikrofonu, kodek, sterownik OEM, gniazdo combo i logi. Porównaj mikrofon wewnętrzny, USB i słuchawki.
Rozwiązanie: Wykonaj test nagrania w aplikacji systemowej, sprawdź sterownik i ustawienia przetwarzania. Przy podejrzeniu taśmy/gniazda wykonaj kontrolę sprzętową bez zasilania.
Test końcowy: Nagrywanie i odtwarzanie działają po restarcie, wznowieniu i w aplikacji kontrolnej, nie występują trzaski ani zaniki.
Ostrzeżenie: Nie instaluj pakietów audio ze stron agregujących sterowniki ani nie udostępniaj nagrań klienta bez zgody.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Diagnosing microphone and audio codec issues.

Symptoms and context: Brak dźwięku, mikrofon nie działa, urządzenie znika po uśpieniu lub poziom nagrania jest zbyt niski.

Diagnostic reasoning: Sprawdź urządzenie domyślne, prywatność mikrofonu, kodek, sterownik OEM, gniazdo combo i logi. Porównaj mikrofon wewnętrzny, USB i słuchawki.

Possible remedy: Wykonaj test nagrania w aplikacji systemowej, sprawdź sterownik i ustawienia przetwarzania. Przy podejrzeniu taśmy/gniazda wykonaj kontrolę sprzętową bez zasilania.

Acceptance criteria: Nagrywanie i odtwarzanie działają po restarcie, wznowieniu i w aplikacji kontrolnej, nie występują trzaski ani zaniki.

Further reading: https://support.microsoft.com/windows. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Brak dźwięku, mikrofon nie działa, urządzenie znika po uśpieniu lub poziom nagrania jest zbyt niski.
Diagnostic reasoning: Sprawdź urządzenie domyślne, prywatność mikrofonu, kodek, sterownik OEM, gniazdo combo i logi. Porównaj mikrofon wewnętrzny, USB i słuchawki.
Remedy: Wykonaj test nagrania w aplikacji systemowej, sprawdź sterownik i ustawienia przetwarzania. Przy podejrzeniu taśmy/gniazda wykonaj kontrolę sprzętową bez zasilania.
Verification: Nagrywanie i odtwarzanie działają po restarcie, wznowieniu i w aplikacji kontrolnej, nie występują trzaski ani zaniki.
Warning: Nie instaluj pakietów audio ze stron agregujących sterowniki ani nie udostępniaj nagrań klienta bez zgody.','audio,microphone,codec,driver','https://support.microsoft.com/windows'),
('lesson:LABX-042','lesson','Chłodzenie / CPU','Ocena chłodzenia i throttlingu CPU','Assessing CPU cooling and thermal throttling','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Ocena chłodzenia i throttlingu CPU.

Objawy i kontekst: CPU obniża zegary, wentylator stale pracuje, wydajność spada lub obudowa mocno się nagrzewa.

Tok diagnostyczny: Zapisz temperaturę pakietu, hotspot, zegary efektywne, moc, limity PL/PPT, obciążenie i temperaturę otoczenia. Sprawdź czy throttle jest termiczny, mocy czy prądowy.

Możliwe rozwiązanie: Oczyść kanały powietrzne, sprawdź kontakt radiatora, wentylator i ustawienia OEM. Testuj na fabrycznych limitach i porównaj wyniki z dokumentacją procesora.

Kryterium odbioru: Po obciążeniu temperatura i zegary pozostają w granicach projektu OEM, nie ma nagłych spadków, a układ chłodzenia pracuje poprawnie.

Źródło do dalszej nauki: https://www.intel.com/content/www/us/en/support/topics/thermal-management.html. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: CPU obniża zegary, wentylator stale pracuje, wydajność spada lub obudowa mocno się nagrzewa.
Tok diagnostyczny: Zapisz temperaturę pakietu, hotspot, zegary efektywne, moc, limity PL/PPT, obciążenie i temperaturę otoczenia. Sprawdź czy throttle jest termiczny, mocy czy prądowy.
Rozwiązanie: Oczyść kanały powietrzne, sprawdź kontakt radiatora, wentylator i ustawienia OEM. Testuj na fabrycznych limitach i porównaj wyniki z dokumentacją procesora.
Test końcowy: Po obciążeniu temperatura i zegary pozostają w granicach projektu OEM, nie ma nagłych spadków, a układ chłodzenia pracuje poprawnie.
Ostrzeżenie: Nie wyłączaj zabezpieczeń termicznych i nie podnoś limitów mocy jako podstawowej metody naprawy.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Assessing CPU cooling and thermal throttling.

Symptoms and context: CPU obniża zegary, wentylator stale pracuje, wydajność spada lub obudowa mocno się nagrzewa.

Diagnostic reasoning: Zapisz temperaturę pakietu, hotspot, zegary efektywne, moc, limity PL/PPT, obciążenie i temperaturę otoczenia. Sprawdź czy throttle jest termiczny, mocy czy prądowy.

Possible remedy: Oczyść kanały powietrzne, sprawdź kontakt radiatora, wentylator i ustawienia OEM. Testuj na fabrycznych limitach i porównaj wyniki z dokumentacją procesora.

Acceptance criteria: Po obciążeniu temperatura i zegary pozostają w granicach projektu OEM, nie ma nagłych spadków, a układ chłodzenia pracuje poprawnie.

Further reading: https://www.intel.com/content/www/us/en/support/topics/thermal-management.html. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: CPU obniża zegary, wentylator stale pracuje, wydajność spada lub obudowa mocno się nagrzewa.
Diagnostic reasoning: Zapisz temperaturę pakietu, hotspot, zegary efektywne, moc, limity PL/PPT, obciążenie i temperaturę otoczenia. Sprawdź czy throttle jest termiczny, mocy czy prądowy.
Remedy: Oczyść kanały powietrzne, sprawdź kontakt radiatora, wentylator i ustawienia OEM. Testuj na fabrycznych limitach i porównaj wyniki z dokumentacją procesora.
Verification: Po obciążeniu temperatura i zegary pozostają w granicach projektu OEM, nie ma nagłych spadków, a układ chłodzenia pracuje poprawnie.
Warning: Nie wyłączaj zabezpieczeń termicznych i nie podnoś limitów mocy jako podstawowej metody naprawy.','CPU,thermal,throttling,cooling','https://www.intel.com/content/www/us/en/support/topics/thermal-management.html'),
('lesson:LABX-043','lesson','Laptop / zasilanie','Sprawdzenie złącza ładowania DC-in','Inspecting a laptop DC-in charging jack','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Sprawdzenie złącza ładowania DC-in.

Objawy i kontekst: Ładowanie przerywa się przy poruszeniu wtykiem, gniazdo grzeje się lub zasilacz nie jest rozpoznawany.

Tok diagnostyczny: Oceń stan mechaniczny, luzy, przebarwienia, ślady łuku i temperaturę. Sprawdź oryginalny adapter i identyfikację, a także wiązkę DC-in jeśli jest osobna.

Możliwe rozwiązanie: Odłącz zasilanie i baterię przed inspekcją. Porównaj część z numerem OEM, wymień uszkodzone gniazdo/wiązki zgodnie z procedurą i sprawdź luty pod powiększeniem.

Kryterium odbioru: Wtyk jest stabilny, nie ma grzania ani przerw, laptop rozpoznaje zgodny adapter i ładuje baterię podczas testu.

Źródło do dalszej nauki: https://support.dell.com/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: Ładowanie przerywa się przy poruszeniu wtykiem, gniazdo grzeje się lub zasilacz nie jest rozpoznawany.
Tok diagnostyczny: Oceń stan mechaniczny, luzy, przebarwienia, ślady łuku i temperaturę. Sprawdź oryginalny adapter i identyfikację, a także wiązkę DC-in jeśli jest osobna.
Rozwiązanie: Odłącz zasilanie i baterię przed inspekcją. Porównaj część z numerem OEM, wymień uszkodzone gniazdo/wiązki zgodnie z procedurą i sprawdź luty pod powiększeniem.
Test końcowy: Wtyk jest stabilny, nie ma grzania ani przerw, laptop rozpoznaje zgodny adapter i ładuje baterię podczas testu.
Ostrzeżenie: Nadpalone gniazdo może mieć uszkodzenia laminatu. Nie poruszaj złączem pod obciążeniem w celu „sprawdzenia”.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Inspecting a laptop DC-in charging jack.

Symptoms and context: Ładowanie przerywa się przy poruszeniu wtykiem, gniazdo grzeje się lub zasilacz nie jest rozpoznawany.

Diagnostic reasoning: Oceń stan mechaniczny, luzy, przebarwienia, ślady łuku i temperaturę. Sprawdź oryginalny adapter i identyfikację, a także wiązkę DC-in jeśli jest osobna.

Possible remedy: Odłącz zasilanie i baterię przed inspekcją. Porównaj część z numerem OEM, wymień uszkodzone gniazdo/wiązki zgodnie z procedurą i sprawdź luty pod powiększeniem.

Acceptance criteria: Wtyk jest stabilny, nie ma grzania ani przerw, laptop rozpoznaje zgodny adapter i ładuje baterię podczas testu.

Further reading: https://support.dell.com/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: Ładowanie przerywa się przy poruszeniu wtykiem, gniazdo grzeje się lub zasilacz nie jest rozpoznawany.
Diagnostic reasoning: Oceń stan mechaniczny, luzy, przebarwienia, ślady łuku i temperaturę. Sprawdź oryginalny adapter i identyfikację, a także wiązkę DC-in jeśli jest osobna.
Remedy: Odłącz zasilanie i baterię przed inspekcją. Porównaj część z numerem OEM, wymień uszkodzone gniazdo/wiązki zgodnie z procedurą i sprawdź luty pod powiększeniem.
Verification: Wtyk jest stabilny, nie ma grzania ani przerw, laptop rozpoznaje zgodny adapter i ładuje baterię podczas testu.
Warning: Nadpalone gniazdo może mieć uszkodzenia laminatu. Nie poruszaj złączem pod obciążeniem w celu „sprawdzenia”.','DC-in,jack,charging,laptop','https://support.dell.com/'),
('lesson:LABX-044','lesson','Dyski / firmware','Analiza problemów z firmware SSD','Analysing SSD firmware issues','Cel lekcji: nauczyć technika rozdzielać objaw od potwierdzonej przyczyny. Analiza problemów z firmware SSD.

Objawy i kontekst: SSD znika po wybudzeniu, nie jest rozpoznawany w określonej płycie lub producent opisuje poprawkę firmware.

Tok diagnostyczny: Ustal dokładny model i rewizję, firmware, kontroler, temperaturę i status SMART. Sprawdź listę zmian i znane problemy na stronie producenta.

Możliwe rozwiązanie: Najpierw wykonaj kopię danych. Użyj tylko oficjalnego narzędzia producenta, upewnij się, że aktualizacja jest zalecana dla tej rewizji i przygotuj plan odzyskania systemu.

Kryterium odbioru: Dysk jest rozpoznawany po zimnym starcie, wybudzeniu i restarcie; logi i SMART nie pokazują nowych błędów.

Źródło do dalszej nauki: https://nvmexpress.org/specifications/. Zewnętrzna dokumentacja pozostaje własnością jej wydawcy; Akademia linkuje do oryginału i prezentuje własne omówienie.

Objawy: SSD znika po wybudzeniu, nie jest rozpoznawany w określonej płycie lub producent opisuje poprawkę firmware.
Tok diagnostyczny: Ustal dokładny model i rewizję, firmware, kontroler, temperaturę i status SMART. Sprawdź listę zmian i znane problemy na stronie producenta.
Rozwiązanie: Najpierw wykonaj kopię danych. Użyj tylko oficjalnego narzędzia producenta, upewnij się, że aktualizacja jest zalecana dla tej rewizji i przygotuj plan odzyskania systemu.
Test końcowy: Dysk jest rozpoznawany po zimnym starcie, wybudzeniu i restarcie; logi i SMART nie pokazują nowych błędów.
Ostrzeżenie: Aktualizacja firmware może trwale unieruchomić nośnik lub wymazać dane. Nie wykonuj jej bez kopii i pewnego zasilania.','Lesson objective: teach technicians to separate symptoms from confirmed causes. Analysing SSD firmware issues.

Symptoms and context: SSD znika po wybudzeniu, nie jest rozpoznawany w określonej płycie lub producent opisuje poprawkę firmware.

Diagnostic reasoning: Ustal dokładny model i rewizję, firmware, kontroler, temperaturę i status SMART. Sprawdź listę zmian i znane problemy na stronie producenta.

Possible remedy: Najpierw wykonaj kopię danych. Użyj tylko oficjalnego narzędzia producenta, upewnij się, że aktualizacja jest zalecana dla tej rewizji i przygotuj plan odzyskania systemu.

Acceptance criteria: Dysk jest rozpoznawany po zimnym starcie, wybudzeniu i restarcie; logi i SMART nie pokazują nowych błędów.

Further reading: https://nvmexpress.org/specifications/. Third-party documentation remains the property of its publisher; the Academy links to the original and provides its own explanation.

Symptoms: SSD znika po wybudzeniu, nie jest rozpoznawany w określonej płycie lub producent opisuje poprawkę firmware.
Diagnostic reasoning: Ustal dokładny model i rewizję, firmware, kontroler, temperaturę i status SMART. Sprawdź listę zmian i znane problemy na stronie producenta.
Remedy: Najpierw wykonaj kopię danych. Użyj tylko oficjalnego narzędzia producenta, upewnij się, że aktualizacja jest zalecana dla tej rewizji i przygotuj plan odzyskania systemu.
Verification: Dysk jest rozpoznawany po zimnym starcie, wybudzeniu i restarcie; logi i SMART nie pokazują nowych błędów.
Warning: Aktualizacja firmware może trwale unieruchomić nośnik lub wymazać dane. Nie wykonuj jej bez kopii i pewnego zasilania.','SSD,firmware,NVMe,update','https://nvmexpress.org/specifications/');
