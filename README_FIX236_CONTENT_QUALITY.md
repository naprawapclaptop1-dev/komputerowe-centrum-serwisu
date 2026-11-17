# FIX236 — kontrola jakości materiałów

- Uczeń może przesłać zgłoszenie błędu, przestarzałej treści, linku, dostępności lub praw autorskich.
- Zgłoszenia trafiają do kolejki administratora; nie zmieniają lekcji automatycznie.
- Wprowadzono kontrolę limitu zgłoszeń i odrzucanie treści przypominających sekrety lub dane uwierzytelniające.
- `scripts/audit-content-quality-fix236.mjs` sprawdza unikalność ID nowego panelu, 35 widoków oraz istnienie lokalnych zasobów. Starsze obrazy bez alt są raportowane jako ostrzeżenia, nie są automatycznie modyfikowane.
