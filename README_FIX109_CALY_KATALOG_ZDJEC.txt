NAUKA OD A DO Z 6.8.0 — FIX109: KOLEJKA ZDJEC CALEJ PLATFORMY
Data przygotowania: 2026-11-09

CEL
FIX109 usuwa ograniczenie, przez które katalog fotografii przetwarzał głównie
aktywną zakładkę. Wszystkie rozpoznane i dołączone do dokumentu sloty zdjęć
są teraz dodawane do wspólnej kolejki w czasie startu i po dynamicznym
wstawieniu zawartości. Aktywna zakładka ma wyższy priorytet, ale pozostałe
zakładki nie są odrzucane.

NAJWAŻNIEJSZE ZMIANY
- Pełne kolejkowanie wszystkich podłączonych, kwalifikujących się obrazów,
  także w ukrytych widokach i poza aktualnym obszarem ekranu.
- Zmiana zakładki nie usuwa pozycji z kolejki.
- Ponawianie i przetwarzanie nie wymagają aktywnego widoku.
- MutationObserver dodaje dynamicznie tworzone kafelki i galerie.
- Skan startowy i okresowy obejmuje cały dokument.
- Rozszerzone selektory obejmują zdjęcia hero, diagnostyczne, kafelki wideo,
  długie okładki wideo, galerię zdjęć, materiały powiązane i warsztatowe.
- Naprawiono obsługę Retry-After w sekundach i w formacie HTTP-date.
- Tymczasowe błędy Wikimedia nie oznaczają już kategorii jako trwale
  wyczerpanej; limity Openverse i Wikimedia pozostają niezależne.
- Zachowano kontrolę licencji, trafności tematycznej i globalnej unikalności
  (w tym kontrolę podobieństwa), mapowanie 147 kart metod oraz 21 slotów
  zdjęć strony głównej.
- Zachowano migrację przypisań Fix106/Fix108 do przestrzeni FIX109.
- Zaktualizowano HTML, manifest źródeł, release.json, cache PWA,
  OneClick i Auto Publish Watcher.

ZACHOWANE ZASADY
- Limity i tempo żądań dostawców nie są omijane ani resetowane.
- Zdjęcia muszą przejść kontrolę tematu i licencji.
- Jedna fotografia nie może być przypisana do wielu różnych slotów.
- Zdjęcia prywatne przesłane przez użytkownika nie są nadpisywane.
- Schematy, mapy PCB i elementy będące diagramami pozostają diagramami.
- Gdy odpowiednie zdjęcie nie jest dostępne lub nie przejdzie kontroli,
  pozostaje oznaczony fallback. FIX109 nie udaje, że ilustracja jest zdjęciem.

JAK SPRAWDZIĆ
1. Rozpakuj całą paczkę do kopii roboczej projektu.
2. Uruchom WYKONAJ_TESTY_FIX109.cmd.
3. Przeczytaj FIX109_FULL_TESTS.log oraz README/CHANGELOG.
4. Po pozytywnych testach wykonaj publikację z użyciem OneClick.
5. Po publikacji odśwież stronę bez cache lub wyczyść cache PWA/service worker.

WAŻNE — STATUS PUBLIKACJI
Paczka zawiera zmiany lokalne. Nie wykonano publikacji na serwerze produkcyjnym
ani testu przeglądarkowego na działającej stronie z odpowiedziami dostawców.
Wyniki testów opisują testy regresji, kontraktów i składni uruchomione lokalnie.
Samo przejście testów nie gwarantuje, że każdy slot uzyska odrębną fotografię:
źródła mogą nie mieć odpowiedniego, licencjonowanego materiału, a limity dostawców
regulują szybkość pobierania. Pełna kolejka sprawia jednak, że takie sloty nie są
pomijane tylko dlatego, że ich zakładka jest aktualnie ukryta.

Wersja produktu pozostaje 6.8.0; oznaczenie poprawki: FIX109.
