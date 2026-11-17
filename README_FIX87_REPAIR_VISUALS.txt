NAUKA OD A DO Z — FIX87
Instrukcja kontroli i uruchomienia

WPROWADZONE POPRAWKI
- Karty usterek: zdjęcie/ilustracja ma pełną szerokość kontenera, proporcje 16:9 i nie jest ściskane do 92x58 px.
- Ilustracje SVG używają contain, aby nie ucinać rysunku technicznego.
- Fotografie zewnętrzne zachowują cover.
- Silnik FIX83 uruchamia się przed lesson-art.js i app.js.
- API uniqueVisualUrl jest zachowane podczas inicjalizacji ACADEMY_ART.
- Każda z 155 procedur ma osobny obraz karty oraz trzy inne ilustracje szczegółowe (620 unikalnych wizualizacji SVG w teście).
- VRAM przedstawia kości GDDR/BGA, a RAM moduły DIMM/SO-DIMM.

TESTY
1. Uruchom WYKONAJ_TESTY_FIX87.cmd.
2. Runner powinien zakończyć się wynikiem 84/84 PASS.
3. Testy zapisują szczegółowy wynik w FIX87_FULL_TESTS.log.

URUCHOMIENIE / PUBLIKACJA
- Po pozytywnej kontroli uruchom URUCHOM_AKADEMIE.cmd.
- W tej paczce nie wykonano produkcyjnej publikacji Cloudflare.
- Przed uznaniem publikacji za zakończoną należy sprawdzić, czy stały adres produkcyjny serwuje release FIX87, nowe CSS/JS i nowy Service Worker cache.
- Nie używać losowego deployment URL jako dowodu aktualizacji stałej domeny.

WAŻNE: ZDJĘCIA A ILUSTRACJE
Zrzut z 06.11.2026 pokazuje status pobierania fotografii: 9/155 usterek i 0/465 unikalnych zdjęć. Lokalny manifest foto-sources-online.json nadal ma photosPerRepair: 0. FIX87 zapewnia osobne ilustracje SVG offline i poprawia ich layout, ale NIE pobiera 465 prawdziwych fotografii. Do tego potrzebny jest osobny etap z pobieraniem, weryfikacją licencji/atrybucji i magazynowaniem obrazów.

BEZPIECZEŃSTWO I DANE
- Nie dodano migracji D1.
- Nie zmieniono istniejącej bazy D1 ani sekretu OPENAI_API_KEY.
- Nie wykonano deploymentu produkcyjnego w ramach przygotowania ZIP.
- Numer produktu pozostaje 6.8.0; poprawka to FIX87.

ŚRODOWISKO TESTOWE
Testy automatyczne w tej sesji: Node.js 22.16.0. Użytkownik raportował Node.js 24.19.0; końcowy test lokalny na jego komputerze pozostaje wymagany.
