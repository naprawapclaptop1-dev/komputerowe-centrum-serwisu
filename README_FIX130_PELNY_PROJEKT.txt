NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX130
NAPRAWA FAŁSZYWEGO BLOKOWANIA PUBLIKACJI ZDJĘĆ

FIX130 naprawia błąd z logu 13.11.2026: deployment na Cloudflare był przesyłany, a remotePhotoCatalogValid osiągał true, ale końcowy gate zatrzymywał publikację przez sitewideNoPeopleVisuals. Watcher sprawdzał filtry metadanych w złym pliku.

CO ZMIENIONO
1. Weryfikacja znaczników hasHumanSubjectMetadata i NO_HUMAN_SUBJECT_RE jest wykonywana na rzeczywistym assets/photo-catalog-fix115.js.
2. Watcher pobiera skrypt z cache-bustingiem i raportuje oddzielnie status HTTP, brakujące znaczniki oraz wynik kontraktu.
3. Niespełnienie kontraktu nadal blokuje wdrożenie.
4. Zachowano 19 unikalnych zdjęć sprzętu, filtr bez osób/dłoni i awaryjne SVG FIX129.
5. Zachowano istniejący projekt Cloudflare Pages, binding D1 oraz dane; FIX130 nie wymaga migracji.

URUCHOMIENIE
- Rozpakuj pełne archiwum do nowego folderu projektu.
- Uruchom WYKONAJ_TESTY_FIX130.cmd. Oczekiwany wynik: STATUS: PASS.
- Następnie uruchom istniejący start publikacji START_FIX105.cmd / dotychczasowy bezpieczny start.
- Po publikacji oczekuj sitewideNoPeopleVisualsValid=true, photoPolicyFilterValid=true, photoPolicyFilterMissing=none, remotePhotoCatalogValid=true i remoteCurrentHotfixValid=true.

WERSJE
Produkt: 6.8.0. Publikator / poprawka bramki: FIX130. Runtime zdjęć: FIX129. Cache Service Workera bez zmian, ponieważ nie zmieniono zasobów klienta.
