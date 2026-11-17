NAPRAWA PC — AKADEMIA SERWISU PRO 3.9.3
PEŁNA PACZKA — NOWY UKŁAD REFERENCYJNY

Uruchomienie: URUCHOM_AKADEMIE.cmd

W wydaniu 3.9.3 przebudowano cały szkielet aplikacji: globalny pasek z logo i nawigacją, boczne menu pod paskiem oraz główny obszar strony obok menu. Naprawiono konflikt szerokości panelu bocznego, który w 3.9.2 powodował zasłanianie lewej krawędzi treści. Usunięto przycinanie overflow w głównym obszarze.

Widoki pozostają rozdzielone: aktywna jest tylko wybrana zakładka. Wewnątrz widoku można przewijać stronę w dół. Siatki materiałów są responsywne: 4/3/2/1 kolumny.

Zachowano istniejące D1, migracje 0001–0005, konfigurację OAuth, zgłoszenia społeczności, moderację, płatności wsparcia i obserwatora. Pełny ZIP nie zawiera lokalnego wrangler.toml ani sekretów. Zachowaj własny wrangler.toml i TOOLS_CLOUDFLARE.

Logowanie Google, Facebook i Microsoft wymaga własnych Client ID/Client Secret w Cloudflare Pages. Bez sekretów przyciski OAuth pozostają nieaktywne; profil pseudonimowy działa niezależnie.

Przed produkcyjnym wdrożeniem wykonaj kopię folderu i bazy. Nie uruchamiaj osobno migracji — ONECLICK stosuje wyłącznie oczekujące migracje i wykonuje kopię D1 przed zmianami.
