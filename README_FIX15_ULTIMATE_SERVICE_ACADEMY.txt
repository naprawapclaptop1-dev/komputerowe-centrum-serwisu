NAUKA OD A DO Z — 6.4.0 FIX15
ULTIMATE SERVICE ACADEMY
============================================================

CO ZAWIERA WYDANIE

FIX15 rozszerza poprzedni Warsztat Mistrza FIX14 o osobny panel
„Laboratoria PRO”. Wszystkie wcześniejsze treści i moduły pozostają
w projekcie, w tym 1060 lekcji, katalog napraw, laboratoria FIX12–FIX14,
ścieżki nauki, materiały, konta i istniejące mechanizmy postępu.

NOWE MODUŁY FIX15

1. PCB / zasilanie
   - cztery prowadzone ścieżki: brak zasilania, brak POST, brak ładowania,
     problem portu USB;
   - pola na model urządzenia, Board ID, rewizję i źródło dokumentacji;
   - lista kroków, notatki i lokalny eksport raportu.

2. BIOS / UEFI
   - lokalne obliczanie SHA-256 wybranego pliku (limit 64 MiB);
   - wyszukiwanie wybranych znaczników struktury firmware;
   - porównywanie dwóch plików bajt po bajcie;
   - tworzenie kopii wybranego pliku.
   Moduł nie programuje kości, nie modyfikuje wsadów i nie wgrywa BIOS.

3. Odzyskiwanie danych
   - wybór lokalnego pliku obrazu .IMG/.RAW/.DD/.BIN/.ISO;
   - odczyt ograniczonego fragmentu nagłówka, sygnatur MBR/GPT i podstawowych
     wpisów partycji;
   - lokalny raport i hash badanego fragmentu.
   Moduł nie otwiera fizycznych dysków, nie wykonuje zapisu i nie odzyskuje
   zawartości plików. Pracuje na kopii/obrazie wskazanym przez użytkownika.

4. Analizator logów Windows
   - analiza lokalnych plików TXT/LOG/CSV do 8 MiB;
   - heurystyczne wykrywanie wybranych identyfikatorów zdarzeń i wzorców BSOD;
   - eksport podsumowania.
   To nie jest pełny parser EVTX ani automatyczny diagnozer całego Windows.

5. Porównywarka kompatybilności
   - porównanie ręcznie wprowadzonych parametrów podzespołów;
   - wskazanie pól niezgodnych lub niepodanych.
   Wynik nie jest automatycznym potwierdzeniem kompatybilności. Należy
   sprawdzić dokumentację producenta, datasheet, QVL, BIOS, TDP, zasilanie,
   footprint i pinout.

6. Sieć IPv4/CIDR
   - obliczanie adresu sieci, broadcastu, zakresu hostów i liczby adresów;
   - checklista diagnostyczna.
   Brak skanowania sieci, pingowania hostów lub zmiany konfiguracji routera.

7. Kontrola jakości po naprawie
   - 12-punktowa checklista;
   - lokalna historia kontroli i raport.

8. AI Serwisant 3.0
   - formularz porządkujący objaw, model, pomiary i hipotezy;
   - przygotowanie kontekstu do istniejącego Repair Master AI.
   Formularz nie wykonuje osobnego wywołania modelu i nie wymyśla napięć,
   pinoutów ani wartości pomiarowych.

9. Biblioteka dokumentacji
   - IndexedDB w przeglądarce: do 150 pozycji, do 20 MiB na plik;
   - dozwolone formaty: PDF, TXT, MD, CSV, PNG, JPG/JPEG, WEBP, DOCX, XLSX, ODS;
   - wyszukiwanie, pobieranie i usuwanie.
   Dokumenty są lokalne dla danej przeglądarki/profilu. Nie są wysyłane do
   chmury i nie są dołączane do kopii JSON metadanych FIX15 — należy je
   pobierać osobno, gdy potrzebna jest kopia poza przeglądarką.

10. Egzaminy specjalistyczne
    - 10 tematów po 4 pytania;
    - wyjaśnienia odpowiedzi, próg 75%, lokalna historia wyników.
    Wyniki są ćwiczeniem edukacyjnym, a nie akredytowanym certyfikatem.

DANE I BEZPIECZEŃSTWO

- Nowe rekordy FIX15 są zapisywane lokalnie w przeglądarce.
- Eksport/import FIX15 dotyczy metadanych i rekordów laboratoriów.
- Biblioteka dokumentów IndexedDB wymaga osobnej kopii plików.
- Wybrane pliki są analizowane lokalnie; moduły FIX15 nie wysyłają ich
  automatycznie do serwera.
- Nie ma dostępu do surowych urządzeń blokowych, programowania BIOS,
  aktywnego skanowania sieci ani sterowania przyrządami.
- Symulatory i checklisty są materiałem szkoleniowym. Dla rzeczywistej
  naprawy wymagane są dokumentacja właściwego modelu/revizji, odpowiednie
  narzędzia i procedury bezpieczeństwa.
- Zachowano edukacyjny charakter platformy; nie przywrócono publicznego
  formularza przyjmowania zleceń serwisowych.

JAK SPRAWDZIĆ PACZKĘ I ZOBACZYĆ NOWY INTERFEJS

1. Rozpakuj całe archiwum z zachowaniem folderów.
2. Uruchom WYKONAJ_TESTY_FIX15.cmd, aby wykonać kontrole offline.
3. Uruchom PODGLAD_LOKALNY_FIX15.cmd, aby otworzyć stronę pod adresem
   http://127.0.0.1:8765/ i zobaczyć nowy widok Laboratoria PRO.
4. Podgląd jest statyczny: logowanie, Pages Functions, API i backend AI
   nie są w nim uruchamiane. Nie zmienia on danych produkcyjnych.
5. Nie uruchamiaj URUCHOM_NAUKE_OD_A_DO_Z.cmd, jeżeli chcesz tylko
   przetestować paczkę — ten skrypt uruchamia proces publikacji/watcher.

WYNIKI KONTROLI W ŚRODOWISKU PRZYGOTOWANIA

- 19/19 skryptów testowych: PASS.
- 90 plików JavaScript: node --check bez błędów.
- 33 arkusze CSS: parsowanie PostCSS bez błędów.
- WEB_PUBLISH/index.html: 546 unikalnych identyfikatorów.
- 95 lokalnych odwołań HTML: brak brakujących plików.
- Integralność archiwum ZIP: sprawdzona po utworzeniu.

NIEPOTWIERDZONE / NIEWYKONANE

- Lokalny serwer statyczny i jego zabezpieczenia zostały przetestowane;
  pełny test interakcji E2E w przeglądarce Chromium nie został wykonany.
- Nie przeprowadzono testu z fizycznym sprzętem.
- Nie wykonano publikacji na Cloudflare Pages.
- Nie zmieniano produkcyjnej bazy D1 i nie wykonywano migracji.
- Nie potwierdzono działania zdalnych integracji AI w środowisku produkcyjnym.

Wersja: 6.4.0 FIX15
Build: 6.4.0-ultimate-service-academy-fix15-20261102
