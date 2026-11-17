NAUKA OD A DO Z 6.8.0 — FIX25

PRZYCZYNA
FIX24 dochodził do etapu login-password-kdf, ponieważ functions/api/session.js i reset hasła wywoływały WebCrypto PBKDF2 z 210 000 iteracji. Cloudflare Workers odrzuca PBKDF2 powyżej 100 000 iteracji komunikatem NotSupportedError. Dlatego test fikcyjnego adresu kończył się HTTP 503 jeszcze przed porównaniem hasła.

NAPRAWA
- Jeden wspólny moduł functions/_password-kdf.js obsługuje rejestrację, logowanie i reset.
- PBKDF2-HMAC-SHA-256: 100 000 iteracji (maksimum akceptowane przez Workers WebCrypto).
- password_salt zawiera identyfikator: pbkdf2-sha256$100000$ oraz losową 16-bajtową sól.
- Brak konta lub starsza niewersjonowana sól uruchamia dummy KDF i ogólny HTTP 401. Nie ujawniamy, czy adres istnieje.
- Nowa rejestracja i reset nadal wymagają minimum 12 znaków; logowanie istniejących haseł nie wprowadza nowego limitu długości.

WAŻNE O STARYCH HASHACH
Wersje FIX19B–FIX24 zapisywały niewersjonowaną sól i żądały 210 000 iteracji. Cloudflare Workers nie może ponownie obliczyć takiego KDF przez WebCrypto. Jeśli w bazie istnieje konto z hashem utworzonym poza Workers przy 210 000 iteracji, trzeba użyć resetu hasła (jeśli poczta Resend jest skonfigurowana). Sam rekord konta i sesje nie są kasowane. Rejestracja i reset w działającym środowisku Cloudflare będą od teraz tworzyć prawidłowy format FIX25.

URUCHOMIENIE
1. Rozpakuj ZIP do nowego folderu.
2. Uruchom WYKONAJ_TESTY_FIX25.cmd.
3. Uruchom URUCHOM_AKADEMIE.cmd. Publikator sprawdzi projekt i binding, wykona kopię D1, nie dodając nowej migracji tylko dla KDF, następnie opublikuje Functions i stronę.
4. Po publikacji uruchom CHECK_KONTA_FIX25.cmd. Fikcyjny adres .invalid musi zwrócić HTTP 401 LOGIN_FAILED.
5. Przetestuj rejestrację i reset na własnym koncie.

BEZPIECZEŃSTWO I OGRANICZENIA
- Nie ma integracji Google Drive, OneDrive ani Dropbox.
- Nie zmieniamy ani nie usuwamy istniejących tabel kont, sesji ani limitera V3.
- Nie dodano migracji D1; wymagane migracje pozostają 0013–0015.
- 100 000 iteracji jest ograniczeniem zgodności Cloudflare Workers, a nie idealnym celem dla nowego systemu haseł. Dalsze podniesienie odporności wymaga KDF obsługiwanego w tym runtime (np. sprawdzonej implementacji Argon2id) albo wydzielonego serwera uwierzytelniania.
- FIX25 nie został opublikowany z tego środowiska.
