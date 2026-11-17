# FIX209 — centrum stanu platformy

- Widok korzysta z istniejącego pola `ADMIN_REVIEW_TOKEN`; nie przechowuje tokenu i nie dodaje nowego sekretu.
- `GET /api/admin/health` wymaga same-origin oraz `checkAdmin`.
- Sprawdza połączenie D1, obecność podstawowych tabel, obecność sekretu Gemini i kompletność par Client ID / Client Secret pięciu dostawców OAuth: Google, Microsoft, Facebook, GitHub, Discord.
- API zwraca wyłącznie status obecności sekretów, nigdy ich wartości, ani danych kont użytkowników.
- Endpoint nie potwierdza, że OAuth callback działa z zewnętrznym dostawcą i nie podaje statusu ostatniego deployu.
