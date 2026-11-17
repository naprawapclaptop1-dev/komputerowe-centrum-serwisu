NAUKA OD A DO Z — FIX104

FIX103 uruchamiał PowerShell z parametrami NodePathFile i VersionFile, które w niektórych sesjach CMD docierały jako puste wartości. Parametry Mandatory powodowały interaktywne pytanie PowerShell i błąd Cannot bind argument ... empty string.

FIX104 usuwa ten kontrakt. NodePathFile i VersionFile są opcjonalne oraz mają wartości domyślne w katalogu projektu. CMD przekazuje tylko Root. PowerShell zapisuje wynik do NODE_EXE.path i NODE_EXE.version, a CMD odczytuje oraz ponownie weryfikuje node.exe.

URUCHOMIENIE
1. Rozpakuj pełny FIX104 do nowego folderu (nie łącz z poprzednim folderem).
2. Uruchom SPRAWDZ_NODE_FIX104.cmd.
3. Gdy pojawi się okno wyboru, wskaż rzeczywisty plik node.exe.
4. Sprawdź, czy pokazana wersja to oczekiwane Node.js, np. v24.19.0.
5. Uruchom WYKONAJ_TESTY_FIX104.cmd.
6. Dopiero po pozytywnym wyniku uruchom URUCHOM_NAUKE_OD_A_DO_Z.cmd.

Ścieżka Node.js jest zapisywana w NODE_EXE.path, a wersja w NODE_EXE.version. Przy kolejnych startach nie trzeba ponownie wybierać pliku.

FIX104 nie zmienia systemowego PATH, rejestru ani danych D1.
