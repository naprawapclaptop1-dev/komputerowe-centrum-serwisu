FIX144 — NAPRAWA RZECZYWISTEJ PRZYCZYNY BRAKU ZDJĘCIA HERO USB-C

FIX142 dodał prawidłowy lokalny plik JPEG, ale FIX77 odrzucał go, ponieważ nie było go na globalnej allowliście zdjęć. Strażnik zastępował wtedy zdjęcie SVG i podpisywał je jako offline. FIX144 dodaje tylko ten jeden plik do allowlisty, pozostawiając aktywną ochronę przed duplikatami i niezatwierdzonymi obrazami.

Nie zmieniono HTML, CSS, układu, kursów, menu ani pozostałych przypisań zdjęć.

Testy:
  node scripts/test-fix142-local-usbc-hero-photo.mjs
  node scripts/test-fix144-hero-allowlist.mjs
  node scripts/run-tests-fix137.mjs

Po rozpakowaniu pełnego ZIP wykonaj kopię zapasową i uruchom dotychczasowy START_FIX105. Używany jest istniejący projekt Cloudflare Pages i istniejąca baza D1.
