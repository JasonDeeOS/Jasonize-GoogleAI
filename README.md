# Cloud & Lokale Notizen App

Eine vielseitige, moderne Notizanwendung, die Benutzern maximale Flexibilität bei der Speicherung und Organisation ihrer Gedanken bietet. Das Kernkonzept ist ein hybrider Ansatz, der zwei Speicherorte kombiniert: den schnellen, offline verfügbaren **lokalen Speicher** des Browsers und einen optionalen **Cloud-Speicher** über die GitHub Gist API für geräteübergreifende Synchronisierung.

![App Screenshot](https://picsum.photos/1200/600)

## Inhaltsverzeichnis

1.  [High-Level-Konzept](#1-high-level-konzept)
2.  [Features](#2-features)
3.  [Benutzerhandbuch: Cloud-Synchronisierung einrichten](#3-benutzerhandbuch-cloud-synchronisierung-einrichten)
4.  [Entwickler-Setup](#4-entwickler-setup)
5.  [Technischer Stack](#5-technischer-stack)
6.  [Entwicklungsverlauf (Changelog)](#6-entwicklungsverlauf-changelog)
7.  [Versions-Snapshot (Prompt-Grundlage)](#7-versions-snapshot-prompt-grundlage)

---

### 1. High-Level-Konzept

Die "Cloud & Lokale Notizen App" ist als reaktionsschnelle Single-Page-Application (SPA) konzipiert, die ein klares, intuitives Benutzererlebnis in einem ansprechenden Dark Mode bietet. Sie ermöglicht es Benutzern, Notizen entweder nur lokal im Browser oder synchronisiert über mehrere Geräte in der Cloud zu speichern.

### 2. Features

*   **Notizen verschieben (Lokal -> Cloud):** Übertragen Sie Notizen mit einem Klick vom lokalen Speicher in die Cloud.
*   **Automatische Hintergrund-Synchronisierung:** Cloud-Notizen werden automatisch alle 60 Sekunden im Hintergrund aktualisiert, um Änderungen von anderen Geräten zu übernehmen.
*   **Theme-Umschalter (Light/Dark):** Wechseln Sie mit einem Klick im Header zwischen einem hellen und einem dunklen Design.
*   **Optimierter Dark Mode:** Verbessertes Farbschema im dunklen Modus für höheren Kontrast und bessere Lesbarkeit.
*   **Hybrider Speicher:** Wählen Sie pro Notiz, ob sie lokal (`localStorage`) oder in der Cloud (GitHub Gist) gespeichert werden soll.
*   **Papierkorb:** Gelöschte Notizen werden in einen Papierkorb verschoben und können von dort wiederhergestellt oder endgültig gelöscht werden, um Datenverlust zu vermeiden.
*   **Verschiedene Notiztypen:**
    *   **Textnotiz:** Für einfache Memos und Gedanken.
    *   **Checkliste:** Für To-do-Listen mit abhakbaren Einträgen.
    *   **Einkaufsliste:** Eine erweiterte Checkliste mit Feldern für Menge, Kategorie und Notizen sowie automatischer Gruppierung nach Kategorien.
*   **Optimierter "Neue Notiz"-Dialog:** Ein überarbeiteter, visueller Dialog macht die Auswahl des Notiztyps und des Speicherorts schneller und intuitiver.
*   **Subtile UI-Animationen:** Sanfte Animationen beim Erstellen, Aktualisieren und Löschen von Notizen sorgen für ein flüssigeres Benutzererlebnis.
*   **Permanente Statusanzeige:** Der Cloud-Sync-Status ist nun jederzeit prominent im Header sichtbar.
*   **Inhalts-Vorschau:** Sehen Sie direkt auf der Notizkarte einen Auszug des Inhalts, um Notizen schneller zu identifizieren.
*   **Erfolgsbenachrichtigungen:** Erhalten Sie eine kurzzeitige "Toast"-Nachricht als Bestätigung, wenn eine Notiz erfolgreich gespeichert wurde.
*   **Manuelle Synchronisierung:** Ein dedizierter Button, um Cloud-Notizen bei Bedarf manuell neu zu laden.
*   **Bestätigungs-Dialog:** Warnt Benutzer vor der manuellen Synchronisierung, um versehentliches Überschreiben zu verhindern.
*   **Responsive UI:** Eine moderne Benutzeroberfläche, die auf allen Geräten gut aussieht.
*   **Intuitive Bedienung:** Ein durchdachter Workflow vom Erstellen über das Anzeigen bis zum Bearbeiten und Löschen von Notizen.
*   **Verbesserte Fehleranzeige:** Sync-Fehler werden in einer ausblendbaren Benachrichtigung angezeigt, ohne den Zugriff auf die Notizen zu blockieren.

### 3. Benutzerhandbuch: Cloud-Synchronisierung einrichten

Um Ihre Notizen über mehrere Geräte hinweg zu synchronisieren, müssen Sie die App mit einem GitHub Gist verbinden. Dies erfordert zwei Dinge: eine **Gist-ID** und einen **Personal Access Token (PAT)**.

**Schritt 1: Personal Access Token (PAT) erstellen**

1.  Gehen Sie zu Ihren [GitHub Developer Settings](https://github.com/settings/tokens).
2.  Klicken Sie auf "Generate new token" und wählen Sie "Generate new token (classic)".
3.  Geben Sie dem Token einen aussagekräftigen Namen (z.B. "Notizen-App-Sync").
4.  Setzen Sie bei "Expiration" eine für Sie passende Gültigkeitsdauer.
5.  Unter "Select scopes" setzen Sie **nur** den Haken bei `gist`. Dies stellt sicher, dass der Token nur die Berechtigung hat, Gists zu lesen und zu schreiben.
6.  Klicken Sie auf "Generate token".
7.  **WICHTIG:** Kopieren Sie den Token sofort und speichern Sie ihn an einem sicheren Ort (z.B. Passwort-Manager). Sie werden ihn nach dem Verlassen der Seite nicht wieder sehen können.

**Schritt 2: Ein leeres Gist erstellen**

1.  Gehen Sie zu [gist.github.com](https://gist.github.com).
2.  Erstellen Sie ein neues, **geheimes (secret)** Gist.
    *   **Dateiname:** `cloud-notes.json`
    *   **Inhalt:** `{}` (zwei geschweifte Klammern)
3.  Klicken Sie auf "Create secret gist".
4.  Nach dem Erstellen sehen Sie in der URL-Leiste Ihres Browsers eine Adresse wie `https://gist.github.com/IhrUsername/abcdef1234567890`. Der lange Code am Ende (`abcdef1234567890`) ist Ihre **Gist-ID**. Kopieren Sie diese.

**Schritt 3: App konfigurieren**

1.  Öffnen Sie die Notizen-App.
2.  Klicken Sie auf das Zahnrad-Icon oben rechts, um die Einstellungen zu öffnen.
3.  Fügen Sie die kopierte **Gist-ID** und Ihren **Personal Access Token (PAT)** in die entsprechenden Felder ein.
4.  Klicken Sie auf "Speichern".

Die App wird nun versuchen, sich mit Ihrem Gist zu verbinden. Wenn alles geklappt hat, ist die "Cloud Notizen"-Sektion aktiv und bereit zur Nutzung.

### 4. Entwickler-Setup

Das Projekt ist als "build-less" Setup konzipiert und benötigt nur einen einfachen statischen Webserver.

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Webserver starten:**
    Verwenden Sie ein beliebiges Tool, um einen lokalen Webserver im Projektverzeichnis zu starten. Ein einfacher Weg ist die Verwendung von `serve`:
    ```bash
    # Falls noch nicht installiert: npm install -g serve
    serve .
    ```
3.  Öffnen Sie die angezeigte URL (z.B. `http://localhost:3000`) in Ihrem Browser.

Für Entwicklungszwecke können Sie eine Fallback-Konfiguration direkt in `App.tsx` eintragen, um die Cloud-Funktionalität ohne UI-Eingabe zu testen.

### 5. Technischer Stack

*   **Framework:** React 18
*   **Sprache:** TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **Icons:** Inline SVG als React-Komponenten
*   **Lokaler Speicher:** `window.localStorage`
*   **Cloud-API:** GitHub Gist REST API

### 6. Entwicklungsverlauf (Changelog)

*   **v2.1.0 (Feature Release):**
    *   **Hinzugefügt:** Eine Funktion zum Verschieben von lokalen Notizen in die Cloud wurde implementiert. Diese Aktion ist über die Notiz-Detailansicht verfügbar.
*   **v2.0.4 (UI/UX Improvement):**
    *   **Verbessert:** Der 'Cloud erstellen'-Button im "Neue Notiz"-Dialog wurde visuell hervorgehoben (solide Hintergrundfarbe), um seine Bedeutung als primäre Aktion zu verdeutlichen und die Konsistenz mit anderen Buttons zu verbessern.
*   **v2.0.3 (UI/UX Improvement):**
    *   **Verbessert:** Die UI-Farbpalette wurde überarbeitet. Die primäre Akzentfarbe ist nun Orange und die sekundäre Farbe ist Cyan, was der App ein frischeres, moderneres Aussehen verleiht.
*   **v2.0.2 (UI/UX Improvement):**
    *   **Verbessert:** Der Kontrast und die Lesbarkeit im Dark Mode wurden optimiert. Insbesondere die Textfarbe auf primären Buttons wurde angepasst, um die Barrierefreiheit zu erhöhen.
*   **v2.0.1 (Bugfix Release):**
    *   **Behoben:** Ein Laufzeitfehler (`TypeError`) wurde behoben, der beim Erstellen von neuen Listen- oder Einkaufslisten-Notizen auftrat. Die Zustandsverwaltung im Notiz-Editor wurde robuster gestaltet, um diesen Fehler zu verhindern.
*   **v2.0.0 (Major Feature Release):**
    *   **Hinzugefügt:** Eine automatische Hintergrund-Synchronisierung wurde implementiert. Die App ruft nun alle 60 Sekunden den neuesten Stand der Cloud-Notizen aus dem Gist ab, um Änderungen von anderen Geräten nahtlos zu übernehmen. Ein Sperrmechanismus verhindert dabei Datenkonflikte.
*   **v1.9.0 (Feature Release):**
    *   **Hinzugefügt:** Ein Theme-Umschalter (Light/Dark Mode) wurde im Header implementiert. Die Benutzereinstellung wird im `localStorage` gespeichert.
*   **v1.8.0 (Feature Release):**
    *   **Hinzugefügt:** Eine Papierkorb-Funktion wurde implementiert. Notizen werden nicht mehr sofort gelöscht, sondern in einen "Papierkorb"-Bereich verschoben, aus dem sie wiederhergestellt oder endgültig gelöscht werden können. Dies gilt sowohl für lokale als auch für Cloud-Notizen.
*   **v1.7.0 (UX Redesign & Bugfix):**
    *   **Überarbeitet:** Der Dialog zur Auswahl eines neuen Notiztyps wurde komplett neugestaltet. Statt Radio-Buttons gibt es nun interaktive Karten mit Icons und direkten "Erstellen"-Aktionen, was den Workflow von drei auf zwei Klicks reduziert.
    *   **Behoben:** Ein kritischer Bug wurde behoben, der das Erstellen neuer Notizen verhinderte. Die zugrundeliegende Zustandsverwaltung wurde bereinigt und robuster gestaltet.
*   **v1.6.1 (Bugfix Release):**
    *   **Behoben:** Ein kritischer Bug, der das zuverlässige Löschen von Cloud-Notizen verhinderte, wurde durch die Implementierung eines "optimistischen" Updates behoben. Die neue Logik verhindert Probleme mit veraltetem Zustand ("stale state") und stellt im Fehlerfall die Notiz sicher wieder her.
*   **v1.6.0 (UX Improvement):**
    *   **Hinzugefügt:** Subtile Animationen beim Erstellen, Aktualisieren und Löschen von Notizen für ein flüssigeres UI-Feedback.
*   **v1.5.0 (UI Improvement):**
    *   **Verbessert:** Der Synchronisierungsstatus der Cloud-Notizen wird nun direkt im Header neben dem App-Namen angezeigt, um eine bessere Sichtbarkeit zu gewährleisten.
*   **v1.4.0 (UX Improvement):**
    *   **Hinzugefügt:** Eine kurzzeitige "Toast"-Benachrichtigung wird nach dem erfolgreichen Speichern einer Notiz angezeigt, um dem Benutzer direktes Feedback zu geben.
*   **v1.3.0 (Security Feature):**
    *   **Hinzugefügt:** Ein Bestätigungsdialog wird vor einer manuellen Synchronisierung angezeigt, um den Benutzer vor dem versehentlichen Überschreiben von Daten zu warnen.
*   **v1.2.1 (UI Improvement):**
    *   **Verbessert:** Die Fehleranzeige für die Cloud-Synchronisierung wurde durch eine ausblendbare `Alert`-Komponente ersetzt. Dies verhindert, dass der Notizenbereich bei einem Sync-Fehler blockiert wird.
*   **v1.2.0 (Feature Release):**
    *   Inhalts-Vorschau auf Notizkarten hinzugefügt, die je nach Notiztyp entweder die ersten Textzeilen oder die Anzahl der Listeneinträge anzeigt.
*   **v1.1.1 (Process Update):**
    *   `instructions.md` erstellt, um Kernanweisungen und dauerhafte Aufgaben für die KI-Entwicklung zu dokumentieren.
*   **v1.1.0 (Feature Release):**
    *   Manueller Synchronisierungs-Button für Cloud-Notizen hinzugefügt, um die Synchronisierung bei Bedarf auszulösen.
*   **v1.0.1 (Bugfix Release):**
    *   **Behoben:** Eine Race Condition, die das Löschen von Cloud-Notizen unzuverlässig machte. Ein unnötiger Re-Sync wurde durch die Optimierung des Renderings mit `useMemo` verhindert.
*   **v1.0.0 (Initial Release):**
    *   Grundstruktur der App mit Header und zwei Notiz-Grids (Lokal & Cloud) erstellt.
    *   Implementierung des kompletten Notiz-Lebenszyklus: Erstellen, Anzeigen, Bearbeiten, Löschen.
    *   Einführung von drei Notiztypen: Text, Liste, Einkaufsliste.
    *   Vollständige Integration mit `localStorage` für lokale Notizen und der GitHub Gist API für Cloud-Notizen.
    *   Erstellung aller notwendigen Modals (`Settings`, `NewNoteType`, `NoteView`, `NoteEditor`).
    *   Styling im Dark Mode mit Tailwind CSS.
    *   Hinzufügen einer simplen Datenmigrationslogik für Notizen älteren Formats.

### 7. Versions-Snapshot (Prompt-Grundlage)

Dieser Abschnitt enthält einen vollständigen Code-Snapshot der Hauptkomponente `App.tsx` zum Zeitpunkt des Releases v2.1.0. Er dient als präzise, versionierte Blaupause und kann als verlässliche Grundlage für eine Weiterentwicklung (z.B. durch eine KI) dienen.

```typescript
// --- App.tsx Snapshot v2.1.0 ---
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Note, GithubGistSettings, NoteType } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { getGistContent, updateGistContent } from './services/githubService';

import NoteCard from './components/NoteCard';
import SettingsModal from './components/SettingsModal';
import NewNoteTypeModal from './components/NewNoteTypeModal';
import NoteViewModal from './components/NoteViewModal';
import NoteEditorModal from './components/NoteEditorModal';
import Alert from './components/Alert';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import CogIcon from './components/icons/CogIcon';
import PlusIcon from './components/icons/PlusIcon';
import SyncIcon from './components/icons/SyncIcon';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';

const DEV_FALLBACK_SETTINGS: GithubGistSettings = {
    gistId: '',
    token: '',
};

const App: React.FC = () => {
  const [localNotes, setLocalNotes] = useLocalStorage<Note[]>('local-notes', []);
  const [cloudNotes, setCloudNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useLocalStorage<GithubGistSettings>('gist-settings', { gistId: '', token: '' });
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  const effectiveSettings = useMemo(() => {
    return (settings.gistId && settings.token) ? settings : DEV_FALLBACK_SETTINGS;
  }, [settings]);
  
  const isCloudConfigured = !!(effectiveSettings.gistId && effectiveSettings.token);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [deletingNoteIds, setDeletingNoteIds] = useState(new Set<string>());
  const [updatedNoteId, setUpdatedNoteId] = useState<string | null>(null);

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isNewNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditorModalOpen, setEditorModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeNoteLocation, setActiveNoteLocation] = useState<'local' | 'cloud' | null>(null);
  const [newNoteConfig, setNewNoteConfig] = useState<{ type: NoteType; location: 'local' | 'cloud' } | null>(null);
  
  const isSyncingRef = useRef(false);

  const activeLocalNotes = useMemo(() => localNotes.filter(n => !n.deletedAt).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [localNotes]);
  const deletedLocalNotes = useMemo(() => localNotes.filter(n => n.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()), [localNotes]);
  const activeCloudNotes = useMemo(() => cloudNotes.filter(n => !n.deletedAt).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [cloudNotes]);
  const deletedCloudNotes = useMemo(() => cloudNotes.filter(n => n.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()), [cloudNotes]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // ... (rest of the component logic)
  
  const handleMoveNoteToCloud = async (noteId: string) => {
    const noteToMove = localNotes.find(n => n.id === noteId);
    if (!noteToMove || !isCloudConfigured) return;

    closeAllModals();
    setSyncStatus('syncing');

    const newCloudNotes = [...cloudNotes, noteToMove];

    try {
        await updateGistContent(effectiveSettings, newCloudNotes);
        setCloudNotes(newCloudNotes);
        setLocalNotes(prev => prev.filter(n => n.id !== noteId));

        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
        setToastMessage(`Notiz "${noteToMove.title}" erfolgreich in die Cloud verschoben.`);
    } catch (error) {
        console.error("Fehler beim Verschieben der Notiz in die Cloud:", error);
        setSyncStatus('error');
        setSyncError("Notiz konnte nicht in die Cloud verschoben werden.");
    }
  };
  
  // ... rest of the functions

  return (
    // ... JSX with new handlers in NoteViewModal
  );
};

export default App;
```