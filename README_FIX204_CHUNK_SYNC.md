# FIX204 — synchronizacja większych stanów

- Pozostaje 16 kluczy synchronizowanych automatycznie; historia rozmów nadal korzysta z osobnego endpointu.
- Stany JSON powyżej 30 KB są dzielone na fragmenty po 30 000 znaków, maksymalnie 12 fragmentów / 360 000 znaków.
- Małe stany nadal trafiają do `academy_user_state`. Duże trafiają do nowej, addytywnej tabeli `academy_user_state_chunks`.
- Migracja: `migrations/0018_academy_user_state_chunks_fix204.sql`.
- API sprawdza poprawność całego JSON przed zapisem i używa partii D1 do wymiany starego stanu na nowy.
- Eksport danych i usunięcie konta obejmują również rekordy porcjowane.
- Synchronizacja wymaga logowania i zgody. Nie przekracza 360 KB na pojedynczy klucz; większy stan należy wyeksportować.
- Migracja jest w pakiecie, ale nie została zastosowana w produkcyjnym D1 w tej sesji.
