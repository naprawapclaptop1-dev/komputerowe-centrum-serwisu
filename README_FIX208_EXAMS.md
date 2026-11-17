# FIX208 — egzamin oceniany po stronie serwera

- Migracja addytywna: `migrations/0019_server_graded_exams_fix208.sql`.
- API `POST /api/certificates` przyjmuje wyłącznie akcje `start` i `submit` dla nowych prób. Samodzielne przesłanie wyniku przez przeglądarkę jest odrzucane.
- Serwer losuje 10 pytań z banku 50, zapisuje klucz odpowiedzi w D1 i zwraca przeglądarce tylko pytania oraz opcje.
- Czas podejścia: 20 minut. Próg: 70%. Ocenę wylicza serwer.
- Certyfikat nowego typu jest oparty o rekord w `academy_certificates`. Weryfikacja starszych wpisów wskazuje, że były wynikiem przesłanym z przeglądarki i nie są potwierdzeniem serwerowego egzaminu.
- Certyfikat jest platformowym potwierdzeniem egzaminu, nie państwowym świadectwem ani akredytacją.
- Migracja musi zostać zastosowana do produkcyjnego D1 przez kontrolowany publikator po kopii bezpieczeństwa.
