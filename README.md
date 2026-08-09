# Volleyball Trainer 2.5.1

## Neu in 2.5.1

- Feste Schritt-Vorlagen im Bearbeitungsmodus: **Aufschlag, Annahme, Angriff, Block, Abwehr**.
- Eine Vorlage setzt nur den Ausgangsnamen. Das Namensfeld bleibt editierbar, z. B. **Block → Doppelblock**.
- Eigene Namen werden exakt so am Schritt gespeichert; die fünf Standardvorlagen bleiben unverändert erhalten.
- Supabase Project URL und Publishable Key sind bereits in `config.js` eingetragen.
- Die App liest jetzt ausdrücklich `SUPABASE_PUBLISHABLE_KEY` (mit Fallback auf den alten `SUPABASE_ANON_KEY`).
- Alle CSS-, Logo-, Config- und App-Dateien tragen `?v=2.5.1`, damit GitHub Pages/Safari keine alte 2.4.2-Datei aus dem Cache verwenden.
- Supabase: `pgcrypto`-Funktionen werden schemaqualifiziert über `extensions.crypt` und `extensions.gen_salt` aufgerufen; behebt den Fehler `function crypt(text, text) does not exist` in SECURITY-DEFINER-Funktionen.

- Fehler beim Verschieben von Spielern behoben: abgeschlossene Schrittanimationen werden sauber entfernt und überdecken die im Bearbeitungsmodus gesetzten SVG-Positionen nicht mehr.
- Im Bearbeitungsmodus lässt sich jeder Spieler wieder direkt im aktuellen Schritt positionieren.
- Die Pfeile links/rechts animieren im Anzeigemodus weiterhin genau den vorherigen bzw. nächsten Schritt.
- **Play** springt immer auf Schritt 1 und spielt anschließend automatisch alle Schritte bis zum letzten Schritt durch.
- Ein erneuter Druck auf Play/Stop während der Wiedergabe beendet die laufende Sequenz.
- Änderungen werden weiterhin erst durch Speichern dauerhaft übernommen.
- Testpasswort bleibt leer: Passwortdialog öffnen und einfach **OK** drücken.

## GitHub Pages

Alle Dateien dieses Ordners in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.

## Supabase

Die Supabase-Anbindung ist in dieser Version bereits vorkonfiguriert. Nach dem Upload sollte unten `Speicherung: Supabase verbunden` erscheinen. Falls noch eine alte Seite im Safari-Cache liegt, die Seite einmal vollständig neu laden oder den Tab schließen und erneut öffnen.


## Version 2.5.1
Lokale Browserdaten können im Bearbeitungsmodus einmalig nach Supabase übertragen werden. Im Anzeigemodus wird keine Migrationsfunktion angezeigt.


## 2,5D-Anzeige (ab 2.5.1)
- Im Anzeigemodus kann zwischen 2D und 2,5D gewechselt werden.
- Der Bearbeitungsmodus bleibt immer 2D.
- Die 2,5D-Kamera blickt erhöht von hinter der eigenen Grundlinie auf das Netz.
- Die gespeicherten Spielerkoordinaten sind in beiden Ansichten identisch.
- Jeder Spieler wird mit einer perspektivischen Standfläche von ungefähr 1 x 1 Meter dargestellt, damit Abstände und Überlappungen insbesondere in der Annahme sichtbar bleiben.


## Neu in 2.5.1
- 2,5D-Perspektive: eigenes Feld breiter, gegnerisches Hinterfeld kompakter, Netzpfosten weiter außen.
- Optionale Aktionsverknüpfungen pro Schritt: Aufschlag, Annahme, Zuspiel, Angriff, Block.
- Akteur, Zielspieler und bei Block ein zweiter Blockspieler können gespeichert werden.
- Der Ball kann im Bearbeitungsmodus explizit an die Position des Akteurs gesetzt werden.
- Aktionen ergänzen die freie 2D-Positionsplanung und verändern sie nicht automatisch.


