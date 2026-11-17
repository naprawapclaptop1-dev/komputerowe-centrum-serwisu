NAUKA OD A DO Z — FIX63 CLOUDFLARE BRANCH DISCOVERY
Wydanie produktu: 6.8.0 (FIX51 + FIX54–FIX62 + FIX63)

CEL
Poprzedni log pokazał, że Wrangler 4.156.0 wyświetlał listę projektów Pages bez pola production_branch. FIX63 usuwa zależność od zgadywania gałęzi i odczytuje ustawienie projektu z oficjalnego Cloudflare Pages API.

JAK DZIAŁA
1. Watcher uruchamia istniejący Wrangler i potwierdza dokładny projekt Pages.
2. Jeśli lista Wrangler zawiera production_branch, wykorzystuje tę wartość.
3. Jeśli pola brakuje, FIX63 pyta GET /client/v4/accounts/{account_id}/pages/projects/{project_name}.
4. Uwierzytelnienie: najpierw CLOUDFLARE_API_TOKEN, a następnie istniejący oauth_token z profilu Wrangler default.toml (Windows: %APPDATA%\xdg.config\.wrangler\config\default.toml).
5. Token jest używany tylko w pamięci procesu, nie jest logowany ani zapisywany w projekcie.
6. Odczytana gałąź jest przekazywana do `wrangler pages deploy --branch`. Nie ma już domyślnego założenia `main`.
7. Gdy API i Wrangler nie dostarczą gałęzi, używany jest wyłącznie jawny wpis w CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt. Bez niego publikacja jest blokowana.
8. Gdy ręczne potwierdzenie jest sprzeczne z API, publikacja jest blokowana.

URUCHOMIENIE
1. Rozpakuj pełny ZIP do nowego folderu lub scal z kopią roboczą po wykonaniu backupu.
2. Uruchom WYKONAJ_TESTY_FIX63.cmd.
3. Dopiero po PASS uruchom ONECLICK_AKADEMIA.cmd.

BEZPIECZEŃSTWO
- Nie zmienia sekretu OPENAI_API_KEY.
- Nie zapisuje tokenu Wrangler do plików projektu ani logów.
- Nie tworzy nowego projektu Pages ani nowej bazy D1.
- Nie wykonuje migracji SQL w ramach testów FIX63.
- Nie omija kontroli gałęzi; pobiera ją z ustawień Cloudflare.

OGRANICZENIA
FIX63 nie może użyć poświadczeń z zaszyfrowanego keyringu, jeśli nie ma zwykłego profilu TOML ani CLOUDFLARE_API_TOKEN. W takim przypadku nadal działa ręczny fallback. Nie przeprowadzono rzeczywistego żądania do konta Cloudflare z tego środowiska; testy API używają odpowiedzi symulowanych. Pierwsze uruchomienie na Windows zweryfikuje uprawnienia istniejącego logowania.
