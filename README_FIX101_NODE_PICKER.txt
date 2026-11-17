NAUKA OD A DO Z — FIX101
NAPRAWA WYKRYWANIA NODE.JS W WINDOWS

CO BYŁO NIE TAK
FIX100 nadal mógł nie znaleźć node.exe, jeżeli ścieżka była dostępna tylko w innym terminalu, przez menedżer wersji lub w niestandardowym katalogu. Samo skanowanie PowerShell nie rozwiązało sytuacji na komputerze użytkownika.

CO ROBI FIX101
1. Odczytuje zapamiętaną ścieżkę z pliku NODE_EXE.path w katalogu projektu.
2. Sprawdza zmienne NODE_EXE, NODE_HOME i NODEJS_HOME.
3. Szuka node.exe natywnie w PATH bieżącego CMD i przez where.exe — bez zależności od PowerShell.
4. Sprawdza typowe katalogi Program Files, AppData, WinGet, Volta, NVM, FNM, NVS i Scoop.
5. Uruchamia dodatkowy resolver PowerShell jako wyszukiwanie uzupełniające.
6. Jeżeli nadal nie znajdzie Node.js, otwiera okno wyboru pliku. Wskaż rzeczywisty node.exe z instalacji Node.js 24.19.0. Jeśli okno wyboru nie zadziała, można przeciągnąć node.exe do CMD albo wkleić pełną ścieżkę.
7. Każda ścieżka jest sprawdzana przez uruchomienie node.exe --version. Akceptowany jest Node.js 20 lub nowszy (w tym 24.19.0); stare wersje są odrzucane.
8. Wybrana ścieżka jest zapisana w NODE_EXE.path, aby kolejne uruchomienia nie pytały o nią ponownie.

BEZPIECZEŃSTWO
- Nie jest wykonywana ponowna instalacja Node.js.
- Nie jest zmieniany systemowy PATH ani rejestr Windows.
- Katalog Node.js jest dopisywany do PATH tylko w procesie uruchamiacza i jego procesach potomnych.
- NODE_EXE.path zawiera jedynie lokalną ścieżkę do node.exe; plik jest tworzony przy pierwszym ręcznym wyborze.
- Stare RESOLVE_NODE_FIX100.cmd, SPRAWDZ_NODE_FIX100.cmd i WYKONAJ_TESTY_FIX100.cmd pozostają jako zgodne wstecznie przekierowania do FIX101.

KOLEJNOŚĆ
1. Rozpakuj pełny FIX101 do osobnego folderu.
2. Uruchom SPRAWDZ_NODE_FIX101.cmd.
3. Jeżeli pojawi się okno wyboru, wskaż node.exe. Resolver zweryfikuje wersję i zapamięta ścieżkę.
4. Uruchom WYKONAJ_TESTY_FIX101.cmd.
5. Dopiero po pozytywnym wyniku uruchom URUCHOM_NAUKE_OD_A_DO_Z.cmd.

WERSJE
Produkt: 6.8.0
Hotfix publikatora i narzędzi Windows: FIX101
Runtime fotografii: FIX99 (bez zmian)

UWAGA O TESTACH
Zestaw FIX101: 156/156 PASS i 6/6 kontroli składni JavaScript. Uruchomiono w środowisku Linux na Node.js v22.16.0. Windows CMD, Windows PowerShell 5.1 i okno wyboru pliku wymagają potwierdzenia na komputerze docelowym. Nie wykonano publikacji Cloudflare Pages ani migracji D1.