## Neu in 2.5.5
- Ein an den Kontaktspieler gekoppelter Ball fängt im Bearbeitungsmodus keine Touch-/Pointer-Ereignisse mehr ab. Der Spieler bleibt dadurch auch direkt unter dem Ball zuverlässig verschiebbar.
- Der Ballflug zwischen zwei Schritten verwendet je nach Ballkontakt unterschiedliche Kurven und Geschwindigkeiten. Zuspiel ist höher, Angriff schneller/flacher; Aufschlag, Annahme, Block und Abwehr haben eigene Bewegungsprofile.
- Die gelbe Ballflug-Markierung wird als Kurve statt als Gerade dargestellt.


## Neu in 2.5.5
- Technik-Auswahl „oben“ / „unten“ bei Annahme, Zuspiel und Abwehr.
- 2,5D-Kontaktpunkt berücksichtigt die Technik: oben über Kopf, unten tiefer vor dem Körper.
- Ballflug startet und endet an den jeweiligen visuellen Kontaktpunkten.

## Neu in 2.6.3
- Obere Annahme, oberes Zuspiel und obere Abwehr zeigen den Ballkontakt in 2,5D deutlich über dem Kopf statt vor dem Gesicht.
- Die Armhaltung für obere und untere Technik wurde klarer getrennt.
- Angreifer sowie zugeordnete Blockspieler springen während des Übergangs in 2,5D sichtbar hoch.
- Bei einem eigenen Blockkontakt springen der Blockspieler und ein optionaler zweiter Blockspieler ebenfalls.


## 2.6.3
- Oberes Zuspiel/Annahme deutlich höher über dem Kopf.
- Höhere Annahme-Flugkurven.
- Angriff/Block-Sprünge bleiben über zusammenhängende Kontakt-Schritte in der Luft und landen erst danach.


## Cache-sicher 2.6.3
- JavaScript, CSS und Konfiguration besitzen neue Dateinamen.
- Im Versionsbereich wird sichtbar angezeigt, welche JavaScript-Version tatsächlich geladen wurde.
- Bestehende Schritte und Supabase-Daten bleiben kompatibel; kein Neuaufbau des Ablaufs nötig.


## Neu in 2.6.3
- Abgestimmte Demo-Geometrie fuer oberes Zuspiel in 2,5D.
- Hohes Zuspiel fliegt als echte Bogenkurve.
- Angriff zum Block fliegt geradlinig.
- Blockflug zum Folgeschritt fliegt geradlinig; Angriff und Doppelblock bleiben ueber den Blockschritt gemeinsam in der Luft und landen anschliessend.
- Cache-sichere Dateinamen app-2.6.3.js, style-2.6.3.css und config-2.6.3.js.


## Version 2.6.4
- 2,5D-Feinjustierung: oberes Zuspiel klarer über dem Kopf.
- Angriffs- und Blockkontakt in 2,5D deutlich abgesenkt.


## Version 2.6.5
- Oberes Zuspiel in 2,5D wieder tiefer gesetzt: weiterhin über Kopf, aber näher an Händen und Kopf.


## Version 2.6.6
- Überkopf-Zuspiel in 2,5D um etwa eine Balllänge abgesenkt.
- Kontakt bleibt über dem Kopf, aber näher an Händen/Kopf.


## Version 2.6.7
- Überkopf-Zuspiel nochmals klar abgesenkt.
- Arme beim oberen Zuspiel verkürzt, damit die Darstellung natürlicher wirkt.


## Version 2.6.8
- Automatische Datenmigration beim Laden alter gespeicherter Schritte.
- Alte Annahme-, Zuspiel- und Abwehrkontakte ohne Technikangabe werden automatisch als oberer Kontakt interpretiert.
- Spieler- und Ballpositionen werden durch die Migration nicht verändert.
- Supabase-Daten müssen nicht pro Schritt neu gespeichert werden; die Migration wirkt direkt beim Laden und Rendern.


## Version 2.6.9
- Feste Zusatzinfo-Zeile unter dem Schrittnamen verhindert vertikales Springen während der Wiedergabe.


## Version 2.6.10
- Schalter 'Positionen: an/aus' für 2D und 2,5D.
- 2,5D zeigt bei aktivierter Option die Positionsnummer unter jedem Spieler.
- Einstellung wird lokal im Browser gespeichert.


## Version 2.6.11
- 2,5D-Ansicht vertikal enger zugeschnitten.
- Deutlich weniger Leerraum über dem Spielfeld auf mobilen Geräten.
- Spielfeldgeometrie und gespeicherte Positionen bleiben unverändert.


