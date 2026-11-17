FIX116 — PIERWSZY RENDER FOTOGRAFII STRONY GŁÓWNEJ

Cel
Usunąć widoczne w zrzutach puste placeholdery w górnej siatce modułów i specjalizacji. Karty otrzymują swój dokładny, licencjonowany URL już podczas inicjalizacji strony, przed przetwarzaniem kolejki Openverse/Wikimedia.

Pliki
- WEB_PUBLISH/assets/homepage-photo-prime-fix116.js — czyta manifest i przypisuje 21 zdjęć do 21 slotów.
- WEB_PUBLISH/assets/homepage-photo-prime-fix116.css — ogranicza fotografię i podpis źródłowy do ramki karty.
- WEB_PUBLISH/assets/photo-catalog-fix115.js — czeka na bootstrap, odrzuca stare rezerwacje dla slotów strony głównej i rozpoznaje obraz już załadowany pod tym samym URL.
- WEB_PUBLISH/index.html — ładuje bootstrap przed silnikiem katalogu.
- WEB_PUBLISH/service-worker.js — cache CORE zawiera nowe pliki; nazwa cache pozostaje FIX109.

Bezpieczeństwo i zgodność
- 21 różnych seedId i URL, kategoria każdego źródła musi odpowiadać kategorią `data-photo-kind`.
- Wymagane HTTPS, strona źródłowa, autor i dozwolona licencja (Pexels License, Public Domain, CC0, CC BY, CC BY-SA).
- Brak dodatkowych zapytań do dostawców podczas bootstrapu.
- Oryginalna ilustracja SVG pozostaje w `data-photo-fix90-fallback`.
- Informacja o autorze, źródle i licencji jest widoczna i klikalna.
- Jeśli obraz online nie zadziała, silnik katalogu może przywrócić podpisany fallback.

Wdrożenie
Uruchom `WYKONAJ_TESTY_FIX116.cmd` (pełny zestaw preflight OneClick/Watcher); po PASS użyj istniejącego bezpiecznego startu publikacji. Nie twórz nowej bazy D1.

Publikacja produkcyjna nie jest wykonywana przez ten pakiet lokalny i musi zostać potwierdzona logiem z komputera użytkownika.
