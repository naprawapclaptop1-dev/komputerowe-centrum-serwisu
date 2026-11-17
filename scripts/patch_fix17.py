from pathlib import Path
import json
root=Path('/mnt/data/nauka_fix15_work')
web=root/'WEB_PUBLISH'
build='6.6.0-master-service-center-fix17-20261102'
# index branding and assets
p=web/'index.html'; s=p.read_text(encoding='utf-8')
s=s.replace('content="6.5.0-ultimate-repair-center-fix16-20261102"','content="'+build+'"')
s=s.replace('6.5.0 | ULTIMATE REPAIR CENTER','6.6.0 | MASTER SERVICE CENTER')
s=s.replace('ULTIMATE REPAIR CENTER / FIX16','MASTER SERVICE CENTER / FIX17')
s=s.replace('Centrum nauki elektroniki i serwisu PC rozszerzone o bazę kodów STOP/POST, dziennik pomiarów z warunkami i źródłami, lokalne adnotacje schematów PDF/obrazów, analizę raportów Windows, anonimizowane przypadki napraw, trenera technika oraz sześć akademii specjalistycznych. Dane FIX16 pozostają lokalne, a raport przeglądarki nie zastępuje testów fizycznego sprzętu.','Centrum szkolenia i pracy technika: sekwencje startowe, netlisty PCB, import przebiegów z przyrządów, plan diagnostyczny AI, audyt stanowiska, lokalne karty napraw i scenariusze praktyczne. Dane FIX17 pozostają lokalne; moduły nie sterują sprzętem i nie zastępują dokumentacji producenta.')
s=s.replace('  <link rel="stylesheet" href="assets/master-academy-650-ultimate.css?v=6.5.0-fix16">','  <link rel="stylesheet" href="assets/master-academy-650-ultimate.css?v=6.5.0-fix16">\n  <link rel="stylesheet" href="assets/master-academy-660-center.css?v=6.6.0-fix17">')
s=s.replace('<script src="assets/master-academy-650-ultimate.js?v=6.5.0-fix16" defer></script>','<script src="assets/master-academy-650-ultimate.js?v=6.5.0-fix16" defer></script>\n<script src="assets/master-academy-660-center.js?v=6.6.0-fix17" defer></script>')
p.write_text(s,encoding='utf-8')

# service worker
p=web/'service-worker.js'; s=p.read_text(encoding='utf-8')
s=s.replace('nauka-od-a-do-z-6.5.0-ultimate-repair-center-fix16-support-video-clean-fix9-20261102','nauka-od-a-do-z-6.6.0-master-service-center-fix17-20261102')
s=s.replace("'/assets/master-academy-650-ultimate.js', '/assets/master-academy-650-ultimate.css',","'/assets/master-academy-650-ultimate.js', '/assets/master-academy-650-ultimate.css', '/assets/master-academy-660-center.js', '/assets/master-academy-660-center.css',")
p.write_text(s,encoding='utf-8')

