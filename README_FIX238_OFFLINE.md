# FIX238 — lokalne materiały offline

- Użytkownik może zapisać tekstową kopię aktualnie otwartego materiału w IndexedDB.
- W kopii usuwane są aktywne skrypty, formularze, kontrolki, multimedia, iframe, odnośniki i atrybuty zdarzeń.
- Limit wynosi 100 pozycji. Użytkownik może otwierać i usuwać kopie.
- To nie jest pełny tryb offline platformy: nie pobiera całych kursów, chronionych zasobów API, filmów ani obrazów.
