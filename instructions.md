# Anweisungen für die KI-Entwicklung

Dieses Dokument enthält die Kernanweisungen und permanenten Aufgaben für mich, die KI, bei der Weiterentwicklung der "Cloud & Lokale Notizen App". Es dient dazu, Konsistenz, Qualität und eine aktuelle Dokumentation sicherzustellen.

---

### 1. Grundprinzipien

*   **Sprache:** Die primäre Sprache für alle Benutzeroberflächen-Texte, Kommentare und Dokumentationsdateien (`README.md`, diese Datei etc.) ist **Deutsch**.
*   **Code-Qualität:** Der Code muss sauber, lesbar, wartbar und stark typisiert (TypeScript) sein. Halte dich an die bestehenden Code-Muster und die etablierte Architektur.
*   **UI/UX:** Behalte die bestehende Ästhetik bei. Verwende die in `src/index.css` definierten Tailwind-CSS-Farben (`background`, `surface`, `primary` etc.). Stelle sicher, dass alle neuen Elemente responsiv und zugänglich sind.
*   **Technischer Stack:** Das Projekt ist ein Vite-basiertes Projekt. Der Stack besteht aus React 18, TypeScript, Vite und Tailwind CSS (via PostCSS).

---

### 2. Der Hybride Workflow (Extrem Wichtig!)

Das Projekt verwendet einen hybriden Ansatz, um sowohl eine Vorschau in der AI Studio Sandbox als auch ein Deployment auf Vercel zu ermöglichen.

*   **`index.html`:** Dies ist die Produktions-Vorlage für **Vercel** und den **lokalen `npm run dev` Server**. Sie ist minimal und enthält keine CDN-Skripte.
*   **`index.sandbox.html`:** Dies ist der Einstiegspunkt für die **AI Studio Sandbox**. Sie enthält alle notwendigen CDN-Skripte (React, Babel, Tailwind), um den Code direkt im Browser auszuführen.

**Workflow:**
1.  **An die KI geben:** Um Änderungen in der Sandbox zu testen, **muss der Benutzer den Inhalt von `index.sandbox.html` als `index.html` bereitstellen.**
2.  **Von der KI erhalten:** Die KI wird die aktualisierten Quelldateien, die aktualisierte `index.sandbox.html` und die saubere `index.html` zurückgeben.
3.  **Wichtige Anforderung:** Damit die Sandbox funktioniert, müssen alle lokalen `import`-Anweisungen in den `.tsx` und `.ts` Dateien **explizite Dateiendungen** enthalten (z.B. `import App from './App.tsx'`). Vite kann dies verarbeiten, für die Sandbox ist es jedoch unerlässlich.

---

### 3. Interaktions-Workflow (Vorschlag & Bestätigung)

Um sicherzustellen, dass alle Änderungen den Erwartungen des Benutzers entsprechen, wird der folgende Prozess befolgt:

1.  **Analyse & Vorschlag:** Nach jeder Anfrage analysiere ich das Problem und präsentiere eine detaillierte **"Spezifikation der geplanten Änderungen"** in Listenform.
2.  **Warten auf Bestätigung:** Ich werde **keine Implementierung starten**, bis ich eine explizite Bestätigung vom Benutzer erhalten habe.
3.  **Trigger-Wort:** Die Implementierung der vorgeschlagenen Änderungen wird ausschließlich durch eine Nachricht ausgelöst, die das Wort "**go**" enthält.

---

### 4. Permanente Aufgaben bei JEDER Code-Änderung

Bei jeder Anfrage, die (nach Bestätigung) zu einer Code-Änderung führt, muss die folgende Checkliste vollständig abgearbeitet werden:

*   **[ ] 1. Code implementieren:**
    *   Führe die angeforderte(n) Änderung(en) im Code durch.
    *   Stelle sicher, dass die neue Funktionalität die bestehende nicht beeinträchtigt.

*   **[ ] 2. `README.md` aktualisieren:**
    *   **[ ] Changelog:** Füge einen neuen, aussagekräftigen Eintrag im Abschnitt `8. Entwicklungsverlauf (Changelog)` hinzu.
    *   **[ ] Versionierung:** Passe die Versionsnummer im Changelog logisch an.
    *   **[ ] Features:** Aktualisiere die Liste unter `2. Features`, falls neue Funktionen hinzugefügt oder bestehende geändert wurden.
    *   **[ ] Benutzerhandbuch:** Passe die relevanten Abschnitte (`3.`, `4.`, `5.`, `6.`) an, falls sich die Bedienung für den Endbenutzer ändert.

*   **[ ] 3. Diese Datei (`instructions.md`) aktualisieren:**
    *   Überprüfe, ob die Anfrage neue, allgemeingültige Regeln oder Prozesse einführt, die hier für die zukünftige Entwicklung dokumentiert werden sollten.
