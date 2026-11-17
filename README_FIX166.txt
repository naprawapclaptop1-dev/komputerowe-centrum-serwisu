NAUKA OD A DO Z — FIX166
PRODUKT: 6.8.0
TYP: NAPRAWA STRAŻNIKA PUBLIKACJI GEMINI (PUBLISHER-ONLY)

PRZYCZYNA BŁĘDU Z LOGU UŻYTKOWNIKA
Gemini poprawnie potwierdziło klucz, a Cloudflare Pages Production potwierdziło zapis sekretu GEMINI_API_KEY. Publikację zatrzymywał dopiero lokalny verifyWeb w ONECLICK_AKADEMIA.js.

Backend functions/api/chat.js prawidłowo pobiera sekret przez składnię JavaScript optional chaining:
  env?.GEMINI_API_KEY

Dotychczasowy strażnik OneClick i Watcher szukał wyłącznie literalnego tekstu:
  env.GEMINI_API_KEY

Te dwa zapisy oznaczają dostęp do tej samej właściwości, ale tekstowo są różne. Strażnik odrzucał poprawny backend jako niezgodny z Gemini. Nie był to błąd klucza, Google API ani połączenia.

CO NAPRAWIA FIX166
1. ONECLICK_AKADEMIA.js rozpoznaje oba zapisy dostępu do sekretu: env?.GEMINI_API_KEY oraz env.GEMINI_API_KEY.
2. AUTO_PUBLISH_WATCHER.js stosuje identyczny warunek.
3. Obie kontrole nadal wymagają stabilnego endpointu Gemini Interactions API v1.
4. Obie kontrole nadal wymagają ograniczenia tematycznego topicRestricted.
5. Nadal blokowane są wywołania OpenAI, Workers AI i niestandardowy Api-Revision.
6. Dodano test regresyjny test-gemini-publisher-guard-fix166.mjs i włączono go do preflight wykonywanego przez OneClick oraz Watcher.
7. Dodano WYKONAJ_TESTY_FIX166.cmd i raport RAPORT_FIX166_TESTY.log.

WAŻNE — KLUCZ GEMINI
Log przekazany przed przygotowaniem FIX166 potwierdza:
  [OK] Google Gemini potwierdziło klucz i dostęp do modelu.
  [OK] GEMINI_API_KEY zapisany i potwierdzony w Cloudflare Pages Production.

Dlatego po instalacji FIX166 nie powinno być potrzeby ponownego wklejania klucza. START_FIX105 powinien wykryć istniejący sekret i przejść dalej. FIX166 nie usuwa ani nie nadpisuje sekretu. Nie umieszczaj klucza w plikach, logach ani rozmowie.

ZAKRES WYDANIA
- Produkt pozostaje 6.8.0.
- Runtime strony pozostaje FIX165: latestHotfix i cache Service Workera nie są zmieniane.
- Zmiana FIX166 dotyczy wyłącznie strażników publikacji, release metadata, testów i dokumentacji.
- Nie zmieniono functions/api/chat.js ani konfiguratora klucza.
- Nie dodano bazy D1, tabel ani migracji.
- Istniejący projekt Pages: naprawa-pc-akademia-serwisu-pro.
- Istniejąca baza D1: naprawapc-orders.
- Zachowane: 35 widoków, 1083 lekcje, 19 zdjęć i cache zdjęć FIX135.

INSTALACJA
1. Wykonaj kopię katalogu G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj jeden pełny ZIP FIX166 do G:\AKADEMIA_SERWISU_PRO, zastępując starsze pliki.
3. Uruchom WYKONAJ_TESTY_FIX166.cmd. Oczekiwany wynik: STATUS: PASS, kod 0.
4. Uruchom START_FIX105.
5. Ponieważ poprzedni log potwierdził zapis GEMINI_API_KEY, nie wklejaj klucza ponownie, chyba że CMD wyraźnie poinformuje, że sekretu nie ma.

OCZEKIWANY PRZEBIEG START_FIX105
Node.js -> wykrycie istniejącego GEMINI_API_KEY (bez pytania o klucz) -> OneClick FIX166 -> kontrola istniejącego Pages i bindingu D1 -> walidacja -> publikacja -> AUTO-WATCH.

WERYFIKACJA
Pełny lokalny preflight uruchamia dotychczasowy łańcuch regresji FIX136–FIX165 oraz nowy test FIX166. Raport: RAPORT_FIX166_TESTY.log.

Nie wykonano z tego środowiska zdalnej publikacji. Sukces produkcyjny potwierdzi dopiero kolejny log START_FIX105 z komputera użytkownika.
