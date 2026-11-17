NAUKA OD A DO Z — FIX99

CEL
FIX99 naprawia kolejkę zdjęć w widokach katalogu, metod naprawy i diagnostyki. FIX98 weryfikował obecność źródeł, ale nie chronił poprawnie wszystkich dynamicznych/ukrytych elementów obrazów i mógł zużywać budżet API na ukryte zakładki.

CO ZMIENIONO
- Aktywny widok i obszar do 1450 px od viewportu mają pierwszeństwo.
- Ukryty IMG w widocznym wrapperze karty nie jest już pomijany.
- Kolejka ponawia skan po nawigacji, scrollu i zmianie rozmiaru okna.
- Kategorie metod naprawy są mapowane z polskich nazw; wszystkie 147 metod są rozpoznane.
- 21 slotów strony głównej ma oddzielne preferowane źródła zdjęć.
- Ukryte widoki nie pobierają zdjęć na starcie i nie zabierają limitu 180 żądań Openverse.

TESTY
W katalogu głównym uruchom:
  WYKONAJ_TESTY_FIX99.cmd

Runner:
  node scripts/run-tests-fix99.mjs

Wynik sprawdzony podczas przygotowania: 132/132 testów regresji + 17/17 kontroli składni.

WAŻNE — ZDALNE ŹRÓDŁA
13 istniejących fotografii w banerze/slajdach/kafelkach pozostaje lokalnych.
37 źródeł zdjęć w manifeście (w tym 21 preferowanych przypisań do homepage) pochodzi ze zdalnych źródeł licencjonowanych. Do ich pobrania przeglądarka potrzebuje Internetu. 147 metod ładuje fotografie progresywnie z Openverse/Wikimedia; limity API, filtry zgodności tematycznej i licencje obowiązują nadal. Ilustracja jest fallbackiem, gdy nie ma odpowiedniego zdjęcia.

PUBLIKACJA
Wersja produktu: 6.8.0
Hotfix publikatora: FIX99
Build runtime zdjęć: 6.8.0-fix99-active-view-topic-photo-priority-20261108
Build hotfixa publikatora: 6.8.0-fix99-photo-publication-guard-active-view-20261108

Ten pakiet nie został opublikowany na Cloudflare. D1/migracje nie były uruchamiane ani zmieniane. OneClick zachowuje dotychczasowy przepływ publikacji; przed uruchomieniem należy zweryfikować konfigurację i stan migracji produkcyjnych.
