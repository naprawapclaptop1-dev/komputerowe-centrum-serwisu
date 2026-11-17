NAUKA OD A DO Z 6.8.0 — FIX37
NAPRAWA STAREGO KONTRAKTU TESTU WYDANIA 6.2.0
============================================================

PRZYCZYNA
W lokalnym folderze Windows pozostal starszy plik:
  scripts\test-release-620-contract.js
Nie bylo go w archiwum FIX36, wiec rozpakowanie projektu bez usuwania starych plikow nie nadpisalo go. Runner uruchamia wszystkie pliki scripts\test-*.js. Stary test nadal wymagal, aby caly release mial numer 6.2.0, przez co przerywal testy platformy 6.8.0.

NAPRAWA
1. FIX37 dodaje plik scripts\test-release-620-contract.js o tej samej nazwie.
2. Nowy test wymaga release 6.8.0 i identyfikatora buildu FIX37.
3. Jednoczesnie sprawdza, ze historyczne zasoby ultimate-workshop-620.js/css oraz Learning Studio 620 pozostaly w projekcie i Service Workerze.
4. Aktualny identyfikator wydania jest zgodny w release.json, index.html, funkcji statusu kont, OneClick, watcherze i cache PWA.
5. Dodano test zgodnosci calego kontraktu oraz zaktualizowano test-release-630-contract.js.
6. WYKONAJ_TESTY_FIX36.cmd zostal zachowany jako skrot przekierowujacy do WYKONAJ_TESTY_FIX37.cmd. Analogicznie stary skrot CHECK_KONTA_FIX36.cmd prowadzi do FIX37.

INSTALACJA
1. Wykonaj kopie folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj cale archiwum FIX37 do G:\AKADEMIA_SERWISU_PRO.
3. Potwierdz nadpisanie plikow, w szczegolnosci scripts\test-release-620-contract.js oraz WYKONAJ_TESTY_FIX36.cmd.
4. Uruchom WYKONAJ_TESTY_FIX37.cmd.
5. Po PASS mozna uruchomic URUCHOM_AKADEMIE.cmd. CHECK_KONTA_FIX37.cmd wykonuj po publikacji, gdy publiczny status API bedzie juz zgodny z FIX37.

WERYFIKACJA
56/56 skryptow testowych PASS (27 JS + 29 MJS).
Lokalne ONECLICK verifyWeb() PASS — 1060 lekcji, 12 kart diagnostycznych.
167 plikow JS/MJS/CJS bez bledow skladni.
40 arkuszy CSS bez bledow parsera.
704 unikalne ID HTML; 128 lokalnych odwolan, 0 brakow.
Porownanie FIX36 -> FIX37: 0 usunietych plikow, 5 nowych plikow projektu/testow.

OGRANICZENIA
Testy wykonano w srodowisku przygotowawczym Node.js 22.16.0. Log uzytkownika wskazuje Node.js 24.19.0, ale ta wersja nie byla dostepna w srodowisku przygotowawczym i nie byla tutaj uruchomiona.
Nie wykonano publikacji Cloudflare, migracji produkcyjnej D1 ani zmian w sekretach. Zachowano dotychczasowy projekt Pages i binding D1.
