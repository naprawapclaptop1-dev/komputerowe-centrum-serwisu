# NAUKA OD A DO Z 6.8.0 — FIX136

## Zakres

FIX136 poprawia kolejność pobierania fotografii u góry strony i rozszerza akademię o ćwiczenia warsztatowe. Dolna część strony głównej ma pozostać dokładnie taka jak w bazie FIX135.

## Co zmieniono

- Pierwszy priorytet: trzy fotografie hero i zdjęcie aktywnego slajdu.
- Nieaktywne slajdy i dolne obrazy: `loading="lazy"`, `fetchPriority="low"`; slajd otrzymuje priorytet dopiero po aktywacji.
- 19 przypisań zdjęć modułów, istniejący katalog źródeł, licencje, polityka zdjęć bez ludzi oraz awaryjne SVG pozostają zachowane.
- Dodano 18 lekcji (`PRACTICE136-001`–`PRACTICE136-018`), co daje 1078 pozycji w katalogu.
- Każda nowa lekcja zawiera checklistę 7 kroków, narzędzia, scenariusz, zadanie praktyczne, kryterium akceptacji oraz 3 pytania quizowe z objaśnieniami.

## Dowód zachowania dolnej części

Sekcja `#view-home` ma identyczną zawartość HTML jak w archiwum FIX135.

SHA-256:

`45fec2858526bab2dc791d309682528a4efe04470480e9be081f6209d9fc2e21`

## Pliki istotne dla FIX136

- `WEB_PUBLISH/assets/academy-expanded-practice-fix136.js`
- `WEB_PUBLISH/assets/practice-quiz-fix136.css`
- `WEB_PUBLISH/assets/learning-engine.js`
- `WEB_PUBLISH/assets/photo-catalog-fix115.js`
- `WEB_PUBLISH/assets/homepage-photo-prime-fix118.js`
- `scripts/run-tests-fix136.mjs`
- `RAPORT_FIX136_TESTY.log`

## Testowanie

Wymagany Node.js. W katalogu głównym projektu uruchom:

```bash
node scripts/run-tests-fix136.mjs
```

Oczekiwany wynik: `14/14`, `STATUS: PASS`.

## Publikacja

Nie wykonano automatycznej publikacji na Cloudflare Pages. Przed wdrożeniem uruchom istniejący OneClick zgodnie z konfiguracją projektu i sprawdź raport Watchera na stabilnej domenie. Zachowaj aktualne powiązanie D1 `naprawapc-orders`, `env.AI` i istniejącą konfigurację produkcyjną. FIX136 nie wymaga migracji D1 ani resetu danych.

Radio nie należy do tej Akademii i nie zostało tu dodane.
