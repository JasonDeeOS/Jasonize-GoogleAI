# Anweisungen für die KI-Entwicklung

Dieses Dokument enthält die Kernanweisungen und permanenten Aufgaben für mich, die KI, bei der Weiterentwicklung der "Cloud & Lokale Notizen App". Es dient dazu, Konsistenz, Qualität und eine aktuelle Dokumentation sicherzustellen.

---

### 1. Grundprinzipien

*   **Sprache:** Die primäre Sprache für alle Benutzeroberflächen-Texte, Kommentare und Dokumentationsdateien (`README.md`, diese Datei etc.) ist **Deutsch**.
*   **Code-Qualität:** Der Code muss sauber, lesbar, wartbar und stark typisiert (TypeScript) sein. Halte dich an die bestehenden Code-Muster und die etablierte Architektur.
*   **UI/UX:** Behalte die bestehende Dark-Mode-Ästhetik bei. Verwende die in `index.html` definierten Tailwind-CSS-Farben (`background`, `surface`, `primary` etc.). Stelle sicher, dass alle neuen Elemente responsiv und zugänglich sind.
*   **Technischer Stack:** Das Projekt ist ein "build-less" Setup. Es werden keine Build-Tools (wie Vite oder Webpack) eingeführt. Der Stack besteht aus React 18, TypeScript und Tailwind CSS (via CDN).

---

### 2. Dauerhafte Aufgaben bei JEDER Code-Änderung

Bei jeder Anfrage, die zu einer Code-Änderung führt, muss die folgende Checkliste vollständig abgearbeitet werden:

*   **[ ] 1. Code implementieren:**
    *   Führe die angeforderte(n) Änderung(en) im Code durch.
    *   Stelle sicher, dass die neue Funktionalität die bestehende nicht beeinträchtigt.

*   **[ ] 2. `README.md` aktualisieren:**
    *   **[ ] Changelog:** Füge einen neuen, aussagekräftigen Eintrag im Abschnitt `6. Entwicklungsverlauf (Changelog)` hinzu.
    *   **[ ] Versionierung:** Passe die Versionsnummer im Changelog logisch an:
        *   **Bugfix:** v1.1.1 -> v1.1.2
        *   **Feature:** v1.1.1 -> v1.2.0
        *   **Breaking Change:** v1.1.1 -> v2.0.0
    *   **[ ] Features:** Aktualisiere die Liste unter `2. Features`, falls neue Funktionen hinzugefügt oder bestehende geändert wurden.
    *   **[ ] Benutzerhandbuch:** Passe den Abschnitt `3. Benutzerhandbuch` an, falls sich die Bedienung für den Endbenutzer ändert.
    *   **[ ] `App.tsx` Snapshot:** Wenn `App.tsx` wesentlich geändert wurde, **muss** der Code-Snapshot am Ende der `README.md` (`7. Versions-Snapshot`) aktualisiert werden, um den neuen Stand widerzuspiegeln.

*   **[ ] 3. Diese Datei (`instructions.md`) aktualisieren:**
    *   Überprüfe, ob die Anfrage neue, allgemeingültige Regeln oder Prozesse einführt, die hier für die zukünftige Entwicklung dokumentiert werden sollten.

---

### 3. Spezifische Anweisungen

*   **Cloud-Integration (GitHub Gist):** Die `services/githubService.ts` ist die einzige Schnittstelle zur GitHub API. Alle Cloud-Operationen in `App.tsx` müssen den `syncStatus`-Hook korrekt verwenden (`syncing`, `synced`, `error`), um dem Benutzer klares visuelles Feedback zu geben.
*   **State Management:** Der globale Zustand wird zentral in `App.tsx` mit React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) verwaltet. Behalte diese zentrale Logik bei und vermeide die Einführung komplexerer State-Management-Bibliotheken.
*   **Modals:** Der UI-Fluss basiert stark auf Modals. Neue Interaktionen sollten, wenn passend, ebenfalls in diesem Muster implementiert werden.
