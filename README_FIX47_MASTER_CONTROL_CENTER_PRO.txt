# NAUKA OD A DO Z 6.8.0 FIX47 — MASTER CONTROL CENTER PRO

## Zakres wydania
FIX47 rozszerza FIX46 o osobny pulpit `Master Control Center` z dziesięcioma obszarami:
1. Pulpit zbiorczy.
2. Audyt jakości DOM, widoków, nawigacji, opisów kontrolek i zasobów.
3. Skrzynka opinii używająca istniejącego API administratora.
4. Projekty praktyczne z lokalną oceną postępu.
5. Wstępna kontrola kompatybilności socket/RAM/mocy PSU.
6. Lokalny, regułowy Learning Coach z odsyłaczami do istniejących modułów.
7. Lokalny rejestr zleceń bez pól danych osobowych klienta.
8. Plany nauki i grupy szkoleniowe z samą liczebnością (bez list uczniów).
9. Kontrola metadanych wydania i dostępności zasobów.
10. Production Guardian — eksportowalna checklista operatora.

## Uruchomienie i testy w Windows
1. Rozpakuj archiwum do nowego katalogu obok dotychczasowego projektu.
2. Nie usuwaj poprzedniego katalogu ani kopii D1.
3. Uruchom `WYKONAJ_TESTY_FIX47.cmd`.
4. Dopiero po lokalnym PASS przeanalizuj raport i zdecyduj o publikacji.
5. Publikację uruchamiaj świadomie z głównego publikatora; ten ZIP nie uruchamia deployu samoczynnie.

`CHECK_KONTA_FIX47.cmd` jest osobnym narzędziem diagnostycznym. Odpytuje produkcyjne API i wykonuje kontrolowaną negatywną próbę logowania na adresie `.invalid`; nie uruchamiaj go tylko po to, by sprawdzić lokalną składnię.

## Dane, prywatność i granice działania
- Nowe plany, grupy, zlecenia, wyniki projektów i logi QA zapisują się w `localStorage` tej przeglądarki.
- Jeśli przeglądarka blokuje `localStorage`, panel nadal się inicjalizuje, ale zapis nie będzie możliwy i pokaże komunikat.
- Grupy przechowują wyłącznie liczbę uczestników; nie przechowują nazwisk, e-maili ani kont uczniów.
- Zlecenia FIX47 nie mają pól na imię, telefon, adres ani hasła klienta.
- Token administratora skrzynki opinii pozostaje w pamięci strony; żądania korzystają z tego samego origin i istniejącego endpointu.
- Audyt zasobów jest ograniczonym sprawdzeniem DOM i żądań HEAD do plików tej samej witryny, a nie pełnym testem Playwright/E2E.
- Kalkulator kompatybilności jest wstępny: zgodność socketu i typu RAM nie gwarantuje zgodności konkretnej płyty/CPU/BIOS/QVL.
- Learning Coach korzysta z lokalnych reguł. Nie jest samodzielnym generatywnym modelem AI.
- Production Guardian eksportuje deklaracje operatora. Nie wykonuje kopii D1, migracji, wdrożenia ani rollbacku.
- FIX47 nie zapisuje firmware, nie modyfikuje fizycznych dysków i nie steruje zasilaczami ani innym sprzętem.

## Produkcja
W tym wydaniu nie wykonano publikacji Cloudflare Pages, migracji D1, mutacji sekretów ani rollbacku. `ONECLICK verifyWeb()` był uruchomiony lokalnie w teście kontraktowym i zakończył się PASS; nie jest to potwierdzenie wdrożenia produkcyjnego.
