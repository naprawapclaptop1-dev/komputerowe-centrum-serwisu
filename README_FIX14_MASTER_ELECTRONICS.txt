NAUKA OD A DO Z 6.3.0 FIX14 — MASTER ELECTRONICS & REPAIR ACADEMY

CO ZAWIERA
Wersja zawiera wcześniejszą platformę i moduły FIX12/FIX13 oraz rozszerzenia FIX14.
Nowe elementy:
- trener lutowania SMD/THT z checklistą jakości,
- biblioteka kryteriów doboru dla 17 rodzin podzespołów,
- lokalny system XP i poziomów,
- eksport edukacyjnego schematu blokowego do SVG,
- aktualny numer wersji 6.3.0 w interfejsie,
- zasoby rozszerzenia dodane do pamięci PWA i kontroli publikacji.

URUCHOMIENIE TESTÓW LOKALNYCH
1. Rozpakuj całe archiwum do zwykłego folderu.
2. Zainstaluj Node.js LTS, jeśli nie jest dostępny.
3. Uruchom WYKONAJ_TESTY_FIX14.cmd.
4. Jeżeli którykolwiek test zgłosi błąd, nie publikuj wydania i zachowaj log.

Skrypt WYKONAJ_TESTY_FIX14.cmd wykonuje kontrolę składni i testy lokalne.
Nie publikuje strony, nie loguje się do Cloudflare i nie zmienia D1.

WAŻNE OGRANICZENIA
- Dane modułów Warsztatu Mistrza są przechowywane lokalnie w przeglądarce.
- Zachowano format kopii JSON FIX13 dla zgodności ze starszymi eksportami.
- XP i certyfikaty są lokalne i nie stanowią formalnych kwalifikacji.
- Symulator oscyloskopu/termowizji oraz trener lutowania są edukacyjne; nie sterują urządzeniami.
- Biblioteka zamienników podaje kryteria porównania, nie gwarantuje kompatybilności.
- Diagnostyka porządkuje informacje i nie zastępuje schematu, datasheetu ani pomiarów.
- Wydanie nie zostało opublikowane produkcyjnie. Baza D1 nie została zmieniona.
- Testy E2E w przeglądarce Chromium nie zostały potwierdzone.

Wydanie: 6.3.0
Build: 6.3.0-master-electronics-repair-academy-fix14-20261102
