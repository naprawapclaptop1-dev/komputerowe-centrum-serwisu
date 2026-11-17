NAUKA OD A DO Z — FIX105
NAPRAWA NODE.EXE RESULT PATHS

Przyczyna z logu FIX104:
PowerShell wykrywał Node.js 24.19.0, ale CMD nie widział NODE_EXE.path / NODE_EXE.version w katalogu głównym. Wywołanie przekazywało %~dp0 z końcowym ukośnikiem bez kanonikalizacji. PowerShell mógł rozpoznać inny Root niż oczekiwany.

FIX105: RESOLVE_NODE_FIX105.cmd najpierw kanonikalizuje katalog przez FOR %%I in ("%~dp0.") do set NPA_ROOT=%%~fI. Ten katalog nie kończy się separatorem. Następnie przekazuje trzy jawne pełne ścieżki: Root, NODE_EXE.path i NODE_EXE.version. PowerShell zapisuje pliki, odczytuje je ponownie i weryfikuje zgodność. CMD sprawdza konkretne przyczyny braku plików, odczytuje UTF-8 bez BOM przez FOR /F i ponownie uruchamia node.exe --version.

Pliki diagnostyczne powstają w katalogu głównym projektu. Systemowy PATH i rejestr Windows nie są modyfikowane. Starsze RESOLVE_NODE_FIX104.cmd oraz SPRAWDZ_NODE_FIX104.cmd są kompatybilnymi przekierowaniami do FIX105.

Uruchom: SPRAWDZ_NODE_FIX105.cmd, następnie WYKONAJ_TESTY_FIX105.cmd, a po sukcesie URUCHOM_NAUKE_OD_A_DO_Z.cmd.

Natywny Windows PowerShell/CMD musi być zweryfikowany na komputerze użytkownika; środowisko budowania nie jest Windows.
