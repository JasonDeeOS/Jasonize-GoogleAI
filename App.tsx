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
  const [cloudNotes, setCloudNotes] = useLocalStorage<Note[]>('cloud-notes', []);
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
  const allNotes = useMemo(() => [...localNotes, ...cloudNotes], [localNotes, cloudNotes]);

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
    setCloudNotes(prev => migrateNotes(prev));
  }, []); // Run migration once on mount for local notes

  const syncCloudNotes = useCallback(async () => {
    if (!isCloudConfigured || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const notesFromGist = await getGistContent(effectiveSettings);
      
      const localPendingNotes = cloudNotes.filter(n => n.isPendingSync);

      // If no local changes are pending, we just accept the server state.
      if (localPendingNotes.length === 0) {
        setCloudNotes(migrateNotes(notesFromGist));
      } else {
        // Merge pending changes with the fetched notes
        const notesFromGistMap = new Map(notesFromGist.map(n => [n.id, n]));
        
        localPendingNotes.forEach(pendingNote => {
            // Remove the pending flag as we are trying to sync it
            const { isPendingSync, ...noteToSync } = pendingNote;
            notesFromGistMap.set(noteToSync.id, noteToSync);
        });

        const notesToUpload = Array.from(notesFromGistMap.values());
        
        await updateGistContent(effectiveSettings, notesToUpload);
        setCloudNotes(notesToUpload); // Update local state with the successfully synced state
      }

      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
    } catch (error) {
      console.error("Sync-Fehler:", error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : "Unbekannter Fehler. Überprüfen Sie Ihre Internetverbindung und Konfiguration.");
    } finally {
        isSyncingRef.current = false;
    }
  }, [effectiveSettings, isCloudConfigured, cloudNotes, setCloudNotes]);

  // Automatic background sync
  useEffect(() => {
    if (!isCloudConfigured) {
        return;
    }

    syncCloudNotes(); // Initial sync

    const intervalId = setInterval(syncCloudNotes, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId);
  }, [isCloudConfigured, syncCloudNotes]);
  
  const handleSaveNote = (note: Note) => {
    const isUpdating = !!activeNote;
    const location = isUpdating ? activeNoteLocation : newNoteConfig?.location;
    
    closeAllModals();
    
    if (!location) {
        console.error("Speicherort konnte nicht ermittelt werden. Abbruch.");
        setSyncError("Ein interner Fehler ist aufgetreten. Die Notiz konnte nicht gespeichert werden.");
        setSyncStatus('error');
        return;
    }

    if (location === 'local') {
        setLocalNotes(prev => isUpdating ? prev.map(n => n.id === note.id ? note : n) : [...prev, note]);
        if(isUpdating) setUpdatedNoteId(note.id);
        setToastMessage(`Notiz "${note.title}" erfolgreich gespeichert.`);
    } else if (location === 'cloud') {
        const noteWithPendingState = { ...note, isPendingSync: true };
        const newCloudNotes = isUpdating 
          ? cloudNotes.map(n => (n.id === note.id ? noteWithPendingState : n))
          : [...cloudNotes, noteWithPendingState];
        
        setCloudNotes(newCloudNotes);
        if (isUpdating) setUpdatedNoteId(note.id);
        setToastMessage(`Notiz "${note.title}" zur Synchronisierung vorgemerkt.`);
        
        if (isCloudConfigured) {
            syncCloudNotes();
        }
    }
  };
  
  const handleDeleteNote = (noteId: string, location: 'local' | 'cloud') => {
    closeAllModals();
    const deletedAt = new Date().toISOString();
    if (location === 'local') {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt } : n));
    } else if (location === 'cloud') {
      setCloudNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt, isPendingSync: true } : n));
       if (isCloudConfigured) {
            syncCloudNotes();
        }
    }
    setToastMessage('Notiz in den Papierkorb verschoben.');
  };

  const handleRestoreNote = (noteId: string, location: 'local' | 'cloud') => {
    if (location === 'local') {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null } : n));
    } else if (location === 'cloud') {
       setCloudNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null, isPendingSync: true } : n));
       if (isCloudConfigured) {
            syncCloudNotes();
        }
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
              // Restore note to UI on failure
              setCloudNotes(cloudNotes);
            });
      } else if (location === 'cloud' && !isCloudConfigured) {
         setCloudNotes(prev => prev.filter(n => n.id !== noteId));
      }

      setDeletingNoteIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      setToastMessage('Notiz endgültig gelöscht.');
    }, 300);
  };

  const handleMoveNoteToCloud = (noteId: string) => {
    const noteToMove = localNotes.find(n => n.id === noteId);
    if (!noteToMove) return;

    closeAllModals();
    
    const pendingNote = { ...noteToMove, isPendingSync: true };
    setCloudNotes(prev => [...prev, pendingNote]);
    setLocalNotes(prev => prev.filter(n => n.id !== noteId));

    setToastMessage(`Notiz "${noteToMove.title}" wird in die Cloud verschoben.`);
    
    if (isCloudConfigured) {
        syncCloudNotes();
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
      if (!isCloudConfigured && cloudNotes.length > 0) return <span className="text-yellow-400">Cloud nicht konfiguriert</span>
      if (!isCloudConfigured) return null;
      switch (syncStatus) {
          case 'syncing': return <span className="text-yellow-400">Synchronisiere...</span>;
          case 'synced': return <span className="text-green-400">Synchronisiert um {lastSyncTime}</span>;
          case 'error': return <span className="text-danger" title={syncError || ''}>Sync-Fehler</span>;
          default: return <span className="text-on-background/50">Bereit</span>;
      }
  };

  return (
    <div className="min-h-screen font-sans pb-24">
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
                    location='local'
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
          
             <>
                {syncStatus === 'error' && syncError && (
                    <Alert message={syncError} onDismiss={handleDismissSyncError} />
                )}

                {syncStatus === 'syncing' && activeCloudNotes.length === 0 && isCloudConfigured ? (
                    <p className="text-on-background/70">Lade Cloud-Notizen...</p>
                ) : activeCloudNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {activeCloudNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            view='active'
                            location='cloud'
                            onView={() => openNoteView(note, 'cloud')} 
                            onDelete={() => handleDeleteNote(note.id, 'cloud')} 
                            isDeleting={deletingNoteIds.has(note.id)}
                            isUpdated={updatedNoteId === note.id}
                        />
                      ))}
                    </div>
                ) : syncStatus !== 'syncing' ? (
                  !isCloudConfigured ? (
                    <div className="text-center bg-surface p-8 rounded-lg">
                      <p className="mb-4 text-lg">Die Cloud-Synchronisierung ist nicht eingerichtet.</p>
                      <button onClick={() => setSettingsModalOpen(true)} className="px-6 py-2 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-variant transition-colors">
                        Jetzt konfigurieren
                      </button>
                    </div>
                  ) : (
                    <p className="text-on-background/70">Keine Cloud-Notizen gefunden.</p>
                  )
                ) : null}
             </>
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
                            location='local'
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
                            location='cloud'
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
        onMoveToCloud={() => activeNote && activeNoteLocation === 'local' && handleMoveNoteToCloud(activeNote.id)}
      />

      <NoteEditorModal
        isOpen={isEditorModalOpen}
        onClose={closeAllModals}
        onSave={handleSaveNote}
        noteToEdit={activeNote}
        noteType={activeNote?.noteType || newNoteConfig?.type || NoteType.Text}
        allNotes={allNotes}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeAllModals}
        onConfirm={handleConfirmSync}
        title="Synchronisierung bestätigen"
        message="Möchten Sie wirklich synchronisieren? Der aktuelle Stand der Cloud-Notizen wird geladen und mit Ihren lokalen Änderungen zusammengeführt. Dies ist in der Regel sicher."
      />

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;