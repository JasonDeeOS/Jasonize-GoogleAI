import { useState, useRef, useCallback, useEffect } from 'react';
import { Note, GithubGistSettings, ListItem, NoteType } from '../types';
import { getGistContent, updateGistContent } from '../services/githubService';

// Helper to merge two lists of items
const mergeLists = (remoteItems: ListItem[], localItems: ListItem[]): ListItem[] => {
    const itemsMap = new Map<string, ListItem>();

    // 1. Add all remote items
    remoteItems.forEach(item => itemsMap.set(item.id, item));

    // 2. Overlay local items (updates existing, adds new)
    localItems.forEach(item => itemsMap.set(item.id, item));

    return Array.from(itemsMap.values());
};

export const useSync = (
    effectiveSettings: GithubGistSettings,
    isCloudConfigured: boolean,
    cloudNotes: Note[],
    setCloudNotes: (notes: Note[]) => void,
    migrateNotes: (notes: any[]) => Note[],
    recentlyPermanentlyDeletedIds: Set<string>
) => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const isSyncingRef = useRef(false);
    const cloudNotesRef = useRef<Note[]>(cloudNotes);

    // Keep cloudNotesRef in sync with cloudNotes
    useEffect(() => {
        cloudNotesRef.current = cloudNotes;
    }, [cloudNotes]);

    const syncCloudNotes = useCallback(async () => {
        if (!isCloudConfigured || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setSyncStatus('syncing');
        setSyncError(null);
        try {
            // 1. Fetch latest from Cloud
            const notesFromGist = await getGistContent(effectiveSettings);
            const migratedGistNotes = migrateNotes(notesFromGist);

            // 2. Strict Mirror + Overlay Strategy
            const mergedNotesMap = new Map<string, Note>();
            let hasChangesToUpload = false;

            // A. Base: Start with Gist notes
            migratedGistNotes.forEach(note => {
                // Filter out recently deleted ones (race condition protection)
                if (!recentlyPermanentlyDeletedIds.has(note.id)) {
                    mergedNotesMap.set(note.id, note);
                } else {
                    // If we filtered it out locally, we MUST ensure this deletion is synced to Gist
                    hasChangesToUpload = true;
                }
            });

            // B. Overlay: Apply local pending changes
            // We only care about local notes that are PENDING SYNC.
            // Everything else in local state that is NOT in Gist is considered "deleted remotely" and ignored (dropped).
            cloudNotesRef.current.forEach(localNote => {
                if (localNote.isPendingSync) {
                    // Check for smart merge opportunity (Shopping Lists)
                    const remoteNote = mergedNotesMap.get(localNote.id);

                    if (remoteNote &&
                        localNote.noteType === NoteType.ShoppingList &&
                        Array.isArray(localNote.content) &&
                        Array.isArray(remoteNote.content)) {

                        // Perform Smart Merge
                        const mergedContent = mergeLists(remoteNote.content as ListItem[], localNote.content as ListItem[]);
                        const mergedNote = { ...localNote, content: mergedContent };
                        mergedNotesMap.set(localNote.id, mergedNote);

                    } else {
                        // Standard overwrite (Local wins)
                        // This is a local change waiting to be uploaded.
                        // It takes precedence over Gist (or adds to it if new).
                        mergedNotesMap.set(localNote.id, localNote);
                    }
                    hasChangesToUpload = true;
                }
            });

            const mergedNotes = Array.from(mergedNotesMap.values());

            if (hasChangesToUpload) {
                // Clean up isPendingSync before uploading
                const notesToUpload = mergedNotes.map(n => {
                    const { isPendingSync, ...rest } = n;
                    return rest as Note;
                });

                await updateGistContent(effectiveSettings, notesToUpload);

                // Update local state with the clean version (no isPendingSync)
                setCloudNotes(notesToUpload);
            } else {
                // No changes to upload, just update local state to match Gist (Mirror)
                setCloudNotes(mergedNotes);
            }

            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
        } catch (error) {
            console.error("Sync-Fehler:", error);
            setSyncStatus('error');
            setSyncError(error instanceof Error ? error.message : "Unbekannter Fehler.");
        } finally {
            isSyncingRef.current = false;
        }
    }, [effectiveSettings, isCloudConfigured, setCloudNotes, migrateNotes, recentlyPermanentlyDeletedIds]);

    // Automatic background sync
    useEffect(() => {
        if (!isCloudConfigured) return;

        // Call sync immediately on mount
        const doSync = async () => {
            await syncCloudNotes();
        };
        doSync();

        // Set up interval for background sync
        const intervalId = setInterval(() => {
            doSync();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCloudConfigured]); // Only re-run when cloud configuration changes

    return {
        syncStatus,
        setSyncStatus,
        syncError,
        setSyncError,
        lastSyncTime,
        setLastSyncTime,
        syncCloudNotes,
        updateGistContent: (notes: Note[]) => updateGistContent(effectiveSettings, notes)
    };
};