## Version 2.6.12
- Web-App-/Standalone-Unterstützung für iPhone und iPad.
- Manifest und Home-Screen-Icon ergänzt.
- Start vom Home-Bildschirm ohne Safari-Adressleiste.
- Bewusst kein Service-Worker-Cache, damit neue Releases weiterhin zuverlässig geladen werden.


## Version 2.6.13
- Neue kompakte Plausibilitätsprüfung unter dem Spielfeld.
- Fehler: Ballkontakt ohne Kontaktspieler, Aufschläger nicht hinter Grundlinie, Blocker falsche Mannschaft/Netzseite, mehr als drei reguläre Kontakte einer Mannschaft in Folge.
- Warnungen: Blocker zu weit vom Netz, Doppelblock zu weit auseinander, Angriff→Block inkonsistent, Ballkontakt weit vom Akteur.
- Block zählt bei der 3-Kontakt-Regel nicht als Ballkontakt.


## Version 2.6.14
- Korrigierte 3-Kontakt-Regel: Block zählt nicht als regulärer Ballkontakt, setzt als Berührung der blockenden Mannschaft die Kontaktzählung aber neu.


## Version 2.6.16
- Stabiler Neuaufbau des kompakten Bearbeitungsmodus auf Basis 2.6.14.
- Regelhinweise nur bei Problemen und nur im Bearbeitungsmodus.
- Antippen-only, Plus in der Schrittsteuerung, Speichern nur bei Änderungen.


## Version 2.6.17
- Regelbox wird nur im Bearbeitungsmodus und nur bei echten Warnungen/Fehlern angezeigt.
- Papierkorb zum Löschen eines Schritts sitzt direkt in der oberen Schrittsteuerung neben dem Plus.


## Version 2.6.18
- Spielsituation direkt oben per ＋ hinzufügen.
- Name wird beim Anlegen abgefragt.
- Spielsituation direkt oben per 🗑 löschen, mit Sicherheitsabfrage.
- Separate Situation-Bearbeitung im unteren Bereich entfernt.


## Version 2.6.19
- Aktionen werden über ein kompaktes Zahnrad-Menü direkt über dem Spielfeld konfiguriert.
- Neue Aktion „Punkt / Fehler“ beendet den Ballwechsel und verlangt keinen Kontaktspieler.
- Punkt/Fehler kann Punktgewinner und Fehlergrund speichern.
- Die Drei-Kontakt-Zählung wird beim Rallye-Ende zurückgesetzt.


## Version 2.7.0
- Neue Ebene **Teamaufstellung** über den Spielsituationen.
- Bestehende 2.6.x-Daten werden automatisch als **Hauptaufstellung** migriert.
- Teamaufstellungen besitzen eigene Rollen/Libero-Konfiguration und eigene Spielsituationen.
- Spielphase entfernt; Aufstellungs-/Rotationsprüfung wird aus der Aktion **Aufschlag** abgeleitet.
- Außerhalb eines Aufschlags sind Spielerpositionen frei.
- Automatischer Web-App-Versionscheck über `version.json` mit `cache: no-store`.


## Version 2.7.1
- Teamaufstellungs-Konfiguration wird zuverlässig eingeblendet.
- Rollen- und Libero-Auswahl direkt unter Teamaufstellung.


## Version 2.7.2
- Aktionsmenü nochmals kompakter für iPhone-Bedienung.
- Horizontale Schrittübersicht mit direktem Sprung zu jedem Schritt.
- Aktueller Schritt wird in der Übersicht hervorgehoben.


## Version 2.7.3
- Schrittstatus farbig: gelb bei unvollständig/Warnung, rot bei Regelfehler.
- Spielsituation übernimmt den aggregierten Status ihrer Schritte.
- Punkt/Fehler beendet Play am Rallye-Ende.
- Schritt löschen mit Sicherheitsabfrage.
- Aktionsmenü öffnet nach Wahl einer neuen Schrittvorlage automatisch.
- Datenquelle in den Versionsdetails und aktualisierte „So funktioniert es“-Hilfe.
- Web-App zeigt vor einem automatischen Versionswechsel einen kurzen Update-Hinweis.
