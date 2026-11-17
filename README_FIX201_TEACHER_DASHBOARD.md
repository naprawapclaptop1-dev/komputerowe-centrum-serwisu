# FIX201 — Analityka nauczyciela

Rozszerza istniejący widok klasy. Dane są pobierane przez istniejące uwierzytelnione API `/api/classroom` i istniejący magazyn D1 `academy_events`. Nauczyciel widzi statystyki zadań, przesłanych prac, oczekujących ocen, średnią i zestawienie uczniów, którzy przesłali co najmniej jedną pracę. Dostępny jest eksport CSV z ochroną przed formułami CSV/arkusza.

Nie dodano nowych tabel D1 ani widoków. Pełna lista zapisanych/ zaproszonych uczniów wymaga osobnego endpointu członkostwa, jeśli taki rejestr będzie potrzebny.
