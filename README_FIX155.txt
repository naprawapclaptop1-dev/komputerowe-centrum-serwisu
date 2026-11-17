NAUKA OD A DO Z — DLA WSZYSTKICH
WERSJA PRODUKTU: 6.8.0
AKTYWNY PAKIET: FIX155 — AKADEMIA PRAKTYCZNA SERWISANTA

CEL
FIX155 dodaje kompletny zestaw praktycznych ćwiczeń do istniejącej Akademii. Wszystkie osiem modułów jest osadzonych w dotychczasowym widoku „Centrum Mistrza PRO” (#view-academypro). Nie powstaje nowa strona ani osobny projekt.

NOWE MODUŁY
1. AKADEMIA PRZYPADKÓW SERWISOWYCH PRO
   Sześć scenariuszy: laptop bez POST, BSOD, przegrzewanie, brak ładowania USB-C, znikający SSD i problem Wi-Fi. Uczeń wybiera kolejne kroki diagnostyczne, otrzymuje informację zwrotną i zapisuje ukończenie lokalnie.
2. LABORATORIUM BIOS / UEFI / WINDOWS PRO
   Symulator trybu UEFI/Legacy, GPT/MBR, EFI, Secure Boot, TPM 2.0, AHCI/RAID/IDE, celu instalacji oraz pojemności dysku. Pokazuje konflikty konfiguracji i ostrzeżenia. Nie modyfikuje firmware, tablic partycji ani ustawień urządzenia.
3. LABORATORIUM DIAGNOSTYKI SPRZĘTU PRO
   Sześć ćwiczeń: RAM, SMART SSD, artefakty GPU, temperatury/throttling CPU, zasilanie i bateria. Dane są przykładowymi danymi szkoleniowymi; uczeń wybiera uzasadniony następny test.
4. EGZAMINY I CERTYFIKATY PRO
   Losowany egzamin z 10 pytań, limit 10 minut i próg zaliczenia 70%. Wyniki zapisują się lokalnie. Po zaliczeniu można wygenerować samodzielny dokument HTML do wydruku.
5. AKADEMIA SIECI KOMPUTEROWYCH PRO
   Kalkulator IPv4/CIDR oraz scenariusze DHCP/APIPA, DNS, Wi-Fi, wolnego połączenia i dzierżawy DHCP. Obliczenia wykonują się lokalnie; moduł nie skanuje prawdziwej sieci.
6. PRAKTYKI SERWISOWE I PORTFOLIO PRO
   Rejestr ćwiczeń i wykonanych zadań z możliwością eksportu oraz przygotowania strony HTML do wydruku. Należy używać pseudonimów i danych testowych, bez danych klientów.
7. TUTOR SERWISOWY I MAPA UMIEJĘTNOŚCI
   Lokalny tutor regułowy, który dobiera wskazówki do tematów, pokazuje obszary do powtórzenia i prezentuje mapę postępów. To nie jest generatywny model AI i nie wysyła zapytań do zewnętrznego API.
8. TRYB NAUCZYCIELA PRO
   Lokalna lista zadań, pseudonimy uczniów, termin i status wykonania oraz eksport raportu grupy.

POSTĘPY I DANE
- Nowy zestaw zapisuje dane w localStorage przeglądarki pod kluczem academy-fix155-practical-academy.
- Dostępny jest eksport zbiorczy JSON, a wybrane moduły mają własne eksporty.
- Dane FIX155 nie są synchronizowane pomiędzy przeglądarkami ani urządzeniami.
- Nie wpisuj haseł, kluczy BitLocker, danych osobowych ani danych klientów.
- Certyfikat jest potwierdzeniem ukończenia ćwiczenia w platformie. Nie jest państwowym świadectwem, dyplomem ani akredytowaną kwalifikacją zawodową.
- Symulacje BIOS/UEFI, diagnostyki sprzętu i sieci nie wykonują rzeczywistych pomiarów ani zmian w systemie.

CO ZACHOWANO
- Wersja produktu: 6.8.0.
- Istniejący projekt Cloudflare Pages: naprawa-pc-akademia-serwisu-pro.
- Istniejąca baza D1 i binding: naprawapc-orders / DB.
- Brak nowej bazy, migracji D1, migracji danych i nowych sekretów.
- 35 istniejących widoków, 1083 lekcje oraz 19 wpisów katalogu zdjęć.
- Istniejący osobny cache zdjęć academy-photo-library-fix135.
- Istniejąca strona główna i poprzednie moduły FIX148/FIX149.

URUCHOMIENIE I PUBLIKACJA
1. Zamknij uruchomione procesy platformy i wykonaj kopię katalogu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj cały archiwum FIX155 do katalogu projektu, zastępując aktualne pliki. Zachowaj kopię poprzedniego katalogu.
3. Uruchom WYKONAJ_TESTY_FIX155.cmd, jeżeli chcesz najpierw wykonać pełny zestaw lokalnych testów.
4. Uruchom dotychczasowy START_FIX105. OneClick i Watcher wykonują wymagane kontrole przed dalszą publikacją.
5. Zachowaj LOGI\START_FIX105.log, jeśli publikacja zatrzyma się na kolejnym błędzie.

TESTY
- FIX155 Practical Academy Suite: 10/10 PASS.
- FIX150 Publisher Release Scope: 3/3 PASS.
- FIX149 Advanced Training Suite: 8/8 PASS.
- FIX148 Master Technician Regression: 7/7 PASS.
- FIX147 lesson contract: 3/3 PASS; katalog 1083 lekcji zachowany.
- FIX145 Academy Hub: 7/7 PASS.
- FIX144 HERO allowlist: 3/3 PASS.
- FIX137 publisher photo-cache contract: 6/6 PASS.
- FIX136 regression: 14/14 PASS.
- Weryfikacja strukturalna HTML: 967 unikalnych identyfikatorów, brak duplikatów; 8 zakładek i 8 paneli FIX155.
- Pełny raport: RAPORT_FIX155_TESTY.log.

OGRANICZENIE WERYFIKACJI
Testy i kontrola składni zostały wykonane lokalnie w środowisku budowania. Nie wykonano pełnego testu interakcji w prawdziwej przeglądarce ani zdalnej publikacji Cloudflare Pages. Stan produkcyjny należy potwierdzić po uruchomieniu START_FIX105 i sprawdzeniu publicznej witryny.
