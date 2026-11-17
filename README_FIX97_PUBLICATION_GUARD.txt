NAUKA OD A DO Z — FIX97

CO BYŁO NIE TAK?
Publikator nadal wymagał 13 zdjęć przypisanych do samych kafelków modułów.
Po układzie FIX96 fotografie są rozłożone między trzy obszary:
- 3 zdjęcia w górnym banerze,
- 6 zdjęć w pokazie slajdów,
- 4 zdjęcia w wybranych kafelkach modułów.
Łącznie nadal jest 13 różnych fotografii.

CO POPRAWIA FIX97?
- OneClick rozpoznaje rzeczywisty układ 3 + 6 + 4.
- Sprawdza 19 kafelków oraz 6 modułów z ilustracjami technicznymi.
- Sprawdza istnienie lokalnych plików i dokładne SHA-256.
- Oblicza globalny dystans pHash i blokuje zdjęcia zbyt podobne.
- Auto-Watcher potwierdza ten sam rozkład w zdalnej stronie po wdrożeniu.
- PWA dostaje nowy cache FIX97.

JAK SPRAWDZIĆ?
Uruchom WYKONAJ_TESTY_FIX97.cmd albo w katalogu projektu wykonaj:
node scripts/run-tests-fix97.mjs

Wynik oczekiwany: 169/169 PASS.

PO PUBLIKACJI
Uruchom zwykły OneClick z tego archiwum. Proces nie powinien już zatrzymać się
na komunikacie FIX77 o 13 zdjęciach przypisanych do modułów. Przed deployem
nadal wykonuje pozostałe kontrole. Nie pomijaj kopii D1 ani etapów Watchera.

Wersja produktu: 6.8.0
Publikator: FIX97
Runtime katalogu fotografii: FIX96
