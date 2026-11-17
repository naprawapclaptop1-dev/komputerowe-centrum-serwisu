CLOUDFLARE FREE — FIX067

Użytkownik uruchamia wyłącznie URUCHOM_WSZYSTKO.cmd. Ten plik buduje, weryfikuje i publikuje program.

Cloudflare:
- Pages: kcs-rj2026-updates
- Host: kcs-rj2026-updates.pages.dev
- R2 bucket: kcs-rj2026-updates-store
- Pages Function: /updates/*, binding UPDATES.
- Pliki R2 są pobierane i wysyłane z `--remote`, aby używać zdalnego bucketu.

Publikowane obiekty:
- KomputeroweCentrumSerwisu_FIX067_INSTALATOR.exe
- manifest-stable.xml
- manifest-beta.xml
- releases.json

Kontrole po publikacji:
- Produkcyjne deployment Pages.
- DNS i HTTPS.
- Health endpoint.
- Binding R2 i obecność obiektów.
- Oba manifesty: wersja, kanał, SHA-256 i signerThumbprint.
- releases.json: Stable/Beta, URL pakietu, SHA-256 i signerThumbprint.
- HEAD 200 i HTTP Range 206 dla instalatora.

Pobieranie:
- Użytkownik nie wpisuje serwerów ani manifestów.
- Podpis Authenticode jest opcjonalny; po podpisaniu manifest przechowuje thumbprint.
- Jeżeli thumbprint jest przypięty, klient odrzuci instalator bez prawidłowego podpisu z tym certyfikatem.

Publikacja nie jest uznana za udaną, jeżeli pages.dev nie rozwiązuje się w DNS, deployment nie jest produkcyjny lub brakuje obiektów w R2.
