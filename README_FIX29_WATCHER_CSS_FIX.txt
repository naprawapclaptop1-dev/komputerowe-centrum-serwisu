NAUKA OD A DO Z 6.8.0 FIX29 — INSTRUKCJA

CO NAPRAWIA FIX29
Watcher pobierał arkusz CSS jako `practiceCssResponse`, lecz odwoływał się do nieistniejącej nazwy `remotePracticeCssResponse`. Poprawiono nazwę zmiennej bez wyłączania kontroli CSS. Dodano także jawne raportowanie statusu HTTP stałego adresu przed dalszą walidacją zasobów.

URUCHOMIENIE
1. Rozpakuj cały ZIP do nowego folderu, np. G:\AKADEMIA_SERWISU_PRO_FIX29.
2. Nie mieszaj plików z FIX28.
3. Uruchom `WYKONAJ_TESTY_FIX29.cmd`.
4. Jeżeli wszystkie testy przejdą, uruchom `URUCHOM_AKADEMIE.cmd`.
5. Po wdrożeniu sprawdź stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev
6. Uruchom `CHECK_KONTA_FIX29.cmd`. Test jest wyłącznie negatywny: używa adresu example.invalid, nie tworzy konta i oczekuje HTTP 401.

WAŻNE
- Samo „Deployment complete” nie potwierdza, że stały alias serwuje nowy build. Watcher sprawdza build, odpowiedź HTTP i zasoby przed uznaniem wdrożenia.
- Jeżeli stały adres zwróci HTTP 500, watcher pokaże status HTTP zamiast mylącego błędu w walidacji CSS.
- FIX29 nie został opublikowany w tej sesji. Nie zmieniono produkcyjnej bazy D1 i nie dodano migracji.
- Nie usuwaj ani nie przebudowuj ręcznie tabel kont.
