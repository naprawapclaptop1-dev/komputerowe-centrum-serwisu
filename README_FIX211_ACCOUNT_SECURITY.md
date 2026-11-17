# FIX211 — historia bezpieczeństwa konta

Dodano addytywną tabelę `academy_security_events` i endpoint historii dla zalogowanego użytkownika. Rejestrowane są wybrane zdarzenia OAuth, 2FA i odwołania sesji. Nie zapisujemy surowego IP, user-agentów, sekretów, haseł ani tokenów. Zastosowanie migracji `0020_account_security_events_fix211.sql` jest wymagane przed produkcyjnym użyciem.
