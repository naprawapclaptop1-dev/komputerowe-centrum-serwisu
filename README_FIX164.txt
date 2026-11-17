NAUKA OD A DO Z — FIX164
NAPRAWA WKLEJANIA KLUCZA GEMINI W CMD
Produkt: 6.8.0

PRZYCZYNA PROBLEMU FIX163
Poprzedni konfigurator przełączał wejście Node.js w tryb raw (setRawMode).
W części konfiguracji CMD / Windows Terminal tryb ten przechwytywał Ctrl+V
lub wklejanie prawym przyciskiem. Po naciśnięciu Enter Node otrzymywał pusty
tekst i zgłaszał „Wklej cały klucz Gemini”.

ROZWIĄZANIE FIX164
1. START_FIX105 uruchamia skrypt configure-gemini-secret.ps1 w tym samym oknie.
2. PowerShell używa Read-Host -AsSecureString. Znaki klucza są maskowane gwiazdkami; sama wartość pozostaje niewidoczna.
3. Skopiuj klucz w Google AI Studio, wróć do tego samego okna i wklej go
   standardową metodą obsługiwaną przez konsolę (Ctrl+V, Ctrl+Shift+V lub
   Shift+Insert — zależnie od terminala).
4. Naciśnij Enter. PowerShell przekazuje klucz do procesu Node wyłącznie przez
   zamknięte standardowe wejście (stdin). Nie tworzy pliku tymczasowego i nie
   umieszcza klucza w argumentach procesu ani w zmiennej środowiskowej.
5. Node sprawdza klucz przez Google Gemini, a następnie zapisuje go jako sekret
   GEMINI_API_KEY do istniejącego projektu Cloudflare Pages Production.
6. Przy kolejnych uruchomieniach START_FIX105 sprawdza sekret i nie pyta ponownie.

OFICJALNA STRONA KLUCZY
https://aistudio.google.com/api-keys

ZMIANA KLUCZA
Uruchom USTAW_KLUCZ_GEMINI.cmd. Ta operacja wymusza wprowadzenie nowego klucza
w tym samym oknie CMD i zastępuje sekret w istniejącym Cloudflare Pages.

CO ZACHOWANO
- Google Gemini pozostaje jedynym dostawcą nauczyciela AI.
- Zakres AI pozostaje ograniczony do nauki, diagnostyki, napraw i konserwacji PC/laptopów.
- Projekt Pages, konto Cloudflare i baza D1 pozostają te same.
- Produkt 6.8.0, 35 widoków, 1083 lekcje i biblioteka zdjęć pozostają bez zmian.
- Brak zmian w schemacie D1 i brak nowych baz.

TESTY
Uruchom WYKONAJ_TESTY_FIX164.cmd.
Raport szczegółowy: RAPORT_FIX164_TESTY.log.

UWAGA
To wydanie naprawia lokalny konfigurator i pakiet CMD. Nie publikuje samoistnie
zmian w Cloudflare; START_FIX105 kontynuuje zwykłą kontrolę i publikację dopiero
po poprawnym zapisaniu klucza.
