# PolisAkademin

Komplett webbapp för att plugga svensk polisjuridik inför Polisutbildningen.

## Starta appen

Öppna bara `index.html` i en modern webbläsare (Chrome, Firefox, Edge, Safari).

Ingen installation, ingen build – fungerar direkt.

Alternativt kan du köra en lokal server:

```bash
npx serve .
# eller
python3 -m http.server 8080
```

## Funktioner

### Startsida
- Dagens mål med progressbar
- Dagens lektion
- Kommande repetition (flashcards)
- Snabbval (Scenario, Kurser, Flashcards, AI-lärare)
- XP, Level, Streak
- Senaste aktivitet & översiktsstatistik

### Dashboard
- XP, Level, Streak, rättsvarsprocent
- Veckans studietid (stapeldiagram)
- Svåraste / starkaste områden
- Veckans mål

### Kurser
- 6 kurser: Polislagen, LOB, LVU, Brottsbalken, LPT, Kniv/vapen
- Progress per kurs
- Inbyggd quiz-modul (flerval + sant/falskt)

### Scenarier (kärnfunktion)
- 5 realistiska polisärenden
- Öppna frågor: Vad gör du? Vilken lag? Alternativ? Proportionalitet?
- AI-genererad feedback med poäng, nyckelpunkter, lagrum och proportionalitetsanalys
- Sokratisk stil – ingen direkt facit

### Flashcards
- Anki-liknande system
- Framsida/baksida
- Bedömning: Svår / Osäker / Bra / Lätt
- Spaced-repetition-redo (progress sparas i localStorage)

### Lagbibliotek
- Polislagen, Brottsbalken, LOB, LVU, LPT, Knivlagen, Rättegångsbalken
- Fullständig lagtext, förklaring, exempel, praktiska tips
- Egna anteckningar per paragraf
- Favoritmarkering

### AI-lärare
- Sokratisk metod – ställer följdfrågor
- Hänvisar till lagtext
- Ger tips utan att avslöja facit direkt
- Rule-based (kan bytas till riktig LLM-backend)

### Statistik
- Studieminuter, rätt/fel, träffsäkerhet
- XP & nivå
- Streak

### Övrigt
- Sökfunktion (lagar, paragrafer, scenarier, flashcards)
- Favoriter
- Admin-panel (placeholder för backend)
- Responsiv design (mobil + desktop)
- Mörkt tema med polisblå accenter
- Progress sparas i localStorage

## Design

Inspirerad av Duolingo, Brilliant, Notion, Anki och Quizlet.
Mörkt tema, vita/grå kort, diskreta polisblå accenter.

## Teknisk notering

Denna version är en komplett, körbar SPA byggd med React 18 + Tailwind via CDN för maximal portabilitet.

För en produktionsversion med Next.js/Vite, TypeScript, Supabase/Firebase, Framer Motion och Zustand finns strukturen och datamodellerna redo att porteras – all logik, mockdata och UX finns redan här.
