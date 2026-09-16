# Instrumentpakete des Musikgenerators

Die produktiven Klangwelten und ihre gebündelten Samplepakete werden zentral in
`music-sample-packs.js` registriert. Das Super-Admin-**Power Dance Lab** ergänzt
ab Version 3.17.0 einen datengetriebenen Katalog in `vt_music_sample_packs`.
Kompatible tonale Lab-Pakete können dort über die Oberfläche ergänzt werden,
ohne den JavaScript-Code anzupassen.

Ein gebündeltes produktives Paket benötigt weiterhin:

1. kompakte, sauber geschnittene Audiodateien in einem eigenen Unterordner,
2. eine `LICENSE.md` mit Quelle, Urheber und erlaubter Nutzung,
3. einen Registry-Eintrag mit Tonzuordnung, Rollen und Hüllkurve,
4. die Zuordnung zu mindestens einer Klangwelt,
5. einen Eintrag im App-Shell-Cache für vollständige Offline-Nutzung.

Rhythmus und Bass bleiben die gemeinsame Basis. Instrumentpakete ergänzen
Harmonie, Akzente oder Atmosphäre. Dadurch können später zum Beispiel Bläser,
Gitarren, echte Chorstimmen oder weitere regionale Instrumente ergänzt werden,
ohne die Vorlagenstruktur des Trainingsplayers erneut umzubauen.

Im Lab müssen Sampledateien nach Tonhöhe benannt sein (`C3.mp3`, `Fs3.wav`,
`G4.ogg`). Lizenzname und Lizenzquelle sind Pflicht. Hochgeladene Pakete sind
zunächst ausschließlich im Lab aktiv und werden nicht automatisch produktiv.
