# NAUKA OD A DO Z 6.8.0 FIX133 — bezpieczna naprawa pozostałego helpera Pages Functions

## Co wykryto

Log FIX132 zatrzymał publikację podczas pierwszego testu: `unsupported .mjs helper must be removed`. Przy aktualizacji przez rozpakowanie nowego ZIP-a na istniejący katalog Windows mógł zachować poprzedni `functions/_photo-proxy-fix131.mjs`, mimo że poprawny `functions/_photo-proxy-fix131.js` był już obecny. Samo archiwum FIX132 nie zawierało starego `.mjs`, ale katalog roboczy mógł go nadal mieć.

## Co robi FIX133

Przed testami publikacji uruchamiany jest `scripts/cleanup-pages-function-residue-fix133.mjs`. Przenosi wyłącznie znany, osierocony plik `functions/_photo-proxy-fix131.mjs` poza katalog Pages Functions, do:

`BACKUPS_FIX133/LEGACY_PAGES_FUNCTIONS/_photo-proxy-fix131.mjs`

Jeśli taka kopia już istnieje, wybierana jest kolejna nazwa z numerem. Plik nie jest kasowany — oryginalne bajty pozostają w kopii zapasowej.

Operacja jest dozwolona tylko wtedy, gdy:

1. istnieje `functions/_photo-proxy-fix131.js`;
2. istnieje `functions/media/photos/[id].js`;
3. trasa importuje dokładnie `../../_photo-proxy-fix131.js`;
4. katalog kopii znajduje się wewnątrz katalogu projektu i poza `functions/`.

Jeśli te warunki nie są spełnione, plik `.mjs` pozostaje nietknięty, a testy kończą się błędem. Inne niedozwolone rozszerzenia w `functions/` nadal zatrzymują publikację.

## Uruchomienie

Zalecane polecenie:

`WYKONAJ_TESTY_FIX133.cmd`

Stary launcher `WYKONAJ_TESTY_FIX132.cmd` pozostaje jako zgodnościowy i przekazuje do FIX133. OneClick i Watcher także korzystają z `scripts/run-tests-fix133.mjs`.

## Testy

`15/15` skryptów regresyjnych PASS. Nowy test sprawdza: przeniesienie starego pliku, zachowanie jego zawartości, idempotencję, odmowę działania przy braku nowego helpera oraz odmowę działania przy niewłaściwym imporcie.

## Zakres zmian

- Wersja produktu: `6.8.0` (bez podnoszenia).
- Numer poprawki: `FIX133`.
- Fotografowanie / proxy: zachowano FIX131, 19 przypisań i dotychczasową allowlistę.
- D1: brak migracji i zmian danych.
- Cloudflare: z tej sesji nie wykonano wdrożenia produkcyjnego.
