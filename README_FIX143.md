# FIX143 — naprawa nieaktualnego testu publikacji

FIX80 zawierał sprzeczny warunek: odrzucał każdy `data-photo-unique`, mimo że FIX142 wymaga tego atrybutu dla głównego zdjęcia HERO USB-C. Test dopuszcza teraz dokładnie jeden taki znacznik i sprawdza jego identyfikator, kategorię `port` oraz wartość `true`. Nie zmieniono strony ani pozostałych przypisań fotografii.

Uruchomienie testu: `node scripts/test-homepage-showcase-fix80.mjs`
Pełny preflight: `node scripts/run-tests-fix137.mjs`
