NAUKA OD A DO Z 6.6.0 FIX17 — INSTRUKCJA

1. Rozpakuj ZIP do nowego folderu.
2. Uruchom WYKONAJ_TESTY_FIX17.cmd.
3. Uruchom PODGLAD_LOKALNY_FIX17.cmd.
4. Otwórz http://127.0.0.1:8765/ i przejdź do Warsztatu Mistrza PRO.
5. Nowe zakładki FIX17 znajdują się w pasku podzakładek Warsztatu.

SEKWENCJA STARTOWA
Wprowadź pełny model, Board ID/rewizję i źródło dokumentacji. Dla każdego etapu wybierz stan i wpisz dowód. Statusy są deklaracją technika, nie automatycznym odczytem płyty.

NETLISTA PCB
Importuj CSV/TXT z wierszem nagłówka. Wymagane są kolumny Ref/Component oraz Net/NetName. Opcjonalnie Pin/Pad oraz Description. Wybierz sieć lub filtruj tekst; eksportuje widoczne wiersze.

PRZYRZĄDY / WYKRESY
Importuj CSV/TXT z co najmniej dwiema kolumnami numerycznymi. Wybierz osie X/Y. Wykres powstaje z pliku, nie z połączenia na żywo.

AI REPAIR BRAIN
Wypełnij objaw i dowody. Plan wstępny porządkuje hipotezy i dane do zebrania. Skopiuj kontekst i otwórz istniejący Repair Master AI; sprawdź wszystkie sugestie na podstawie dokumentacji konkretnego urządzenia.

AUDYT STANOWISKA
„Odczyt przeglądarkowy” pokazuje jedynie informacje dozwolone przez browser API. Dane CPU/GPU/RAM/Board/Storage/Monitor wpisane ręcznie muszą mieć źródło. Dodatkowo na Windows 10/11 można wykonać lokalny audyt CIM/Storage skryptem AUDYT_STANOWISKA_FIX17.ps1 i zaimportować jego raport JSON. Import przepuszcza wyłącznie białą listę pól. Odczyt zależy od sterowników i dostępnych klas systemowych.

KARTY NAPRAW
Używaj wewnętrznych identyfikatorów. Nie wpisuj nazwisk, telefonów, adresów, numerów seryjnych, haseł ani innych danych osobowych klientów. Karty są lokalne i nie są CRM/fakturowaniem.

KOPIA FIX17
Eksport JSON pobiera dane nowych modułów. Import scala rekordy po ID. Dane w localStorage nie są szyfrowane w miejscu — zabezpiecz plik kopii i urządzenie. Usuwanie FIX17 nie narusza rekordów FIX11–FIX16.

OGRANICZENIA TECHNICZNE
Nie ma parsera .fz/.brd, bezpośredniego sterowania przyrządami, dostępu do surowych dysków, gwarantowanego SMART/temperatur/EDID, zdalnej synchronizacji FIX17 ani produkcyjnej publikacji. Skrypt PowerShell nie był uruchamiany na rzeczywistym Windows w tym środowisku; wymaga testu na komputerze docelowym.


DODATEK WINDOWS — AUDYT STANOWISKA
1. Na Windows 10/11 uruchom URUCHOM_AUDYT_STANOWISKA_FIX17.cmd (Windows PowerShell 5.1).
2. Skrypt tylko odczytuje dostępne klasy CIM/Storage i tworzy lokalnie pliki AUDYT_STANOWISKA_*.json oraz .txt.
3. W aplikacji otwórz Warsztat Mistrza PRO → Audyt stanowiska → Importuj raport PowerShell JSON.
4. Wynik zależy od modelu, sterowników, wersji Windows i dostępnych uprawnień. Temperatura/Wear nie są gwarantowane.
5. Skrypt nie zbiera numerów seryjnych, nazw użytkowników, MAC ani adresów IP. Niczego nie wysyła do sieci i nie zapisuje do BIOS/UEFI ani na dyskach.
6. Nie testowano wykonania skryptu na fizycznym komputerze Windows w tym środowisku; przed użyciem produkcyjnym sprawdź raport na stanowisku testowym.
