# FIX222 — zarządzany bank egzaminów

Migracja `0022_admin_exam_bank_fix222.sql` tworzy dodatkowy bank pytań D1. `functions/api/admin/exam-bank.js` pozwala administratorowi tworzyć, edytować i archiwizować pytania; panel obsługuje od 2 do 6 opcji odpowiedzi po weryfikacji ADMIN_REVIEW_TOKEN i same-origin. Wbudowane 50 pytań pozostaje bez zmian; dodatkowe aktywne pytania są dołączane do serwerowego losowania. Panel nie przyjmuje klucza odpowiedzi od ucznia. To nie oznacza jeszcze banku 1000 pytań.
