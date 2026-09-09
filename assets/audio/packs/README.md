# Instrumentpakete des Musikgenerators

Die auswählbaren Klangwelten und ihre Samplepakete werden zentral in
`music-sample-packs.js` registriert. Ein neues Paket benötigt:

1. kompakte, sauber geschnittene Audiodateien in einem eigenen Unterordner,
2. eine `LICENSE.md` mit Quelle, Urheber und erlaubter Nutzung,
3. einen Registry-Eintrag mit Tonzuordnung, Rollen und Hüllkurve,
4. die Zuordnung zu mindestens einer Klangwelt,
5. einen Eintrag im App-Shell-Cache für vollständige Offline-Nutzung.

Rhythmus und Bass bleiben die gemeinsame Basis. Instrumentpakete ergänzen
Harmonie, Akzente oder Atmosphäre. Dadurch können später zum Beispiel Bläser,
Gitarren, echte Chorstimmen oder weitere regionale Instrumente ergänzt werden,
ohne die Vorlagenstruktur des Trainingsplayers erneut umzubauen.
