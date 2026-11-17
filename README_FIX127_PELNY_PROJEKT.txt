NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX127
PEŁNY PROJEKT ZIP

INSTALACJA
1. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Zamknij działający OneClick/Watcher.
3. Rozpakuj CAŁE archiwum FIX127 bezpośrednio do G:\AKADEMIA_SERWISU_PRO, zachowując strukturę folderów.
4. Zachowaj lokalne sekrety i konfigurację: wrangler.toml, .env, .dev.vars i lokalne tokeny nie powinny być nadpisywane wartościami z paczki.
5. Uruchom WYKONAJ_TESTY_FIX127.cmd.
6. Dopiero po PASS uruchom dotychczasowy START_FIX105.cmd.

CO NAPRAWIA FIX127
Test globalnej kontroli grafik nie zależy już od zewnętrznego polecenia sha256sum, którego Windows nie dostarcza domyślnie. Wszystkie 30 sum SHA-256 jest liczone w Node.js przez node:crypto. Nowy test jest częścią preflight OneClick oraz Watchera.

ZACHOWANIE KONFIGURACJI
Wersja produktu pozostaje 6.8.0. Zachowano nazwę NAUKA OD A DO Z — DLA WSZYSTKICH, projekt Pages, binding i bazę D1, migracje, konta, klucze i sekrety oraz lokalną konfigurację. Nie wykonywano zmian produkcyjnych.

TESTY WYKONANE PRZED WYDANIEM
- Regresja: 28/28 PASS.
- Preflight OneClick/Watcher: 63/63 unikalnych skryptów PASS.
- Kontrola SHA-256: 30/30 grafik zgodnych z manifestem.
- Kontrola składni Node.js: PASS.

To wydanie jest pełnym projektem ZIP, nie paczką PATCH.

TESTY WYKONANE PRZED WYDANIEM
- Regresja: 28/28 PASS.
- Preflight OneClick/Watcher: 63/63 unikalnych skryptów PASS.
- Kontrola SHA-256: 30/30 grafik zgodnych z manifestem.
- Kontrola składni Node.js: PASS.

To wydanie jest pełnym projektem ZIP, nie paczką PATCH.
