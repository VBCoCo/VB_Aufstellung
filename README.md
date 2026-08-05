# Volleyball Trainer

Kleine modulare Web-App für Volleyball-Aufstellungen, Rotationen, Laufwege und Ballflug.

## Dateien

- `index.html` – Oberfläche
- `style.css` – Darstellung
- `app.js` – zentrale Bedienlogik
- `animation.js` – Ball- und Spieleranimation
- `rotation.js` – Rotationen und Grunddaten
- `validation.js` – Aufstellungsprüfung
- `storage.js` – Speicherung im Browser

## Starten

Am einfachsten mit einem kleinen lokalen Webserver:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

Direktes Öffnen von `index.html` kann je nach Browser wegen JavaScript-Modulen eingeschränkt sein.

## Speicherung

Beim Klick auf das Speichersymbol wird der aktuelle Zustand im `localStorage` des Browsers gespeichert.
