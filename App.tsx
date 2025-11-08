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

// --- Fallback-Konfiguration für Entwicklung ---
// WIRD NUR VERWENDET, WENN KEINE BENUTZERKONFIGURATION IM LOCALSTORAGE VORHANDEN IST.
// HIER EIGENE WERTE EINTRAGEN, UM DIE CLOUD-FUNKTIONALITÄT ZU TESTEN.
const DEV_FALLBACK_SETTINGS: GithubGistSettings = {
    gistId: '', // z.B. 'dein_gist_id_string'
    token: '', // z.B. 'ghp_dein_personal_access_token'
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

  // States for animations
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

  // Memoized selectors for active and deleted notes
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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (updatedNoteId) {
        const timer = setTimeout(() => setUpdatedNoteId(null), 1000); // Duration of the pulse animation
        return () => clearTimeout(timer);
    }
  }, [updatedNoteId]);

  const migrateNotes = (notes: any[]): Note[] => {
    return notes.map(note => {
      let migratedNote = { ...note };
      if (!note.noteType) {
        migratedNote.noteType = NoteType.Text;
      }
      if (note.deletedAt === undefined) {
        migratedNote.deletedAt = null;
      }
      return migratedNote;
    });
  };
  
  useEffect(() => {
    setLocalNotes(prev => migrateNotes(prev));
  }, []); // Run migration once on mount for local notes

  const syncCloudNotes = useCallback(async () => {
    if (!isCloudConfigured || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const notesFromGist = await getGistContent(effectiveSettings);
      setCloudNotes(migrateNotes(notesFromGist));
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
    } catch (error) {
      console.error("Sync-Fehler:", error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : "Unbekannter Fehler");
    } finally {
        isSyncingRef.current = false;
    }
  }, [effectiveSettings, isCloudConfigured]);

  // Automatic background sync
  useEffect(() => {
    if (!isCloudConfigured) {
        return;
    }

    syncCloudNotes(); // Initial sync

    const intervalId = setInterval(syncCloudNotes, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId);
  }, [isCloudConfigured, syncCloudNotes]);
  
  const handleSaveNote = async (note: Note) => {
    const isUpdating = !!activeNote;
    const location = isUpdating ? activeNoteLocation : newNoteConfig?.location;
    
    if (!location) {
        console.error("Speicherort konnte nicht ermittelt werden. Abbruch.");
        setSyncError("Ein interner Fehler ist aufgetreten. Die Notiz konnte nicht gespeichert werden.");
        setSyncStatus('error');
        closeAllModals();
        return;
    }

    if (location === 'local') {
        setLocalNotes(prev => isUpdating ? prev.map(n => n.id === note.id ? note : n) : [...prev, note]);
        if(isUpdating) setUpdatedNoteId(note.id);
    } else if (location === 'cloud' && isCloudConfigured) {
        setSyncStatus('syncing');
        const newCloudNotes = isUpdating 
          ? cloudNotes.map(n => (n.id === note.id ? note : n))
          : [...cloudNotes, note];
        
        try {
            await updateGistContent(effectiveSettings, newCloudNotes);
            setCloudNotes(newCloudNotes);
            if (isUpdating) setUpdatedNoteId(note.id);
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
        } catch (error) {
            console.error("Fehler beim Speichern der Cloud-Notiz:", error);
            setSyncStatus('error');
            setSyncError("Notiz konnte nicht in der Cloud gespeichert werden.");
        }
    }
    setToastMessage(`Notiz "${note.title}" erfolgreich gespeichert.`);
    closeAllModals();
  };
  
  const handleDeleteNote = (noteId: string, location: 'local' | 'cloud') => {
    closeAllModals();
    const deletedAt = new Date().toISOString();
    if (location === 'local') {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt } : n));
    } else if (location === 'cloud' && isCloudConfigured) {
      setSyncStatus('syncing');
      const newCloudNotes = cloudNotes.map(n => n.id === noteId ? { ...n, deletedAt } : n);
      updateGistContent(effectiveSettings, newCloudNotes)
        .then(() => {
            setCloudNotes(newCloudNotes);
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
        })
        .catch(error => {
            console.error("Fehler beim Verschieben der Cloud-Notiz in den Papierkorb:", error);
            setSyncStatus('error');
            setSyncError("Notiz konnte nicht gelöscht werden.");
        });
    }
    setToastMessage('Notiz in den Papierkorb verschoben.');
  };

  const handleRestoreNote = (noteId: string, location: 'local' | 'cloud') => {
    if (location === 'local') {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null } : n));
    } else if (location === 'cloud' && isCloudConfigured) {
       setSyncStatus('syncing');
       const newCloudNotes = cloudNotes.map(n => n.id === noteId ? { ...n, deletedAt: null } : n);
       updateGistContent(effectiveSettings, newCloudNotes)
        .then(() => {
            setCloudNotes(newCloudNotes);
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
        })
        .catch(error => {
            console.error("Fehler beim Wiederherstellen der Cloud-Notiz:", error);
            setSyncStatus('error');
            setSyncError("Notiz konnte nicht wiederhergestellt werden.");
        });
    }
     setToastMessage('Notiz wiederhergestellt.');
  };

  const handlePermanentDeleteNote = (noteId: string, location: 'local' | 'cloud') => {
    setDeletingNoteIds(prev => new Set(prev).add(noteId));

    setTimeout(() => {
      if (location === 'local') {
        setLocalNotes(prev => prev.filter(n => n.id !== noteId));
      } else if (location === 'cloud' && isCloudConfigured) {
        setSyncStatus('syncing');
        const newCloudNotes = cloudNotes.filter(n => n.id !== noteId);
        updateGistContent(effectiveSettings, newCloudNotes)
            .then(() => {
              setCloudNotes(newCloudNotes);
              setSyncStatus('synced');
              setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
            })
            .catch(error => {
              console.error("Fehler beim endgültigen Löschen der Cloud-Notiz:", error);
              setSyncStatus('error');
              setSyncError("Notiz konnte nicht endgültig gelöscht werden.");
            });
      }

      setDeletingNoteIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      setToastMessage('Notiz endgültig gelöscht.');
    }, 300);
  };

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

  const closeAllModals = () => {
    setSettingsModalOpen(false);
    setNewNoteModalOpen(false);
    setViewModalOpen(false);
    setEditorModalOpen(false);
    setConfirmModalOpen(false);
    setActiveNote(null);
    setActiveNoteLocation(null);
    setNewNoteConfig(null);
  };
  
  const handleDismissSyncError = () => {
    setSyncError(null);
  };
  
  const handleConfirmSync = () => {
    setConfirmModalOpen(false);
    syncCloudNotes();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const renderSyncStatus = () => {
      if (!isCloudConfigured) return null;
      switch (syncStatus) {
          case 'syncing': return <span className="text-yellow-400">Synchronisiere...</span>;
          case 'synced': return <span className="text-green-400">Synchronisiert um {lastSyncTime}</span>;
          case 'error': return <span className="text-danger" title={syncError || ''}>Sync-Fehler</span>;
          default: return <span className="text-on-background/50">Bereit</span>;
      }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 bg-surface/80 backdrop-blur-sm shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">Cloud & Lokale Notizen</h1>
            <div className="text-xs pt-1 hidden sm:block">{renderSyncStatus()}</div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-on-background/10 transition-colors" aria-label="Theme umschalten">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-on-background/10 transition-colors"><CogIcon /></button>
            <button onClick={() => setNewNoteModalOpen(true)} className="p-2 rounded-full bg-primary text-on-primary hover:bg-primary-variant transition-colors"><PlusIcon /></button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-primary pb-2">Lokale Notizen</h2>
          {activeLocalNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeLocalNotes.map(note => (
                <NoteCard 
                    key={note.id} 
                    note={note} 
                    view='active'
                    onView={() => openNoteView(note, 'local')} 
                    onDelete={() => handleDeleteNote(note.id, 'local')} 
                    isDeleting={deletingNoteIds.has(note.id)}
                    isUpdated={updatedNoteId === note.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-on-background/70">Keine lokalen Notizen. Erstellen Sie eine neue Notiz!</p>
          )}
        </section>

        <section className="mt-12">
            <div className="flex justify-between items-center mb-4 border-b-2 border-secondary pb-2">
                <h2 className="text-2xl font-semibold">Cloud Notizen</h2>
                {isCloudConfigured && (
                    <button 
                        onClick={() => setConfirmModalOpen(true)}
                        disabled={syncStatus === 'syncing'}
                        className="p-2 rounded-full text-secondary hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Cloud-Notizen synchronisieren"
                    >
                        <SyncIcon className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>
          {isCloudConfigured ? (
             <>
                {syncStatus === 'error' && syncError && (
                    <Alert message={syncError} onDismiss={handleDismissSyncError} />
                )}

                {syncStatus === 'syncing' && activeCloudNotes.length === 0 ? (
                    <p className="text-on-background/70">Lade Cloud-Notizen...</p>
                ) : activeCloudNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {activeCloudNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            view='active'
                            onView={() => openNoteView(note, 'cloud')} 
                            onDelete={() => handleDeleteNote(note.id, 'cloud')} 
                            isDeleting={deletingNoteIds.has(note.id)}
                            isUpdated={updatedNoteId === note.id}
                        />
                      ))}
                    </div>
                ) : syncStatus !== 'syncing' ? (
                    <p className="text-on-background/70">Keine Cloud-Notizen gefunden.</p>
                ) : null}
             </>
          ) : (
            <div className="text-center bg-surface p-8 rounded-lg">
              <p className="mb-4 text-lg">Die Cloud-Synchronisierung ist nicht eingerichtet.</p>
              <button onClick={() => setSettingsModalOpen(true)} className="px-6 py-2 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-variant transition-colors">
                Jetzt konfigurieren
              </button>
            </div>
          )}
        </section>
        
        {(deletedLocalNotes.length > 0 || deletedCloudNotes.length > 0) && (
            <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-4 border-b-2 border-danger/50 pb-2">Gelöschte Notizen</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {deletedLocalNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            view='deleted'
                            onView={() => {}} 
                            onRestore={() => handleRestoreNote(note.id, 'local')}
                            onPermanentDelete={() => handlePermanentDeleteNote(note.id, 'local')}
                            isDeleting={deletingNoteIds.has(note.id)}
                        />
                    ))}
                    {deletedCloudNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            view='deleted'
                            onView={() => {}} 
                            onRestore={() => handleRestoreNote(note.id, 'cloud')}
                            onPermanentDelete={() => handlePermanentDeleteNote(note.id, 'cloud')}
                            isDeleting={deletingNoteIds.has(note.id)}
                        />
                    ))}
                 </div>
            </section>
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={closeAllModals}
        onSave={(newSettings) => {
            setSettings(newSettings);
            // reset cloud notes and trigger resync
            setCloudNotes([]);
            syncCloudNotes();
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
        onDelete={() => activeNote && activeNoteLocation && handleDeleteNote(activeNote.id, activeNoteLocation)}
        note={activeNote}
        onUpdateNote={(updatedNote) => handleSaveNote(updatedNote)}
        location={activeNoteLocation}
        onMoveToCloud={() => activeNote && handleMoveNoteToCloud(activeNote.id)}
      />

      <NoteEditorModal
        isOpen={isEditorModalOpen}
        onClose={closeAllModals}
        onSave={handleSaveNote}
        noteToEdit={activeNote}
        noteType={activeNote?.noteType || newNoteConfig?.type || NoteType.Text}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeAllModals}
        onConfirm={handleConfirmSync}
        title="Synchronisierung bestätigen"
        message="Möchten Sie wirklich synchronisieren? Der aktuelle Stand der Cloud-Notizen wird geladen. Dies kann lokale Änderungen überschreiben, die noch nicht in der Cloud gespeichert wurden."
      />

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;
