# FIX232 — centrum powiadomień

- Skrzynka powiadomień D1 z odczytem pojedynczym i zbiorczym.
- Kategorie: ogłoszenia, zadania, oddane prace, oceny, egzaminy, bezpieczeństwo i platforma. Wyłączenie kategorii blokuje wpis w skrzynce oraz kanały Push/e-mail tej kategorii.
- Web Push korzysta z VAPID ES256 oraz szyfrowania payloadu AES128GCM. Endpointy są ograniczone do hostów push przeglądarek: Google FCM, Mozilla, Apple i Windows.
- E-mail jest opcjonalny; wymaga `RESEND_API_KEY`, `AUTH_EMAIL_FROM` oraz potwierdzonego adresu użytkownika.

## Konfiguracja Web Push

1. Uruchom `GENERUJ_KLUCZE_PUSH_FIX232.cmd` lokalnie. Skrypt tworzy `config/VAPID_KEYS_LOCAL_ONLY.txt`; plik jest wpisany do `.gitignore`.
2. Zmień `VAPID_SUBJECT` na poprawny `mailto:` administratora.
3. Dodaj wartości jako sekrety Cloudflare Pages Production: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY_PKCS8`, `VAPID_SUBJECT`. Powtórz osobno dla Preview, jeśli potrzebne.
4. Nigdy nie kopiuj klucza prywatnego do HTML, JS, `release.json`, ZIP ani logów.

`VAPID_PRIVATE_KEY_PKCS8` to base64 DER PKCS#8 P-256. `VAPID_PUBLIC_KEY` to base64url 65-bajtowego punktu P-256.

Test kryptograficzny: `node scripts/test-fix232-web-push.mjs`. Test używa wyłącznie lokalnie generowanych kluczy i mockowanego fetch; nie wysyła prawdziwych pushy.


## Wyłączenie Push na urządzeniu

Przycisk wyłączenia usuwa wyłącznie subskrypcję bieżącej przeglądarki. Nie kasuje subskrypcji innych urządzeń ani nie wyłącza globalnej preferencji konta. Globalne wyłączenie wszystkich powiadomień Push odbywa się przez przełącznik preferencji Push.
