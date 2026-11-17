# FIX197 — logowanie zewnętrzne NAUKA OD A DO Z 6.8.0

## Aktywne metody

- Google
- Microsoft
- Facebook
- GitHub
- Discord

X jest wyłączony: nie ma przycisku, nie jest dostępny w backendowej allowliście, konfiguratorze sekretów ani API zarządzania tożsamościami. Starsze tabele D1 zachowują zgodność z dawnymi rekordami X, aby nie usuwać danych historycznych; te rekordy nie oznaczają, że X można użyć do nowego logowania.

## Konfiguracja GitHub

W panelu aplikacji OAuth GitHub ustaw dokładny callback:

`https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback`

Zapisz w lokalnym konfiguratorze parę sekretów: `GITHUB_CLIENT_ID` i `GITHUB_CLIENT_SECRET`. Żądany zakres w kodzie: `read:user`; przepływ autoryzacji używa `state` i PKCE S256.

## Konfiguracja Discord

W panelu Developer Portal aplikacji Discord dodaj ten sam redirect URI:

`https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback`

Zapisz w lokalnym konfiguratorze: `DISCORD_CLIENT_ID` i `DISCORD_CLIENT_SECRET`. Kod używa zakresu `identify` i PKCE S256.

## Bezpieczny zapis sekretów

Uruchom istniejący lokalny konfigurator `scripts/configure-oauth-secrets.js` (lub jego plik startowy z pakietu). Działa na `127.0.0.1`, nie wypisuje wartości sekretów, nie zapisuje ich do `wrangler.toml`, `.env` ani argumentów procesu. Możesz wprowadzić tylko pary dostawców, które już masz skonfigurowane.

## Kontrola

Uruchom `node scripts/run-tests-fix197.mjs`. Testy lokalne potwierdzają kontrakt i mockowane przepływy callbacków, ale nie zastępują logowania testowego na prawdziwych aplikacjach OAuth. Po dodaniu sekretów wymagane jest ponowne wdrożenie Pages. Nie publikuj sekretów w zgłoszeniach ani w czacie.
