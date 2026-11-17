NAUKA OD A DO Z 6.5.0 FIX16 — ULTIMATE REPAIR CENTER
Build: 6.5.0-ultimate-repair-center-fix16-20261102

SZYBKI START
1. Rozpakuj całe archiwum do nowego folderu. Nie nadpisuj jedynej kopii poprzedniej wersji.
2. Uruchom WYKONAJ_TESTY_FIX16.cmd. Testy nie publikują strony i nie modyfikują D1.
3. Uruchom PODGLAD_LOKALNY_FIX16.cmd.
4. Otwórz http://127.0.0.1:8765/ i przejdź do Warsztat Mistrza PRO → Laboratoria PRO.
5. Nowe zakładki FIX16: Kody STOP/POST, Pomiary, Schematy/PCB, Tester, Przypadki, Trener, Akademie, Prywatność.
6. Zakończ podgląd klawiszami Ctrl+C w oknie serwera.

NOWE MODUŁY
- Kody POST/BIOS/BSOD: wyszukuj wybrane kody STOP Windows. Własne kody beep/LED zapisuj wyłącznie z dokładnym modelem i źródłem producenta.
- Pomiary PRO: zapisuj model, Board ID, rewizję, punkt, stan urządzenia, przyrząd, tryb, odczyt, jednostkę i źródło odniesienia. Status porównuje tylko z zakresem ręcznie wprowadzonym przez technika.
- Schematy/PCB: otwieraj lokalny PDF lub obraz i zapisuj ręczne znaczniki współrzędnych. Nie ma parsera zastrzeżonych formatów .fz/.brd.
- Tester sprzętu: pokazuje ograniczone informacje dostępne przeglądarce i może heurystycznie analizować importowane raporty TXT/LOG/CSV/JSON. Nie wykonuje testu obciążeniowego, nie odczytuje uniwersalnie temperatur, SMART ani EDID.
- Przypadki napraw: zapisuj zanonimizowane objawy, dowody, rozpoznanie, procedurę i wynik. Nie wpisuj danych klienta.
- Trener technika: lokalny test z sześcioma pytaniami i rekomendacją tematów do powtórki.
- Akademie: Mac, serwery, chłodzenie, zasilacze ATX, odzyskiwanie danych i podstawy instalacji samochodowej 12 V z wyraźnymi ograniczeniami bezpieczeństwa.
- Prywatność: eksportuj dane FIX16 do pliku szyfrowanego AES-256-GCM z PBKDF2-SHA-256. Hasło min. 12 znaków; nie jest przechowywane.

WAŻNE OGRANICZENIA
- Podgląd lokalny jest statyczny. API Pages Functions, logowanie i integracje serwerowe są w tym trybie wyłączone.
- Bieżące rekordy FIX16 w localStorage nie są szyfrowane w miejscu. Szyfrowanie dotyczy pliku eksportu.
- Przywracanie kopii scala rekordy FIX16. Biblioteka plików IndexedDB z poprzednich modułów ma osobny mechanizm kopii i nie jest częścią szyfrowanej kopii FIX16.
- Usuwanie w module prywatności dotyczy wyłącznie danych FIX16 i nie usuwa danych FIX11–FIX15.
- Importowane pliki są przetwarzane lokalnie; nie są automatycznie przesyłane do chmury.
- PDF/obrazy schematów są tylko przeglądane i ręcznie oznaczane. Brak parsera BoardView .fz/.brd i automatycznego mapowania komponentów.
- Raport przeglądarki jest ograniczony i przybliżony. Temperatury, SMART, EDID i czujniki wymagają odpowiednich narzędzi systemowych/producenta.
- Kody STOP pomagają rozpocząć analizę; nie wskazują samodzielnie uszkodzonego komponentu. Kody POST/beep/LED zależą od producenta i modelu.
- Zakres samochodowy jest edukacyjny i ograniczony do niskiego napięcia 12 V. Bez HV, poduszek powietrznych i pirotechniki.
- Nie otwieraj zasilaczy sieciowych ani nie omijaj zabezpieczeń. Pomiar wykonuj tylko po identyfikacji punktu, trybu przyrządu i procedury producenta.

TESTY
- 24/24 plików testowych PASS.
- 43 pliki JavaScript/MJS w WEB_PUBLISH przechodzą node --check.
- 34 arkusze CSS poprawne strukturalnie.
- 546 unikalnych ID HTML; 96 lokalnych odwołań bez brakujących plików.
- Lokalny podgląd HTTP i odcięcie /api przetestowane.
- Pełny test Chromium nie został potwierdzony w środowisku budowania; otwórz lokalny podgląd w przeglądarce Windows.

PUBLIKACJA
Wydanie nie jest opublikowane na Cloudflare. Nie wykonano migracji ani zapisów do produkcyjnej bazy D1. Nie uruchamiaj publikatora, dopóki nie sprawdzisz lokalnego podglądu i nie zdecydujesz o publikacji.
