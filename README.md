# Volleyball Trainer 3.0.0

Version 3 führt die Grundlage für eine geschützte Vereins-/Mannschafts-App ein:

- Login mit persönlicher E-Mail und Passwort
- Rollen Viewer, Bearbeiter, Vereinsadmin und Superadmin
- ein Benutzer kann mehrere Rollen gleichzeitig haben
- Superadmins erhalten dadurch keinen automatischen Zugriff auf Volleyball-Inhalte anderer Vereine
- mandantenfähiges Datenmodell: Verein → Mannschaft → Inhalte
- bestehende TTC-Geltendorf-Daten werden per Migration übernommen
- Offline bleibt nach erfolgreichem Login als reine Anzeige möglich

Die einmalige Einrichtung steht in `SETUP_V3.md`.
