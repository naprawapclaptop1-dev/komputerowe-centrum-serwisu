# FIX132 — zgodność Cloudflare Pages Functions

FIX131 uruchamiał lokalnie wszystkie 13 testów, ale OneClick/Watcher blokował publikację, ponieważ wspólny helper był zapisany jako `functions/_photo-proxy-fix131.mjs`. Katalog `functions/` przyjmuje tylko pliki `.js` i `.ts`.

## Poprawka
- Zmieniono helper na `functions/_photo-proxy-fix131.js`.
- Zaktualizowano import w `functions/media/photos/[id].js`.
- Zaktualizowano walidację w OneClick i Watcherze.
- Test Node importuje moduł jako `data:text/javascript`, więc nie wymaga zmiany typu modułu całego projektu.
- Dodano test, który skanuje wszystkie pliki w `functions/` i blokuje nieobsługiwane rozszerzenia.
- Zmieniono numer poprawki wydania na FIX132 i namespace głównego cache PWA, aby wymusić aktualizację. Dedykowany cache zdjęć `academy-photo-library-fix131` pozostaje zachowany.

Produkt pozostaje w wersji 6.8.0. Nie zmieniono schematu D1, kont, sekretów ani haseł.

## Uruchomienie
`WYKONAJ_TESTY_FIX132.cmd`

Dopiero po wyniku PASS uruchom `URUCHOM_NAUKE_OD_A_DO_Z.cmd`. Publikacja musi przejść końcową kontrolę stałej domeny i próbne żądania `/media/photos/{id}.jpg`; samo `Deployment complete` nie wystarcza.
