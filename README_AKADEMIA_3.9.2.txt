NAPRAWA PC — AKADEMIA SERWISU PRO 3.9.2
PEŁNE ARCHIWUM PROJEKTU

CO ZAWIERA WYDANIE
- Pełny WEB_PUBLISH z lekcjami, procedurami, kartami diagnostycznymi, katalogami, biblioteką dokumentów, obrazami i materiałami wideo.
- Pełne Pages Functions i API dla profili pseudonimowych, historii, czatu, zgłoszeń społeczności, moderacji i logowania OAuth.
- Pięć migracji SQL (0001–0005); migracja 0005 dodaje nonce do bezpiecznej walidacji OIDC.
- Górną nawigację modułów i boczny panel; każda zakładka jest osobnym widokiem, a nie sekcją dokładanymi jedna pod drugą.
- Ciemny motyw granatowo-niebieski z turkusowymi obramowaniami, dużymi kartami ilustrowanymi i responsywnymi siatkami.
- Formularz dodawania wiedzy z pseudonimem, kolejkę moderacji i publikację wyłącznie zatwierdzonych przypadków.
- Logowanie Google, Facebook i Microsoft po dodaniu własnych sekretów OAuth w Cloudflare.
- Widok wsparcia: dane BLIK 78640187, link SumUp oraz grafika QR dostarczona przez operatora.
- Pliki startowe URUCHOM_AKADEMIE.cmd, ONECLICK_AKADEMIA.js i AUTO_PUBLISH_WATCHER.js.

INSTALACJA PEŁNEJ PACZKI
1. Zatrzymaj dotychczasowy obserwator (Ctrl+C).
2. Wykonaj kopię całego obecnego folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj zawartość ZIP do G:\AKADEMIA_SERWISU_PRO, zachowując strukturę katalogów i zastępując pliki projektu.
4. Zachowaj swój lokalny wrangler.toml, katalog TOOLS_CLOUDFLARE oraz lokalne dane logowania. Nie są dołączane do ZIP, aby nie nadpisywać konfiguracji i nie ujawniać danych uwierzytelniających.
5. Uruchom URUCHOM_AKADEMIE.cmd. Skrypt sprawdzi istniejący projekt i D1, wykona kopię bazy oraz zastosuje wyłącznie oczekujące migracje.
6. Zostaw okno obserwatora otwarte. Ctrl+C zatrzymuje automatyczną publikację.

ISTNIEJĄCA BAZA D1
Wydanie zachowuje dotychczasowy identyfikator produkcyjnej D1 potwierdzony w logach: 6ac0a922-639c-43ee-ba33-5da14c25a533 (naprawapc-orders). Nie dołączaj wrangler.toml z innego projektu i nie twórz nowej bazy.

WIEDZA SPOŁECZNOŚCI
- Każdy może utworzyć profil autora przez pseudonim 3–32 znaki; do przesłania naprawy nie jest wymagana synchronizacja historii nauki.
- Zgłoszenia wymagają potwierdzenia praw, licencji i anonimizacji.
- Wszystkie nowe przypadki trafiają do statusu pending. Publiczna lista pokazuje tylko zatwierdzone zgłoszenia.

LOGOWANIE ZEWNĘTRZNE
Google/Facebook/Microsoft wymagają osobnych aplikacji OAuth i własnych Client ID/Client Secret utworzonych przez właściciela. Klucze należy dodać jako sekrety środowiska Production projektu Pages. Instrukcja i dokładny callback są w KONFIGURACJA_LOGOWANIA_OAUTH_3.9.2.txt. Bez tych kluczy działa profil pseudonimowy, a przyciski SSO pozostają wyłączone, aby nie udawały działającego logowania.

WAŻNE OGRANICZENIA TESTÓW
Kod, migracje i lokalne testy techniczne zostały sprawdzone. Nie wykonano z tego środowiska wdrożenia Cloudflare na koncie operatora, migracji produkcyjnej ani prawdziwego logowania przez zewnętrznych dostawców. Raport znajduje się w TEST_REPORT_3.9.2.txt.
