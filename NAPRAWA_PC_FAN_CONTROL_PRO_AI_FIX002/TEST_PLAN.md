# TEST PLAN — FIX004
## CI
1. dotnet restore.
2. dotnet publish Release / win-x64 / self-contained.
3. Weryfikacja obecności pliku EXE w artefakcie CI.
## Testy Windows 10/11
1. Uruchomić aplikację z uprawnieniami administratora.
2. Potwierdzić odświeżanie sensorów przez 10 minut.
3. Sprawdzić dane CPU, płyty, BIOS, RAM, GPU, dysków i EDID.
4. Zapisać raport TXT i ponownie odczytać.
## Testy fizycznego sterowania
1. Potwierdzić listę kanałów IControl.
2. Testować pojedynczy kanał i zachować bezpieczne wartości.
3. Sprawdzić profile Cichy, Zrównoważony i Wydajny.
4. Zamknąć program i potwierdzić powrót do ustawień domyślnych.
CI nie potwierdza pracy wentylatorów na nieznanym komputerze. Do tego wymagany jest test fizycznego sprzętu.