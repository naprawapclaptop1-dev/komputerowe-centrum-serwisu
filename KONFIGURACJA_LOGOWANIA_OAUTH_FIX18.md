# NAUKA OD A DO Z 6.7.0 FIX18B — diagnostyka konfiguracji kont i logowania zewnętrznego

## Co działa w kodzie

- Rejestracja i logowanie e-mail + hasło (istniejący mechanizm, PBKDF2-HMAC-SHA256).
- Google, Facebook, Microsoft, X, GitHub oraz Discord przez serwerowy OAuth Authorization Code.
- PKCE S256 dla Google, Microsoft, X, GitHub i Discord; state przechowywany jako skrót w D1 i sprawdzany razem z ciasteczkiem HttpOnly/Secure/SameSite=Lax.
- Pierwsze logowanie dostawcą tworzy profil. Jeżeli użytkownik jest już zalogowany i wybierze dostawcę w sekcji konta, metoda zostaje dołączona do obecnego profilu.
- Metody można przeglądać i odłączać w panelu konta. API nie pozwala odłączyć ostatniej metody logowania.
- Nie zapisujemy access tokenów dostawców ani nie łączymy kont na podstawie podobnego adresu e-mail. Nowe logowanie wymaga zaakceptowania zasad platformy; data i wersja zaakceptowanych zasad są zapisywane w profilu, osobno od dobrowolnej zgody synchronizacji nauki.
- Przycisk jest aktywny dopiero, gdy dla danego dostawcy ustawiono oba wymagane sekrety po stronie Cloudflare, dostępne jest D1, a migracje OAuth są zastosowane. Przyciski pozostają widoczne również wtedy, gdy metoda jest wyłączona; status przy przycisku wyjaśnia brak konfiguracji.

## Dokładny adres callback

W każdej aplikacji OAuth zarejestruj dokładnie ten adres (bez końcowego ukośnika):

`https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback`

Dla aplikacji lokalnej/preview dodaj osobny callback tylko wtedy, gdy skonfigurujesz HTTPS, host i cookies dla tego środowiska. Nie używaj `http://` na publicznej stronie.

## Sekrety Cloudflare Pages

Jeśli lokalny Wrangler nie jest jeszcze zainstalowany, uruchom `PRZYGOTUJ_WRANGLER_FIX18.cmd` (główne launchery robią to automatycznie; potrzebne jest połączenie z npm). Po utworzeniu aplikacji u dostawcy możesz dodać sekrety ręcznie w Cloudflare Dashboard → Workers & Pages → `naprawa-pc-akademia-serwisu-pro` → Settings → Variables and Secrets albo skorzystać z lokalnego okna `KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX18.cmd`. Konfigurator sprawdza właściwe konto i istniejący projekt, zapisuje tylko kompletne pary przez Wrangler `pages secret bulk`, weryfikuje nazwy zapisanych sekretów i nie uruchamia publikacji ani migracji. Dodaje wartości jako **Secrets** w środowisku Production (oraz osobno Preview, tylko jeśli faktycznie go używasz):

| Dostawca | Nazwa sekretu |
|---|---|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |

Opcjonalne zwykłe zmienne konfiguracji: `MICROSOFT_TENANT_ID` (domyślnie `common`) oraz `FACEBOOK_GRAPH_VERSION` (domyślnie `v26.0`). Nie umieszczaj sekretów w ZIP, kodzie JavaScript, repozytorium, `wrangler.toml`, `release.json` ani w wiadomości do asystenta.

## Rejestracja aplikacji u dostawców

- Google: utwórz OAuth Client ID typu Web application w Google Cloud Console; wpisz powyższy callback jako Authorized redirect URI. Zakresy są ograniczone do `openid profile`.
- Facebook: w Meta for Developers dodaj produkt Facebook Login i wpisz callback w Valid OAuth Redirect URIs. W trybie Development zalogują się tylko role/testerzy aplikacji; dla wszystkich użytkowników Meta może wymagać przeglądu aplikacji.
- Microsoft: zarejestruj aplikację w Microsoft Entra ID, dodaj Web redirect URI i wybierz obsługiwane typy kont. Domyślny tenant to `common`; dla organizacji można ustawić konkretny tenant.
- X: w X Developer Portal włącz OAuth 2.0 Authorization Code Flow with PKCE; dodaj callback jako Redirect URI i skonfiguruj aplikację jako confidential client z client secret. Wymagany jest wyłącznie zakres `users.read` do pobrania identyfikatora i nazwy profilu; aplikacja nie odczytuje wpisów ani nie publikuje postów.
- GitHub: utwórz OAuth App w Developer Settings i wpisz callback jako Authorization callback URL. Zakres to tylko `read:user`; aplikacja nie prosi o dostęp do repozytoriów.
- Discord: utwórz aplikację w Discord Developer Portal → OAuth2, dodaj callback jako Redirect URI i ustaw `identify`; aplikacja nie dołącza użytkownika do serwerów ani nie żąda zarządzania nimi.

## Kolejność bezpiecznego wdrożenia

