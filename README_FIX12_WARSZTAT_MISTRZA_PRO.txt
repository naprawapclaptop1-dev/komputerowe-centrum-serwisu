NAUKA OD A DO Z 6.2.0 FIX12 — INSTRUKCJA

CO JEST W PACZCE
Pełny projekt w folderze nauka, wraz z dotychczasowymi funkcjami i nowym
modułem „Warsztat Mistrza PRO”. Nie kopiuj pojedynczych plików na starą
wersję. Rozpakuj całe archiwum do osobnego folderu i zachowaj poprzednie
archiwum jako kopię awaryjną.

JAK SPRAWDZIĆ PAKIET
1. W Windows 10/11 rozpakuj archiwum.
2. Otwórz folder nauka.
3. Uruchom WYKONAJ_TESTY_FIX12.cmd.
   Skrypt sprawdza składnię JavaScript i uruchamia 20 testów projektu.
   Nie publikuje strony, nie loguje się do Cloudflare i nie zmienia D1.
4. Po testach uruchom lokalnie stronę zgodnie z dotychczasową instrukcją
   URUCHOM_NAUKE_OD_A_DO_Z.cmd / URUCHOM_AKADEMIE.cmd.
5. W menu wybierz „Warsztat Mistrza PRO” (FIX12).

NOWY WARSZTAT
Atlas: 10 dziedzin / 30 procedur.
Symulator: 8 przypadków / 3 decyzje w każdym.
Egzaminy: 3 egzaminy / 8 pytań każdy / próg 80%.
Narzędzia: prawo Ohma, dzielnik napięcia, rezystory, moc, dekoder SMD/EIA-96.
Dokumentacja: wyszukiwarka symbolu układu, modelu lub Board ID.
Dziennik: przypadki serwisowe ze zdjęciem przed i po, przechowywane lokalnie.
Własne materiały: notatki i procedury zapisywane lokalnie.

KOPIA DANYCH
W zakładce Warsztat Mistrza PRO dostępny jest eksport/import kopii JSON.
Wpisy i zdjęcia dziennika są przechowywane w IndexedDB tej przeglądarki;
notatki, wyniki i postęp są w lokalnym magazynie przeglądarki. Eksportuj
kopię przed czyszczeniem danych przeglądarki lub zmianą urządzenia.

WAŻNE
Nie używaj przykładowych treści jako schematu konkretnego laptopa lub płyty.
Wartości pomiarów, napięcia, pinouty i pliki BIOS muszą być potwierdzone
w dokumentacji właściwego modelu i rewizji. Nieznane parametry oznaczają
wstrzymanie testu, a nie zgadywanie.

STATUS WYDANIA
Testy automatyczne projektu: raport w TEST_REPORT_6.2.0_FIX12_MASTER_WORKSHOP.txt.
Test w prawdziwej przeglądarce nie został potwierdzony w środowisku budowania.
Produkcja Cloudflare Pages nie została zmieniona przez przygotowanie tej paczki.
Baza D1 nie została zmieniona przez przygotowanie tej paczki.
