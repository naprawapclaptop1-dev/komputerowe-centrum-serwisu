KOMPUTEROWE CENTRUM SERWISU — FIX087 / aplikacja 1.0.0.69

JEDEN ZIP / JEDEN CMD
1. Rozpakuj cały ZIP do jednego folderu z prawem zapisu.
2. Uruchom wyłącznie URUCHOM_TYLKO_TEN_PLIK.cmd.
3. Nie uruchamiaj pozostałych CMD/PS1 ręcznie — to etapy pomocnicze głównego automatu.

CO ZROBI GŁÓWNY CMD
1. Automatycznie przygotuje GitHub CLI, Git, Inno Setup i wymagane ścieżki.
2. Zsynchronizuje pełne źródła i stronę WWW z przypisanym repozytorium.
3. Zbuduje świeży program, wersję przenośną i instalator Windows.
4. Utworzy pierwsze publiczne wydanie GitHub Releases z instalatorem, portable, manifestami Stable/Beta, releases.json i SHA256SUMS.txt.
5. Sprawdzi publiczne adresy, HTTP 200, sumy SHA-256 i wszystkie zasoby strony WWW.
6. Dopiero po pomyślnej weryfikacji zainstaluje i uruchomi lokalną wersję programu.

JEDYNE REPOZYTORIUM TEGO PROGRAMU
https://github.com/naprawapclaptop1-dev/komputerowe-centrum-serwisu
Repozytorium jest wpisane automatycznie. Nie wpisuj URL i nie zmieniaj repozytorium.

STRONA DLA UŻYTKOWNIKÓW NA CAŁYM ŚWIECIE
https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/
Publiczna strona działa w języku polskim i angielskim. Wyjaśnia do czego służy program, opisuje moduły i wymagania, zawiera oryginalny film prezentacyjny z napisami, FAQ i instrukcję pobierania. Linki do instalatora i wersji portable staną się aktywne po opublikowaniu pierwszego wydania GitHub Releases. Pobieranie ma być bezpłatne — bez abonamentu i płatnego konta. Hosting publicznej strony na GitHub Pages jest dostępny bez opłat w publicznym repozytorium na planie GitHub Free.

PIERWSZE URUCHOMIENIE
Wymagane jest jednorazowe zalogowanie do GitHub w przeglądarce i zatwierdzenie uprawnień repo/workflow. Windows może poprosić o standardową zgodę UAC podczas instalacji. Nie zapisujemy tokena GitHub w kodzie ani w repozytorium.

NAPRAWA 404
Manifesty nie są udostępniane z samego adresu repozytorium — muszą zostać dołączone jako assety do opublikowanego wydania. Główny automat publikuje oba manifesty, pliki EXE, releases.json i SHA256SUMS.txt, a następnie odpytuje dokładne adresy /releases/latest/download/. Jeżeli Release nie jest jeszcze dostępny lub strona Pages czeka na wdrożenie, etap weryfikacji zatrzyma instalację i zapisze szczegóły w dist\build-logs.

BEZPIECZEŃSTWO I WZNOWIENIE
- Opublikowane tagi i assety nie są nadpisywane ani kasowane.
- Przy ponownym uruchomieniu automat sprawdza istniejące assety; różniące się pliki blokują publikację.
- Po utworzeniu wydania, ale przed zakończeniem wdrożenia Pages, można bezpiecznie uruchomić ponownie ten sam CMD.
- Operacje na partycjach, rejestrze, rozruchu i przywracaniu systemu mogą zmienić dane. Przed nimi wykonaj kopię zapasową.

Wersja aplikacji pozostaje 1.0.0.69. FIX087 naprawia test walidacyjny workflow Pages: testy używają teraz rekordów PSCustomObject, aby PowerShell 5.1 nie spłaszczał wyników i opisów kontroli.
