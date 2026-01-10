import { useState, useRef, useCallback, useEffect } from 'react';
import { Note, GithubGistSettings, Tombstone, GistData } from '../types';
import { getGistContent, updateGistContent } from '../services/githubService';

type Candidate = {
    id: string;
    kind: 'note' | 'tombstone';
    updatedAt: string;
    item: Note | Tombstone;
};

const POLL_INTERVAL_MS = 30000;
const PENDING_DEBOUNCE_MS = 500;
const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const stripPendingNote = (note: Note): Note => {
    const { isPendingSync, ...rest } = note;
    return rest;
};

const stripPendingTombstone = (tombstone: Tombstone): Tombstone => {
    const { isPendingSync, ...rest } = tombstone;
    return rest;
};

const sortById = <T extends { id: string }>(items: T[]) => {
    return [...items].sort((a, b) => a.id.localeCompare(b.id));
};

const normalizeData = (notes: Note[], tombstones: Tombstone[]): GistData => {
    return {
        schemaVersion: 1,
        notes: sortById(notes).map(stripPendingNote),
        tombstones: sortById(tombstones).map(stripPendingTombstone),
    };
};

const areDataEqual = (a: GistData, b: GistData): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
};

const migrateTombstones = (tombstones: any): Tombstone[] => {
    if (!Array.isArray(tombstones)) {
        return [];
    }
    return tombstones.map(t => {
        const deletedAt = t.deletedAt || t.updatedAt;
        const updatedAt = t.updatedAt || t.deletedAt;
        return {
            id: String(t.id),
            deletedAt: deletedAt || new Date().toISOString(),
            updatedAt: updatedAt || new Date().toISOString(),
        };
    });
};

const cleanupTombstones = (tombstones: Tombstone[], nowMs: number) => {
    let removed = false;
    const cleaned = tombstones.filter(t => {
        const deletedAtMs = Date.parse(t.deletedAt);
        if (Number.isNaN(deletedAtMs)) {
            return true;
        }
        if (nowMs - deletedAtMs > TOMBSTONE_RETENTION_MS) {
            removed = true;
            return false;
        }
        return true;
    });
    return { cleaned, removed };
};

const resolveCandidates = (
    remoteNotes: Note[],
    remoteTombstones: Tombstone[],
    pendingNotes: Note[],
    pendingTombstones: Tombstone[],
    nowMs: number
) => {
    const candidates = new Map<string, Candidate[]>();
    const pushCandidate = (candidate: Candidate) => {
        const list = candidates.get(candidate.id) ?? [];
        list.push(candidate);
        candidates.set(candidate.id, list);
    };

    remoteNotes.forEach(note => {
        pushCandidate({ id: note.id, kind: 'note', updatedAt: note.updatedAt, item: note });
    });
    remoteTombstones.forEach(tombstone => {
        pushCandidate({ id: tombstone.id, kind: 'tombstone', updatedAt: tombstone.updatedAt, item: tombstone });
    });
    pendingNotes.forEach(note => {
        pushCandidate({ id: note.id, kind: 'note', updatedAt: note.updatedAt, item: note });
    });
    pendingTombstones.forEach(tombstone => {
        pushCandidate({ id: tombstone.id, kind: 'tombstone', updatedAt: tombstone.updatedAt, item: tombstone });
    });

    const notes: Note[] = [];
    const tombstones: Tombstone[] = [];

    candidates.forEach(list => {
        list.sort((a, b) => {
            const diff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
            if (diff !== 0) return diff;
            if (a.kind === b.kind) return 0;
            return a.kind === 'tombstone' ? -1 : 1;
        });

        const winner = list[0];
        if (winner.kind === 'note') {
            notes.push(winner.item as Note);
        } else {
            tombstones.push(winner.item as Tombstone);
        }
    });

    const { cleaned, removed } = cleanupTombstones(tombstones, nowMs);

    return { notes, tombstones: cleaned, cleanupRemoved: removed };
};

