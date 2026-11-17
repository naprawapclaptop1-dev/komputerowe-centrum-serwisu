NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.4
JEDEN START — UZUPEŁNIENIE BRAKUJĄCEGO BINDINGU D1 W PAGES

DLACZEGO 3.8.3 SIĘ ZATRZYMAŁA
Log z 31.10.2026 potwierdził, że istniejący projekt Pages nie ma produkcyjnego bindingu D1 o nazwie DB. Żadna z czterech dostępnych baz nie miała rozpoznanych tabel Akademii. To nie jest błąd składni ani logowania — w konfiguracji produkcyjnej Pages brakuje połączenia DB.

CO ROBI 3.8.4
1. Sprawdza konto Cloudflare i istniejący projekt Pages.
2. Odczytuje binding DB w produkcji i istniejące UUID D1.
3. Jeżeli bindingu DB rzeczywiście brak, odczytuje listę tabel każdej istniejącej bazy (tylko SELECT) i pokazuje listę nazw, UUID i tabel.
4. Prosi o numer wybranej bazy. Nie wybiera jej samodzielnie.
5. Pokazuje wybraną bazę i wymaga wpisania dokładnie: DODAJ AKADEMIE.
6. Po potwierdzeniu zapisuje kopię wrangler.toml/json/jsonc i ustawia binding DB na wybrane istniejące D1.
7. Wykonuje oczekujące migracje Akademii na wybranej bazie.
8. Kontroluje stronę i Functions, a następnie uruchamia obserwator. Pierwsze wdrożenie Wrangler przenosi binding do produkcyjnej konfiguracji Pages.

WAŻNE
- Z logu 3.8.3 znamy wyłącznie nazwy czterech baz: naprawapc-orders, naprawapc-db, naprawapc-tracking, serwis-chat. Nie ma dowodu, która jest przeznaczona dla Akademii. Dlatego 3.8.4 wyświetla rzeczywiste tabele i prosi o świadomy wybór.
- Migracje dodają tabele z prefiksem academy_ do wybranej istniejącej bazy. Nie kasują istniejących tabel. Nie wybieraj bazy, której nie chcesz współdzielić z Akademią.
- Jeśli żadna istniejąca baza nie jest przeznaczona dla Akademii, anuluj wybór. Wersja 3.8.4 nie tworzy nowej bazy.
- Po wybraniu bazy i wpisaniu DODAJ AKADEMIE zgadzasz się na dodanie tabel Akademii oraz skonfigurowanie jej jako binding DB produkcyjnego Pages.

AKTUALIZACJA
1. Zatrzymaj poprzedni obserwator klawiszami Ctrl+C.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj ZIP 3.8.4 do G:\AKADEMIA_SERWISU_PRO, scalając katalogi i zastępując pliki programu. Zachowaj WEB_PUBLISH, Biblioteka, TOOLS_CLOUDFLARE oraz obecny plik wrangler.toml.
4. Uruchom URUCHOM_AKADEMIE.cmd.
5. Gdy program pokaże listę baz, wybierz wyłącznie bazę przeznaczoną dla Akademii. Aby anulować, naciśnij Enter.
6. Po sprawdzeniu nazwy i ID wybranej bazy wpisz DODAJ AKADEMIE tylko wtedy, gdy potwierdzasz jej użycie.

Projekt: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź: main
Stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev
Punkt startowy: URUCHOM_AKADEMIE.cmd
