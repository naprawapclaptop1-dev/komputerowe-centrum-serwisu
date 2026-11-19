# TEST PLAN — FIX006
## CI Windows x64
1. dotnet restore.
2. Publikacja Release / win-x64 / self-contained.
3. Potwierdzenie obecności NaprawaPCFanControl.exe.
4. Kompilacja Setup.exe przez Inno Setup.
5. Skopiowanie instalatora oraz wszystkich plików portable do jednego katalogu wydania.
6. Utworzenie jednego archiwum ZIP.
7. Rozpakowanie ZIP w CI do katalogu tymczasowego.
8. Potwierdzenie obecności Setup.exe i Portable/NaprawaPCFanControl.exe.
9. Potwierdzenie braku plików ZIP wewnątrz paczki.
10. Opublikowanie wyłącznie jednego artefaktu ZIP.

## Testy Windows 10/11
1. Rozpakować jedno archiwum.
2. Uruchomić Setup.exe i przeprowadzić instalację.
3. Uruchomić Portable/NaprawaPCFanControl.exe.
4. Sprawdzić raport TXT, monitoring i inwentaryzację.

## Testy fizycznego sterowania
1. Potwierdzić listę kanałów IControl.
2. Testować pojedynczy kanał z bezpiecznymi wartościami.
3. Sprawdzić profile Cichy, Zrównoważony i Wydajny.
4. Zamknąć program i potwierdzić powrót do ustawień domyślnych.

CI nie potwierdza pracy wentylatorów na nieznanym komputerze. Do tego wymagany jest test fizycznego sprzętu.
