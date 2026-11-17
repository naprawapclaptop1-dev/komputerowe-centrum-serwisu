NAUKA OD A DO Z — GLOBAL ACADEMY PRO
PEŁNE WYDANIE FIX64–FIX73
Produkt: 6.8.0 (bez zmiany numeru produktu)
Build rozszerzenia: 6.8.0-fix73-global-academy-expansion-20261106

1. CO ZAWIERA WYDANIE
To jest pełny projekt źródłowy oparty na FIX63, a nie patch. Zachowuje istniejące moduły FIX51–FIX63 i rozszerza istniejący widok #view-globalacademy o 10 dodatkowych zakładek. Nie dodaje nowych widoków najwyższego poziomu.

FIX64 — Production Control Center
- lokalny, tylko do odczytu audyt nawigacji, zasobów i manifestów;
- nie publikuje zmian, nie wykonuje zapisów do D1 i nie jest potwierdzeniem wdrożenia.

FIX65 — Knowledge Center / Atlas podzespołów
- interaktywny model warstwowy laptopa z obrotem, rozsunięciem i wyborem warstw;
- to poglądowy model 2.5D CSS, nie skan 3D/CAD konkretnego urządzenia.

FIX66 — AI Repair Expert
- jawne wysłanie zapytania metodą POST do istniejącego, same-origin /api/chat;
- nie zawiera klucza OpenAI w przeglądarce;
- wymaga zaznaczenia zgody i nie wykonuje napraw ani pomiarów; odpowiedź jest hipotezą do weryfikacji.

FIX67 — Hardware Intelligence Database
- przeszukiwanie już istniejącego katalogu modeli oraz lokalne notatki technika;
- nie jest kompletną bazą OEM/SKU/FRU ani potwierdzeniem kompatybilności części.

FIX68 — Service Workshop Manager
- lokalne karty serwisowe, statusy, druk, import i eksport JSON;
- nie wpisywać danych osobowych klientów, haseł, numerów seryjnych ani danych wrażliwych;
- nie zastępuje systemu CRM, fakturowania ani dokumentacji prawnej.

FIX69 — Master Training Academy
- lokalne ścieżki szkoleniowe i zapis wykonanych ćwiczeń.

FIX70 — Professional Examination Center
- 10 losowych pytań i lokalny wynik;
- wydruk jest potwierdzeniem ćwiczenia, nie akredytowanym certyfikatem ani kwalifikacją zawodową.

FIX71 — Global Media Center
- lokalna galeria fotografii i linki do źródeł istniejącego katalogu wideo;
- plakaty nie są nagraniami; prawa/licencje odziedziczonych zdjęć wymagają potwierdzenia przed publiczną dystrybucją.

FIX72 — Global Community
- lokalna tablica pytań w bieżącej przeglądarce;
- nie publikuje wpisów publicznie i nie synchronizuje ich pomiędzy użytkownikami.

FIX73 — Smart Offline & Backup
- ręczne pobranie wybranego pakietu do Cache Storage;
- ręczny eksport/import danych JSON z łączeniem rekordów po ID;
- brak automatycznej synchronizacji cloud-to-cloud i brak pobierania dużych filmów.

2. INSTALACJA / URUCHOMIENIE LOKALNE
1) Rozpakuj CAŁE archiwum do nowego folderu, np. G:\AKADEMIA_SERWISU_FIX64_FIX73.
2) Nie kasuj poprzedniego FIX63 ani swojego działającego folderu.
3) Uruchom WYKONAJ_TESTY_FIX74.cmd (pełny zestaw 23 kontroli; poprawia też Windows file URL root).
4) Podgląd statyczny uruchom przez PODGLAD_FIX64_FIX73.cmd; skrypt otwiera lokalny podgląd w domyślnej przeglądarce.
5) W podglądzie statycznym Pages Functions/API są wyłączone (endpointy API zwracają tryb podglądu). AI wymaga działającego wdrożenia Pages i istniejącego /api/chat.

3. TEST PRZEGLĄDARKOWY CHROME / EDGE
Po uruchomieniu podglądu sprawdź:
- Global Academy → kolejno wszystkie zakładki FIX64–FIX73;
- obrót modelu 2.5D, zmianę rozłożenia i wybór 6 warstw;
- wyszukiwanie modelu i zapis lokalnej notatki;
- utworzenie, zmianę statusu, wydruk, eksport i import lokalnej karty serwisowej;
- zaznaczanie zadań w ścieżkach nauki;
- egzamin 10 pytań i wydruk lokalnego potwierdzenia;
- galerię zdjęć i otwieranie linków do istniejących źródeł;
- zapis/usunięcie lokalnego pytania;
- pobranie pakietu offline, audyt cache oraz eksport/import kopii JSON.

