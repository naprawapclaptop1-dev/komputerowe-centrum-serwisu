NAUKA OD A DO Z 6.8.0 — FIX35
ROZBUDOWA SAMODZIELNEJ ZAKŁADKI WSPARCIA
============================================================

CO ZMIENIA FIX35

Zakładka „Wesprzyj platformę” została rozbudowana tak, aby wyjaśniała:
- dlaczego platforma pozostaje bezpłatna i dobrowolna;
- na jakie obszary może być przeznaczane wsparcie;
- które zasoby są już dostępne;
- jakie są priorytety dalszego rozwoju;
- w jaki sposób można pomagać bez wpłacania pieniędzy;
- jak przygotować wartościowy przypadek edukacyjny do moderacji;
- jak bezpiecznie sprawdzać dane płatności.

ZAWARTOŚĆ ZAKŁADKI

1. Osobna nawigacja po sekcjach wsparcia.
2. Zasady dobrowolności, bezpłatnego dostępu i równych zasad.
3. Zachowany film 33 s, polskie napisy VTT i tekst narracji.
4. Sześć obszarów, na które wsparcie może pomagać.
5. Osiem obszarów planowanych priorytetów rozwoju. Lista nie jest gwarancją terminów.
6. Stan zasobów w wydaniu: 1060 lekcji, 12 kart diagnostycznych, 18 dziedzin mapy wiedzy i jedna wspólna platforma.
7. Przykłady już dostępnych materiałów i funkcji.
8. Cztery sposoby pomocy bez wpłaty.
9. Czterokrokowy przewodnik przygotowania przypadku serwisowego: identyfikacja urządzenia, opis objawu, pomiary i źródła/prawa.
10. Trzynaście pytań FAQ.
11. Kroki bezpiecznego sprawdzania płatności.
12. Zachowane metody i dane płatnicze BLIK oraz SumUp, bez zmieniania ich wartości/linku.
13. Przycisk udostępniania: natywne Web Share, a w razie braku obsługi — próba kopiowania do schowka.
14. Kontakt e-mail i powrót do nauki.

WAŻNA UWAGA DOTYCZĄCA BLIK

Na stronie zachowana jest dotychczasowa wartość 78640187. Nie jest ona standardowym,
jednorazowym kodem BLIK, ponieważ oficjalny serwis BLIK opisuje taki kod jako
sześciocyfrowy i generowany w aplikacji banku. Nie wpisuj 78640187 jako kodu BLIK. Karta płatności zawiera bezpośredni odnośnik do oficjalnej instrukcji BLIK.
Przed wykorzystaniem tej wartości trzeba ustalić jej właściwy typ i potwierdzić
odbiorcę w banku. Do czasu wyjaśnienia bezpieczniej skorzystać z zachowanego linku
SumUp, po sprawdzeniu danych odbiorcy i kwoty.
Oficjalna informacja: https://www.blik.com/pierwsze-kroki-z-blikiem

DANE I FUNKCJE ZACHOWANE

- BLIK: 78640187 — bez zmiany wartości, z ostrzeżeniem o formacie.
- SumUp: https://pay.sumup.com/b2c/QON3J042 — bez zmiany adresu.
- Dotychczasowy kod QR SumUp.
- Film MP4, napisy VTT i transkrypcja.
- Pozostałe 26 niezależnych widoków platformy.
- Istniejące konto, OAuth/2FA, kursy, laboratoria, katalogi, statystyki i PWA.
- Dane projektu Cloudflare i binding D1 nie zostały zmienione.

INSTALACJA / PUBLIKACJA

1. Wykonaj kopię obecnego folderu projektu.
2. Rozpakuj całe archiwum FIX35 do folderu projektu, zachowując strukturę.
3. Uruchom WYKONAJ_TESTY_FIX35.cmd.
4. Po pozytywnym wyniku uruchom URUCHOM_AKADEMIE.cmd zgodnie z dotychczasową procedurą.
5. Nie twórz nowego projektu Pages ani nowej bazy D1.

CHECK_KONTA_FIX35.cmd wykonuje kontrolę API kont bez tworzenia rzeczywistego konta.

WYNIKI TESTÓW W ŚRODOWISKU PRZYGOTOWANIA

- 52/52 skryptów testowych PASS.
- Lokalna funkcja ONECLICK verifyWeb() PASS; bez połączenia z Cloudflare i D1.
- 155 plików JS/MJS/CJS — 0 błędów składni.
- 39 plików CSS — 0 błędów parsowania.
- 662 ID HTML — 0 duplikatów.
- 130 lokalnych odwołań do zasobów — 0 brakujących plików.
- Porównanie z FIX34: 0 plików usuniętych, 8 dodanych.

Testy wykonano w środowisku Node v22.16.0. Nie stanowi to testu na komputerze
użytkownika z Node v24.19.0 ani pełnego testu wizualnego w jego przeglądarce.

STATUS WDROŻENIA

FIX35 przygotowano i sprawdzono lokalnie. Nie wykonano publikacji na Cloudflare,
nie uruchomiono migracji D1 i nie zmieniono sekretów produkcyjnych. Wdrożenie
następuje dopiero po uruchomieniu procesu startowego w folderze użytkownika.
