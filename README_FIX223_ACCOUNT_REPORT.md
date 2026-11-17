# FIX223 — eksport raportu bezpieczeństwa konta

Panel profilu umożliwia pobranie JSON z listą połączonych dostawców, stanem weryfikacji e-mail/2FA, podstawowymi znacznikami czasu sesji oraz zdarzeniami konta. Raport celowo wyklucza hasła, tokeny, sekret TOTP, adres IP, user-agent i identyfikatory sesji. Zdarzenia pochodzą z istniejącego, filtrowanego rejestru bezpieczeństwa.
