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
            const notesFromGist = await getGistContent(effectiveSettings);

            const localPendingNotes = cloudNotes.filter(n => n.isPendingSync);

            if (localPendingNotes.length === 0) {
                setCloudNotes(migrateNotes(notesFromGist));
            } else {
                const notesFromGistMap = new Map(notesFromGist.map(n => [n.id, n]));

                localPendingNotes.forEach(pendingNote => {
                    const { isPendingSync, ...noteToSync } = pendingNote;
                    notesFromGistMap.set(noteToSync.id, noteToSync);
                });

                const notesToUpload = Array.from(notesFromGistMap.values());

                await updateGistContent(effectiveSettings, notesToUpload);
                setCloudNotes(notesToUpload);
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
