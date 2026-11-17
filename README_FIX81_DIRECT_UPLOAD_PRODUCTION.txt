NAUKA OD A DO Z — FIX81
CLOUDFLARE PAGES DIRECT UPLOAD: NAPRAWA CELU PRODUKCYJNEGO

PRZYCZYNA
Projekt Pages naprawa-pc-akademia-serwisu-pro ma Direct Upload (Git Provider: No).
Poprzedni watcher uruchamiał:
  wrangler pages deploy WEB_PUBLISH --project-name ... --branch main
W Pages Direct Upload flaga --branch tworzy deployment gałęzi/podglądu. W efekcie
Cloudflare zwracał adres hash.pages.dev, ale główny adres projektu pages.dev nadal
serwował stary build FIX51.

POPRAWKA
FIX81 zachowuje odczyt Production Branch przez Pages API i sprawdzenie wartości main,
ale do produkcyjnego Direct Upload przekazuje:
  wrangler pages deploy WEB_PUBLISH --project-name naprawa-pc-akademia-serwisu-pro --commit-dirty --commit-message ...
Bez --branch i bez --env preview. Dla Direct Upload brak --branch kieruje wdrożenie
do środowiska produkcyjnego. Test FIX81 blokuje powrót flagi --branch.

TESTY
Uruchom WYKONAJ_TESTY_FIX81.cmd.
Runner uruchamia wszystkie 37 testów bazowych FIX80 oraz nową regresję FIX81.

NASTĘPNIE
Po pozytywnym wyniku uruchom standardowy URUCHOM_NAUKE_OD_A_DO_Z.cmd / OneClick.
Watcher po wysłaniu deploymentu nadal musi odczytać nowy build na stałym adresie:
https://naprawa-pc-akademia-serwisu-pro.pages.dev
Jeżeli produkcyjny adres nie pokaże builda i wymaganych modułów, publikacja pozostaje
niezaliczona. Nie należy ręcznie otwierać hash.pages.dev jako zamiennika produkcji.

ZACHOWANIE KONFIGURACJI
Nie zastępuj istniejącego wrangler.toml, TOOLS_CLOUDFLARE, poświadczeń ani kopii D1.
Nie utworzono nowego projektu Pages ani nowej bazy D1.
FIX81 nie dodaje migracji, nie zmienia sekretu OPENAI_API_KEY, bindingu D1 ani AI.
Wersja produktu pozostaje 6.8.0; FIX81 jest poprawką procesu publikacji.

UWAGA
Testy wykonywane w kontenerze Linux na Node.js 22.16.0; należy dodatkowo uruchomić
runner na Windows z Node.js 24.19.0. Ten pakiet nie wykonuje deploymentu.

Źródło zachowania Direct Upload (dokumentacja Cloudflare):
https://developers.cloudflare.com/pages/get-started/direct-upload/
