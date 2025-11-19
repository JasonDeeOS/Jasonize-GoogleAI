import { useState, useRef, useCallback, useEffect } from 'react';
import { Note, GithubGistSettings } from '../types';
import { getGistContent, updateGistContent } from '../services/githubService';

export const useSync = (
    effectiveSettings: GithubGistSettings,
    isCloudConfigured: boolean,
    cloudNotes: Note[],
    setCloudNotes: (notes: Note[]) => void,
    migrateNotes: (notes: any[]) => Note[]
) => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const isSyncingRef = useRef(false);

    const syncCloudNotes = useCallback(async () => {
        if (!isCloudConfigured || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setSyncStatus('syncing');
        setSyncError(null);
        try {
            // 1. Fetch latest from Cloud
            const notesFromGist = await getGistContent(effectiveSettings);
            const migratedGistNotes = migrateNotes(notesFromGist);

            // 2. Merge Strategy
            const mergedNotesMap = new Map<string, Note>();

            // Start with all Gist notes
            migratedGistNotes.forEach(note => {
                mergedNotesMap.set(note.id, note);
            });

            let hasChangesToUpload = false;

            // Iterate through local cloud notes to check for updates/new notes
            cloudNotes.forEach(localNote => {
                const remoteNote = mergedNotesMap.get(localNote.id);

                if (!remoteNote) {
                    // Note exists locally but not in Gist (New Note created locally)
                    // We assume it's a new note and add it
                    mergedNotesMap.set(localNote.id, localNote);
                    hasChangesToUpload = true;
                } else {
                    // Note exists in both. Conflict resolution based on updatedAt.
                    const localDate = new Date(localNote.updatedAt).getTime();
                    const remoteDate = new Date(remoteNote.updatedAt).getTime();

                    // We use a small buffer (e.g. 1000ms) to avoid ping-ponging due to clock skew
                    // But for strict "Last Write Wins", strict comparison is usually fine.
                    if (localDate > remoteDate) {
                        // Local is newer, keep local
                        mergedNotesMap.set(localNote.id, localNote);
                        hasChangesToUpload = true;
                    } else {
                        // Remote is newer (or equal), keep remote
                        // No change to upload for this note
                    }
                }
            });

            const mergedNotes = Array.from(mergedNotesMap.values());

            // Check if we need to upload
            // We upload if we detected local changes that are newer (hasChangesToUpload)
            // OR if we have pending syncs that we decided to keep.
            // Actually, hasChangesToUpload covers the "keep local" case.

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
                // No changes to upload, but we might have received updates from Gist (new notes or newer versions)
                // We update local state to match the merged result (which is effectively the Gist content + any new local notes if we had them... wait)
                // If hasChangesToUpload is false, it means:
                // 1. No new local notes.
                // 2. No local notes were newer than remote.
                // So mergedNotes is exactly remoteNotes (or remoteNotes + nothing).
                // So we just update local to match remote.
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
    }, [effectiveSettings, isCloudConfigured, cloudNotes, setCloudNotes, migrateNotes]);

    // Automatic background sync
    useEffect(() => {
        if (!isCloudConfigured) return;

        syncCloudNotes(); // Initial sync

        const intervalId = setInterval(syncCloudNotes, 60000); // Poll every 60 seconds

        return () => clearInterval(intervalId);
    }, [isCloudConfigured, syncCloudNotes]);

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
