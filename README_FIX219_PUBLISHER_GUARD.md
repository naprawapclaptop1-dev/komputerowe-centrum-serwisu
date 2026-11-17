# FIX219 — naprawa fałszywego blokowania publikacji

## Przyczyna

Strażniki OneClick i Auto Publisher wyszukiwały dosłowny tekst `id: 'pc-050'`. W prawidłowym banku egzaminacyjnym identyfikator zapisano jako `id:'pc-050'` (bez spacji), więc poprawny bank był błędnie uznawany za niekompletny.

## Zmiana

Oba strażniki używają teraz wyrażenia regularnego tolerującego odstępy oraz raportują dokładną listę brakujących plików, zasobów, metadanych i kontraktów API. Nie osłabiono kontroli obecności banku egzaminacyjnego ani pozostałych modułów FIX210–FIX218.

## Test

Uruchom `TESTY_FIX219.cmd` albo `node scripts/run-tests-fix219.mjs`. Test regresyjny odczytuje rzeczywisty plik `functions/api/certificates.js`, a następnie sprawdza obydwa strażniki.

Produkt pozostaje w wersji 6.8.0. Nie zmieniono D1, sekretów, dostawców OAuth, konfiguracji ani cache PWA.
