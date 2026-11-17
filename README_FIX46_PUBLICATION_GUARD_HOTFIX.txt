NAUKA OD A DO Z — 6.8.0 FIX46
POPRAWKA WATCHERA I STRAŻNIKÓW PUBLIKACJI
========================================

CEL
---
FIX46 naprawia błąd z logu uruchomienia FIX45:
„FIX44: kontrakt funkcji i stylów niekompletny.”

PRZYCZYNA
---------
Lokalny AUTO_PUBLISH_WATCHER.js porównywał nazwy funkcji FIX44 z rozróżnieniem
wielkości liter. Runtime zawiera nazwę „3d electronics explorer”, podczas gdy
lista wymagała „3D Electronics Explorer”. OneClick i zdalny watcher miały już
porównanie niewrażliwe na wielkość liter. Lokalna kontrola była niespójna.

POPRAWKA
--------
1. Lokalny watcher tworzy fix44RuntimeLower = fix44Runtime.toLowerCase().
2. Wszystkie wymagane etykiety są porównywane po normalizacji.
3. Pięć wymaganych selektorów CSS nadal musi występować dokładnie.
4. HTML, widok, zasoby JavaScript/CSS, manifest i cache PWA nadal są wymagane.
5. Kontrola zdalna nadal sprawdza zawartość zasobów po pobraniu z Pages.
6. OneClick wymaga nowego testu regresji przed dopuszczeniem publikacji.
7. Cache PWA otrzymuje znacznik FIX46, zachowując historyczne zasoby.

NOWY TEST
----------
scripts/test-watcher-fix44-case-contract-fix46.mjs
Test potwierdza:
- obecność wszystkich wymaganych nazw funkcji po normalizacji;
- obecność wymaganych klas CSS i widoku FIX44;
- zgodność reguły lokalnej z kontrolą zdalną i OneClick;
- wymaganie testu przez watcher i OneClick;
- obecność nowego znacznika cache PWA FIX46.

URUCHOMIENIE W WINDOWS
----------------------
1. Rozpakuj archiwum FIX46 do osobnego katalogu.
2. Uruchom WYKONAJ_TESTY_FIX46.cmd.
3. Sprawdź, czy wszystkie testy i kontrola składni kończą się PASS.
4. Dopiero potem świadomie uruchom ONECLICK_AKADEMIA.cmd / publikator.

Wszystkie stare nazwy WYKONAJ_TESTY_FIX*.cmd są aliasami przekazującymi do
WYKONAJ_TESTY_FIX46.cmd. CHECK_KONTA_FIX*.cmd przekazują do CHECK_KONTA_FIX46.cmd.

WYNIKI W ŚRODOWISKU PRZYGOTOWAWCZYM
-----------------------------------
- Node.js: v22.16.0 w środowisku przygotowawczym.
- 193 pliki .js/.mjs/.cjs przeszły node --check.
- 70 skryptów test-*.js/test-*.mjs zakończyło się powodzeniem.
- Lokalny ONECLICK verifyWeb() przeszedł; build FIX46, 1060 lekcji i 12 kart
  diagnostycznych zostały potwierdzone.
- Nie wykonano testów E2E w prawdziwej przeglądarce Windows użytkownika.

WAŻNE — PRODUKCJA
-----------------
FIX46 nie został opublikowany. Nie uruchomiono Cloudflare Wrangler, migracji D1,
ani zmian sekretów. Klucz OpenAI i istniejący binding D1 pozostają bez zmian.
Publikator ONECLICK_AKADEMIA.js może wykonać backup/migracje i wdrożenie, dlatego
należy uruchamiać go dopiero po sprawdzeniu kopii oraz właściwego konta Pages.
