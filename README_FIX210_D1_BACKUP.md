# FIX210 — kopia D1 przed migracją

Dodano skrypt eksportujący istniejącą bazę D1 przez `wrangler d1 export --remote`. Skrypt nie tworzy bazy i nie stosuje migracji. Wymaga jawnego wskazania nazwy istniejącej bazy oraz konfiguracji Wrangler zawierającej binding DB. Przed uruchomieniem wykonuje kontrolę ścieżki, nazwy i pyta o potwierdzenie. Manifest zawiera SHA-256. Testy lokalne nie potwierdzają połączenia z kontem Cloudflare.
