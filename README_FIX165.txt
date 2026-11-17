NAUKA OD A DO Z — FIX165
WERSJA PRODUKTU: 6.8.0
TEMAT: naprawa timeoutu przy pierwszym sprawdzaniu klucza Gemini

CO NAPRAWIA FIX165
1. Poprzedni konfigurator wykonywał pełne generowanie odpowiedzi testowej w Gemini Interactions API. To mogło trwać dłużej niż 30 sekund i zatrzymywało zapis sekretu mimo prawidłowego formatu klucza.
2. Nowy walidator wykonuje lekkie GET /v1beta/models/gemini-3.8-flash z nagłówkiem x-goog-api-key. Pobiera tylko metadane modelu; nie generuje tekstu ani nie zużywa tokenów generacji.
3. Skrócono czas oczekiwania walidatora do 15 sekund i rozdzielono komunikaty błędu: timeout, DNS, połączenie, odrzucony klucz/model i zła odpowiedź.
4. Produkcyjny czat używa stabilnego endpointu Google Gemini Interactions API v1: POST /v1/interactions, stream=true, store=false.
5. Usunięto niestandardowy nagłówek Api-Revision. Pozostaje wyłącznie Gemini; bez OpenAI i bez Workers AI fallback.
6. Zachowano FIX164: klucz jest wklejany wyłącznie w ukrytym polu PowerShell w tym samym oknie CMD i przekazywany do Node przez stdin. Nie jest zapisywany do pliku, argumentów procesu, logów ani przeglądarki.

WAŻNE DLA TEGO URUCHOMIENIA
Poprzedni log kończył się przed zapisaniem GEMINI_API_KEY do Cloudflare. Klucz nie został zapisany. Po rozpakowaniu FIX165 trzeba wkleić go ponownie jeden raz w CMD. Po udanym zapisie kolejne uruchomienia nie będą pytać o klucz.

INSTALACJA
1. Zrób kopię G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełny ZIP FIX165 do G:\AKADEMIA_SERWISU_PRO i zastąp starsze pliki.
3. Uruchom WYKONAJ_TESTY_FIX165.cmd.
4. Gdy testy zakończą się kodem 0, uruchom START_FIX105.
5. Przy pierwszym pytaniu wklej klucz Gemini w CMD i naciśnij Enter.

JEŚLI POJAWI SIĘ BŁĄD
- HTTP 401/403: sprawdź, czy klucz pochodzi z Google AI Studio, nie jest ograniczony do innego API i czy Gemini API jest włączone.
- HTTP 404: konto/klucz nie widzi modelu gemini-3.8-flash.
- DNS: sprawdź DNS i dostęp do generativelanguage.googleapis.com.
- TIMEOUT: zapora, antywirus, proxy, DNS lub sieć może blokować dostęp do Google API.
- 429: limit API lub rozliczeń Google; to nie jest błąd wklejania klucza.

ZACHOWANE
Produkt 6.8.0, 35 widoków, 1083 lekcje, 19 zdjęć głównych, cache biblioteki zdjęć FIX135, logowanie/OAuth, istniejący Cloudflare Pages i istniejąca D1 naprawapc-orders. Bez nowych baz, tabel i migracji.

STATUS PUBLIKACJI
FIX165 przetestowano lokalnie. Nie wykonano wdrożenia produkcyjnego Cloudflare. To potwierdzi dopiero log START_FIX105 na komputerze użytkownika.
