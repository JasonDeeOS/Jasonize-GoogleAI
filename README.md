# Cloud & Lokale Notizen App

Eine vielseitige, moderne Notizanwendung, die Benutzern maximale Flexibilität bei der Speicherung und Organisation ihrer Gedanken bietet. Das Kernkonzept ist ein hybrider Ansatz, der zwei Speicherorte kombiniert: den schnellen, offline verfügbaren **lokalen Speicher** des Browsers und einen optionalen **Cloud-Speicher** über die GitHub Gist API für geräteübergreifende Synchronisierung.

![App Screenshot](https://picsum.photos/1200/600)

## Inhaltsverzeichnis

1.  [High-Level-Konzept](#1-high-level-konzept)
2.  [Features](#2-features)
3.  [Benutzerhandbuch: Cloud-Synchronisierung einrichten](#3-benutzerhandbuch-cloud-synchronisierung-einrichten)
4.  [Lokales Entwickler-Setup](#4-lokales-entwickler-setup)
5.  [Deployment (Vercel)](#5-deployment-vercel)
6.  [Technischer Stack](#6-technischer-stack)
7.  [Entwicklungsverlauf (Changelog)](#7-entwicklungsverlauf-changelog)

---

### 1. High-Level-Konzept

Die "Cloud & Lokale Notizen App" ist als reaktionsschnelle Single-Page-Application (SPA) konzipiert, die ein klares, intuitives Benutzererlebnis bietet. Sie ermöglicht es Benutzern, Notizen entweder nur lokal im Browser oder synchronisiert über mehrere Geräte in der Cloud zu speichern.

### 2. Features

*   **Professioneller Build-Prozess:** Nutzt Vite für schnelle Entwicklung, Optimierung und robustes Deployment.
*   **Mobile-First-Optimierung:** Die gesamte Benutzeroberfläche ist für eine intuitive Bedienung auf Smartphones optimiert.
    *   **Floating Action Button (FAB):** Die wichtigste Aktion – das Erstellen einer neuen Notiz – ist über einen schwebenden Button in der unteren rechten Ecke jederzeit leicht erreichbar.
    *   **Bottom Sheet Modals:** Alle Dialoge gleiten auf mobilen Geräten vom unteren Bildschirmrand nach oben, was die Bedienung mit einer Hand erleichtert und sich nativer anfühlt.
*   **Offline-fähige Cloud-Notizen:** Erstellen und bearbeiten Sie Cloud-Notizen auch ohne Internetverbindung. Änderungen werden lokal gespeichert und automatisch synchronisiert, sobald wieder eine Verbindung besteht.
*   **Intelligenter Einkaufslisten-Editor:**
    *   **Smart Quick-Add:** Fügen Sie Artikel über eine intelligente Eingabezeile mit Autovervollständigung hinzu. Die Suche priorisiert Treffer am Wortanfang sowie aus der persönlichen Einkaufshistorie und hebt die Übereinstimmung visuell hervor.
    *   **Automatische Kategorisierung:** Artikel werden beim Hinzufügen automatisch der richtigen Kategorie zugeordnet.
    *   **"Häufig gekauft":** Greifen Sie mit einem Klick auf eine Liste Ihrer am häufigsten gekauften Artikel zu, um Listen noch schneller zu erstellen.
    *   **Inline-Editing:** Bearbeiten Sie Mengen und Notizen direkt in der Listenansicht, ohne separate Dialoge öffnen zu müssen. Der Editor gruppiert Artikel zur besseren Übersicht ebenfalls nach Kategorien.
*   **Notizen verschieben (Lokal -> Cloud):** Übertragen Sie Notizen mit einem Klick vom lokalen Speicher in die Cloud.
*   **Automatische Hintergrund-Synchronisierung:** Cloud-Notizen werden automatisch alle 60 Sekunden im Hintergrund aktualisiert, um Änderungen von anderen Geräten zu übernehmen.
*   **Theme-Umschalter (Light/Dark):** Wechseln Sie mit einem Klick im Header zwischen einem hellen und einem dunklen Design.
*   **Hybrider Speicher:** Wählen Sie pro Notiz, ob sie lokal (`localStorage`) oder in der Cloud (GitHub Gist) gespeichert werden soll.
*   **Papierkorb:** Gelöschte Notizen werden in einen Papierkorb verschoben und können von dort wiederhergestellt oder endgültig gelöscht werden, um Datenverlust zu vermeiden.
*   **Verschiedene Notiztypen:** Textnotiz, Checkliste, Einkaufsliste.
*   **Subtile UI-Animationen:** Sanfte Animationen beim Erstellen, Aktualisieren und Löschen von Notizen sorgen für ein flüssigeres Benutzererlebnis.

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

### 4. Lokales Entwickler-Setup

Das Projekt verwendet Vite als Build-Tool und erfordert Node.js und npm.

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
3.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
4.  Öffnen Sie die angezeigte URL (z.B. `http://localhost:5173`) in Ihrem Browser.

Für Entwicklungszwecke können Sie eine Fallback-Konfiguration direkt in `src/App.tsx` eintragen, um die Cloud-Funktionalität ohne UI-Eingabe zu testen.

### 5. Deployment (Vercel)

Dieses Projekt ist für ein nahtloses Deployment auf [Vercel](https://vercel.com) vorbereitet.

1.  **Repository pushen:** Stellen Sie sicher, dass Ihr Code in einem GitHub/GitLab/Bitbucket-Repository ist.
2.  **Projekt in Vercel importieren:**
    *   Importieren Sie Ihr Git-Repository in Vercel.
    *   Wählen Sie als **"Framework Preset"** die Option **"Vite"**.
    *   Vercel erkennt das Projekt automatisch und füllt alle Build-Einstellungen korrekt aus. Es sind keine weiteren manuellen Anpassungen notwendig.
3.  **Deploy:** Klicken Sie auf "Deploy". Vercel führt `npm run build` aus, findet den Output im `dist`-Ordner und stellt die optimierte Anwendung bereit.

### 6. Technischer Stack

*   **Build-Tool:** Vite
*   **Framework:** React 18
# Cloud & Lokale Notizen App

Eine vielseitige, moderne Notizanwendung, die Benutzern maximale Flexibilität bei der Speicherung und Organisation ihrer Gedanken bietet. Das Kernkonzept ist ein hybrider Ansatz, der zwei Speicherorte kombiniert: den schnellen, offline verfügbaren **lokalen Speicher** des Browsers und einen optionalen **Cloud-Speicher** über die GitHub Gist API für geräteübergreifende Synchronisierung.

![App Screenshot](https://picsum.photos/1200/600)

## Inhaltsverzeichnis

1.  [High-Level-Konzept](#1-high-level-konzept)
2.  [Features](#2-features)
3.  [Benutzerhandbuch: Cloud-Synchronisierung einrichten](#3-benutzerhandbuch-cloud-synchronisierung-einrichten)
4.  [Lokales Entwickler-Setup](#4-lokales-entwickler-setup)
5.  [Deployment (Vercel)](#5-deployment-vercel)
6.  [Technischer Stack](#6-technischer-stack)
7.  [Entwicklungsverlauf (Changelog)](#7-entwicklungsverlauf-changelog)

---

### 1. High-Level-Konzept

Die "Cloud & Lokale Notizen App" ist als reaktionsschnelle Single-Page-Application (SPA) konzipiert, die ein klares, intuitives Benutzererlebnis bietet. Sie ermöglicht es Benutzern, Notizen entweder nur lokal im Browser oder synchronisiert über mehrere Geräte in der Cloud zu speichern.

### 2. Features

*   **Professioneller Build-Prozess:** Nutzt Vite für schnelle Entwicklung, Optimierung und robustes Deployment.
*   **Mobile-First-Optimierung:** Die gesamte Benutzeroberfläche ist für eine intuitive Bedienung auf Smartphones optimiert.
    *   **Floating Action Button (FAB):** Die wichtigste Aktion – das Erstellen einer neuen Notiz – ist über einen schwebenden Button in der unteren rechten Ecke jederzeit leicht erreichbar.
    *   **Bottom Sheet Modals:** Alle Dialoge gleiten auf mobilen Geräten vom unteren Bildschirmrand nach oben, was die Bedienung mit einer Hand erleichtert und sich nativer anfühlt.
*   **Offline-fähige Cloud-Notizen:** Erstellen und bearbeiten Sie Cloud-Notizen auch ohne Internetverbindung. Änderungen werden lokal gespeichert und automatisch synchronisiert, sobald wieder eine Verbindung besteht.
*   **Intelligenter Einkaufslisten-Editor:**
    *   **Smart Quick-Add:** Fügen Sie Artikel über eine intelligente Eingabezeile mit Autovervollständigung hinzu. Die Suche priorisiert Treffer am Wortanfang sowie aus der persönlichen Einkaufshistorie und hebt die Übereinstimmung visuell hervor.
    *   **Automatische Kategorisierung:** Artikel werden beim Hinzufügen automatisch der richtigen Kategorie zugeordnet.
    *   **"Häufig gekauft":** Greifen Sie mit einem Klick auf eine Liste Ihrer am häufigsten gekauften Artikel zu, um Listen noch schneller zu erstellen.
    *   **Inline-Editing:** Bearbeiten Sie Mengen und Notizen direkt in der Listenansicht, ohne separate Dialoge öffnen zu müssen. Der Editor gruppiert Artikel zur besseren Übersicht ebenfalls nach Kategorien.
*   **Notizen verschieben (Lokal -> Cloud):** Übertragen Sie Notizen mit einem Klick vom lokalen Speicher in die Cloud.
*   **Automatische Hintergrund-Synchronisierung:** Cloud-Notizen werden automatisch alle 60 Sekunden im Hintergrund aktualisiert, um Änderungen von anderen Geräten zu übernehmen.
*   **Theme-Umschalter (Light/Dark):** Wechseln Sie mit einem Klick im Header zwischen einem hellen und einem dunklen Design.
*   **Hybrider Speicher:** Wählen Sie pro Notiz, ob sie lokal (`localStorage`) oder in der Cloud (GitHub Gist) gespeichert werden soll.
*   **Papierkorb:** Gelöschte Notizen werden in einen Papierkorb verschoben und können von dort wiederhergestellt oder endgültig gelöscht werden, um Datenverlust zu vermeiden.
*   **Verschiedene Notiztypen:** Textnotiz, Checkliste, Einkaufsliste.
*   **Subtile UI-Animationen:** Sanfte Animationen beim Erstellen, Aktualisieren und Löschen von Notizen sorgen für ein flüssigeres Benutzererlebnis.

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

### 4. Lokales Entwickler-Setup

Das Projekt verwendet Vite als Build-Tool und erfordert Node.js und npm.

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
3.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
4.  Öffnen Sie die angezeigte URL (z.B. `http://localhost:5173`) in Ihrem Browser.

Für Entwicklungszwecke können Sie eine Fallback-Konfiguration direkt in `src/App.tsx` eintragen, um die Cloud-Funktionalität ohne UI-Eingabe zu testen.

### 5. Deployment (Vercel)

Dieses Projekt ist für ein nahtloses Deployment auf [Vercel](https://vercel.com) vorbereitet.

1.  **Repository pushen:** Stellen Sie sicher, dass Ihr Code in einem GitHub/GitLab/Bitbucket-Repository ist.
2.  **Projekt in Vercel importieren:**
    *   Importieren Sie Ihr Git-Repository in Vercel.
    *   Wählen Sie als **"Framework Preset"** die Option **"Vite"**.
    *   Vercel erkennt das Projekt automatisch und füllt alle Build-Einstellungen korrekt aus. Es sind keine weiteren manuellen Anpassungen notwendig.
3.  **Deploy:** Klicken Sie auf "Deploy". Vercel führt `npm run build` aus, findet den Output im `dist`-Ordner und stellt die optimierte Anwendung bereit.

### 6. Technischer Stack

*   **Build-Tool:** Vite
*   **Framework:** React 18
*   **Sprache:** TypeScript
*   **Styling:** Tailwind CSS (via PostCSS)
*   **Icons:** Inline SVG als React-Komponenten
*   **Lokaler Speicher:** `window.localStorage`
*   **Cloud-API:** GitHub Gist REST API