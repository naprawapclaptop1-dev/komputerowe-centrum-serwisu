FIX74 — INSTRUKCJA
===================

1. Rozpakuj pełny ZIP do nowego folderu lub skopiuj całą zawartość do kopii
   roboczej projektu, zachowując konfigurację i folder TOOLS_CLOUDFLARE.
2. Uruchom WYKONAJ_TESTY_FIX74.cmd.
3. Sprawdź wynik na Node.js 24.19.0 w Windows.
4. Dopiero po zaliczeniu testów uruchom ONECLICK_AKADEMIA.cmd.

Poprawka zmienia wyłącznie wyznaczanie ścieżki ROOT w teście składni oraz
integruje regresję FIX74 z OneClick i Watcherem.

Nie wykonuj ręcznie migracji D1. Dwie historyczne migracje 0008 i 0009 nadal
wymagają osobnej oceny, a FIX74 nie modyfikuje ich zawartości.

Nie zmieniaj ani nie wklejaj klucza OpenAI do plików projektu. Używany jest
istniejący sekret Cloudflare.

Uwaga: log 6.11.2026 wskazywał także wcześniejszą blokadę production_branch.
FIX74 naprawia błąd G:\G:\...; nie wymusza i nie zgaduje gałęzi produkcyjnej.
