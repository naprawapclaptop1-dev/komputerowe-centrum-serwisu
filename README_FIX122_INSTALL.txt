NAUKA OD A DO Z 6.8.0 FIX122 — INSTRUKCJA

ZAKRES
FIX122 wymienia grafiki głównego widoku platformy na lokalne ilustracje techniczne. Nie dodaje żadnych fotografii ludzi. Na stronie głównej widoczne są wyłącznie ilustracje sprzętu komputerowego, podzespołów, elektroniki, narzędzi i schematów.

NAJBEZPIECZNIEJSZA INSTALACJA DO ISTNIEJĄCEGO PROJEKTU
1. Zamknij procesy publikacji i obserwatora, jeśli są uruchomione.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj paczkę FIX122 PATCH do G:\AKADEMIA_SERWISU_PRO i zezwól na nadpisanie plików.
4. Otwórz G:\AKADEMIA_SERWISU_PRO.
5. Uruchom WYKONAJ_TESTY_FIX122.cmd.
6. Sprawdź końcowy kod zakończenia 0 i raport RAPORT_FIX122_TESTY.log.
7. Dopiero po pozytywnych testach uruchom istniejący START_FIX105.cmd, aby rozpocząć normalny proces kontroli i publikacji.

WAŻNE
- Nie twórz nowego projektu Cloudflare Pages.
- Nie twórz nowej bazy D1.
- Nie zmieniaj identyfikatora istniejącej bazy ani bindingu DB.
- Nie wklejaj ponownie klucza OpenAI; istniejący sekret pozostaje bez zmian.
- Cache PWA zachowuje dotychczasową nazwę — nie wykonuj ręcznego czyszczenia cache przeglądarki.
- Katalog zdjęć pozostaje w projekcie dla innych widoków, ale nie może podmieniać grafik strony głównej. Blokada obejmuje wszystkie znaczniki IMG w #view-home, także nowe lub nieoznaczone; niezatwierdzony element dostaje lokalną ilustrację techniczną fallback.
- FIX122 nie został automatycznie opublikowany. Produkcyjne wdrożenie wykonuje dopiero istniejący proces START_FIX105 po Twoim uruchomieniu.

TESTY
WYKONAJ_TESTY_FIX122.cmd uruchamia testy polityki grafik, strony głównej, Watchera, OneClick, Service Workera, katalogu zdjęć i symulatorów elektroniki.
