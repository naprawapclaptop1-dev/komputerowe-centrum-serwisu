NAUKA OD A DO Z — FIX103
NAPRAWA BŁĘDÓW CMD: TRY_NODE / INPUT LINE IS TOO LONG / SYNTAX ERROR

CO BYŁO PRZYCZYNĄ
Poprzedni resolver uruchamiał wiele wywołań CALL :TRY_NODE w zagnieżdżonych pętlach i blokach CMD. Końcowe ENDLOCAL łączyło także eksport zmiennych z rozwinięciem całego systemowego PATH w jednym wierszu. Przy długim PATH CMD mógł przekroczyć limit wiersza polecenia (8191 znaków), zgłaszając „The input line is too long” i „The syntax of the command is incorrect”.

CO ZMIENIA FIX103
1. Usunięto wszystkie wywołania CALL :TRY_NODE z aktywnego resolvera.
2. Wykrywanie i weryfikacja node.exe odbywają się w osobnym skrypcie PowerShell: scripts/resolve-node-fix103.ps1.
3. CMD odczytuje wyłącznie krótkie pliki wynikowe node.path i node.version z katalogu tymczasowego.
4. Resolver weryfikuje node.exe --version ponownie w CMD, a zaakceptowaną ścieżkę zapisuje lokalnie w NODE_EXE.path.
5. Nie ma polecenia set PATH=%NODE_DIR%;%PATH% ani łańcucha ENDLOCAL eksportującego całe PATH. Systemowy i procesowy PATH nie są modyfikowane.
6. URUCHOM_AKADEMIE.cmd, konfiguracja OpenAI, przygotowanie Wrangler, diagnostyka i skrót testów korzystają z RESOLVE_NODE_FIX103.cmd.
7. Wrangler uruchamiany jest bezpośrednio przez NODE_EXE; przy instalacji brakującego Wrangler preferowany jest npm-cli.js z katalogu instalacji Node, zamiast zależności od npm.cmd w PATH.

WYKRYWANIE NODE.JS
Resolver sprawdza zapamiętaną ścieżkę projektu, jawne zmienne NODE_EXE/NODE_HOME/NODEJS_HOME, bieżący i zapisany PATH, standardowe lokalizacje, rejestr Windows, NVM, FNM, NVS, Volta, Scoop i WinGet. Każdy kandydat musi być rzeczywistym node.exe i zwrócić poprawne vX.Y.Z; wymagany jest Node.js 20 lub nowszy. Gdy automatyczne wykrywanie zawiedzie, otwiera okno wyboru pliku, a następnie umożliwia ręczne wklejenie ścieżki.

PLIKI STARTOWE
- URUCHOM_NAUKE_OD_A_DO_Z.cmd — główne okno zabezpieczone FIX102; uruchamia główny start.
- URUCHOM_AKADEMIE.cmd — właściwy start publikatora z resolverem FIX103.
- SPRAWDZ_NODE_FIX103.cmd — diagnostyka bez publikowania.
- WYKONAJ_TESTY_FIX103.cmd — pełny test bez publikowania.
- RESOLVE_NODE_FIX103.cmd — wspólny resolver.
- scripts/resolve-node-fix103.ps1 — wykrywanie, weryfikacja i wybór node.exe.

JAK URUCHOMIĆ
1. Rozpakuj pełne archiwum FIX103 do nowego folderu.
2. Uruchom SPRAWDZ_NODE_FIX103.cmd. Jeżeli pojawi się okno wyboru, wskaż rzeczywisty plik node.exe (np. z instalacji Node.js 24.19.0).
3. Sprawdź wyświetloną ścieżkę i wersję.
4. Uruchom WYKONAJ_TESTY_FIX103.cmd.
5. Dopiero po zaliczeniu testów uruchom URUCHOM_NAUKE_OD_A_DO_Z.cmd.

BEZPIECZEŃSTWO I OGRANICZENIA
- Nie zmieniamy systemowego PATH ani rejestru Windows.
- NODE_EXE.path przechowuje wyłącznie ścieżkę do programu, bez sekretów.
- Nie zapisujemy klucza OpenAI ani tokenów w logu.
- FIX103 nie wykonuje publikacji sam z siebie.
- Nie zmienia schematu D1 ani danych użytkowników.
- Runtime fotografii pozostaje FIX99; produkt pozostaje 6.8.0.
- Testy automatyczne uruchomiono w Linux na Node.js v22.16.0. Windows CMD i Windows PowerShell 5.1 nie były dostępne w środowisku testowym, dlatego rzeczywiste uruchomienie na Windows wymaga potwierdzenia przez SPRAWDZ_NODE_FIX103.cmd.
