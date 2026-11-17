# NAUKA OD A DO Z 6.8.0 — FIX134

## Cel poprawki

Log produkcyjny FIX133 pokazał, że deployment został wysłany, ale trzy testowe żądania do proxy zdjęć kończyły się HTTP 502. W kodzie funkcji znaleziono tryb `redirect: 'error'`. Cloudflare Workers obsługuje tryby `follow` i `manual`; wartość `error` jest nieobsługiwana i powoduje `TypeError` przed wysłaniem żądania. Szczegóły: [Cloudflare Workers — Request API](https://developers.cloudflare.com/workers/runtime-apis/request/).

## FIX134 — bezpieczne przekierowania

Proxy używa `redirect: 'manual'` i samo obsługuje odpowiedzi 301/302/303/307/308. Każdy cel przekierowania jest weryfikowany przed następnym żądaniem:

- HTTPS jest obowiązkowy;
- dane logowania w URL są odrzucane;
- dozwolone hosty: `images.pexels.com`, `thumb.wikimedia.org`, `upload.wikimedia.org`;
- maksymalnie 4 przekierowania;
- wykrywanie pętli;
- nie ma parametru URL od użytkownika — proxy korzysta wyłącznie z 19 stałych przypisań w katalogu.

## FIX134 — poprawka Watchera

Weryfikacja strony głównej oczekiwała `FIX129` w manifeście `home-photo-library-fix118.json`, chociaż manifest ma `hotfix: FIX131`. Ten fałszywy warunek utrzymywał `sitewideNoPeopleVisualsValid=false`. Obecnie: źródła i polityka metadanych są sprawdzane jako FIX129, a biblioteka zdjęć strony głównej jako FIX131. Kontrole nie zostały wyłączone.

Dodane pola diagnostyczne ujawniają osobno wynik polityki globalnej, polityki strony głównej, HTML, liczbę wpisów, unikalne ID i nagłówki odpowiedzi proxy.

## Uruchamianie

1. Rozpakuj pełny ZIP w osobnym katalogu projektu lub zgodnie z dotychczasową procedurą aktualizacji.
2. Uruchom `WYKONAJ_TESTY_FIX134.cmd`. Skrypt użyje `NODE_EXE.path`, jeśli zawiera poprawną ścieżkę, a w przeciwnym razie polecenia `node`.
3. Po wyniku PASS uruchom `URUCHOM_NAUKE_OD_A_DO_Z.cmd`.
4. Pozostaw okno Watchera otwarte do zakończenia kontroli stałej domeny.
5. Sprawdź, czy trzy próbne adresy `/media/photos/...jpg` zwracają HTTP 200, `Content-Type: image/*` oraz `X-Photo-Proxy-Fix: FIX134-SAFE-REDIRECTS`.
6. W przeglądarce wykonaj Ctrl+F5. Licznik ma zwiększyć liczbę zdjęć dopiero po poprawnym odczytaniu obrazu.

## Testy i ograniczenia

`RAPORT_FIX134_TESTY.log` potwierdza 16/16 skryptów testowych w środowisku Node v22.16.0. Test przekierowań korzysta z kontrolowanych odpowiedzi symulowanych, a nie z sieci zewnętrznej. W tym środowisku DNS do dostawców Pexels/Wikimedia był niedostępny, więc nie udaję, że sprawdziłem faktyczne pobranie fotografii live.

Weryfikacja produkcyjna jest wbudowana w OneClick/Watcher i musi zostać wykonana na komputerze, gdzie jest zalogowane konto Cloudflare. Sama informacja `Deployment complete` nie wystarcza — wymagane jest potwierdzenie odpowiedzi zdjęć 200 i poprawnego dekodowania.

Wersja produktu pozostaje 6.8.0. FIX134 nie wykonuje migracji D1, nie tworzy nowej bazy i nie zmienia sekretów.
