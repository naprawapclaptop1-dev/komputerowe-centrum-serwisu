NAUKA OD A DO Z 6.8.0 FIX28 — INSTRUKCJA

CEL
FIX28 porządkuje katalog lekcji i kończy audyt jakości Centrum Praktyki PRO. Wersja aplikacji pozostaje 6.8.0. Build: 6.8.0-social-login-fix28-quality-audit-20261103.

INSTALACJA LOKALNA
1. Rozpakuj całe archiwum do nowego folderu, np. G:\AKADEMIA_SERWISU_PRO_FIX28.
2. Nie mieszaj plików z FIX25, FIX26 lub FIX27.
2a. Każdy historyczny plik WYKONAJ_TESTY_FIX*.cmd przekierowuje teraz do aktualnego zestawu FIX28; utrzymywany runner to WYKONAJ_TESTY_FIX28.cmd.
2b. URUCHOM_NAUKE_OD_A_DO_Z.cmd jest aliasem URUCHOM_AKADEMIE.cmd — publikator ma jeden wspólny punkt startowy.
3. Uruchom WYKONAJ_TESTY_FIX28.cmd.
4. Jeżeli wszystkie testy przejdą, uruchom URUCHOM_AKADEMIE.cmd.
5. Publikator powinien użyć istniejącego projektu Pages i istniejącego bindingu D1. Przed każdą oczekującą migracją wykonuje eksport D1 do BACKUPS_D1. Jeżeli eksport jest pusty lub się nie powiedzie, dalsza migracja ma zostać przerwana.
6. Po publikacji uruchom CHECK_KONTA_FIX28.cmd. Ten test jest tylko negatywny: używa fikcyjnego adresu example.invalid, nie tworzy konta i oczekuje HTTP 401 dla błędnych danych.

WAŻNE
- FIX28 nie został opublikowany w tej sesji. Samo przejście testów lokalnych nie potwierdza działania publicznej strony.
- Nie wykonuj ręcznego usuwania ani przebudowy tabel kont. Migracje 0013–0015 są dodatkami zachowującymi stare tabele.
- Nie umieszczaj haseł, Client Secret, tokenów, kluczy API ani kodów 2FA w logu lub czacie.
- Nie przywracaj Google Drive, OneDrive ani Dropbox. W Akademii pozostaje lokalny eksport/import postępu i kopia D1 przed migracjami.

CO ZAWIERA CENTRUM PRAKTYKI
- PCB Repair Master Lab: 8 elementów PCB z opisami dydaktycznymi.
- Repair Challenge: 5 lokalnych przypadków diagnostycznych.
- Schematics Center: podgląd lokalnych PDF oraz PNG/JPEG/WEBP; brak parsera natywnych BoardView .brd/.fz.
- Virtual Electronics Bench: kalkulatory Ohma, dzielnika i RC; nie jest to pełny symulator SPICE i nie steruje przyrządami.
- AI Technician Mentor: tworzy kontekst do ręcznego wysłania w czacie AI.
- 6 ścieżek specjalistycznych, 36 lekcji, egzaminy, portfolio i lokalne Studio instruktora.

AUDYT KATALOGU
- 1060 lekcji po załadowaniu wszystkich 7 skryptów danych.
- 10 tytułów PL i 4 tytuły EN rozróżniono bez usuwania rekordów.
- 53 polskie sekwencje, 414 angielskich sekwencji, 200 bloków diagnozy i 200 bloków weryfikacji, które się powtarzały, otrzymały wersje dopasowane do tematu.
- Spersonalizowano również 3551 powtarzających się pojedynczych kroków PL i 1936 kroków EN, dodając nazwę lekcji i numer kroku.
- Wspólne ostrzeżenia BHP zostały zachowane, gdy opisują tę samą zasadę bezpieczeństwa.
- Tłumaczenie EN nie jest pełne: 709 z 1060 lekcji ma co najmniej cztery angielskie kroki; przy brakujących tłumaczeniach interfejs wraca do polskiej treści. To nie jest pełna lokalizacja wszystkich kursów.

WYNIKI KONTROLI
- 43/43 skryptów testowych PASS.
- 133 pliki JS/MJS/CJS bez błędów składni.
- 37 CSS bez błędów strukturalnych.
- 648 unikalnych ID HTML; 101 lokalnych zasobów, 0 brakujących.
- 175 nagłówków i 198 długich akapitów bez powtórzeń.

ŚRODOWISKO TESTOWE I OGRANICZENIA
Testy uruchomiono lokalnie w środowisku Node.js 22.16.0. Komputer użytkownika ma Node.js 24.19.0. Nie wykonano pełnego testu przeglądarkowego Windows ani publikacji Cloudflare. Po wdrożeniu należy sprawdzić stały adres produkcyjny i logowanie na własnym koncie.
