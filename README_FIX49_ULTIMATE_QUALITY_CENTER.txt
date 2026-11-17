NAUKA OD A DO Z — DLA WSZYSTKICH
WYDANIE 6.8.0 FIX49 — ULTIMATE QUALITY & KNOWLEDGE CENTER
=======================================================

CEL WYDANIA
-----------
FIX49 rozbudowuje FIX48 o wspólne Centrum Jakości i Publikacji. Zmiana
zachowuje istniejące moduły nauki, warsztatu, kont, opinii, serwisu i Master
Control Center. Nowe centrum jest osobnym widokiem view-fix49.

NOWE OBSZARY
------------
1. Real Browser Testing PRO
   - statyczny smoke test DOM: duplikaty ID, cele nawigacji, etykiety pól,
     przyciski, linki i podstawowe kontrakty widoku;
   - kontrola zasobów WWW przez HEAD z bezpiecznym fallbackiem GET;
   - opcjonalny Playwright E2E dla rzeczywistej przeglądarki.

2. Universal Error Center
   - ograniczony lokalny dziennik błędów;
   - redakcja tokenów i query-stringów;
   - ograniczona liczba przechowywanych wpisów.

3. Release Pipeline MASTER
   - FIX49_RELEASE_MANIFEST.json jest wspólnym opisem wydania;
   - wspólny helper odczytuje Service Workera i CACHE_NAME;
   - OneClick i Auto-Publish Watcher używają tego samego kontraktu;
   - kontrola zasobów, wersji build, cache PWA, manifestów i testów.

4. Cloudflare Staging PRO
   - przygotowuje checklistę stagingu;
   - wymaga osobnej gałęzi, osobnej bazy D1 i osobnych sekretów preview;
   - nie tworzy środowiska ani nie wykonuje wdrożenia automatycznie.

5. Automatic Rollback PRO
   - przygotowuje plan powrotu do identyfikowanego wdrożenia;
   - domyślny zakres to kod aplikacji;
   - nie wykonuje automatycznego rollbacku Pages ani przywracania D1.

6. Database Migration Simulator
   - analizuje pliki SQL bez wykonywania poleceń;
   - oznacza operacje destrukcyjne i wymagające przeglądu;
   - przed migracją OneClick pobiera listę niezaaplikowanych migracji przez
     Wrangler i blokuje oczekujące migracje wysokiego ryzyka.

7. Security Audit PRO
   - skanuje wybrane pliki źródłowe i konfigurację pod kątem typowych wzorców
     ujawnionych sekretów;
   - raportuje regułę, plik i numer linii, ale nie wypisuje znalezionej wartości;
   - nie jest pełnym audytem penetracyjnym ani gwarancją braku podatności.

8. Diagnostic Bundle
   - eksportuje metadane wydania i odciski SHA-256 wybranych plików;
   - pomija wartości sekretów, dane logowania, treści formularzy i rekordy D1.

9. Repair Academy Multiplayer
   - przygotowuje lokalny kod pokoju ćwiczeń;
   - synchronizacja wielu użytkowników wymaga osobnego backendu i nie jest
     deklarowana jako działająca w tym wydaniu.

URUCHOMIENIE W WINDOWS
----------------------
1. Rozpakuj całe archiwum do nowego katalogu, np.:
   G:\AKADEMIA_SERWISU_PRO_FIX49
2. Nie nadpisuj starego folderu i nie kasuj istniejących kopii D1.
3. Uruchom WYKONAJ_TESTY_FIX49.cmd.
4. Przeczytaj cały wynik testów. Przy dowolnym błędzie nie publikuj.
5. Przed użyciem OneClick zweryfikuj na swoim komputerze środowisko Node.js,
   Wrangler, konto Cloudflare, właściwy projekt Pages i binding D1.
6. Jeśli planujesz publikację, dopiero po lokalnych testach uruchom główny
   publikator z tego samego katalogu.

WAŻNE DLA NODE.JS
-----------------
Testy w środowisku przygotowawczym wykonano na Node.js v22.16.0. W logu
użytkownika środowisko Windows używa Node.js v24.19.0. Przed publikacją
uruchom WYKONAJ_TESTY_FIX49.cmd właśnie na Node.js v24.19.0.

OGRANICZENIA I BEZPIECZEŃSTWO
-----------------------------
- Nie wykonano wdrożenia Cloudflare Pages.
- Nie połączono się z produkcyjną bazą D1 i nie wykonano migracji.
- Nie zmieniano sekretu OPENAI_API_KEY ani żadnych sekretów Cloudflare.
- Playwright nie jest zainstalowany w środowisku przygotowawczym; rzeczywiste
  E2E w przeglądarce nie zostało wykonane. Skrypt
  scripts/run-browser-e2e-fix49.mjs jest opcjonalny i jawnie kończy się SKIP,
  jeśli Playwright nie jest dostępny.
- Audyt bezpieczeństwa statycznego nie zastępuje audytu penetracyjnego.
- Symulator migracji analizuje SQL; nie uruchamia go.
- Dwie historyczne migracje OAuth: 0008_social_login_x_github.sql i
  0009_discord_social_login.sql są oznaczone do ręcznego przeglądu ze względu
  na RENAME/DROP. Nie oznacza to, że są oczekujące. Przy uruchomieniu OneClick
  lista rzeczywiście niezaaplikowanych migracji jest pobierana z D1.
- Jeśli któraś z tych migracji byłaby nadal oczekująca, strażnik wysokiego
  ryzyka zatrzyma proces przed kopią i wykonaniem migracji.
- Staging i rollback są planami/checklistami; nie wykonują operacji zdalnych.

PLIKI KONTROLNE
---------------
FIX49_RELEASE_MANIFEST.json
WEB_PUBLISH/release-contract-fix49.json
SECURITY_AUDIT_FIX49.json
MIGRATION_AUDIT_FIX49.json
DIAGNOSTIC_BUNDLE_FIX49.json
scripts/test-release-contract-fix49.mjs
scripts/test-ultimate-quality-fix49.mjs
scripts/test-pending-migration-guard-fix49.mjs
scripts/run-browser-e2e-fix49.mjs

Punkt wyjścia: 6.8.0 FIX49.
