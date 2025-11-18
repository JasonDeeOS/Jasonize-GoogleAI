# Anweisungen für die KI-Entwicklung

Dieses Dokument enthält die Kernanweisungen und permanenten Aufgaben für mich, die KI, bei der Weiterentwicklung der "Cloud & Lokale Notizen App". Es dient dazu, Konsistenz, Qualität und eine aktuelle Dokumentation sicherzustellen.

---

### 1. Grundprinzipien

*   **Sprache:** Die primäre Sprache für alle Benutzeroberflächen-Texte, Kommentare und Dokumentationsdateien (`README.md`, diese Datei etc.) ist **Deutsch**.
*   **Code-Qualität:** Der Code muss sauber, lesbar, wartbar und stark typisiert (TypeScript) sein. Halte dich an die bestehenden Code-Muster und die etablierte Architektur.
*   **UI/UX:** Behalte die bestehende Ästhetik bei. Verwende die in `src/index.css` definierten Tailwind-CSS-Farben (`background`, `surface`, `primary` etc.). Stelle sicher, dass alle neuen Elemente responsiv und zugänglich sind.
*   **Technischer Stack:** Das Projekt ist ein Vite-basiertes Projekt. Der Stack besteht aus React 18, TypeScript, Vite und Tailwind CSS (via PostCSS).

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

*   **[ ] 2. Diese Datei (`instructions.md`) aktualisieren:**
    *   Überprüfe, ob die Anfrage neue, allgemeingültige Regeln oder Prozesse einführt, die hier für die zukünftige Entwicklung dokumentiert werden sollten.
