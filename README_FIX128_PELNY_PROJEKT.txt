NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX128
PEŁNY PROJEKT ZIP

INSTALACJA
1. Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj całe archiwum bezpośrednio do G:\AKADEMIA_SERWISU_PRO. ZIP zawiera pliki od razu w katalogu głównym, bez dodatkowego folderu nadrzędnego.
3. Nie nadpisuj lokalnych sekretów i konfiguracji komputera: wrangler.toml, .env, .dev.vars, tokenów, profili Wrangler ani BACKUPS_D1. Zachowaj je z istniejącego folderu.
4. Uruchom WYKONAJ_TESTY_FIX128.cmd.
5. Po pozytywnym wyniku uruchom dotychczasowy START_FIX105.cmd.
6. Sprawdź log LOGI\START_FIX105.log. Jeżeli publikator zatrzyma się, prześlij cały nowy log.

CO NAPRAWIA FIX128
FIX127 przeszedł lokalny preflight, ale zdalny Watcher odrzucał stronę, ponieważ nadal oczekiwał historycznych 13 zdjęć FIX77 w układzie strony głównej. Aktualny projekt FIX122/FIX123 używa 36 lokalnych ilustracji SVG bez osób i dłoni, a źródła fotografii zewnętrznych są zablokowane. To była niezgodność historycznego warunku walidacji, nie brak sześciu modułów.

FIX128 aktualizuje zdalny kontrakt Watchera: sprawdza 19 modułów, 6 rozszerzeń i 203 unikalne ilustracje lekcji, a dla strony głównej weryfikuje 36 unikalnych lokalnych SVG wraz z blokadą katalogu zdjęć. Globalny manifest musi potwierdzać peopleVisible=false, handsVisible=false, wyłączone źródła fotografii i wyłączony cache fotografii. OneClick i Watcher wymagają nowego testu kontraktu FIX128.

WYNIKI LOKALNE
- Testy regresyjne FIX128: 29/29 PASS.
- Unikalne skrypty preflight OneClick/Watcher: 64/64 PASS.
- Testy po poprawkach nagłówka Watchera i publicationGuard: PASS.
- Składnia ONECLICK_AKADEMIA.js i AUTO_PUBLISH_WATCHER.js: PASS.

ZACHOWANO
- Nazwę NAUKA OD A DO Z — DLA WSZYSTKICH i produkt 6.8.0.
- Istniejący projekt Cloudflare Pages, konto i binding D1.
- Sekrety, lokalny profil Wrangler, konfigurację komputera i kopie BACKUPS_D1 (nie są częścią archiwum).
- Wszystkie kursy, 19 modułów, 6 rozszerzeń, symulatory, konta, postęp nauki i filmy.
- Cache Service Workera FIX127, ponieważ FIX128 zmienia walidację publikacji i metadane wydania, ale nie zmienia zasobów wykonywanych w przeglądarce.

BEZPIECZEŃSTWO I WDROŻENIE
FIX128 nie tworzy nowej bazy D1 i nie dodaje migracji SQL. Nie zmienia sekretów OpenAI/Cloudflare ani ustawień konta. Lokalny preflight nie jest potwierdzeniem wdrożenia produkcyjnego. Produkcję uruchom dotychczasowym START_FIX105.cmd dopiero po testach lokalnych.
