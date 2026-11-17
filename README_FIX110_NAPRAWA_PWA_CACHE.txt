NAUKA OD A DO Z 6.8.0 — FIX110

Naprawia błąd publikacji wskazany w logu START FIX105 / OneClick FIX109.

Przyczyna:
OneClick i Watcher wymagały cache fix94-topic-verified-photo-20261107,
a aktywny service-worker.js miał już cache FIX109. Wszystkie trzy wymagane
media wsparcia (MP4, poster JPG, captions VTT) są obecne w plikach i CORE.

Poprawka:
- aktywny CACHE_NAME pozostaje: nauka-6.8.0-fix109-full-catalog-photo-queue-20261109
- OneClick sprawdza dokładny cache i osobno każdy zasób wsparcia
- Watcher stosuje identyczny warunek lokalnie i dla zdalnego Service Workera
- cache offline i silnik fotografii FIX109 pozostają bez zmian
- D1/projekt Pages nie są tworzone ponownie; migracje pozostają po walidacji WWW

Uruchom: WYKONAJ_TESTY_FIX110.cmd
Po PASS: uruchom dotychczasowy bezpieczny start / OneClick.
Nie uruchamiaj ręcznie migracji D1.