4. PUBLIKACJA CLOUDFLARE
- AUTO_PUBLISH_WATCHER.js sprawdza także trzy pliki rozszerzenia FIX73 po stronie stałego adresu produkcyjnego.
- FIX63 próbuje odczytać Production Branch z Pages API przez istniejący profil OAuth Wrangler lub CLOUDFLARE_API_TOKEN.
- Jeżeli API nie zwróci prawidłowej gałęzi/projektu albo potwierdzenie ręczne jest sprzeczne, publikacja ma pozostać zablokowana. Nie wpisuj domyślnie "main" bez sprawdzenia ustawienia Cloudflare Pages.
- Przed produkcją należy mieć kopię D1 i pozytywny preflight w swoim środowisku Windows/Node 24.19.0.
- W tym wydaniu nie wykonano publikacji produkcyjnej.

5. DANE I MIGRACJE
- Nie dodano nowych migracji D1.
- Nie zmieniono sekretu OPENAI_API_KEY ani nie umieszczono go w kodzie klienta.
- Dane FIX67–FIX73 przechowywane są lokalnie w profilu przeglądarki; usunięcie danych przeglądarki może je skasować. Regularnie eksportuj kopię.
- Audyt migracji wskazuje historyczne pliki 0008_social_login_x_github.sql i 0009_discord_social_login.sql do ręcznej oceny (zawierają RENAME TABLE / DROP TABLE). Nie zostały wykonane ani zmodyfikowane.

6. ZNANE OGRANICZENIA
- Brak ręcznego E2E w Chrome/Edge w środowisku tworzenia — testy statyczne/HTTP przechodzą, ale należy wykonać checklistę w swojej przeglądarce.
- Testy w środowisku przygotowania wykonano na Node.js 22.16.0; wymagane jest ponowienie na docelowym Windows z Node.js 24.19.0.
- Nie wykonano live call do Cloudflare Pages API ani publikacji; discovery gałęzi ma testy symulowane.
- FIX65 to warstwowy model 2.5D, nie prawdziwy model CAD.
- FIX67 to istniejący katalog + lokalne notatki, nie pełna baza wszystkich producentów.
- FIX68, FIX69, FIX70, FIX72 i FIX73 mają zakres lokalny, bez cloud sync.
- FIX70 nie wydaje akredytowanych certyfikatów.

7. WAŻNE PLIKI
- ONECLICK_AKADEMIA.js — kontrola i publikator;
- AUTO_PUBLISH_WATCHER.js — obserwator i kontrola produkcyjnego aliasu;
- WEB_PUBLISH/assets/global-academy-expansion-fix73.js — nowy runtime;
- WEB_PUBLISH/assets/global-academy-expansion-fix73.css — style;
- WEB_PUBLISH/assets/global-academy-expansion-manifest-fix73.json — kontrakt funkcji;
- scripts/test-global-academy-expansion-fix73.mjs — test funkcjonalnego kontraktu;
- scripts/test-global-academy-http-fix73.mjs — lokalny test HTTP;
- scripts/test-syntax-fix64-fix73.mjs — kontrola składni (ROOT wyznaczany przez fileURLToPath);
- scripts/test-syntax-root-fix74.mjs — regresja ścieżek Windows/Linux;
- WYKONAJ_TESTY_FIX74.cmd — pełny runner 23 kontroli FIX74;
- WYKONAJ_TESTY_FIX73.cmd — pełny zestaw 22 testów.


8. FIX74 — POPRAWKA ŚCIEŻKI TESTU SKŁADNI
- Poprzedni test używał URL.pathname jako ścieżki systemowej. Na Windows
  zwróciło to nieprawidłowy katalog G:\G:\AKADEMIA_SERWISU_PRO.
- FIX74 używa fileURLToPath z node:url, następnie path.dirname i path.resolve.
- Uruchom WYKONAJ_TESTY_FIX74.cmd przed ponowną próbą OneClick.
- FIX74 nie rozwiązuje niezależnej blokady Production Branch, jeśli Cloudflare
  Pages API i profil Wrangler nie zwrócą rzeczywistej gałęzi.


AKTUALIZACJA FIX75 (2026-11-06)
- Najnowszy pakiet obejmuje FIX75; uruchamiaj WYKONAJ_TESTY_FIX75.cmd, a następnie PODGLAD_FIX75.cmd.
- 13 głównych kafelków ma własny lokalny obraz: 12 fotografii warsztatowych i 1 fotorealistyczną wizualizację AI wyraźnie oznaczoną w interfejsie.
- Dodano sześć ścieżek specjalistycznych i powiększaną galerię zdjęć.
- Pełny opis znajduje się w README_FIX75_PHOTO_ACADEMY.txt.
