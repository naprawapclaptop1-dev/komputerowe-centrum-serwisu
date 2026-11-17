NAUKA OD A DO Z — DLA WSZYSTKICH
INSTRUKCJA WYDANIA 6.8.0 / FIX162

CO TO JEST
FIX162 jest pełnym wydaniem projektu na bazie poprzedniej paczki FIX155. Rozszerza istniejące Centrum Technika / Akademię w widoku view-academypro. Nie tworzy drugiej strony, nowego projektu Cloudflare ani nowej bazy D1.

INSTALACJA W WINDOWS
1. Zrób kopię całego katalogu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj zawartość jednego archiwum FIX162 do G:\AKADEMIA_SERWISU_PRO, zachowując strukturę katalogów i zastępując starsze pliki.
3. Uruchom WYKONAJ_TESTY_FIX162.cmd. Skrypt zapisuje raport RAPORT_FIX162_TESTY.log.
4. Po pozytywnym wyniku uruchom dotychczasowy START_FIX105.
5. Po zakończeniu publikacji sprawdź LOGI\START_FIX105.log.
6. Gdy publikacja zakończy się błędem, zachowaj cały log i przekaż go do diagnostyki. Nie twórz nowego projektu Pages ani nowej bazy D1.

CO ZNAJDZIESZ W AKADEMII
- BoardView szkoleniowy z ośmioma blokami płyty i diagnozą na podstawie wybranego objawu.
- Multimetr i scenariusze elektroniki z przykładowymi, syntetycznymi wskazaniami.
- Konfigurator kompatybilności PC i orientacyjnego zapotrzebowania na moc.
- Ćwiczenia kolejności prac SMD, złącz i BGA.
- Nauczyciel AI korzystający z istniejącego /api/chat po stronie serwera.
- Klasy online: kod klasy, zadania, prace i oceny.
- Rejestr online wpisów ukończenia ćwiczenia i publiczne sprawdzanie numeru.
- Atlas części, wyszukiwarka, katalog odsyłaczy do istniejących materiałów, tygodniowe wyzwania i eksport postępów.

WAŻNE
- Nowe ćwiczenia BoardView, multimetr, kompatybilność i lutowanie są symulacjami edukacyjnymi. Nie mierzą komputera, nie odczytują BIOS-u ani nie sterują sprzętem.
- Nauczyciel AI wymaga dostępnego endpointu /api/chat oraz skonfigurowanego dostawcy. Klucz API nie może być umieszczany w HTML ani JavaScript przeglądarki.
- Klasy online i rejestracja wpisów wymagają zalogowanego konta, zgody synchronizacji i działającego bindingu DB do istniejącej D1.
- Wydruk jest potwierdzeniem ukończenia ćwiczenia platformy, a nie państwowym lub branżowym certyfikatem kwalifikacji. Publiczny rejestr potwierdza istnienie wpisu; wynik testu jest przekazany przez przeglądarkę.
- Katalog „Instrukcje wideo” jest katalogiem odsyłaczy/plakatów do istniejących lekcji. FIX162 nie dodaje nowych nagrań wideo.

ZACHOWANE KONFIGURACJE
- Produkt: 6.8.0; hotfix: FIX162.
- Projekt Pages: naprawa-pc-akademia-serwisu-pro.
- D1: istniejąca baza naprawapc-orders, binding DB.
- Lekcje: 1083; widoki: 35; wpisy biblioteki zdjęć: 19.
- Bez nowej bazy, tabel D1 i migracji.
- Cache zdjęć PWA FIX135 pozostaje odrębny i zachowany.

WERYFIKACJA
Pełny zestaw lokalny kończy się STATUS: PASS. Automatyczny Chromium smoke test w środowisku roboczym nie został zaliczony z powodu timeoutu. Produkcyjna publikacja Cloudflare pozostaje do wykonania z poziomu START_FIX105.
