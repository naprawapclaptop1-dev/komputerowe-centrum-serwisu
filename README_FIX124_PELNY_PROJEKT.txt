NAUKA OD A DO Z — DLA WSZYSTKICH
PEŁNY PROJEKT 6.8.0 — FIX124

TO JEST PEŁNE ARCHIWUM PROJEKTU, NIE PATCH.
Zawiera cały zestaw plików projektu, moduły WWW, materiały, skrypty, testy,
dokumentację oraz poprawiony film wsparcia FIX9.

INSTALACJA PEŁNEGO PROJEKTU
1. Zamknij OneClick i Auto-Watcher, jeżeli są uruchomione.
2. Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj CAŁE archiwum NAUKA_OD_A_DO_Z_6_8_0_FIX124_PELNY_PROJEKT.zip
do G:\AKADEMIA_SERWISU_PRO, zachowując strukturę katalogów i scalając foldery.
4. Nie usuwaj i nie zastępuj lokalnych plików konfiguracji/sekretów, jeżeli występują:
   wrangler.toml, wrangler.jsonc, .env, .dev.vars, lokalne tokeny i klucze.
   Archiwum nie zawiera prywatnych sekretów konta Cloudflare ani OpenAI.
5. Zachowaj lokalny START_FIX105.cmd, jeżeli jest już skonfigurowany na tym komputerze.
6. Uruchom WYKONAJ_TESTY_FIX124.cmd. Wymagany wynik: 22/22 PASS.
7. Dopiero po PASS uruchom dotychczasowy START_FIX105.cmd.

NAPRAWIONE W FIX124
- Film wsparcia FIX9: H.264/AAC, 1280×720, 33,111 s, 1 171 095 bajtów.
- OneClick sprawdza minimalny rozmiar i dokładny SHA-256 filmu.
- Zaktualizowano URL/cache PWA i kontrolę Watchera.
- Zachowano nazwę produktu NAUKA OD A DO Z — DLA WSZYSTKICH i wersję 6.8.0.
- Zachowano globalną politykę ilustracji technicznych FIX123.

BEZPIECZEŃSTWO I KONFIGURACJA
- Nie twórz nowej bazy D1.
- Nie wykonuj ręcznie migracji SQL.
- Nie zmieniaj bindingu produkcyjnego Pages ani sekretów Cloudflare/OpenAI.
- Lokalne pliki wrangler/.env/.dev.vars pozostają pod kontrolą użytkownika.
- FIX124 nie wykonuje samodzielnie publikacji produkcyjnej.

PO TESTACH
Jeżeli testy są zielone, uruchom dotychczasowy START_FIX105.cmd.
Publikacja produkcyjna nie została wykonana w ramach przygotowania tego archiwum.
