NAUKA OD A DO Z — DLA WSZYSTKICH
INSTALACJA FIX123 — GLOBALNE ILUSTRACJE TECHNICZNE

1. Zamknij START_FIX105 / OneClick / Watcher, jeżeli działają.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj FIX123_PATCH bezpośrednio do G:\AKADEMIA_SERWISU_PRO z zachowaniem struktury katalogów i nadpisaniem plików projektu.
4. Nie usuwaj i nie nadpisuj lokalnych .env, .dev.vars, wrangler.toml, NODE_EXE.path, NODE_EXE.version, BACKUPS_D1 ani kopii D1.
5. Uruchom WYKONAJ_TESTY_FIX123.cmd. Oczekiwany wynik jest zapisany na końcu okna oraz w RAPORT_FIX123_TESTY.log.
6. Dopiero po pełnym PASS uruchom dotychczasowy START_FIX105.cmd, aby wykonać normalną procedurę publikacji.
7. Po wdrożeniu otwórz stronę w nowej karcie / wymuś odświeżenie. Service Worker FIX123 wyczyści wyłącznie stare cache fotografii i aktywuje nowy cache techniczny.

WAŻNE
- Prawidłowa nazwa strony: NAUKA OD A DO Z — DLA WSZYSTKICH.
- Produkt pozostaje w wersji 6.8.0; poprawka to FIX123.
- W żadnym widoku nie powinny pojawiać się fotografie ludzi ani dłoni. Obrazy zewnętrzne są blokowane i zastępowane lokalnymi ilustracjami technicznymi.
- FIX123 nie publikuje samodzielnie. Nie wykonuje migracji D1 i nie zmienia sekretów ani danych kont.
