NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.2
JEDEN START — OBSŁUGA WRANGLER TOML / JSON / JSONC

INSTALACJA
1. Zatrzymaj stary obserwator Ctrl+C.
2. Rozpakuj pełny ZIP do katalogu projektu, zachowując TOOLS_CLOUDFLARE.
3. Zachowaj wygenerowany przez Wrangler plik wrangler.toml. Nie usuwaj go.
4. Uruchom wyłącznie URUCHOM_AKADEMIE.cmd.

CO NAPRAWIONO
Wrangler `pages download config` może zapisać istniejące ustawienia jako wrangler.toml. Wersja 3.8.0 błędnie szukała tylko wrangler.jsonc. Wersja 3.8.2 rozpoznaje wrangler.toml, wrangler.json i wrangler.jsonc, odczytuje istniejące ustawienia, zapisuje kopię przed modyfikacją i uzupełnia tylko wymagane pola.

BEZPIECZEŃSTWO
- Nie tworzy nowego projektu Pages.
- Nie tworzy nowej bazy D1.
- Nie nadpisuje obcej konfiguracji.
- Nie wykonuje migracji, jeżeli nie potwierdzi istniejącej bazy.
- Jeśli istnieje kilka konkurencyjnych plików konfiguracji, przerywa i prosi o uporządkowanie ich zamiast zgadywać.
- Wdraża wyłącznie istniejący projekt Pages oraz pliki WWW i Functions.

KONFIGURACJA
Projekt: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź: main
Stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev


WAŻNE DLA TEGO KOMPUTERA
Poprzednie uruchomienie 3.8.0 zgłosiło: `Success! Your project settings have been downloaded to wrangler.toml`. To znaczy, że konfiguracja już istnieje. Nie usuwaj `wrangler.toml` i nie uruchamiaj ponownie pobierania. Wersja 3.8.2 odczyta ten plik bezpośrednio, zrobi jego kopię zapasową i zachowa pozostałe ustawienia.

Jeśli plik zawiera już binding D1 `DB`, wersja 3.8.2 sprawdza jego nazwę i ID względem listy Cloudflare. Jeżeli bindingu nie ma, dodaje go tylko po potwierdzeniu dokładnej istniejącej bazy na tym samym koncie. Brak potwierdzenia bazy oznacza bezpieczne zatrzymanie — bez tworzenia nowej.
