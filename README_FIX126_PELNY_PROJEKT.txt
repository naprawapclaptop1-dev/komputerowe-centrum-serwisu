NAUKA OD A DO Z — DLA WSZYSTKICH
PEŁNY PROJEKT 6.8.0 — FIX126

INSTALACJA PEŁNEGO ARCHIWUM
1. Zrób kopię bezpieczeństwa folderu G:\AKADEMIA_SERWISU_PRO.
2. Zamknij działający OneClick/Watcher.
3. Rozpakuj całe archiwum bezpośrednio do G:\AKADEMIA_SERWISU_PRO. ZIP zawiera pliki projektu bez dodatkowego folderu nadrzędnego.
4. Zachowaj lokalne pliki konfiguracyjne i sekrety, w szczególności .env, .dev.vars, wrangler.toml oraz lokalne ustawienia narzędzi — nie zastępuj ich, jeżeli zawierają własne wartości.
5. Uruchom WYKONAJ_TESTY_FIX126.cmd i zaczekaj na STATUS: PASS.
6. Dopiero po pozytywnym wyniku uruchom dotychczasowy START_FIX105.cmd.

CO NAPRAWIA FIX126
W teście `scripts/test-sitewide-tech-visuals-fix123.mjs` wcześniejszy kod uruchamiał zewnętrzne narzędzie `ffprobe`. Na komputerze, na którym ffprobe nie znajduje się w PATH, `spawnSync` zwraca błąd uruchomienia, a stary test kończył się TypeError podczas przekazania niezdefiniowanego komunikatu do asercji.

FIX126 dodaje `scripts/mp4-metadata-reader-fix126.mjs`, który odczytuje tag tytułu MP4 bezpośrednio z atomów ISO-BMFF w Node.js. Nie wymaga ffprobe ani FFmpeg. Dodany test jednostkowy sprawdza rzeczywisty film, UTF-8, atomy 64-bitowe, brak znacznika i uszkodzone atomy. Test globalnych grafik nadal jest uruchamiany przez OneClick i Watchera — kontrola nie została pominięta.

ZAKRES ZACHOWANY
- Nazwa produktu: NAUKA OD A DO Z — DLA WSZYSTKICH.
- Wersja produktu: 6.8.0. Aktywny hotfix: FIX126.
- Film wsparcia, oryginalny dźwięk, VTT i transkrypcja pozostają na miejscu.
- Napisy polskie pozostają opcjonalne, bez atrybutu default.
- Globalna polityka ilustracji technicznych FIX123 pozostaje aktywna.
- Brak nowych migracji SQL/D1, zmian danych, bindingów, kont i sekretów.
- Zachowano istniejące nazwy oraz ścieżki plików projektu.

WYNIKI LOKALNE
- Zestaw regresyjny FIX126: 27/27 skryptów PASS.
- Dodatkowy preflight OneClick/Watcher: 62/62 unikalne skrypty PASS.
- Globalny test ilustracji technicznych: 10/10 PASS.
- Test parsera MP4: 4/4 PASS.
- Test kontraktu filmu FIX9: 9/9 PASS.
- Testy składni OneClick, Watchera i modułu MP4: PASS.

UWAGA
Testy lokalne nie są publikacją produkcyjną. Nie uruchamiano START_FIX105 ani nie wykonywano migracji D1. Po rozpakowaniu i uruchomieniu testów opublikuj przez dotychczasowy START_FIX105.cmd.
