NAUKA OD A DO Z — FIX82
GLOBAL ACADEMY: POPRAWKA ZDALNEJ KONTROLI MODUŁU EGZAMINÓW
Wersja produktu: 6.8.0 (bez zmiany)

CO POKAZYWAŁ ZAŁĄCZONY LOG
Cloudflare przyjął deployment Direct Upload. Kontrola stałego adresu zwróciła jednak:
  remoteGlobalAcademyExpansionValid=false
  remoteGlobalAcademySuiteValid=false
  academyFeaturesMissing=globalAcademySuiteFix60
mimo że pliki JS, CSS i manifest odpowiadały HTTP 200.

PRZYCZYNA
AUTO_PUBLISH_WATCHER.js wymagał dosłownego tekstu "FIX70" w kodzie JS.
Funkcjonalny moduł certyfikacji/egzaminów używa rzeczywistego identyfikatora
"npaFix70CertificatesV1". Seria FIX70 jest prawidłowo opisana w manifeście,
a funkcjonalny test FIX73 potwierdza ten moduł. Walidator zdalny miał więc
fałszywie negatywny warunek, który blokował potwierdzenie całej Global Academy.

POPRAWKA FIX82
- wydzielono wspólny kontrakt markerów w scripts/global-academy-expansion-contract-fix82.cjs;
- walidator wymaga rzeczywistego identyfikatora npaFix70CertificatesV1 zamiast nieobecnego
  tekstu "FIX70";
- wszystkie pozostałe wymagane markery FIX64–FIX73 pozostają obowiązkowe;
- log watchera wypisuje teraz globalExpansionMissingMarkers, aby przyszły brak
  konkretnego symbolu był widoczny, zamiast ukrywać się jako ogólne academyFeatures=false;
- OneClick i AUTO-PUBLISH-WATCHER uruchamiają nowy test regresyjny.

ZACHOWANE
- wersja produktu 6.8.0;
- identyfikator bazowego wydania FIX51 (to stały identyfikator bazy wydania, nie numer bieżącego hotfixa);
- FIX77: 13 niepowtarzalnych fotografii, SHA-256 i pHash;
- FIX80: sześć osobnych ilustracji SVG w pokazie;
- FIX81: Direct Upload bez --branch;
- istniejący projekt Cloudflare Pages, D1, sekret OpenAI i migracje.

URUCHOMIENIE
1. Zrób kopię G:\AKADEMIA_SERWISU_PRO.
2. Rozpakuj pełny ZIP FIX82 do katalogu projektu.
3. Zachowaj swój wrangler.toml, TOOLS_CLOUDFLARE, poświadczenia i BACKUPS_D1.
4. Uruchom WYKONAJ_TESTY_FIX82.cmd.
5. Po pozytywnych testach uruchom dotychczasowy URUCHOM_NAUKE_OD_A_DO_Z.cmd / OneClick.
6. Pozostaw okno obserwatora otwarte. Sukces wymaga potwierdzenia wymaganych modułów na stałym adresie produkcyjnym.

UWAGA
Testy uruchomiono w kontenerze Linux na Node.js 22.16.0. Należy je powtórzyć
na komputerze użytkownika w Windows z Node.js 24.19.0. Ta paczka nie wykonuje
publikacji w chmurze, migracji D1 ani zmian sekretów.
