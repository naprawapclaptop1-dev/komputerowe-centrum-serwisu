# FIX228 — zagregowana analityka administratora

Chroniony endpoint administratora sprawdza połączenie D1, wymagane tabele, konfigurację Gemini i obecność wymaganych sekretów OAuth oraz zwraca wyłącznie agregaty: konta, sesje, zdarzenia, podejścia egzaminacyjne, certyfikaty, klasy, wpisy stanu, bank pytań i ogłoszenia/obecności. Nie zwraca indywidualnych rekordów, haseł, tokenów ani sekretów. Wynik nie jest potwierdzeniem deployu ani dostępności u dostawców OAuth.