export const useSync = (
    effectiveSettings: GithubGistSettings,
    isCloudConfigured: boolean,
    cloudNotes: Note[],
    setCloudNotes: (notes: Note[]) => void,
    cloudTombstones: Tombstone[],
    setCloudTombstones: (tombstones: Tombstone[]) => void,
    migrateNotes: (notes: any[]) => Note[]
) => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [syncSummary, setSyncSummary] = useState<string | null>(null);
    const isSyncingRef = useRef(false);
    const cloudNotesRef = useRef<Note[]>(cloudNotes);
    const cloudTombstonesRef = useRef<Tombstone[]>(cloudTombstones);

    // Keep refs in sync with local state
    useEffect(() => {
        cloudNotesRef.current = cloudNotes;
    }, [cloudNotes]);

    useEffect(() => {
        cloudTombstonesRef.current = cloudTombstones;
    }, [cloudTombstones]);

    const syncCloudNotes = useCallback(async () => {
        if (!isCloudConfigured || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setSyncStatus('syncing');
        setSyncError(null);

        try {
            const gistData = await getGistContent(effectiveSettings);
            const remoteNotes = migrateNotes(gistData.notes || []);
            const remoteTombstones = migrateTombstones(gistData.tombstones || []);

            const pendingNotes = cloudNotesRef.current.filter(note => note.isPendingSync);
            const pendingTombstones = cloudTombstonesRef.current.filter(t => t.isPendingSync);

            const nowMs = Date.now();
            const remoteResolved = resolveCandidates(remoteNotes, remoteTombstones, [], [], nowMs);
            const merged = resolveCandidates(remoteNotes, remoteTombstones, pendingNotes, pendingTombstones, nowMs);

            const remoteData = normalizeData(remoteResolved.notes, remoteResolved.tombstones);
            const mergedData = normalizeData(merged.notes, merged.tombstones);

            const needsUpload = !areDataEqual(remoteData, mergedData) || remoteResolved.cleanupRemoved;

            if (needsUpload) {
                await updateGistContent(effectiveSettings, mergedData);
                setCloudNotes(mergedData.notes);
                setCloudTombstones(mergedData.tombstones);
            } else {
                setCloudNotes(remoteData.notes);
                setCloudTombstones(remoteData.tombstones);
            }

            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString('de-DE'));
            setSyncSummary(
                `remote: ${remoteNotes.length} notes, ${remoteTombstones.length} del | ` +
                `pending: ${pendingNotes.length} notes, ${pendingTombstones.length} del | ` +
                `result: ${mergedData.notes.length} notes, ${mergedData.tombstones.length} del | ` +
                `upload: ${needsUpload ? 'yes' : 'no'}`
            );
        } catch (error) {
            console.error("Sync-Fehler:", error);
            setSyncStatus('error');
            setSyncError(error instanceof Error ? error.message : "Unbekannter Fehler.");
            setSyncSummary(null);
        } finally {
            isSyncingRef.current = false;
        }
    }, [effectiveSettings, isCloudConfigured, setCloudNotes, setCloudTombstones, migrateNotes]);

    useEffect(() => {
        if (!isCloudConfigured) return;
        const hasPendingChanges = cloudNotes.some(note => note.isPendingSync) || cloudTombstones.some(t => t.isPendingSync);
        if (!hasPendingChanges) return;

        if (!isSyncingRef.current) {
            syncCloudNotes();
        }
        const timeoutId = setTimeout(() => {
            if (!isSyncingRef.current) {
                syncCloudNotes();
            }
        }, PENDING_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [cloudNotes, cloudTombstones, isCloudConfigured, syncCloudNotes]);

    useEffect(() => {
        if (!isCloudConfigured) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                syncCloudNotes();
            }
        };
        const handleFocus = () => {
            syncCloudNotes();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isCloudConfigured, syncCloudNotes]);

    useEffect(() => {
        if (!isCloudConfigured) return;

        const doSync = async () => {
            await syncCloudNotes();
        };
        doSync();

        const intervalId = setInterval(() => {
            doSync();
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isCloudConfigured, syncCloudNotes]);

    return {
        syncStatus,
        setSyncStatus,
        syncError,
        setSyncError,
        lastSyncTime,
        setLastSyncTime,
        syncSummary,
        syncCloudNotes,
        updateGistContent: (data: GistData) => updateGistContent(effectiveSettings, data)
    };
};