# release metadata
p=web/'release.json'; data=json.loads(p.read_text(encoding='utf-8'))
data['release']='6.6.0'; data['build']=build; data['production_published']=False
data['features'] += [
 'fix17-board-power-sequence-tracker-with-board-specific-evidence',
 'fix17-local-netlist-csv-import-and-net-grouping',
 'fix17-instrument-csv-import-and-numeric-waveform-plot',
 'fix17-evidence-based-repair-brain-triage-and-context-handoff-to-existing-ai',
 'fix17-browser-capability-audit-and-explicit-manual-hardware-inventory',
 'fix17-anonymous-local-service-work-cards-cost-estimates-and-reports',
 'fix17-practical-decision-scenarios-with-local-scoring',
 'fix17-local-json-backup-restore-merge-and-scoped-clear',
 'fix17-service-worker-assets-and-release-guard'
]
data['summary']['fix17']='New local-only board startup sequence journal, generic CSV netlist grouping, imported instrument waveform plotting, evidence-based triage context for existing Repair Master AI, browser capability audit separated from manual inventory, anonymous service work cards with cost estimate and TXT/CSV reports, and practical decision scenarios. No live instrument control, proprietary BoardView parsing, SMART/raw-disk access, OS hardware enumeration, customer PII capture, automatic upload or production publishing.'
data['summary']['privacy'] = str(data['summary'].get('privacy','')) + ' FIX17 work cards use anonymous internal references only and do not collect names, phone numbers, addresses, serial numbers or credentials; FIX17 data is local plaintext until separately exported.'
data['release_notes'] = (data.get('release_notes') or []) + [
 'FIX17: analizator sekwencji startowej zapisuje etapy według modelu, Board ID, rewizji i źródła. Nie narzuca uniwersalnych napięć.',
 'FIX17: netlista obsługuje lokalny CSV/TXT z nagłówkami Ref/Component, Net/NetName oraz opcjonalnie Pin/Pad i Description; nie parsuje zastrzeżonych formatów .fz/.brd.',
 'FIX17: hub przyrządów importuje CSV z kolumnami liczbowymi i tworzy wykres X/Y. Nie nawiązuje połączenia ani nie steruje przyrządem.',
 'FIX17: Repair Brain przygotowuje heurystyczny plan i kontekst do istniejącego Repair Master AI. Nie gwarantuje rozpoznania usterki ani nie wymyśla wartości referencyjnych.',
 'FIX17: audyt odczytuje wyłącznie właściwości udostępnione przez przeglądarkę; pozostałe podzespoły technik wpisuje ręcznie ze wskazaniem źródła.',
 'FIX17: lokalne karty pracy nie przechowują danych osobowych; kosztorys i status są narzędziem wewnętrznym, nie systemem fakturowym ani CRM.',
 'FIX17: scenariusze praktyczne oceniają wybór decyzji, nie wynik testu fizycznego ani kwalifikacje zawodowe.',
 'FIX17: kopia JSON scalana po ID; nowe rekordy localStorage pozostają niezaszyfrowane w miejscu. Bez synchronizacji chmurowej i bez zmian D1.'
]
data['summary']['production_published']=False
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Release and documentation files
(root/'WERSJA_6.6.0_FIX17.txt').write_text(f'''NAUKA OD A DO Z — DLA WSZYSTKICH\nWERSJA 6.6.0 FIX17\nMASTER SERVICE CENTER\nBuild: {build}\n\nZakres: sekwencje startowe płyt, netlisty CSV, wykresy pomiarowe CSV, Repair Brain, audyt stanowiska, lokalne karty pracy, scenariusze praktyczne i kopia FIX17.\n\nWydanie lokalne — production_published=false. Brak publikacji Cloudflare i brak zmian D1.\n''',encoding='utf-8')
(root/'CHANGELOG_6.6.0_FIX17.txt').write_text('''NAUKA OD A DO Z 6.6.0 FIX17 — CHANGELOG\nMASTER SERVICE CENTER\n\nNOWE MODUŁY\n1. Analizator sekwencji startowej: 10 etapów z oznaczeniem stanu, dowodem, modelem, Board ID, rewizją i źródłem dokumentacji.\n2. Netlista PCB: lokalny import CSV/TXT, wykrywanie kolumn Ref/Component, Net/NetName, Pin/Pad, grupowanie po sieciach, wyszukiwanie i eksport CSV.\n3. Hub przyrządów: lokalny import danych CSV, wybór dwóch kolumn liczbowych, wykres SVG X/Y, zapis punktów i historia. Bez połączenia ze sprzętem.\n4. Repair Brain: analiza wstępna według rodziny objawów, hipotezy, kolejne bezpieczne kroki, brakujące dane, kopiowanie kontekstu i przejście do istniejącego Repair Master AI.\n5. Audyt stanowiska: fakty udostępnione przez przeglądarkę oddzielone od ręcznie potwierdzonego inwentarza komponentów.\n6. Karty pracy: lokalny rejestr z wewnętrznym numerem, statusem, kosztami części/robocizny, oznaczeniem akceptacji, eksportem TXT/CSV. Bez danych osobowych klientów.\n7. Egzaminy praktyczne: cztery scenariusze po trzy decyzje, feedback, punktacja i historia lokalna.\n8. Prywatność FIX17: eksport, import i scalanie kopii JSON po identyfikatorach oraz usuwanie wyłącznie danych FIX17.\n\nZACHOWANO\n- 1060 lekcji, poprzednie moduły FIX11–FIX16, istniejące konta, API, bibliotekę, materiały i istniejący układ Warsztatu.\n- Produkcyjne D1 i Cloudflare nie były modyfikowane.\n\nOGRANICZENIA\n- Brak parsera zastrzeżonych plików BoardView .fz/.brd. Import netlisty wymaga wspieranego CSV/TXT.\n- Brak bezpośredniego sterowania miernikiem/oscyloskopem; wykresy pochodzą z importowanego CSV.\n- Repair Brain tworzy heurystyczny plan i kontekst do istniejącego asystenta, a nie automatyczny werdykt.\n- Audyt przeglądarki nie odczytuje uniwersalnie SMART, temperatur, EDID ani pełnej listy sprzętu.\n- Karty pracy i wpisy pozostają lokalne, bez synchronizacji; nie gromadzą PII.\n- Pełny test Chromium i testy fizycznego sprzętu wymagają wykonania na komputerze użytkownika.\n''',encoding='utf-8')
(root/'README_FIX17_MASTER_SERVICE_CENTER.txt').write_text('''NAUKA OD A DO Z 6.6.0 FIX17 — INSTRUKCJA\n\n1. Rozpakuj ZIP do nowego folderu.\n2. Uruchom WYKONAJ_TESTY_FIX17.cmd.\n3. Uruchom PODGLAD_LOKALNY_FIX17.cmd.\n4. Otwórz http://127.0.0.1:8765/ i przejdź do Warsztatu Mistrza PRO.\n5. Nowe zakładki FIX17 znajdują się w pasku podzakładek Warsztatu.\n\nSEKWENCJA STARTOWA\nWprowadź pełny model, Board ID/rewizję i źródło dokumentacji. Dla każdego etapu wybierz stan i wpisz dowód. Statusy są deklaracją technika, nie automatycznym odczytem płyty.\n\nNETLISTA PCB\nImportuj CSV/TXT z wierszem nagłówka. Wymagane są kolumny Ref/Component oraz Net/NetName. Opcjonalnie Pin/Pad oraz Description. Wybierz sieć lub filtruj tekst; eksportuje widoczne wiersze.\n\nPRZYRZĄDY / WYKRESY\nImportuj CSV/TXT z co najmniej dwiema kolumnami numerycznymi. Wybierz osie X/Y. Wykres powstaje z pliku, nie z połączenia na żywo.\n\nAI REPAIR BRAIN\nWypełnij objaw i dowody. Plan wstępny porządkuje hipotezy i dane do zebrania. Skopiuj kontekst i otwórz istniejący Repair Master AI; sprawdź wszystkie sugestie na podstawie dokumentacji konkretnego urządzenia.\n\nAUDYT STANOWISKA\n„Odczyt przeglądarkowy” pokazuje jedynie informacje dozwolone przez browser API. Dane CPU/GPU/RAM/Board/Storage/Monitor wpisane ręcznie muszą mieć źródło.\n\nKARTY NAPRAW\nUżywaj wewnętrznych identyfikatorów. Nie wpisuj nazwisk, telefonów, adresów, numerów seryjnych, haseł ani innych danych osobowych klientów. Karty są lokalne i nie są CRM/fakturowaniem.\n\nKOPIA FIX17\nEksport JSON pobiera dane nowych modułów. Import scala rekordy po ID. Dane w localStorage nie są szyfrowane w miejscu — zabezpiecz plik kopii i urządzenie. Usuwanie FIX17 nie narusza rekordów FIX11–FIX16.\n\nOGRANICZENIA TECHNICZNE\nNie ma parsera .fz/.brd, bezpośredniego sterowania przyrządami, dostępu do surowych dysków, automatycznego SMART/temperatur/EDID, zdalnej synchronizacji FIX17 ani produkcyjnej publikacji.\n''',encoding='utf-8')
