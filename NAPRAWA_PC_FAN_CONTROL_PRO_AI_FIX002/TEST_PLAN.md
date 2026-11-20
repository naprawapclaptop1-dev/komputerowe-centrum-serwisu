# TEST PLAN — FIX007

## CI Windows x64
1. dotnet restore.
2. Publikacja Release / win-x64 / self-contained.
3. Potwierdzenie obecności NaprawaPCFanControl.exe.
4. Kompilacja Setup.exe przez Inno Setup.
5. Potwierdzenie w INSTALLER.iss jawnej flagi runascurrentuser przy wpisie postinstall.
6. Skopiowanie Setup.exe i kompletu portable do jednego katalogu wydania.
7. Utworzenie jednego archiwum ZIP.
8. Rozpakowanie ZIP w CI.
9. Potwierdzenie obecności Setup.exe, README.txt i Portable/NaprawaPCFanControl.exe.
10. Potwierdzenie braku plików ZIP wewnątrz paczki.
11. Publikacja bezpośredniego ZIP jako asset wydania GitHub.

## Testy instalacji Windows 10/11 (wymagane na komputerze)
1. Uruchomić Setup.exe standardowo (dwuklik, potwierdzić UAC).
2. Zaznaczyć opcję uruchomienia po instalacji.
3. Potwierdzić, że aplikacja startuje bez komunikatu CreateProcess code 740.
4. Potwierdzić, że aplikacja otrzymuje uprawnienia administratora.
5. Uruchomić ją ponownie ze skrótu Start/pulpitu.
6. Rozpakować wersję portable i sprawdzić uruchomienie.

## Testy fizycznego sterowania
1. Potwierdzić listę kanałów IControl.
2. Testować pojedynczy kanał z bezpiecznymi wartościami.
3. Sprawdzić profile Cichy, Zrównoważony i Wydajny.
4. Zamknąć program i potwierdzić powrót do ustawień domyślnych.

CI może sprawdzić zawartość instalatora i konfigurację flag, ale nie zastępuje fizycznego testu Setup/UAC na komputerze użytkownika.