1. Wykonaj kopię istniejącej bazy D1.
2. Uruchom testy FIX18 i lokalny podgląd.
3. Dodaj sekrety OAuth w Cloudflare (sekrety pozostają poza projektem).
4. Uruchom publikator z FIX18B. Przed migracją powinien sprawdzić, czy `release.json.build` jest identyczny z `meta[name=academy-build]`.
5. Publikator powinien wykonać kopię D1, a następnie zastosować oczekujące migracje `0008_social_login_x_github.sql`, `0009_discord_social_login.sql` i `0010_account_terms_and_oauth_consent.sql`. Zmieniają one wyłącznie ograniczenia tabel tożsamości i stanów OAuth, kopiując istniejące wpisy Google/Facebook/Microsoft oraz później X/GitHub/Discord.
6. Po publikacji otwórz panel „Moje konto i historia”. Diagnostyka pokaże osobno stan bindingu D1, migracji, Client ID i Client Secret. Endpoint `/api/auth/status` udostępnia wyłącznie nazwy brakujących sekretów — nigdy ich wartości — oraz porównuje build HTML z buildem API. Dostawcy z brakującymi sekretami pozostaną widoczni, ale wyłączeni.
7. Przetestuj każdy skonfigurowany dostawca na nowym profilu oraz podłączanie/odłączanie dostawcy na istniejącym koncie.

## Ważne ograniczenia

- Sam kod nie tworzy aplikacji OAuth i nie generuje client ID/secret. Te dane trzeba uzyskać z panelu każdego dostawcy.
- Adres e-mail dostawcy nie jest używany do automatycznego łączenia kont. Użyj najpierw istniejącej metody logowania, a następnie połącz nowego dostawcę z poziomu zalogowanego profilu.
- E-mail i hasło w istniejącym mechanizmie nie mają jeszcze potwierdzania e-mail ani resetu hasła e-mailem. Logowanie społecznościowe nie powinno być traktowane jako zamiennik skonfigurowanego procesu odzyskiwania.
- Nie przechowujemy tokenów dostawców. Aby cofnąć zgodę/aplikację, skorzystaj także z ustawień bezpieczeństwa Google, Meta, Microsoft, X lub GitHub.
- Migracje 0008 i 0009 rozszerzają dostawców OAuth, a 0010 zapisuje akceptację zasad i wymaga nowego checkboxa rejestracji społecznościowej. Nie uruchamiaj ich ręcznie na produkcji poza kontrolowanym publikowaniem z kopią D1.


## Discord
1. Utwórz aplikację w Discord Developer Portal i otwórz OAuth2.
2. Dodaj dokładnie `https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback` jako Redirect URI.
3. Skopiuj Client ID i wygeneruj Client Secret.
4. W Cloudflare Pages → Settings → Variables and Secrets dodaj `DISCORD_CLIENT_ID` oraz zaszyfrowany `DISCORD_CLIENT_SECRET`.
5. Zapisz ustawienia i wykonaj nową publikację po kopii D1 oraz zastosowaniu migracji 0009.

## Zarządzanie sesjami
Po zalogowaniu profil pokazuje bieżącą i pozostałe aktywne sesje. Przycisk „Wyloguj pozostałe urządzenia” usuwa tylko sesje poza bieżącą. Lista nie przechowuje adresów IP ani odcisków urządzeń.


## Bezpieczeństwo konta
Panel profilu pokazuje aktywne sesje wraz z datą utworzenia i wygaśnięcia. Funkcja „Wyloguj pozostałe urządzenia” usuwa inne sesje, pozostawiając bieżącą. Nie pokazujemy ani nie zapisujemy w tym widoku adresów IP, dokładnej lokalizacji czy odcisków przeglądarki.


## Diagnostyka FIX18B — dlaczego przycisk jest wyłączony
- **Brak bazy D1** — binding produkcyjny o nazwie `DB` nie jest dostępny dla Pages Functions.
- **Migracja D1** — endpoint `GET /api/auth/status` sprawdza tabele, kolumny i ograniczenia dla Google/Facebook/Microsoft/X/GitHub/Discord. Braki pokazuje przy metodach logowania; start OAuth zostaje wstrzymany do czasu zastosowania migracji.
- **Konfiguracja OAuth** — status wyświetla nazwy brakujących sekretów, np. `GOOGLE_CLIENT_ID` lub `GOOGLE_CLIENT_SECRET`. Wartości sekretów nigdy nie są zwracane do przeglądarki.
- **Inna wersja strony/API** — strona porównuje `meta[name=academy-build]` z buildem zwróconym przez API. Niezgodność oznacza, że nowy HTML i Functions nie zostały wdrożone razem.
- **Błąd wymiany tokenu** — sprawdź Client ID, Client Secret oraz dokładny callback zapisany u dostawcy.
- **Błąd weryfikacji profilu** — sprawdź typ aplikacji, typ konta, scope oraz ustawienia produkcyjne/testowe dostawcy.

FIX18B nie aktywuje dostawcy bez prawdziwego Client ID i Client Secret. Samo utworzenie przycisku, wpisanie danych do lokalnego konfiguratora ani zapis sekretów bez nowego wdrożenia Pages nie wystarczy. Po zapisaniu sekretów uruchom publikator ponownie, aby nowa wersja Functions dostała sekrety w środowisku Production.


Po publikacji możesz uruchomić `CHECK_LOGOWANIA_OAUTH_FIX18B.cmd`. To wyłącznie odczytowy test publicznego `/api/auth/status`: pokazuje brak D1, migracji lub nazw sekretów i nie wykonuje żadnych zmian.
