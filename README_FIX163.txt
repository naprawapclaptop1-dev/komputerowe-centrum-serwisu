NAUKA OD A DO Z — DLA WSZYSTKICH
FIX163 — GEMINI ONLY / KLUCZ WYŁĄCZNIE W CMD
Produkt: 6.8.0
Runtime: FIX163

NAJWAŻNIEJSZE
Nauczyciel AI korzysta teraz wyłącznie z Google Gemini (Interactions API, model gemini-3.8-flash).
Klucz API wkleja się wyłącznie w oknie CMD. Na stronie WWW nie ma pola do wpisywania klucza.
Asystent obsługuje tylko naukę, diagnostykę, naprawę, konserwację i konfigurację komputerów stacjonarnych oraz laptopów.

PIERWSZE URUCHOMIENIE — KLUCZ GEMINI
1. Rozpakuj cały ZIP do katalogu projektu, zachowując strukturę katalogów.
2. Uruchom WYKONAJ_TESTY_FIX163.cmd. Poczekaj na STATUS: PASS.
3. Uruchom START_FIX105 (plik URUCHOM_NAUKE_OD_A_DO_Z.cmd).
4. Jeżeli w istniejącym projekcie Cloudflare Pages nie ma sekretu GEMINI_API_KEY, CMD wyświetli oficjalny link:
   https://aistudio.google.com/api-keys
   CMD może otworzyć ten adres w przeglądarce. W przeglądarce utwórz/skopiuj klucz, ale NIE wklejaj go do przeglądarki ani do strony Akademii.
5. Utwórz nowy klucz w AI Studio (nowe klucze są obecnie kluczami autoryzacyjnymi), skopiuj go, wróć do tego samego okna CMD, wklej klucz w ukrytym polu i naciśnij Enter. Wpisywane znaki nie są wyświetlane. Nie używaj starego standardowego klucza, który może być odrzucony przez aktualne wymagania Gemini.
6. Skrypt sprawdzi połączenie z Gemini. Dopiero po poprawnej odpowiedzi zapisze klucz jako sekret GEMINI_API_KEY w istniejącym Cloudflare Pages Production przez Wrangler stdin.
7. CMD sprawdzi, czy sekret o tej nazwie istnieje, a następnie przejdzie do dotychczasowego OneClick.

KOLEJNE URUCHOMIENIA
Jeśli GEMINI_API_KEY istnieje w Cloudflare Pages Production, START_FIX105 nie pyta ponownie o klucz.
Nie zapisuj klucza do plików projektu, .env, .dev.vars, skryptów, logów ani czatu.

ZMIANA KLUCZA
Uruchom USTAW_KLUCZ_GEMINI.cmd. CMD ponownie pokaże link do Google AI Studio, przyjmie nowy klucz w ukrytym polu, zweryfikuje go i zastąpi sekret produkcyjny.
Stary plik USTAW_KLUCZ_OPENAI.cmd pozostał tylko dla zgodności ze starszymi skrótami i przekierowuje do konfiguratora Gemini.
Stary scripts/configure-openai-secret.js jest wyłącznie komunikatem zgodności; nie zapisuje i nie uruchamia klucza OpenAI.

ZAKRES ASYSTENTA AI
Dozwolone: nauka serwisu komputerowego, diagnostyka i naprawa komputerów/laptopów, podzespoły PC, płyty główne, CPU, GPU, RAM, VRAM, dyski, BIOS/UEFI, Windows, sterowniki, rozruch, chłodzenie i konfiguracja PC.
Wi-Fi, Ethernet, DHCP, DNS i router są omawiane wyłącznie w kontekście diagnostyki połączenia komputera lub laptopa.
Blokowane: tematy niezwiązane z komputerami oraz naprawy telefonów, iPhone'ów, iPadów, tabletów, konsol, drukarek, telewizorów, aparatów, urządzeń AGD, samochodów i motocykli.
Serwer /api/chat sprawdza zakres przed wywołaniem Gemini. Pytania poza zakresem otrzymują HTTP 403 i nie są wysyłane do Google.
Nie ma awaryjnego przełączenia na OpenAI ani Cloudflare Workers AI.

BEZPIECZEŃSTWO I DANE
- GEMINI_API_KEY znajduje się wyłącznie w Cloudflare Pages Production Secret; nie jest wysyłany do przeglądarki.
- CMD wprowadza klucz w trybie ukrytym.
- Klucz jest przekazywany do Wrangler przez stdin; brak pliku tymczasowego z kluczem.
- Przed zapisaniem wykonywane jest połączenie testowe z Gemini.
- Żądania Gemini używają store:false. Historia rozmowy platformy może być zachowana w istniejącej bazie D1 po zgodzie użytkownika.
- Nie dodano bazy D1, tabel ani migracji.
- Istniejący sekret OPENAI_API_KEY nie jest używany przez aktywny czat Gemini. Nie jest automatycznie usuwany, aby nie wykonywać nieuzgodnionej operacji na sekretach konta.

ZACHOWANE ELEMENTY
Produkt 6.8.0; istniejący projekt Pages naprawa-pc-akademia-serwisu-pro; istniejąca baza naprawapc-orders; konta i OAuth; 35 widoków; 1083 lekcje; biblioteka zdjęć i istniejący cache zdjęć FIX135. Brak nowych widoków i migracji D1.

TESTY I OGRANICZENIA
Uruchom: WYKONAJ_TESTY_FIX163.cmd
Wynik ostatniego lokalnego przebiegu: STATUS: PASS. Raport: RAPORT_FIX163_TESTY.log.
Testy sprawdzają kod, reguły zakresu, konfigurator CMD, brak formularza klucza w WWW, brak OpenAI/Workers AI w aktywnym czacie i regresję wcześniejszych modułów.
Nie wykonywano produkcyjnej publikacji Cloudflare w ramach przygotowania tej paczki. Pełny test E2E w Chromium nie został zaliczony; wymaga sprawdzenia po instalacji i publikacji.

Oficjalne tworzenie klucza: https://aistudio.google.com/api-keys
