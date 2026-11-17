NAUKA OD A DO Z 6.8.0 — FIX113

CEL
Poprawka testu regresji FIX112, który ustawiał nieprawidłowy port proxy 99999. Node.js 26 parsuje proxy podczas inicjalizacji globalnego agenta HTTP i kończy proces przed uruchomieniem testu.

ZMIANY
1. Ustawiany jest poprawny składniowo, lecz niedostępny proxy URL http://127.0.0.1:65534.
2. NO_PROXY i no_proxy obejmują localhost oraz 127.0.0.1.
3. NODE_USE_ENV_PROXY=1 pozostaje aktywne, aby objąć testem mechanizm proxy Node.js.
4. Lokalny serwer jest testowany przez http.request i agent:false, z dynamicznym portem, HEAD, 32 zasobami i ochroną path traversal.
5. OneClick i Watcher uruchamiają test-global-academy-http-proxy-fix113.mjs.

URUCHOMIENIE
Uruchom WYKONAJ_TESTY_FIX113.cmd. Wyniki zapisują się w RAPORT_FIX113_TESTY.log. Po pozytywnym wyniku można ponowić standardowy bezpieczny start publikacji.

UWAGA
Poprzednia próba publikacji zatrzymała się przed migracjami i wysłaniem plików. FIX113 nie zmienia bazy D1 ani jej bindingu. Wersja produktu pozostaje 6.8.0.

WERYFIKACJA W TYM ŚRODOWISKU
Pełny zestaw FIX113 przeszedł na Node.js v22.16.0: 52/52 regresje publikacyjne i 9/9 kontroli składni. Środowisko robocze nie ma Node.js v26.13.0, więc końcowy test zgodności z konkretnym runtime należy wykonać na komputerze Windows, uruchamiając WYKONAJ_TESTY_FIX113.cmd.
