NAUKA OD A DO Z — FIX76 — POPRAWKA BRAMKI ZDJĘĆ PUBLIKACJI
Data: 2026-11-06
Wersja produktu: 6.8.0 (bez zmiany numeru produktu)

PROBLEM
OneClick zatrzymywał publikację w verifyWeb komunikatem FIX39. Historyczna kontrola wymagała, aby wszystkie 22 elementy ze zdjęciami (nagłówek, sześć slajdów i 13 kafelków) wskazywały 22 różne pliki. Po FIX75 część zdjęć jest prawidłowo używana ponownie pomiędzy sekcjami strony, mimo że każdy z 13 kafelków ma własne zdjęcie, a wszystkie sześć slajdów jest odrębnych.

POPRAWKA
- Zachowano wymóg 22 slotów zdjęciowych.
- Pokaz slajdów nadal musi mieć dokładnie 6 slajdów i 6 różnych obrazów.
- Główna siatka nadal musi mieć dokładnie 13 modułów i 13 różnych obrazów.
- Zachowano kontrolę wymaganych selektorów, skryptów, CSS oraz znaczników odświeżonego pulpitu.
- Dodano test regresyjny scripts/test-home-photo-guard-fix76.mjs i włączono go do OneClick oraz AUTO_PUBLISH_WATCHER.
- Nie wyłączono kontroli zdjęć, liczby kafelków ani pokazu slajdów.

URUCHOMIENIE
1. Rozpakuj pełny ZIP FIX76 do katalogu projektu.
2. Zachowaj dotychczasowy wrangler.toml i lokalne poświadczenia Cloudflare.
3. Uruchom WYKONAJ_TESTY_FIX76.cmd.
4. Jeżeli wszystkie testy przejdą, uruchom dotychczasowy OneClick.

BEZ ZMIAN
- Produkt nadal ma wersję 6.8.0.
- Nie zmieniono D1, migracji SQL, danych użytkowników ani sekretu OPENAI_API_KEY.
- Nie zmieniono projektu Cloudflare, bindingu DB ani konfiguracji Wrangler.
- W ramach przygotowania FIX76 nie wykonano publikacji produkcyjnej.
