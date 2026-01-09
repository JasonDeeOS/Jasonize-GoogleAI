import { useState, useMemo, useEffect, useRef, SetStateAction } from 'react';
import { Note, NoteType } from '../types';
import useLocalStorage from './useLocalStorage';

export const useNotes = (isCloudConfigured: boolean) => {
    const [localNotes, setLocalNotes] = useLocalStorage<Note[]>('local-notes', []);
    const [cloudNotes, setCloudNotes] = useLocalStorage<Note[]>('cloud-notes', []);
    const cloudNotesRef = useRef(cloudNotes);

    // Animation states
    const [deletingNoteIds, setDeletingNoteIds] = useState(new Set<string>());
    const [updatedNoteId, setUpdatedNoteId] = useState<string | null>(null);

    // Track IDs of notes that were permanently deleted in this session
    // to prevent them from being re-added by sync (race condition)
    const [recentlyPermanentlyDeletedIds, setRecentlyPermanentlyDeletedIds] = useState(new Set<string>());

    const migrateNotes = (notes: any[]): Note[] => {
        return notes.map(note => {
            let migratedNote = { ...note };
            if (!note.noteType) {
                migratedNote.noteType = NoteType.Text;
            }
            if (note.deletedAt === undefined) {
                migratedNote.deletedAt = null;
            }
            if (migratedNote.noteType === NoteType.ShoppingList && Array.isArray(migratedNote.content)) {
                migratedNote.content = migratedNote.content.filter((item: any) => {
                    const category = item?.category ?? 'Sonstiges';
                    return category !== 'Sonstiges';
                });
            }
            if (migratedNote.isPinned !== undefined) {
                delete migratedNote.isPinned;
            }
            return migratedNote;
        });
    };

    const setCloudNotesWithRef = (updater: SetStateAction<Note[]>) => {
        setCloudNotes(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: Note[]) => Note[])(prev)
                : updater;
            cloudNotesRef.current = next;
            return next;
        });
    };

    useEffect(() => {
        setLocalNotes(prev => migrateNotes(prev));
        setCloudNotesWithRef(prev => migrateNotes(prev));
    }, []);

    const handleSaveNote = (note: Note, location: 'local' | 'cloud', isUpdating: boolean) => {
        if (location === 'local') {
            setLocalNotes(prev => isUpdating ? prev.map(n => n.id === note.id ? note : n) : [...prev, note]);
            if (isUpdating) setUpdatedNoteId(note.id);
        } else if (location === 'cloud') {
            const noteWithPendingState = { ...note, isPendingSync: true };
            setCloudNotesWithRef(prev => isUpdating
                ? prev.map(n => (n.id === note.id ? noteWithPendingState : n))
                : [...prev, noteWithPendingState]
            );
            if (isUpdating) setUpdatedNoteId(note.id);

        }
    };

    const handleDeleteNote = (noteId: string, location: 'local' | 'cloud') => {
        const now = new Date().toISOString();
        if (location === 'local') {
            setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: now, updatedAt: now } : n));
        } else if (location === 'cloud') {
            setCloudNotesWithRef(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: now, updatedAt: now, isPendingSync: true } : n));
        }
    };

    const handleRestoreNote = (noteId: string, location: 'local' | 'cloud') => {
        const now = new Date().toISOString();
        if (location === 'local') {
            setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null, updatedAt: now } : n));
        } else if (location === 'cloud') {
            setCloudNotesWithRef(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null, updatedAt: now, isPendingSync: true } : n));
        }
    };

    const handlePermanentDeleteNote = async (noteId: string, location: 'local' | 'cloud', updateGistContent: (notes: Note[]) => Promise<void>) => {
        setDeletingNoteIds(prev => new Set(prev).add(noteId));

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));

        if (location === 'local') {
            setLocalNotes(prev => prev.filter(n => n.id !== noteId));
        } else if (location === 'cloud' && isCloudConfigured) {
            // Track this ID as permanently deleted
            setRecentlyPermanentlyDeletedIds(prev => new Set(prev).add(noteId));

            const newCloudNotes = cloudNotesRef.current.filter(n => n.id !== noteId);
            try {
                await updateGistContent(newCloudNotes);
                setCloudNotesWithRef(newCloudNotes);
            } catch (error) {
                console.error("Fehler beim endgültigen Löschen der Cloud-Notiz:", error);
                // Revert animation state if failed
                setDeletingNoteIds(prev => {
                    const next = new Set(prev);
                    next.delete(noteId);
                    return next;
                });
                // Also remove from tracked deleted IDs if it failed (optional, but good for consistency)
                setRecentlyPermanentlyDeletedIds(prev => {
                    const next = new Set(prev);
                    next.delete(noteId);
                    return next;
                });
                throw error; // Re-throw to let caller handle it
            }
        } else if (location === 'cloud' && !isCloudConfigured) {
            setCloudNotesWithRef(prev => prev.filter(n => n.id !== noteId));
        }

        setDeletingNoteIds(prev => {
            const next = new Set(prev);
            next.delete(noteId);
            return next;
        });
    };

    const handleEmptyTrash = async (updateGistContent: (notes: Note[]) => Promise<void>) => {
        // Empty local trash
        setLocalNotes(prev => prev.filter(n => !n.deletedAt));

        // Empty cloud trash
        if (isCloudConfigured) {
            const notesToDelete = cloudNotesRef.current.filter(n => n.deletedAt);
            const newCloudNotes = cloudNotesRef.current.filter(n => !n.deletedAt);

            // Track all deleted IDs
            setRecentlyPermanentlyDeletedIds(prev => {
                const next = new Set(prev);
                notesToDelete.forEach(n => next.add(n.id));
                return next;
            });

            try {
                await updateGistContent(newCloudNotes);
                setCloudNotesWithRef(newCloudNotes);
            } catch (error) {
                console.error("Fehler beim Leeren des Papierkorbs (Cloud):", error);
                throw error;
            }
        } else {
            setCloudNotesWithRef(prev => prev.filter(n => !n.deletedAt));
        }
    };

    const activeLocalNotes = useMemo(() => localNotes.filter(n => !n.deletedAt).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [localNotes]);
    const deletedLocalNotes = useMemo(() => localNotes.filter(n => n.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()), [localNotes]);
    const activeCloudNotes = useMemo(() => cloudNotes.filter(n => !n.deletedAt).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [cloudNotes]);
    const deletedCloudNotes = useMemo(() => cloudNotes.filter(n => n.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()), [cloudNotes]);
    const allNotes = useMemo(() => [...localNotes, ...cloudNotes], [localNotes, cloudNotes]);

    return {
        localNotes,
        setLocalNotes,
        cloudNotes,
        setCloudNotes: setCloudNotesWithRef,
        activeLocalNotes,
        deletedLocalNotes,
        activeCloudNotes,
        deletedCloudNotes,
        allNotes,
        handleSaveNote,
        handleDeleteNote,
        handleRestoreNote,
        handlePermanentDeleteNote,
        handleEmptyTrash,
        deletingNoteIds,
        updatedNoteId,
        setUpdatedNoteId,
        migrateNotes,
        recentlyPermanentlyDeletedIds // Expose this
    };
};
