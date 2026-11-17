FIX78 — INSTRUKCJA

Naprawia błąd OneClick: manifest zdjęć jest pobierany przez photo-uniqueness-fix77.js, a nie wpisywany jako osobny tag w index.html.

1. Rozpakuj pełny ZIP FIX78 do osobnego folderu lub na kopię projektu.
2. Zachowaj istniejący wrangler.toml, TOOLS_CLOUDFLARE i poświadczenia.
3. Uruchom WYKONAJ_TESTY_FIX78.cmd (33 kontrole).
4. Jeżeli wszystkie testy przejdą, uruchom ONECLICK_AKADEMIA.cmd.

Nie zmieniaj ani nie usuwaj bazy D1. FIX78 nie zawiera nowych migracji i nie zmienia OPENAI_API_KEY.
Testy uruchomione w kontenerze Linux na Node 22; na Windows należy uruchomić runner przy Node 24.19.0.

FIX78 porządkuje także wykonywanie preflightu: OneClick i Watcher uruchamiają wyłącznie pliki .js/.mjs/.cjs przez Node. Pliki .cmd są launcherami dla użytkownika, nie wejściem Node. Starszy WYKONAJ_TESTY_FIX77.cmd przekierowuje do zestawu FIX78.
