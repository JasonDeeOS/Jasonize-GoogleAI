import { useState, useMemo, useEffect } from 'react';
import { Note, NoteType } from '../types';
import useLocalStorage from './useLocalStorage';

export const useNotes = (isCloudConfigured: boolean, syncCloudNotes: () => void) => {
    const [localNotes, setLocalNotes] = useLocalStorage<Note[]>('local-notes', []);
    const [cloudNotes, setCloudNotes] = useLocalStorage<Note[]>('cloud-notes', []);

    // Animation states
    const [deletingNoteIds, setDeletingNoteIds] = useState(new Set<string>());
    const [updatedNoteId, setUpdatedNoteId] = useState<string | null>(null);

    const migrateNotes = (notes: any[]): Note[] => {
        return notes.map(note => {
            let migratedNote = { ...note };
            if (!note.noteType) {
                migratedNote.noteType = NoteType.Text;
            }
            if (note.deletedAt === undefined) {
                migratedNote.deletedAt = null;
            }
            if (!note.tags) {
                migratedNote.tags = [];
            }
            return migratedNote;
        });
    };

    useEffect(() => {
        setLocalNotes(prev => migrateNotes(prev));
        setCloudNotes(prev => migrateNotes(prev));
    }, []);

    const handleSaveNote = (note: Note, location: 'local' | 'cloud', isUpdating: boolean) => {
        if (location === 'local') {
            setLocalNotes(prev => isUpdating ? prev.map(n => n.id === note.id ? note : n) : [...prev, note]);
            if (isUpdating) setUpdatedNoteId(note.id);
        } else if (location === 'cloud') {
            const noteWithPendingState = { ...note, isPendingSync: true };
            const newCloudNotes = isUpdating
                ? cloudNotes.map(n => (n.id === note.id ? noteWithPendingState : n))
                : [...cloudNotes, noteWithPendingState];

            setCloudNotes(newCloudNotes);
            if (isUpdating) setUpdatedNoteId(note.id);

            if (isCloudConfigured) {
                syncCloudNotes();
            }
        }
    };

    const handleDeleteNote = (noteId: string, location: 'local' | 'cloud') => {
        const now = new Date().toISOString();
        if (location === 'local') {
            setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: now, updatedAt: now } : n));
        } else if (location === 'cloud') {
            setCloudNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: now, updatedAt: now, isPendingSync: true } : n));
            if (isCloudConfigured) {
                syncCloudNotes();
            }
        }
    };

    const handleRestoreNote = (noteId: string, location: 'local' | 'cloud') => {
        const now = new Date().toISOString();
        if (location === 'local') {
            setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null, updatedAt: now } : n));
        } else if (location === 'cloud') {
            setCloudNotes(prev => prev.map(n => n.id === noteId ? { ...n, deletedAt: null, updatedAt: now, isPendingSync: true } : n));
            if (isCloudConfigured) {
                syncCloudNotes();
            }
        }
    };

    const handlePermanentDeleteNote = async (noteId: string, location: 'local' | 'cloud', updateGistContent: (notes: Note[]) => Promise<void>) => {
        setDeletingNoteIds(prev => new Set(prev).add(noteId));

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));

        if (location === 'local') {
            setLocalNotes(prev => prev.filter(n => n.id !== noteId));
        } else if (location === 'cloud' && isCloudConfigured) {
            const newCloudNotes = cloudNotes.filter(n => n.id !== noteId);
            try {
                await updateGistContent(newCloudNotes);
                setCloudNotes(newCloudNotes);
            } catch (error) {
                console.error("Fehler beim endgültigen Löschen der Cloud-Notiz:", error);
                // Revert animation state if failed
                setDeletingNoteIds(prev => {
                    const next = new Set(prev);
                    next.delete(noteId);
                    return next;
                });
                throw error; // Re-throw to let caller handle it
            }
        } else if (location === 'cloud' && !isCloudConfigured) {
            setCloudNotes(prev => prev.filter(n => n.id !== noteId));
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
            const newCloudNotes = cloudNotes.filter(n => !n.deletedAt);

            try {
                await updateGistContent(newCloudNotes);
                setCloudNotes(newCloudNotes);
            } catch (error) {
                console.error("Fehler beim Leeren des Papierkorbs (Cloud):", error);
                throw error;
            }
        } else {
            setCloudNotes(prev => prev.filter(n => !n.deletedAt));
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
        setCloudNotes,
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
        migrateNotes
    };
};
