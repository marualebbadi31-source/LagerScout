# LagerScout (DE/EN) — static site + demo calendar

## Seiten
- `index.html` — Homepage (DE standard) mit Erklärung, wer ihr seid (Frische/Trocken/TK/Obst&Gemuese)
- `booking.html` — Zeitfenster-Reservierung als Kalender (Demo)

## Wichtig (Demo)
- Andere Firmen/Reservierungen werden **generiert** (nicht real).
- Deine Reservierungen werden **lokal im Browser** gespeichert (LocalStorage).
- Für echte, gleichzeitige Nutzer (mehrere Disponenten) brauchst du ein Backend + Datenbank.

## Anpassen
- Texte: in `index.html` / `booking.html`
- Farben: in `styles.css` (Variablen in `:root`)
- Docks/Bereiche: in `booking.js` (`docks` & `cargoAreas`)
- Preis: in `booking.js` (price: 100)

## Gratis veröffentlichen
### Netlify (einfach)
- ZIP hochladen → live

### GitHub Pages
- Repo erstellen → Dateien hochladen → Settings → Pages

