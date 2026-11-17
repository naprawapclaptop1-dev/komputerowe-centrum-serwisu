NAUKA OD A DO Z — FIX88
NAPRAWA FAŁSZYWEGO BLOKOWANIA BIBLIOTEKI FIX83

DLACZEGO ONECLICK SIĘ ZATRZYMYWAŁ
Plik WEB_PUBLISH/index.html zawierał poprawny wpis:
  assets/visual-uniqueness-fix83.js?v=6.8.0-fix87
OneClick i lokalny Auto-Watcher wymagały jednak literalnie:
  visual-uniqueness-fix83.js?v=6.8.0-fix83
Nazwa runtime pozostaje FIX83, ale cache-busting URL został zaktualizowany w FIX87.
Wynik był fałszywym błędem pomimo istniejącego pliku, manifestu i grafiki GDDR/BGA.

CO ZMIENIA FIX88
- Nowy wspólny walidator: scripts/fix83-visual-library-guard-fix88.cjs.
- release.json ma pole visualRuntimeBuildTag = 6.8.0-fix87.
- OneClick oraz Auto-Watcher sprawdzają ten sam konkretny URL na podstawie manifestu wydania.
- Walidator sprawdza, czy runtime jest załadowany synchronicznie przed lesson-art.js oraz app.js.
- Walidator sprawdza 54 tematy, kategorie VRAM i RAM, regułę GDDR/BGA i blokadę DIMM/SO-DIMM dla VRAM.
- Brak pliku, manifestu lub prawidłowej reguły VRAM nadal zatrzymuje wydanie.

URUCHOMIENIE
1. Rozpakuj pełne archiwum.
2. Uruchom WYKONAJ_TESTY_FIX88.cmd.
3. Jeśli testy przejdą, uruchom URUCHOM_AKADEMIE.cmd.

TESTY WYKONANE W TYM PAKIECIE
- 92/92 PASS na Node.js v22.16.0.
- Nowa regresja walidatora: 8/8 PASS.
- Zachowane testy FIX80–FIX87.
- Node.js v24.19.0 nie jest dostępny w środowisku budowania; potwierdź uruchomienie na komputerze docelowym.

BEZPIECZEŃSTWO
Nie zmieniono bazy D1 ani jej migracji. Nie zmieniono OPENAI_API_KEY.
Nie wykonano publikacji produkcyjnej. FIX88 naprawia walidację lokalną przed publikacją.
Stały adres produkcyjny należy uznać za zaktualizowany dopiero po pozytywnym potwierdzeniu przez Auto-Watcher.
