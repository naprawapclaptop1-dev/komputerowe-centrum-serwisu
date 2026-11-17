NAPRAWA PC — AKADEMIA SERWISU PRO 6.0.0 / ULTIMATE CYBER LAB

INSTALACJA
1. Zatrzymaj obserwator Ctrl+C i wykonaj kopię katalogu projektu.
2. Rozpakuj pełny ZIP do istniejącego G:\AKADEMIA_SERWISU_PRO ze scalaniem.
3. Zachowaj TOOLS_CLOUDFLARE, wrangler.toml/wrangler.json(c), BACKUPS_D1 i lokalne sekrety.
4. Uruchom URUCHOM_AKADEMIE.cmd.

NOWOŚCI 6.0.0
- 1000 łącznie strukturalnych lekcji warsztatowych (800 poprzednich + 200 nowych).
- Nowy animowany, niskokosztowy background z siecią i ścieżkami PCB; respektuje prefers-reduced-motion.
- Nowy pulpit ULTIMATE Service Center z licznikami D1 i skrótami do najważniejszych modułów.
- Repair Master: lokalne wyszukiwanie RAG w bazie Akademii, plan hipotez i zapis lokalnej karty diagnozy.
- Interaktywny edukacyjny model PCB z rotacją, zoomem, warstwami, inspektorem części i notatkami.
- Panel administratora do odczytu statystyk i moderacji istniejących kolejek /api/admin/models oraz /api/admin/knowledge.
- Panel administratora wymaga sekretu ADMIN_REVIEW_TOKEN już używanego przez istniejące endpointy; token jest przechowywany tylko w sessionStorage bieżącej karty.
- Zachowane konta, historia, społeczność, katalog 33 producentów i 150 modeli referencyjnych, globalne statystyki D1, kursy, filmy, wsparcie, laboratorium i wcześniejsze narzędzia.

WAŻNE
- Nie dodano migracji SQL i nie zmieniono identyfikatora istniejącej bazy D1.
- Widok PCB jest modelem edukacyjnym, a nie rzeczywistym schematem/BoardView konkretnej rewizji.
- Repair Master korzysta z lokalnej bazy wiedzy i nie odczytuje fizycznych pomiarów sprzętu.
- Statystyki odwiedzin liczą anonimowe sesje i odsłony, nie zweryfikowane osoby.
- Pełny test przeglądarkowy i publikacja produkcyjna wymagają uruchomienia lokalnego środowiska Windows/Cloudflare.

PANEL ADMINISTRATORA
- Statystyki publiczne są pobierane z istniejącego /api/visits.
- Moderacja zgłoszeń modeli i przypadków wykorzystuje istniejące /api/admin/models i /api/admin/knowledge.
- W Cloudflare Pages musi istnieć sekret ADMIN_REVIEW_TOKEN (ten sam, który sprawdza funkcja checkAdmin). Jeśli jeszcze go nie ustawiono, skonfiguruj go jako Secret w Pages > Settings > Variables and Secrets. Nie wpisuj sekretu do plików WEB_PUBLISH ani do repozytorium.
- Sekret wklejony do panelu pozostaje tylko w sessionStorage bieżącej karty i można go usunąć przyciskiem „Rozłącz”.
- Edytor lekcji zapisuje szkice tylko lokalnie; eksport/import JSON nie publikuje ich automatycznie wszystkim użytkownikom.

KONTA
- Rejestracja e-mail/hasło wymaga aktywnego Pages Functions, istniejącego bindingu D1 i zastosowanej migracji 0006. Logowania Google/Facebook/Microsoft są ukrywane, jeśli dostawcy nie są skonfigurowani.
- Wersja nie ma automatycznej weryfikacji adresu e-mail ani resetu hasła e-mailem; użytkownik powinien zachować hasło.
