# FIX227 — link weryfikacyjny certyfikatu

API certyfikatów zwraca odnośnik same-origin do publicznego rekordu weryfikacyjnego. Link jest wyświetlany na ekranie weryfikacji i wydruku/PDF. Historyczne rekordy nadal są oznaczone jako `LEGACY_RECORD_FOUND`, a rekordy ocenione serwerowo jako `RECORD_FOUND`. Nie generujemy kodu QR w tej poprawce. Dokument platformowy nie jest formalnym świadectwem, akredytacją ani kwalifikacją państwową.
