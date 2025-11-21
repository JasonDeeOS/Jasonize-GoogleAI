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
import SearchIcon from './components/icons/SearchIcon';

// --- Fallback-Konfiguration für Entwicklung ---
const DEV_FALLBACK_SETTINGS: GithubGistSettings = {
  gistId: '',
  token: '',
};

const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<GithubGistSettings>('gist-settings', { gistId: '', token: '' });
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  const isCloudConfigured = !!(settings.gistId && settings.token);
  const syncCloudNotesRef = useRef<() => Promise<void>>(async () => { });
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
    migrateNotes
  } = useNotes(isCloudConfigured, () => syncCloudNotesRef.current());

  const effectiveSettings = settings.gistId && settings.token ? settings : DEV_FALLBACK_SETTINGS;

  const {
    syncStatus,
    syncError,
    setSyncError,
    lastSyncTime,
    syncCloudNotes,
    updateGistContent
  } = useSync(effectiveSettings, isCloudConfigured, cloudNotes, setCloudNotes, migrateNotes);

  useEffect(() => {
    syncCloudNotesRef.current = syncCloudNotes;
  }, [syncCloudNotes]);

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

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
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
    closeAllModals();
    handleDeleteNote(noteId, 'local');
    handleSaveNote({ ...noteToMove, isPendingSync: true }, 'cloud', false);
    handlePermanentDeleteNote(noteId, 'local', async () => { });

    setToastMessage(`Notiz "${noteToMove.title}" wird in die Cloud verschoben.`);
  };

  const requestDeleteNote = (id: string, location: 'local' | 'cloud') => {
    setPendingDelete({ id, location });
    setConfirmModalOpen(true);
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

  const handleEmptyTrashConfirm = () => {
    handleEmptyTrash(updateGistContent);
    setIsEmptyTrashConfirmOpen(false);
    setToastMessage("Papierkorb geleert.");
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Filter Logic
  const filterNotes = (notes: Note[]) => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof note.content === 'string' && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = filterTag ? note.tags?.includes(filterTag) : true;
      return matchesSearch && matchesTag;
    });
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
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return filterNotes(notes);
  }, [activeTab, activeLocalNotes, activeCloudNotes, searchQuery, filterTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach(note => note.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [allNotes]);

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
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-bold text-on-surface">Notizen</h1>
              <div className="text-xs pt-1 hidden sm:block">
                {syncStatus === 'syncing' && <span className="text-yellow-400">Synchronisiere...</span>}
                {syncStatus === 'synced' && <span className="text-green-400">Synchronisiert</span>}
                {syncStatus === 'error' && <span className="text-danger">Fehler</span>}
              </div>
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
                  <span className={`absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-surface ${syncStatus === 'synced' ? 'bg-green-400' :
                    syncStatus === 'syncing' ? 'bg-yellow-400' :
                      syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                </button>
              )}
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-on-background/10 transition-colors">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-on-background/10 transition-colors"><CogIcon /></button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-on-background/50" />
              </div>
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-on-background/10 rounded-md leading-5 bg-surface text-on-surface placeholder-on-background/50 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-colors"
              />
            </div>

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
              <div className="w-px h-6 bg-on-background/20 mx-2"></div>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${filterTag === tag ? 'bg-secondary text-on-secondary border-secondary' : 'bg-transparent text-on-background/70 border-on-background/20 hover:border-secondary'}`}
                >
                  #{tag}
                </button>
              ))}
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
                    onRestore={() => handleRestoreNote(note.id, deletedLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud')}
                    onPermanentDelete={() => handlePermanentDeleteNote(note.id, deletedLocalNotes.some(n => n.id === note.id) ? 'local' : 'cloud', updateGistContent)}
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