NAPRAWA PC — AKADEMIA SERWISU PRO 3.8.5
JEDEN START — WYBÓR I POTWIERDZENIE ISTNIEJĄCEJ BAZY D1

CO ZMIENIONO W 3.8.5
W logu 3.8.4 użytkownik wybrał bazę numer 1, a na kolejne pytanie wpisał ponownie „1”. Poprzedni program wymagał dosłownego tekstu „DODAJ AKADEMIE” i kończył pracę po innej odpowiedzi. W 3.8.5 poprawiono ten krok:
- 1 = TAK, zgoda na dodanie tabel Akademii do wskazanej bazy;
- 0 = NIE, anulowanie bez migracji;
- można też wpisać DODAJ AKADEMIE;
- przy niezrozumiałej odpowiedzi program ponawia pytanie do 3 razy i nie traci wybranego numeru bazy.

PROGRAM NADAL DZIAŁA OSTROŻNIE
1. Sprawdza konto Cloudflare i istniejący Pages project.
2. Odczytuje binding Pages oraz listę istniejących D1.
3. Jeśli produkcyjnego DB bindingu brakuje, odczytuje nazwy tabel w istniejących bazach przez SELECT.
4. Użytkownik wybiera numer bazy.
5. Program pokazuje nazwę, UUID i istniejące tabele. Tabele learning_* są wypisane jako wskazówki, ale nie są traktowane jako automatyczny dowód własności bazy.
6. Użytkownik wpisuje 1, aby potwierdzić dodanie tabel Akademii, albo 0, aby anulować.
7. Po zgodzie program kopiuje konfigurację Wrangler, dopisuje binding DB do wybranej istniejącej bazy i wykonuje migracje.
8. Sprawdza WWW i Pages Functions, po czym przechodzi do publikacji i obserwatora.

WAŻNE
- W logu 3.8.4 wybrana została pozycja 1: naprawapc-orders, ID 6ac0a922-639c-43ee-ba33-5da14c25a533. Baza zawierała m.in. learning_accounts, learning_catalog, learning_entitlements, learning_memberships i learning_purchases. To wskazówki, że baza obsługuje funkcje nauki, ale decyzję o użyciu jej jako DB Akademii podejmuje użytkownik.
- W 3.8.5 samo wpisanie numeru wyboru nie uruchamia migracji. Po wyborze pojawi się oddzielny prompt „1 = TAK, 0 = NIE”. Wpisz 1 wyłącznie wtedy, gdy zgadzasz się dodać tabele academy_* do wskazanej bazy.
- 0 lub ENTER w promptach anulowania zatrzymuje pracę bez modyfikacji bazy.
- Nie powstaje nowy projekt Pages ani nowa baza D1.

AKTUALIZACJA
1. Zatrzymaj poprzedni obserwator klawiszami Ctrl+C.
2. Zrób kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj paczkę 3.8.5 do G:\AKADEMIA_SERWISU_PRO, scalając katalogi i zastępując pliki programu.
4. Zachowaj WEB_PUBLISH, TOOLS_CLOUDFLARE, migrations, seeds i dotychczasowy wrangler.toml.
5. Uruchom URUCHOM_AKADEMIE.cmd.
6. Wybierz bazę przeznaczoną dla Akademii. W kolejnym pytaniu wpisz 1 = TAK albo 0 = NIE.

Projekt: naprawa-pc-akademia-serwisu-pro
Konto: 4ddfc3803a4f0c4457ccae083f18b975
Gałąź: main
Stały adres: https://naprawa-pc-akademia-serwisu-pro.pages.dev
Punkt startowy: URUCHOM_AKADEMIE.cmd
