NAUKA OD A DO Z — 6.8.0 FIX23
POPRAWKA LIMITERA LOGOWANIA; BEZ INTEGRACJI GOOGLE DRIVE / ONEDRIVE / DROPBOX

CO ZMIENIONO
- Usunięto z Akademii funkcje automatycznych kopii do Google Drive, Microsoft OneDrive i Dropbox.
- Usunięto ich panel użytkownika, skrypt przeglądarkowy, API, middleware, konfigurator OAuth i tabele D1.
- Zachowano istniejący panel profilu i serwerową synchronizację historii nauki Akademii; nie jest to integracja z zewnętrznym dyskiem chmurowym.
- Zachowano dotychczasowe lokalne kopie JSON postępów/narzędzi oraz kopię produkcyjnej bazy D1 wykonywaną przez publikator przed migracjami.
- Zachowano poprawkę limitera z FIX22: nowa tabela academy_account_rate_limits_v2 ma bucket_key PRIMARY KEY. Wadliwa, historyczna academy_account_rate_limits pozostaje nietknięta.
- /api/session nadal raportuje bezpieczny numer diagnostyczny przy nieoczekiwanym błędzie; log nie zapisuje hasła, e-maila ani treści żądania.

PUBLIKACJA
1. Rozpakuj cały ZIP do nowego folderu obok poprzedniego projektu.
2. Uruchom WYKONAJ_TESTY_FIX23.cmd i przerwij, jeśli którykolwiek test nie przejdzie.
3. Uruchom URUCHOM_AKADEMIE.cmd. Publikator potwierdzi istniejący projekt Pages i binding D1.
4. Przed migracją wykona eksport istniejącej bazy D1. Jeśli eksport się nie powiedzie lub będzie pusty, migracja zostanie zatrzymana.
5. Zastosuje addytywną migrację 0014_account_limiter_key_repair.sql, która tworzy wyłącznie dedykowany limiter v2.
6. Po publikacji uruchom CHECK_KONTA_FIX23.cmd. Test negatywny używa wyłącznie adresu .invalid i nie tworzy konta.

WAŻNE
- Pakiet lokalny nie jest automatycznie opublikowany.
- Nie uruchamia integracji dysków Google/Microsoft/Dropbox.
- Migracja 0014 nie usuwa ani nie przebudowuje starych tabel; dodaje oddzielną tabelę limitera.
- Kopia D1 obejmuje istniejącą bazę produkcyjną, nie pełny eksport plików WWW ani sekretów Cloudflare.
