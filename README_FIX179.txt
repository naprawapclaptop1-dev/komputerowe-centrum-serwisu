NAUKA OD A DO Z — FIX179 — AKADEMIA EKSPERCKA

CO DODANO
Otwórz istniejący widok „Akademia Mistrza Serwisu” i wybierz nową zakładkę
„Kursy eksperckie FIX179”. Znajdziesz tam 24 pełne lekcje, 8 trudnych przypadków,
72 pytania kontrolne, notatki do każdej lekcji, słownik 22 pojęć i eksport raportu.

JAK KORZYSTAĆ
1. Otwórz zakładkę „Kursy eksperckie FIX179”.
2. Wybierz lekcję z listy lub użyj wyszukiwarki i filtrów.
3. Przeczytaj cele, materiał, procedurę i zasady bezpieczeństwa.
4. Zapisz własne notatki. Zaliczenie wymaga minimum 2 poprawnych odpowiedzi z 3.
5. W części „Egzamin ekspercki” wybierz trudny przypadek i oceń diagnozę, plan
   oraz test potwierdzający. Zaliczenie wymaga co najmniej 70/100 punktów.
6. Użyj „Eksportuj raport nauki JSON”, aby zachować postępy i notatki.

ZAPIS POSTĘPÓW
- Szczegóły FIX179 są zapisywane lokalnie w kluczu:
  nauka-od-a-do-z-advanced-fix179-v1
- Punkty za ukończone zadania są przekazywane do istniejącego profilu i dziennika
  Akademii (jeżeli bazowy moduł FIX175 został uruchomiony poprawnie).
- Nie jest wykonywana migracja D1 ani reset istniejących postępów.

AKTUALIZACJA ISTNIEJĄCEGO PROJEKTU
1. Wykonaj kopię folderu projektu i bieżącej konfiguracji Cloudflare.
2. Rozpakuj tę paczkę do dotychczasowego folderu projektu, zachowując jego
   lokalne sekrety i ustawienia: .dev.vars, własne tokeny, wrangler.toml oraz
   katalog TOOLS_CLOUDFLARE. Nie usuwaj ani nie twórz nowej bazy D1.
3. Uruchom WYKONAJ_TESTY_FIX179.cmd.
4. Po pozytywnym wyniku użyj dotychczasowego START_FIX105.cmd, aby wykonać
   publikację na istniejącym projekcie Pages z dotychczasową konfiguracją.
5. Zachowaj START_FIX105.log do weryfikacji publikacji.

TESTY
Uruchom WYKONAJ_TESTY_FIX179.cmd albo:
  node scripts/run-tests-fix179.mjs

UWAGA
To materiał szkoleniowy. Symulacje nie wykonują pomiarów ani napraw rzeczywistego
sprzętu. Zawsze korzystaj z dokumentacji producenta i właściwych kwalifikacji.
Certyfikat ukończenia ćwiczeń Akademii nie jest państwowym świadectwem kwalifikacji.
