NAUKA OD A DO Z 6.8.0 — FIX44 MASTER SERVICE CENTER PRO
========================================================

WYDANIE
-------
Numer aplikacji: 6.8.0
Poprawka: FIX44
Identyfikator buildu: 6.8.0-social-login-fix44-master-service-center-20261104
Nowy ekran: Master Service Center PRO (view-fix44)
Zakres ekranu: pulpit + 15 obszarów szkoleniowych (16 zakładek łącznie)

CEL
---
FIX44 rozszerza FIX43, nie zastępuje go. W projekcie pozostają wcześniejsze kursy,
lekcje, egzaminy, schematy, laboratoria, warsztaty, moduły opinii i obsługi
społeczności. Nowy ekran łączy dodatkowe treści i lokalne narzędzia serwisowe.

NOWE MODUŁY
------------
1. Laptop Identification PRO
   Lokalny katalog producenta/modelu, Board ID, rewizji i platformy. Nie jest
automatycznym skanerem wszystkich laptopów podłączonych do komputera.

2. BIOS Database 360
   Odczyt dwóch plików wskazanych przez użytkownika, SHA-256, porównanie bajtów
   i zakresów różnic. Pliki surowe pozostają w pamięci przeglądarki podczas
   porównania; do historii trafiają metadane. Brak zapisu/flashowania BIOS.

3. Thermal Diagnostic PRO
   Ręczny dziennik temperatur i obciążenia, opcjonalny obraz dowodowy zapisany
   lokalnie. Aplikacja nie odczytuje automatycznie każdego czujnika i nie
   zastępuje termowizji.

4. CPU GPU Architecture Academy
   Materiały edukacyjne o architekturach CPU/GPU i lokalne sprawdziany wiedzy.
   Opisy mają charakter szkoleniowy, nie są automatyczną identyfikacją sprzętu.

5. Battery & Charging Lab
   Kalkulator mocy P = U × I i przykładowe profile USB-C Power Delivery.
   Przykłady służą nauce; moduł nie steruje BMS, baterią ani zasilaczem.

6. Data Recovery Academy
   Ograniczona, tylko do odczytu analiza nagłówków MBR/GPT w obrazie pliku
   wybranym przez użytkownika. To inspekcja metadanych, nie pełne odzyskiwanie
   plików, carving, naprawa partycji ani dostęp do fizycznego dysku.

7. Network & Router Academy
   Kalkulator IPv4/CIDR i edukacyjna symulacja VLAN. Nie wykonuje skanowania
   sieci, testów penetracyjnych ani zmian konfiguracji routera.

8. 3D Electronics Explorer
   Edukacyjna mapa SVG z perspektywą CSS 3D i wyborem elementów. Nie jest to
   rzeczywisty model CAD, skan 3D ani layout konkretnej płyty producenta.

9. Repair Case Marketplace
   Lokalny katalog przypadków z importem/eksportem JSON. Nie jest publicznym
   marketplace, nie publikuje przypadków w Internecie i nie synchronizuje ich
   automatycznie z innymi kontami.

10. Serwisant Professional Manager / Service Manager
    Lokalne zlecenia, statusy, opis urządzenia, koszty części i robocizny.
    Dane pozostają w pamięci przeglądarki; nie tworzą zdalnej bazy klientów.

11. AI Learning Coach
    Lokalne, jawne reguły rekomendacji na podstawie zapisanych postępów i
    ćwiczeń. Może przekazać użytkownika do istniejącego czatu. Nie udaje
    autonomicznego, generatywnego modelu AI.

12. Centrum kontroli jakości / Quality Center
    12 lokalnych kontroli kompletności i spójności wybranych modułów.
    To wewnętrzny self-check, a nie pełny test E2E przeglądarki.

13. Repair Simulator WORLD
    Prowadzone scenariusze diagnostyczne, wybór bezpiecznych kroków i punktacja.
    Symulator jest szkoleniowy; nie steruje prawdziwym sprzętem.

14. Universal Technical Library
    Biblioteka plików użytkownika w IndexedDB, obsługiwane typy i limit do
    25 MiB na plik. Pliki nie są automatycznie wysyłane na serwer.

15. Global Knowledge Update
    Weryfikowany SHA-256 indeks odnośników do oficjalnych źródeł producentów i
    organizacji standardyzacyjnych. Jest to katalog źródeł, nie automatyczny
    downloader datasheetów, firmware, BIOS ani sterowników.

DANE I PRYWATNOŚĆ
-----------------
- Nowe rejestry spraw, urządzeń i wpisów serwisowych są przechowywane lokalnie.
- Biblioteka dokumentów i lokalne załączniki używają IndexedDB przeglądarki.
- Porównywanie wsadów BIOS jest tylko do odczytu; brak komendy zapisu.
- Obrazy dysków są analizowane w ograniczonym zakresie i nie są modyfikowane.
- Nowy FIX44 nie dodaje automatycznego wysyłania prywatnych plików do chmury.
- Opcjonalny most Web Serial odziedziczony z FIX43 pozostaje tylko do odczytu.
- Nie dodano obsługi zapisu BIOS, sterowania BMS/PSU, konfiguracji routera
  ani fizycznego zapisu na dyskach.

URUCHOMIENIE I TESTY
-------------------
1. Wypakuj całe archiwum z zachowaniem struktury katalogów.
2. Uruchom stronę przez dotychczasowe środowisko WWW/PWA (HTTP/HTTPS).
   Nie otwieraj jej jako file://, jeżeli potrzebujesz Service Workera i pełnej
   obsługi pamięci offline.
3. W nawigacji wybierz: Master Service Center PRO FIX44.
4. Na Windows z zainstalowanym Node.js uruchom WYKONAJ_TESTY_FIX44.cmd.
   Skrypt wykonuje kontrolę składni JavaScript oraz wszystkie skrypty test-*.js
   i test-*.mjs w katalogu scripts.

WERYFIKACJA TEGO WYDANIA
-----------------------
- 67/67 skryptów regresji: PASS.
- 189/189 plików JS/MJS/CJS przeszło node --check.
- Nowy test FIX44: 23/23 asercji PASS.
- Lokalny ONECLICK verifyWeb(): PASS.
- 30 niezależnych widoków w aplikacji.
- Wszystkie 758 plików z archiwum FIX43 zachowano; usunięto 0 plików.
- FIX44 dodał 5 nowych plików funkcjonalnych/testowych przed dokumentacją.

PUBLIKACJA
----------
To kompletne archiwum projektu źródłowego WWW/PWA, nie instalator EXE.
W tym wydaniu nie wykonano wdrożenia produkcyjnego, migracji Cloudflare D1,
ani zdalnego testu dostępności nowych assetów. release.json utrzymuje
production_published=false w sekcji FIX44. Migracja opinii FIX43 pozostaje
w repozytorium; FIX44 nie dodaje nowej migracji D1.

Zobacz też:
- CHANGELOG_6.8.0_FIX44.txt
- TEST_REPORT_6.8.0_FIX44.txt
- TEST_LOG_6.8.0_FIX44.txt
- PUBLICATION_GUARD_FIX44.txt
- WYKONAJ_TESTY_FIX44.cmd

SHA-256 kompletnego archiwum jest dostarczony w osobnym pliku obok ZIP:
NAUKA_OD_A_DO_Z_FIX44_SHA256.txt
