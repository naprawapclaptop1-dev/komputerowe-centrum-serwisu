# FIX203 — Klasy online: lista uczniów i obecności

- Rozszerzono istniejący endpoint `/api/classroom` i jego strumień zdarzeń `academy_events`; nie utworzono nowej bazy ani tabeli.
- Członkostwo jest zapisywane jako `academy_classroom_member`, a dziennik obecności jako `academy_classroom_attendance`.
- Nauczyciel widzi członków klasy również wtedy, gdy nie oddali żadnej pracy. Obecność może oznaczać wyłącznie właściciel klasy.
- Uczeń dołącza kodem zaproszenia. Widzi wyłącznie własne prace, oceny i wpisy obecności.
- Klasy utworzone przed FIX203 nadal rozpoznają właściciela jako nauczyciela. Uczniowie tych klas powinni ponownie użyć kodu zaproszenia, aby pojawić się na liście członków.
- Nie ma jeszcze systemu podgrup, frekwencji masowej ani raportowania do zewnętrznych dzienników szkolnych.
