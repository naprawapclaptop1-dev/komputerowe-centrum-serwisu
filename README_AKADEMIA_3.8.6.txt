NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.6 — JEDEN START BEZ PYTAŃ

CEL WYDANIA
Usunięto ręczne pytania o numer bazy D1 i potwierdzenie. Użytkownik nie musi już wpisywać numeru, słowa DODAJ AKADEMIE ani ponawiać wyboru. Program wykonuje całą ścieżkę samodzielnie, gdy istnieje jednoznaczna, wcześniej wskazana baza.

AUTOMATYCZNY WYBÓR D1
- W logu 3.8.5 użytkownik wskazał pozycję 1: naprawapc-orders, UUID 6ac0a922-639c-43ee-ba33-5da14c25a533.
- W tym wydaniu zapisano ten UUID jako preferowany cel konfiguracji i potwierdza się go ponownie na liście baz zalogowanego konta.
- Program dodatkowo sprawdza schemat: baza musi zawierać spójny zestaw tabel modułu nauki (learning_accounts, learning_catalog oraz co najmniej cztery rozpoznane tabele learning_*), albo jednoznaczny schemat academy_*.
- Jeśli preferowany UUID nie jest dostępny, automat wybiera wyłącznie jedną bazę z silnym, unikalnym schematem. Gdy kandydatów jest kilka albo żaden nie spełnia kryteriów, program zatrzymuje się z raportem — nie pyta o ręczny wybór i nie wybiera losowo.
- Jeżeli produkcyjny binding DB już istnieje, ma pierwszeństwo jego UUID. Konflikt UUID zatrzymuje proces.

AUTOMATYCZNA OCHRONA DANYCH
- Przed migracją wykonywany jest pełny eksport istniejącej bazy D1 do BACKUPS_D1\<nazwa>_<data>.sql. Jeśli eksport się nie powiedzie lub plik będzie niekompletny, migracje nie ruszą.
- Lokalny wrangler.toml/json/jsonc jest kopiowany do pliku .bak przed zmianą bindingu.
- Dodawany jest binding DB do już istniejącej bazy. Nie jest tworzona nowa baza ani nowy projekt Pages.
- Migracje tworzą tabele academy_*; istniejące learning_*, orders, users i pozostałe tabele nie są usuwane. Wrangler rejestruje migracje i wykonuje własną kopię przy apply.
- Przed migracją wykonywana jest kontrola WEB_PUBLISH i Pages Functions.

JEDEN START
1. Zatrzymaj poprzedni proces obserwatora klawiszami Ctrl+C.
2. Rozpakuj łatkę 3.8.6 do G:\AKADEMIA_SERWISU_PRO, zastępując wskazane pliki, albo użyj pełnej paczki.
3. Uruchom tylko URUCHOM_AKADEMIE.cmd. Nie pojawią się pytania o wybór bazy ani potwierdzenie.
4. Pozostaw okno otwarte — po migracji i publikacji uruchomi się AUTO-WATCH.

Jeżeli brak pewnego celu, błędne konto, konflikt UUID, nieudany backup albo niespójna konfiguracja, program zatrzyma się automatycznie i poda przyczynę. To celowa blokada ochronna, a nie prośba o ręczne klikanie.

PROJEKT
Pages: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź produkcyjna: main
Stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev
Punkt startowy: URUCHOM_AKADEMIE.cmd
