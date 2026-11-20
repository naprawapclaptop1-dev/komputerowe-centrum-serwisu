KOMPUTEROWE CENTRUM SERWISU — FIX139 / aplikacja 1.0.0.74

JEDEN ZIP / JEDEN CMD
1. Rozpakuj cały ZIP do dowolnego folderu z prawem zapisu (nazwa folderu nie ma znaczenia).
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
Manifesty nie są udostępniane z samego adresu repozytorium — muszą zostać dołączone jako assety do opublikowanego wydania. Główny automat publikuje oba manifesty, pliki EXE, releases.json i SHA256SUMS.txt, a następnie odpytuje dokładne adresy assetów przypięte do tagu v1.0.0.74. Klient nie korzysta z aliasu /releases/latest/download/, aby Stable i Beta pobierały manifesty z tego samego, jawnie zweryfikowanego wydania. Jeżeli Release nie jest jeszcze dostępny lub strona Pages czeka na wdrożenie, etap weryfikacji zatrzyma instalację i zapisze szczegóły w dist\build-logs.

BEZPIECZEŃSTWO I WZNOWIENIE
- Opublikowane tagi i assety nie są nadpisywane ani kasowane.
- Przy ponownym uruchomieniu automat sprawdza istniejące assety; różniące się pliki blokują publikację.
- Po utworzeniu wydania, ale przed zakończeniem wdrożenia Pages, można bezpiecznie uruchomić ponownie ten sam CMD.
- Operacje na partycjach, rejestrze, rozruchu i przywracaniu systemu mogą zmienić dane. Przed nimi wykonaj kopię zapasową.

FIX100 usuwa blokadę nazwy folderu rozpakowania; marker pakietu i przypisane repozytorium nadal są obowiązkowo sprawdzane. Okno CMD pozostaje otwarte i uruchamia etapy w tym samym widocznym oknie. Wersja aplikacji: 1.0.0.74 / FIX139. FIX087 naprawia test walidacyjny workflow Pages: testy używają teraz rekordów PSCustomObject, aby PowerShell 5.1 nie spłaszczał wyników i opisów kontroli.

FIX088: testy uruchamiane przez CMD używają PSCustomObject zamiast zagnieżdżonych tablic.


FIX095 - CZYSZCZENIE CACHE INNYCH APLIKACJI
Automat czyści stare pliki .tmp/.temp z katalogów TEMP oraz pliki z jawnie dozwolonych, regenerowalnych katalogów cache: przeglądarki (Chrome, Edge, Firefox, Brave, Vivaldi, Opera), Discord, klasyczny Microsoft Teams i cache DirectX/NVIDIA/AMD/Intel. Usuwane są wyłącznie pliki w tych katalogach cache; pliki zablokowane są pomijane. Nie są usuwane cookies, sesje, hasła, historia, rozszerzenia, ustawienia, profile, bazy danych, dokumenty ani programy. Raport: dist\build-logs\SAFE_TEMP_CLEANUP.log.

FIX123: instalator rozszerza wykrywanie .NET Framework Full o wartości Install, Release i Version. Automatyczna instalacja zapisuje dist\build-logs\installation-FIX139-inno.log. Wersja produktu 1.0.0.72 / FIX072; poprzednie wydanie v1.0.0.69 pozostaje bez zmian.

FIX130 / FIX072 (historycznie): LIVE monitor pokazuje CPU/RAM oraz dostępne liczniki GPU Engine, pamięci GPU i transferu dysków. Dashboard podaje skrócone woluminy z pełnymi podpowiedziami, rozpoznaje typowe adaptery wirtualne/zdalne, a odczyt SMART/dysków działa w tle. Raport serwisowy zawiera szczegółowe informacje GPU i woluminów. Brak danych z WMI oznacza brak pomiaru, nie zerowe obciążenie ani potwierdzenie zdrowia sprzętu.


FIX139 — SERWIS PRO / ZLECENIA / DIAGNOSTYKA / MAGAZYN / KOPIE
- Dodano lokalną kartotekę zleceń: klient, kontakt, sprzęt, numer seryjny, usterka, czynności, uwagi, status, priorytet i kosztorys.
- Dodano diagnostykę odczytową przed i po naprawie: CPU, RAM, GPU/sterownik, woluminy, dostępny SMART predykcyjny, strefy ACPI, bateria oraz identyfikację monitora z WMI/EDID. Brak danych jest jawnie oznaczany jako niedostępny.
- Dodano porównanie snapshotów bez automatycznego deklarowania poprawy lub sprawności sprzętu.
- Dodano magazyn części z SKU, kategorią, kosztem, ceną, progiem minimalnym i wydawaniem ilości do aktywnego zlecenia; zapis zlecenia można cofnąć po błędzie zapisu magazynu.
- Dodano historię działań serwisowych i historię urządzenia po numerze seryjnym, zalecenia technika oraz raport do wydruku/PDF przez drukarkę Windows (np. Microsoft Print to PDF).
- Dodano kopie trzech lokalnych plików XML z manifestem SHA-256, kontrolą kompletności i poprawności XML, kopią bieżącego stanu oraz rollbackiem całego zestawu po błędzie odtworzenia.
- Dane Serwis PRO są lokalne w Data\ServicePRO; nie są wysyłane do repozytorium ani na stronę WWW.
- Produkt otrzymuje nową, niezmienną wersję 1.0.0.74 / FIX139; publiczne v1.0.0.72 pozostaje zachowane.
Data: 2026-11-20
FIX139 / WERSJA 1.0.0.74
- Dodano Kalendarz wizyt PRO: terminy przyjęć/odbiorów, statusy, notatki oraz eksport ICS i CSV.
- Terminarz zapisuje dane lokalnie w Data\ServicePRO\appointments.xml i rejestruje operacje w historii Serwis PRO.
- Eksport ICS można ręcznie zaimportować do Outlook lub Google Calendar. Automatyczna synchronizacja i wysyłka SMS/e-mail nie są częścią tej wersji.
