NAUKA OD A DO Z — FIX100
WYKRYWANIE NODE.JS W WINDOWS, GDY CMD NIE WIDZI PATH

OBJAW
Poprzedni launcher URUCHOM_AKADEMIE.cmd używał wyłącznie where.exe node.
Jeżeli proces CMD nie odziedziczył aktualnego PATH albo Node był zainstalowany
przez menedżer wersji, launcher kończył pracę kodem 10 przed sprawdzeniem
projektu, sekretem OpenAI i OneClick.

CO ZMIENIONO
- Dodano RESOLVE_NODE_FIX100.cmd oraz scripts/resolve-node-fix100.ps1.
- Resolver sprawdza bieżący PATH i where.exe, a następnie zapisany PATH
  użytkownika/systemu, katalogi Program Files/AppData i wpisy rejestru Windows.
- Obsługiwane są również typowe instalacje NVM for Windows, FNM, Volta, NVS,
  Scoop i Chocolatey.
- Każdy kandydat jest uruchamiany z --version; nieaktywne shimy i martwe ścieżki
  są odrzucane.
- Katalog zawierający wybrany node.exe jest dopisywany do PATH tylko dla
  bieżącego procesu CMD i jego procesów potomnych. Nie zmienia globalnego PATH.
- Główny start, test FIX99, nowy test FIX100, konfiguracja OpenAI i przygotowanie
  Wrangler korzystają ze wspólnego resolvera.
- Nie zmieniono katalogu fotografii FIX99, Service Workera ani wersji produktu.

KOLEJNOŚĆ NA WINDOWS
1. Rozpakuj całe archiwum FIX100 do nowego folderu, bez mieszania z poprzednim.
2. Uruchom SPRAWDZ_NODE_FIX100.cmd. Powinien wyświetlić pełną ścieżkę node.exe
   i numer wersji (np. v24.19.0, jeśli ta wersja jest dostępna).
3. Uruchom WYKONAJ_TESTY_FIX100.cmd.
4. Dopiero po zaliczeniu testów uruchom URUCHOM_NAUKE_OD_A_DO_Z.cmd.

JEŻELI NODE NIE ZOSTANIE ODNALEZIONY
Dodaj do PATH dokładny katalog, w którym znajduje się node.exe, albo napraw
aktywną konfigurację używanego menedżera wersji. Nie instaluj Node.js ponownie,
jeżeli plik node.exe już istnieje i działa z innego okna terminala.

BEZPIECZEŃSTWO I ZAKRES
- Resolver nie pobiera ani nie instaluje Node.js.
- Resolver nie odczytuje ani nie zmienia OPENAI_API_KEY.
- Resolver nie wykonuje publikacji, zapytań do Cloudflare ani migracji D1.
- Wersja produktu pozostaje 6.8.0.
- Hotfix publikatora: FIX100.
- Runtime fotografii pozostaje FIX99: 6.8.0-fix99-active-view-topic-photo-priority-20261108.

OGRANICZENIE TESTU
Pełną regresję uruchomiono w środowisku Linux/Node.js v22.16.0. W tym środowisku
nie ma Windows PowerShell 5.1 ani Windows CMD, więc nie można tu wykonać
rzeczywistego testu wyszukiwania Windows Registry / NVM / Volta. Do tego służy
SPRAWDZ_NODE_FIX100.cmd na komputerze Windows. Testy statyczne resolvera oraz
cała regresja projektu przeszły.


AKTUALIZACJA FIX101
Jeżeli nadal występuje kod 10, użyj nowszego SPRAWDZ_NODE_FIX101.cmd lub URUCHOM_NAUKE_OD_A_DO_Z.cmd z pakietu FIX101. FIX101 otwiera okno wyboru node.exe i zapamiętuje ścieżkę w NODE_EXE.path. Stare skróty FIX100 w pakiecie FIX101 są przekierowane do nowych narzędzi.
