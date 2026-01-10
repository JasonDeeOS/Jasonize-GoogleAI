import React, { useState, useEffect, useMemo, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { Note, GithubGistSettings, NoteType } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { useNotes } from './hooks/useNotes';
import { useSync } from './hooks/useSync';

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
import packageJson from '../package.json';

// --- Fallback-Konfiguration für Entwicklung ---
const DEV_FALLBACK_SETTINGS: GithubGistSettings = {
  gistId: '',
  token: '',
};

const MAX_CLOUD_NOTES = 10;
const APP_VERSION = packageJson.version;

const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<GithubGistSettings>('gist-settings', { gistId: '', token: '' });
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  const isCloudConfigured = !!(settings.gistId && settings.token);
  const isConfiguringRef = useRef(false);

  const {
    localNotes,
    activeLocalNotes,
    deletedLocalNotes,
    activeCloudNotes,
    deletedCloudNotes,
    allNotes,
    cloudNotes,
    setCloudNotes,
    handleSaveNote,
    handleDeleteNote,
    handleRestoreNote,
    handlePermanentDeleteNote,
    handleEmptyTrash,
    deletingNoteIds,
    updatedNoteId,
    migrateNotes,
    cloudTombstones,
    setCloudTombstones
  } = useNotes(isCloudConfigured);

  const effectiveSettings = settings.gistId && settings.token ? settings : DEV_FALLBACK_SETTINGS;

  const {
    syncStatus,
    syncError,
    setSyncError,
    lastSyncTime,
    syncSummary,
    nextSyncIn,
    syncCloudNotes
  } = useSync(effectiveSettings, isCloudConfigured, cloudNotes, setCloudNotes, cloudTombstones, setCloudTombstones, migrateNotes);

  useEffect(() => {
    if (isConfiguringRef.current) {
      if (syncStatus === 'synced') {
        setToastMessage("Verbindung zu GitHub Gist erfolgreich hergestellt!");
        isConfiguringRef.current = false;
      } else if (syncStatus === 'error') {
        setToastMessage(`Verbindung fehlgeschlagen: ${syncError}`);
        isConfiguringRef.current = false;
      }
    }
  }, [syncStatus, syncError]);

  // UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isNewNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditorModalOpen, setEditorModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeNoteLocation, setActiveNoteLocation] = useState<'local' | 'cloud' | null>(null);
  const [newNoteConfig, setNewNoteConfig] = useState<{ type: NoteType; location: 'local' | 'cloud' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; location: 'local' | 'cloud' } | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'local' | 'cloud'>('all');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const closeAllModals = () => {
    setSettingsModalOpen(false);
    setNewNoteModalOpen(false);
    setViewModalOpen(false);
    setEditorModalOpen(false);
    setConfirmModalOpen(false);
    setIsEmptyTrashConfirmOpen(false);
    setActiveNote(null);
    setActiveNoteLocation(null);
    setNewNoteConfig(null);
    setPendingDelete(null);
  };

  const handleSaveNoteWrapper = (note: Note) => {
    const isUpdating = !!activeNote;
    const location = isUpdating ? activeNoteLocation : newNoteConfig?.location;
    closeAllModals();

    if (!location) {
      console.error("Speicherort konnte nicht ermittelt werden.");
      return;
    }

    if (location === 'cloud' && !isUpdating && activeCloudNotes.length >= MAX_CLOUD_NOTES) {
      setToastMessage(`Maximal ${MAX_CLOUD_NOTES} Cloud-Notizen erlaubt.`);
      return;
    }

    handleSaveNote(note, location, isUpdating);
    setToastMessage(location === 'cloud' ? `Notiz "${note.title}" gespeichert. Synchronisierung gestartet...` : `Notiz "${note.title}" erfolgreich gespeichert.`);
  };

  const handleCreateNewNote = (type: NoteType, location: 'local' | 'cloud') => {
    setNewNoteModalOpen(false);
    setNewNoteConfig({ type, location });
    setActiveNote(null);
    setEditorModalOpen(true);
  };

  const openNoteView = (note: Note, location: 'local' | 'cloud') => {
    setActiveNote(note);
    setActiveNoteLocation(location);
    setViewModalOpen(true);
  };

  const openNoteEditor = () => {
    setViewModalOpen(false);
    setEditorModalOpen(true);
  };

  const handleMoveNoteToCloud = (noteId: string) => {
    const noteToMove = localNotes.find(n => n.id === noteId);
    if (!noteToMove) return;
    if (activeCloudNotes.length >= MAX_CLOUD_NOTES) {
      setToastMessage(`Maximal ${MAX_CLOUD_NOTES} Cloud-Notizen erlaubt.`);
      return;
    }
    closeAllModals();
    handleDeleteNote(noteId, 'local');
    handleSaveNote(noteToMove, 'cloud', false);
    handlePermanentDeleteNote(noteId, 'local');

    setToastMessage(`Notiz "${noteToMove.title}" wird in die Cloud verschoben.`);
  };

  const requestDeleteNote = (id: string, location: 'local' | 'cloud') => {
    setPendingDelete({ id, location });
    setConfirmModalOpen(true);
  };

  const handleRestoreNoteWrapper = (id: string, location: 'local' | 'cloud') => {
    if (location === 'cloud' && activeCloudNotes.length >= MAX_CLOUD_NOTES) {
      setToastMessage(`Maximal ${MAX_CLOUD_NOTES} Cloud-Notizen erlaubt.`);
      return;
    }
    handleRestoreNote(id, location);
  };

  const handleConfirmAction = () => {
    if (pendingDelete) {
      handleDeleteNote(pendingDelete.id, pendingDelete.location);
      setPendingDelete(null);
      setConfirmModalOpen(false);
      setToastMessage("Notiz in den Papierkorb verschoben.");
    } else {
      setConfirmModalOpen(false);
      syncCloudNotes();
    }
  };

  const handleEmptyTrashConfirm = async () => {
    setIsEmptyTrashConfirmOpen(false);
    setToastMessage("Papierkorb wird geleert...");
    try {
      await handleEmptyTrash();
      syncCloudNotes();
      setToastMessage("Papierkorb erfolgreich geleert.");
    } catch (error) {
      setToastMessage("Fehler beim Leeren des Papierkorbs.");
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const displayedNotes = useMemo(() => {
    let notes: Note[] = [];
    if (activeTab === 'all') {
      notes = [...activeLocalNotes, ...activeCloudNotes];
    } else if (activeTab === 'local') {
      notes = activeLocalNotes;
    } else if (activeTab === 'cloud') {
      notes = activeCloudNotes;
    }
    // Sort by date desc
    notes.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return notes;
  }, [activeTab, activeLocalNotes, activeCloudNotes]);

  const masonryBreakpointCols = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div className="min-h-screen font-sans pb-24 bg-background text-on-background transition-colors duration-300">
      <header className="sticky top-0 bg-surface/80 backdrop-blur-sm shadow-md z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3 relative">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-bold text-on-surface">Notizen</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {isCloudConfigured && (
                <button
                  onClick={() => { setPendingDelete(null); setConfirmModalOpen(true); }}
                  disabled={syncStatus === 'syncing'}
                  className="p-2 rounded-full text-secondary hover:bg-secondary/10 disabled:opacity-50 transition-colors relative"
                  title="Synchronisieren"
                >
                  <SyncIcon className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  <span className={`absolute top-1 right-1 min-w-[1.25rem] px-1 py-0.5 rounded-full ring-2 ring-surface text-[10px] font-semibold text-white ${syncStatus === 'synced' ? 'bg-green-500' :
                    syncStatus === 'syncing' ? 'bg-yellow-500' :
                      syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                    {nextSyncIn ?? '--'}
                  </span>
                </button>
              )}
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-on-background/10 transition-colors">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-on-background/10 transition-colors"><CogIcon /></button>
            </div>
          </div>
          <span className="absolute top-2 right-2 text-xs text-on-background/60 select-none">v{APP_VERSION}</span>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-on-background/5'}`}
              >
                Alle
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'local' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-on-background/5'}`}
              >
                Lokal
              </button>
              <button
                onClick={() => setActiveTab('cloud')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'cloud' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-on-background/5'}`}
              >
                Cloud
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {syncStatus === 'error' && syncError && (
          <Alert message={syncError} onDismiss={() => setSyncError(null)} />
        )}

        {displayedNotes.length > 0 ? (
          <Masonry
            breakpointCols={masonryBreakpointCols}
            className="flex w-auto -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {displayedNotes.map(note => (
              <div key={note.id} className="mb-4">
                <NoteCard
                  note={note}
                  view='active'
                  location={activeLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud'}
                  onView={() => openNoteView(note, activeLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud')}
                  onDelete={() => requestDeleteNote(note.id, activeLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud')}
                  isDeleting={deletingNoteIds.has(note.id)}
                  isUpdated={updatedNoteId === note.id}
                />
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center mt-20">
            <p className="text-on-background/50 text-lg">Keine Notizen gefunden.</p>
          </div>
        )}

        {/* Deleted Notes Section (Optional, maybe hide behind a toggle or separate view in future) */}
        {(deletedLocalNotes.length > 0 || deletedCloudNotes.length > 0) && (
          <div className="mt-12 border-t border-on-background/10 pt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-on-background/70">Papierkorb</h2>
              <button
                onClick={() => setIsEmptyTrashConfirmOpen(true)}
                className="px-3 py-1 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors"
              >
                Papierkorb leeren
              </button>
            </div>
            <Masonry
              breakpointCols={masonryBreakpointCols}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {[...deletedLocalNotes, ...deletedCloudNotes].map(note => (
                <div key={note.id} className="mb-4">
                  <NoteCard
                    note={note}
                    view='deleted'
                    location={deletedLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud'}
                    onRestore={() => handleRestoreNoteWrapper(note.id, deletedLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud')}
                    onPermanentDelete={() => handlePermanentDeleteNote(note.id, deletedLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud')}
                    isDeleting={deletingNoteIds.has(note.id)}
                  />
                </div>
              ))}
            </Masonry>
          </div>
        )}
      </main>

      <button
        onClick={() => setNewNoteModalOpen(true)}
        className="fixed bottom-6 right-6 z-20 p-4 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-variant transition-transform transform hover:scale-110"
        aria-label="Neue Notiz erstellen"
      >
        <PlusIcon className="h-8 w-8" />
      </button>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeAllModals}
        onSave={(newSettings) => {
          setSettings(newSettings);
          if (newSettings.gistId && newSettings.token) {
            isConfiguringRef.current = true;
            setToastMessage("Verbindung wird geprüft...");
            syncCloudNotes();
          } else {
            setToastMessage("Einstellungen gespeichert (Cloud deaktiviert).");
          }
        }}
        initialSettings={settings}
        syncStatus={syncStatus}
        syncError={syncError}
        lastSyncTime={lastSyncTime}
        syncSummary={syncSummary}
      />

      <NewNoteTypeModal
        isOpen={isNewNoteModalOpen}
        onClose={closeAllModals}
        onCreate={handleCreateNewNote}
        isCloudConfigured={isCloudConfigured}
      />

      <NoteViewModal
        isOpen={isViewModalOpen}
        onClose={closeAllModals}
        onEdit={openNoteEditor}
        onDelete={() => activeNote && activeNoteLocation && requestDeleteNote(activeNote.id, activeNoteLocation)}
        note={activeNote}
        onUpdateNote={(updatedNote) => {
          const location = activeNoteLocation;
          if (!location) return;
          handleSaveNote(updatedNote, location, true);
          setActiveNote(updatedNote);
        }}
        location={activeNoteLocation}
        onMoveToCloud={() => activeNote && activeNoteLocation === 'local' && handleMoveNoteToCloud(activeNote.id)}
      />

      <NoteEditorModal
        isOpen={isEditorModalOpen}
        onClose={closeAllModals}
        onSave={handleSaveNoteWrapper}
        noteToEdit={activeNote}
        noteType={activeNote?.noteType || newNoteConfig?.type || NoteType.Text}
        allNotes={allNotes}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeAllModals}
        onConfirm={handleConfirmAction}
        title={pendingDelete ? "Notiz löschen" : "Synchronisierung bestätigen"}
        message={pendingDelete ? "Möchten Sie diese Notiz wirklich in den Papierkorb verschieben?" : "Möchten Sie wirklich synchronisieren?"}
      />

      <ConfirmModal
        isOpen={isEmptyTrashConfirmOpen}
        onClose={() => setIsEmptyTrashConfirmOpen(false)}
        onConfirm={handleEmptyTrashConfirm}
        title="Papierkorb leeren"
        message="Möchten Sie wirklich alle Notizen im Papierkorb endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      />

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;
