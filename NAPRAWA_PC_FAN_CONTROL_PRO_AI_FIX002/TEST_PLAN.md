# TEST PLAN — FIX005
## CI Windows x64
1. Dotnet restore projektu.
2. Publikacja Release / win-x64 / self-contained.
3. Potwierdzenie obecności artifacts/NaprawaPCFanControl/NaprawaPCFanControl.exe.
4. Kompilacja INSTALLER.iss przez Inno Setup 6.
5. Potwierdzenie Setup.exe w artifacts/installer.
6. Utworzenie i sprawdzenie archiwum portable ZIP.
7. Publikacja obu artefaktów jako jednego wydania FIX005.
## Testy Windows 10/11
1. Uruchomić aplikację z uprawnieniami administratora.
2. Potwierdzić odświeżanie sensorów przez 10 minut.
3. Sprawdzić dane CPU, płyty, BIOS, RAM, GPU, dysków i EDID.
4. Zapisać raport TXT i ponownie odczytać.
5. Zainstalować Setup.exe, uruchomić skrót i odinstalować program.
6. Uruchomić wersję portable z rozpakowanego ZIP.
## Testy fizycznego sterowania
1. Potwierdzić listę kanałów IControl.
2. Testować pojedynczy kanał i zachować bezpieczne wartości.
3. Sprawdzić profile Cichy, Zrównoważony i Wydajny.
4. Zamknąć program i potwierdzić powrót do ustawień domyślnych.
CI nie potwierdza pracy wentylatorów na nieznanym komputerze. Do tego wymagany jest test fizycznego sprzętu.
