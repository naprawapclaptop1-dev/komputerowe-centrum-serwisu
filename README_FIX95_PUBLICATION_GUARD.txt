NAUKA OD A DO Z — FIX95

Uruchomienie pełnych testów:
1. Otwórz folder projektu.
2. Uruchom WYKONAJ_TESTY_FIX95.cmd albo polecenie: node scripts/run-tests-fix95.mjs
3. Publikację uruchamiaj dopiero, gdy wszystkie testy zakończą się statusem PASS.

Co naprawiono:
Poprzedni watcher szukał kluczy opisowych manifestu (strictPortEvidence, noGenericTopicFallback, category-specific) wewnątrz wykonywalnego pliku JS. Dane te znajdują się w photo-sources-online.json, więc zdalny katalog był odrzucany pomimo prawidłowych zasobów. Nowy kontrakt kontroluje manifest, JS, CSS, HTML, Service Worker i tag runtime oddzielnie.

Bezpieczeństwo:
- Nie dodano ani nie usunięto migracji D1.
- Nie zmieniono poświadczeń, sekretów ani wartości API.
- Nie zmieniono trybu Cloudflare Pages Direct Upload.
- Nie dodano parametru --branch. Dla projektu Direct Upload polecenie `wrangler pages deploy <folder>` bez `--branch` jest ścieżką produkcyjną; `--branch` kieruje do Preview.
- Lokalny test nie publikuje danych do Cloudflare.

Wersje:
- Produkt: 6.8.0 (bez zmiany).
- Hotfix publikatora: FIX95.
- Runtime katalogu zdjęć: FIX94 (bez zmiany).
