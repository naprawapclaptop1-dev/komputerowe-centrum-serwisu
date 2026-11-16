# Zasady identyfikacji programów i aktualizacji

1. Jeden program = jedno własne repozytorium i jeden stały adres projektu.
2. Różne programy nigdy nie współdzielą repozytorium ani adresu aktualizacji.
3. Aktualizacja programu pozostaje w jego dotychczasowym repozytorium.
4. Każde wydanie otrzymuje nowy, unikalny tag.
5. Publikator ma przerwać pracę, jeśli tag lub wydanie już istnieje.
6. Zakaz usuwania poprzednich wydań, tagów i assetów.
7. Zakaz używania `--clobber` lub zastępowania assetów w istniejącym wydaniu.
8. Manifesty muszą zawierać nazwę/ID programu, repozytorium, wersję, tag, kanał, adres paczki i SHA-256.
9. Przed publikacją sprawdzić zgodność repozytorium, nazwy plików, sumy SHA-256 i dostępność linków.
10. Nie deklarować publikacji ani poprawnego działania instalatora bez faktycznego testu.
