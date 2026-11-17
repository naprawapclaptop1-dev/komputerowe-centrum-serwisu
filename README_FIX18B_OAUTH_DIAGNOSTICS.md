# NAUKA OD A DO Z 6.7.0 FIX18B — diagnostyka logowania społecznościowego

## Co poprawiono
- Przyciski Google, Facebook, Microsoft, X, GitHub i Discord pozostają widoczne. Nieaktywne metody są wyłączone, ale mają etykietę wyjaśniającą powód.
- Endpoint `GET /api/auth/status` sprawdza binding D1, wymagane kolumny tabel OAuth/kont oraz CHECK constraints dla wszystkich sześciu dostawców.
- API zwraca wyłącznie nazwy brakujących sekretów (`*_CLIENT_ID`, `*_CLIENT_SECRET`), nigdy ich wartości.
- Strona pokazuje osobno: brak D1, brak migracji, brak sekretów, niezgodność wersji HTML/API.
- Przyciski nie są już ukrywane przez CSS ani skrypty UI.
- Start i callback OAuth zatrzymują się czytelnym kodem, gdy brakuje migracji.
- Błąd wymiany kodu dostawcy jest odróżniony od błędu weryfikacji tożsamości.
- Panel konta pokazuje dokładny adres callback i ma przycisk kopiowania.

## Dlaczego Google/Facebook/Microsoft mogą nadal być nieaktywne
1. Każdy dostawca wymaga osobnej aplikacji OAuth w swoim panelu deweloperskim.
2. W aplikacji dostawcy musi być wpisany dokładny callback: `https://naprawa-pc-akademia-serwisu-pro.pages.dev/api/auth/callback`.
3. Client ID i Client Secret trzeba zapisać w Cloudflare Pages Production przez `KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX18.cmd`.
4. Po zapisaniu sekretów wymagane jest nowe wdrożenie Pages. Sekrety Functions są widoczne dla runtime po wdrożeniu, nie przez sam lokalny formularz.
5. W D1 muszą zostać zastosowane migracje 0008, 0009 i 0010 (publikator wykonuje kopię bazy przed migracjami).

## Kolejność
1. Rozpakuj całe archiwum w nowym folderze.
2. Uruchom `WYKONAJ_TESTY_FIX18.cmd`.
3. Skonfiguruj wybranych dostawców przez lokalny konfigurator OAuth (nie wysyłaj sekretów przez czat).
4. Uruchom `URUCHOM_AKADEMIE.cmd` z tego samego folderu i sprawdź wszystkie kontrole przed zatwierdzeniem dalszych działań.
5. Po wdrożeniu odśwież stronę i sprawdź status przy metodach logowania. Możesz też uruchomić `CHECK_LOGOWANIA_OAUTH_FIX18B.cmd`, który tylko odczytuje `/api/auth/status` i nie wykonuje migracji ani publikacji.

## Ważne
Lokalne testy nie mogą potwierdzić autentycznego przekierowania do konta Google/Facebook/Microsoft/X. Do tego potrzebne są prawidłowe Client ID/Secret, callback wpisany u dostawcy i wdrożenie w Cloudflare. Nie wpisuj Client Secret w kodzie, pliku ZIP, `wrangler.toml`, `.env` ani w czacie.
