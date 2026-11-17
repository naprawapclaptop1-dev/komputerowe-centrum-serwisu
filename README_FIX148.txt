FIX148 — CENTRUM TECHNIKA PRO / 7 NOWYCH MODUŁÓW

WERSJA PRODUKTU: 6.8.0
AKTYWNY HOTFIX: FIX148
BAZA: NAUKA OD A DO Z FIX147 — zachowana, bez przebudowy od zera.

CO DODANO
- BOARDVIEW PRO (demonstracyjna plansza, wybór elementów i bezpieczne wskazówki).
- Symulator procesu serwisowego (5 scenariuszy krokowych).
- Rozszerzony PC Compatibility Master.
- Lokalna dokumentacja serwisowa, podgląd, eksport JSON i druk/PDF.
- Akademia nauczyciela — szkice własnych lekcji, bez automatycznej publikacji.
- Baza usterek PRO — 18 wpisów referencyjnych + własne notatki.
- Laboratorium lutowania — 7 kroków bezpieczeństwa i mini-sprawdzian.

GDZIE ZNALEŹĆ
Otwórz w Akademii: „Centrum Mistrza PRO”. Przewiń do sekcji „Centrum technika — narzędzia mistrzowskie PRO”. Wszystkie nowe funkcje są zakładkami w tym samym widoku.

DANE
Nowe rekordy, szkice, raporty i postępy są lokalne w przeglądarce. Każdy moduł udostępnia eksport JSON lub kopię zbiorczą. Nie dodano migracji D1 i nie zmieniono kont/OAuth.

URUCHOMIENIE I TESTY
1. Wykonaj kopię G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj cały ZIP FIX148 do folderu projektu zgodnie z dotychczasową procedurą aktualizacji.
3. Uruchom dotychczasowy START_FIX105.
4. Publikator wykona preflight scripts/run-tests-fix137.mjs, który zawiera test-fix148-master-technician-suite.mjs.
5. Dopiero po PASS może być kontynuowana publikacja na istniejącym Cloudflare Pages.

UWAGA
FIX148 nie jest wdrożeniem produkcyjnym. Nie tworzy nowego projektu Pages ani bazy D1. Testy wykonano lokalnie w Node.js v22.16.0; na komputerze użytkownika publikator powinien użyć wykrytego Node.js v26.13.0.
