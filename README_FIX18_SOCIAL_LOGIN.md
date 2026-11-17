# NAUKA OD A DO Z 6.7.0 FIX18

## Najważniejsze zmiany

- Logowanie/rejestracja: Google, Facebook, Microsoft, X (dawniej Twitter), GitHub i Discord.
- E-mail + hasło pozostaje dostępne.
- Dodano panel aktywnych sesji i wylogowanie pozostałych urządzeń.
- Zarządzanie połączonymi metodami logowania oraz blokada odłączenia ostatniej metody.
- Serwerowy OAuth z state, krótkim czasem ważności i PKCE S256 tam, gdzie dostawca obsługuje ten mechanizm.
- Ograniczenie liczby prób uruchomienia OAuth.
- Akceptacja zasad i polityki prywatności przy nowym logowaniu społecznościowym, z zapisem daty i wersji zasad (migracja 0010).
- Weryfikacja, czy sesja użytkownika nadal jest aktywna przy łączeniu kolejnego dostawcy.
- X wymaga tylko users.read — bez dostępu do wpisów.
- Migracje `0008_social_login_x_github.sql`, `0009_discord_social_login.sql` i `0010_account_terms_and_oauth_consent.sql` zachowują istniejące powiązania i zapisują zgodę na zasady dla nowych kont.
- Naprawiony publikator: `academy-build` musi dokładnie odpowiadać `release.json.build`. To usuwa błąd z logu FIX17, gdzie walidator sprawdzał prefix `6.5.0-` mimo wydania 6.6.0.

## Uruchomienie lokalne

1. Rozpakuj całą paczkę do nowego katalogu.
2. Uruchom `WYKONAJ_TESTY_FIX18.cmd`.
3. Uruchom `PODGLAD_LOKALNY_FIX18.cmd`.
4. Otwórz `http://127.0.0.1:8765/`.

W trybie lokalnego podglądu API kont i rzeczywiste przekierowania OAuth wymagają działającego Cloudflare Pages Functions, produkcyjnej domeny HTTPS i sekretów dostawców.

## Aktywacja logowania społecznościowego

1. Utwórz aplikację OAuth u wybranego dostawcy i zarejestruj callback `https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback`.
2. Uruchom `KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX18.cmd`. Jeśli w paczce brakuje lokalnego Wrangler, launcher przygotuje go automatycznie przez npm (wymagane połączenie z Internetem); instalacja nie publikuje strony i nie zmienia D1. Następnie otworzy się formularz działający tylko na `127.0.0.1`.
3. Wklej Client ID oraz Client Secret wybranych dostawców i zapisz. Konfigurator zapisuje wartości jako Cloudflare Pages Secrets; nie wkłada ich do ZIP ani plików projektu.
4. Uruchom `URUCHOM_AKADEMIE.cmd`, aby bezpieczny publikator sprawdził dokładny build, wykonał kopię D1 i zastosował oczekujące migracje.
5. Po publikacji odwiedź `/api/auth/status`. Nie skonfigurowane przyciski pozostaną wyłączone.

Samo pobranie FIX18 nie tworzy aplikacji u Google/Meta/Microsoft/X/GitHub/Discord. Klucze Client ID/Secret trzeba wygenerować w ich panelach. Nie wysyłaj Client Secret przez czat.

## Narzędzia Cloudflare

W paczce jest `PRZYGOTUJ_WRANGLER_FIX18.cmd`. Główne launchery uruchamiają go automatycznie, gdy nie znajdą `TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js`. Skrypt pobiera przypiętą wersję Wrangler 4.156.0 z npm. To wymaga Internetu i Node.js/npm; po instalacji nie wykonuje wdrożenia ani migracji.

## Wdrożenie

Nie wykonano publikacji FIX18 ani migracji D1 w ramach przygotowania archiwum. Konfigurator sekretów działa osobno i nie uruchamia deploy ani migracji. Zapoznaj się z `KONFIGURACJA_LOGOWANIA_OAUTH_FIX18.md` i wykonaj kopię bazy przed publikacją.

Panel profilu zawiera także zarządzanie sesjami: podgląd czasu utworzenia i wygaśnięcia oraz wylogowanie pozostałych urządzeń.
