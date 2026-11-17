NAPRAWA PC — AKADEMIA SERWISU PRO 4.0.0
========================================

Jest to kontynuacja projektu 3.9.10. Rozpakuj pełne archiwum w dotychczasowym
katalogu projektu, zachowując lokalne TOOLS_CLOUDFLARE, wrangler.toml,
BACKUPS_D1 i własne kopie konfiguracji.

Start i publikacja:
1. Uruchom URUCHOM_AKADEMIE.cmd zgodnie z dotychczasową procedurą.
2. Zachowaj istniejące logowanie Cloudflare i sekret OPENAI_API_KEY.
3. Nie wykonuj resetu D1 ani nie usuwaj migracji.
4. Wersja 4.0.0 nie dodaje migracji D1; istniejąca baza pozostaje bez zmian.

Nowy moduł assets/academy-expansion.js dopisuje 80 lekcji do istniejącego
window.ACADEMY_DATA.courseLessons. Identyfikatory LAB4-001…LAB4-080 są
dodawane bez duplikowania, więc ponowne załadowanie skryptu nie dubluje rekordów.

Wszystkie dotychczasowe funkcje i materiały pozostają w WEB_PUBLISH.
