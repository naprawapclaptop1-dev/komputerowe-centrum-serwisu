NAUKA OD A DO Z — DLA WSZYSTKICH
FIX125 — INSTALACJA PEŁNEGO PROJEKTU
Produkt: 6.8.0
Aktywna poprawka: FIX125

WAŻNE
To jest kompletne archiwum projektu ZIP, nie patch. Rozpakuj całość, zachowując strukturę folderów. Nie kopiuj wyłącznie wybranych plików.

INSTALACJA
1. Zamknij uruchomione okna OneClick, Watchera i przeglądarkę projektu.
2. Zrób kopię obecnego katalogu `G:\AKADEMIA_SERWISU_PRO`.
3. Rozpakuj całe archiwum `NAUKA_OD_A_DO_Z_6_8_0_FIX125_PELNY_PROJEKT.zip` do katalogu projektu `G:\AKADEMIA_SERWISU_PRO`, zachowując strukturę katalogów i scalając foldery.
4. Zachowaj lokalne pliki konfiguracyjne i narzędziowe, jeśli występują na komputerze: `wrangler.toml`, `.env`, `.dev.vars`, `NODE_EXE.path`, `NODE_EXE.version`, `TOOLS_CLOUDFLARE` oraz kopie D1. Nie zastępuj sekretów wartościami z dokumentacji.
5. Uruchom `WYKONAJ_TESTY_FIX125.cmd`.
6. Wymagany wynik: `26/26` testów FIX125 PASS. Raport zostanie zapisany w `RAPORT_FIX125_TESTY.log`.
7. Po PASS uruchom dotychczasowy `START_FIX105.cmd`.

CO NAPRAWIA FIX125
- Wspólny adres cache filmu wsparcia FIX9 w HTML, OneClick, Watcherze, Service Workerze i release.json.
- Zachowana transkrypcja i opcjonalne polskie napisy, bez wymuszenia napisów domyślnie.
- Nowy cache PWA dla wydania FIX125.
- Aktualizacja przestarzałych testów do aktualnej polityki lokalnych ilustracji technicznych FIX122/FIX123.
- Prawidłowa nazwa produktu w konfiguratorze OpenAI i jego launcherze.

KONTROLA PUBLIKACJI
OneClick i Auto-Watcher mają teraz zgodny kontrakt zasobu. Zbiorczy lokalny test 61 skryptów preflight OneClick/Watchera zakończył się 61/61 PASS.

BEZPIECZEŃSTWO I ZACHOWANIE DANYCH
- Wersja produktu pozostaje 6.8.0.
- Projekt Cloudflare Pages i binding D1 pozostają istniejące.
- Nie dodano migracji D1, nie zmieniano schematu ani nie wykonywano migracji.
- Nie zmieniano sekretów OpenAI/Cloudflare ani kont.
- Nie uruchomiono publikacji produkcyjnej podczas przygotowania FIX125.

NAZWA PROJEKTU
W interfejsie i nowych komunikatach używana jest nazwa `NAUKA OD A DO Z — DLA WSZYSTKICH`. Ścieżka katalogu `G:\AKADEMIA_SERWISU_PRO` pozostaje zachowana dla zgodności dotychczasowych launcherów i konfiguracji.
