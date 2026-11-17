NAUKA OD A DO Z — FIX80 — POKAZ SLIDES / GLOBALNA UNIKALNOŚĆ

Problem z logu z 6 listopada 2026:
AUTO_PUBLISH_WATCHER zatrzymywał się po kontroli D1 z komunikatem: „Slajd 1 nie ma źródła zdjęcia lub unikalnego data-photo-lock”. W aktualnym układzie FIX77 pokaz slajdów celowo używa sześciu różnych ilustracji SVG. Atrybut data-photo-lock służy fotografiom i nie powinien być wymagany od SVG.

Co zostało naprawione:
- Wspólny scripts/homepage-showcase-guard.js waliduje 6 unikalnych ilustracji SVG.
- Każdy slajd ma osobny plik assets/artwork-fix77/slide-NN.svg i identyfikator data-visual-unique="home-slide-NN".
- Kontrola sprawdza lokalną ścieżkę, istnienie pliku, podpis SVG i brak powtórzeń plików oraz identyfikatorów.
- Guard odrzuca zewnętrzne adresy, obrazy rastrowe, brakujące pliki, powtórzone źródła i powtórzone identyfikatory.
- SVG nie wymagają data-photo-lock; nie są traktowane jak fotografie.
- OneClick uruchamia tę samą kontrolę przed dalszym etapem, a AUTO_PUBLISH_WATCHER używa jej przy lokalnej walidacji.
- Stare testy FIX8 i FIX32 zostały zaktualizowane do obecnego kontraktu.
- Dodano niezależny test FIX80, pełny runner Node.js oraz plik WYKONAJ_TESTY_FIX80.cmd.

Polityka zdjęć zostaje bez zmian:
- 13 fotografii rastrowych pozostaje przypisanych pojedynczo do 13 kafelków.
- 6 slajdów korzysta z 6 oddzielnych ilustracji SVG.
- Kontrola FIX77 SHA-256/pHash nadal blokuje ponowne używanie i podobne zdjęcia.
- Ilustracje i zdjęcia nie są mieszane ani ponownie przypisywane między sekcjami.

Wersja produktu: 6.8.0 (bez podbijania wersji produktu dla hotfixu).
Uruchom WYKONAJ_TESTY_FIX80.cmd, a dopiero po pozytywnym wyniku OneClick.
Zachowaj własny wrangler.toml, poświadczenia Cloudflare oraz katalog BACKUPS_D1.
