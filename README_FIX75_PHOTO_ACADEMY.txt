NAUKA OD A DO Z — FIX75 / GLOBAL ACADEMY PRO

CO ZMIENIONO
1. Wszystkie 13 kafelków głównej Akademii ma własny lokalny obraz JPG: 12 fotografii warsztatowych i 1 fotorealistyczną wizualizację AI oznaczoną w interfejsie.
2. Dodano sześć ścieżek specjalistycznych, które otwierają istniejące sekcje platformy.
3. W Visual Academy można kliknąć zdjęcie, aby otworzyć je w powiększeniu; dostępne są poprzednie/następne, Escape, strzałki i przycisk zamknięcia.
4. Offline i Service Worker obejmują nowe zasoby FIX75 oraz zdjęcia kafelków.

JAK URUCHOMIĆ
- Rozpakuj pełny ZIP do nowego folderu albo skopiuj pliki projektu, zachowując swój istniejący wrangler.toml, katalog TOOLS_CLOUDFLARE, BACKUPS_D1 i lokalne dane uwierzytelnienia.
- Uruchom WYKONAJ_TESTY_FIX75.cmd.
- Po poprawnych testach uruchom PODGLAD_FIX75.cmd i sprawdź stronę główną oraz Visual Academy.
- Publikację wykonuj dopiero po przejściu bramki Cloudflare i sprawdzeniu gałęzi produkcyjnej.

WERSJA I DANE
- Wersja produktu pozostaje 6.8.0; FIX75 jest numerem poprawki.
- Nie zmieniono D1, nie wykonano SQL, nie zmieniono OPENAI_API_KEY i nie wykonano wdrożenia.
- Nowe zdjęcie znajduje się w WEB_PUBLISH/media. Wszystkie fotografie są lokalne i pakowane razem ze stroną.

UWAGA
Ścieżki specjalistyczne kierują do już istniejących modułów. Nie tworzą fikcyjnych stron ani automatycznych napraw sprzętu.

AKTUALIZACJA FIX76 (2026-11-06)
Jeżeli OneClick zatrzyma publikację komunikatem FIX39 dotyczącym 22 niepowtarzalnych obrazów, użyj pełnej paczki FIX76 i uruchom WYKONAJ_TESTY_FIX76.cmd. Poprawka zachowuje 22 sloty zdjęciowe, sprawdza osobno 6 unikalnych slajdów i 13 unikalnych zdjęć kafelków oraz nie wyłącza pozostałych kontroli publikacji.
