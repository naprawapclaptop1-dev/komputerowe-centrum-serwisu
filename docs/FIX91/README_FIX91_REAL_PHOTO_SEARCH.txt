NAUKA OD A DO Z — FIX91: KATALOG PRAWDZIWYCH FOTOGRAFII
Produkt: 6.8.0
Hotfix: FIX91
Data: 2026-11-07

CO NAPRAWIA FIX91
Poprzednie wyszukiwanie było zbyt restrykcyjne. Przykładowo Openverse dla frazy „computer motherboard repair” zwrócił tylko jeden wynik, podczas gdy szersze „motherboard” zwracało znacznie większy katalog. FIX91 korzysta z trzech szerszych fraz przypisanych do każdej kategorii i przechodzi po stronach wyników.

JAK DZIAŁA KATALOG
1. Zachowuje 12 istniejących źródeł startowych Pexels.
2. Przeszukuje Openverse: 3 warianty kategorii × maksymalnie 3 strony, po 20 pozycji na stronę.
3. Gdy trzeba, przeszukuje Wikimedia Commons: 3 warianty kategorii i maksymalnie 6 kolejnych stron bitmap.
4. Preferuje bezpośredni URL obrazu, przeprowadza próbę załadowania i dopiero wtedy przypisuje fotografię.
5. Zapisuje identyfikator zapytania, stronę i pozostałych kandydatów w localStorage, aby odświeżenie strony nie zaczynało pobierania od początku.
6. Każde zdjęcie może zostać przypisane tylko raz w obrębie przeglądarki. Autor, strona źródłowa i licencja są pokazywane przy fotografii.
7. Po odzyskaniu Internetu katalog wznawia pracę. Przycisk „Wznów pobieranie” ponawia nieudane lub wyczerpane kategorie.

VRAM A RAM
- VRAM: wymaga jawnych informacji o VRAM, GDDR, HBM, video memory, graphics memory albo GPU memory.
- Sam napis BGA lub generic memory chip nie kwalifikuje zdjęcia do VRAM.
- DIMM, SO-DIMM, SO-DIMM, UDIMM, system RAM i moduły pamięci są odrzucane jako VRAM.
- RAM jest odrębną kategorią i może używać fotografii modułów DIMM/SO-DIMM.
- Gdy nie ma wiarygodnego zdjęcia VRAM, pozostaje opisana ilustracja offline zamiast błędnego zdjęcia RAM.

WAŻNE O LICZBIE ZDJĘĆ
Archiwum nie zawiera 1836 pobranych fotografii. Zawiera runtime wyszukiwania, manifest 12 źródeł startowych i istniejące materiały projektu. Pozostałe zdjęcia są pobierane stopniowo przez przeglądarkę użytkownika z Openverse/Wikimedia Commons. Dostępność zależy od Internetu, wyników dostawców, licencji, limitów i dopasowania tematu. Nie należy przedstawiać SVG fallbacków jako fotografii.

URUCHOMIENIE
1. Rozpakuj pełny projekt FIX91 do osobnego katalogu.
2. Uruchom WYKONAJ_TESTY_FIX91.cmd.
3. Jeśli testy przejdą, uruchom URUCHOM_AKADEMIE.cmd.
4. Po zakończonej publikacji na stronie wykonaj Ctrl+F5.
5. Sprawdź pasek „Prawdziwe fotografie” i komunikat błędu dostawcy, jeśli wystąpi.
6. Kliknij „Wznów pobieranie”, jeśli przeglądarka była offline lub dostawca zwrócił limit.

PUBLIKACJA
OneClick i Auto-Watcher wymagają testów FIX91 przed Direct Upload do istniejącego projektu Pages. Produkcyjna komenda nie używa --branch ani --env Preview. Stały adres produkcyjny musi potwierdzić nowy runtime i manifest przed uznaniem wdrożenia za zakończone.

TESTY I OGRANICZENIA
- Testy pakietu uruchomiono w Node.js 22.16.0.
- Nie potwierdzono w tym środowisku uruchomienia testów na Node.js 24.19.0 użytkownika.
- Nie wykonano rzeczywistej publikacji Cloudflare z tego środowiska.
- Nie uruchomiono produkcyjnego pobrania setek zdjęć w przeglądarce; API sprawdzono punktowo, a paginację, parsery i kolejkę przetestowano lokalnie.
- Brak odpowiedniej lub legalnie dostępnej fotografii nadal powoduje jawnie oznaczony fallback techniczny.

DOKUMENTACJA DOSTAWCÓW
Openverse API: https://api.openverse.org/v1/
Wikimedia Commons Imageinfo: https://www.mediawiki.org/wiki/API:Imageinfo
