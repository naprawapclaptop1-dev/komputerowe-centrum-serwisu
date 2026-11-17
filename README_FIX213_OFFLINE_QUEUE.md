# FIX213 — kolejka zmian offline

Kolejka zapisuje tylko metadane oczekujących kluczy, bez kopii treści stanu. Po odzyskaniu łączności ponawia synchronizację. Stany przekraczające limit 360 KB nie są bez końca ponawiane — użytkownik otrzymuje komunikat o konieczności zmniejszenia danych lub eksportu. Konflikty między urządzeniami nadal wymagają testu integracyjnego i świadomej polityki scalania.
