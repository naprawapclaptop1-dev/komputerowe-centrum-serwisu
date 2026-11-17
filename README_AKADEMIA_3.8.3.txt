NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.3
JEDEN START — ODCZYT PRODUKCYJNEGO BINDINGU D1 PO ID

JAK AKTUALIZOWAĆ
1. Zatrzymaj poprzedni obserwator (Ctrl+C).
2. Rozpakuj tę paczkę do G:\AKADEMIA_SERWISU_PRO, scalając/zastępując pliki projektu.
3. Zachowaj istniejący katalog TOOLS_CLOUDFLARE — nie usuwaj lokalnego Wrangler ani jego node_modules.
4. Nie kasuj wrangler.toml, wrangler.json ani wrangler.jsonc.
5. Uruchom URUCHOM_AKADEMIE.cmd.

CO ZMIENIA 3.8.3
Wersja 3.8.2 sprawdzała tylko nazwy tabel academy_* w każdej bazie D1. Nie wystarczało to do wskazania bazy, którą projekt Pages ma naprawdę podłączoną.

Wersja 3.8.3 odczytuje ustawienia istniejącego projektu przez Cloudflare Pages API i bierze identyfikator z deployment_configs.production.d1_databases.DB.id. Potem porównuje go z UUID zwróconymi przez `wrangler d1 list --json`. Dopiero dokładnie dopasowana istniejąca baza może przejść do migracji.

Poświadczenie pobierane jest poleceniem `wrangler auth token --json`. Token pozostaje w pamięci procesu i nie trafia do logów. Uwierzytelnienie musi mieć uprawnienie Pages Read do odczytu konfiguracji projektu.

BEZPIECZEŃSTWO
- Nie tworzy nowego projektu Pages.
- Nie tworzy nowej bazy D1.
- Nie wybiera bazy na podstawie podobnej nazwy.
- Nie wykonuje migracji, jeśli ID projektu Pages i ID bazy D1 nie są zgodne.
- Jeśli produkcyjny binding DB nie istnieje, zatrzymuje się z jasnym komunikatem.
- Przed zmianą konfiguracji Wrangler wykonuje kopię .bak.
- Zmiany strony i Functions są publikowane do istniejącego projektu i gałęzi main.

PROJEKT
Pages: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź: main
Adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev

UWAGA
Testy lokalne sprawdzają składnię i logikę odczytu odpowiedzi API. Nie logują się na konto użytkownika i nie wykonują zdalnej migracji. Rzeczywisty wynik pojawi się w logu uruchomienia OneClick na Twoim komputerze.
