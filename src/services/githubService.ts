import { GistData, GithubGistSettings } from '../types';

const GIST_FILENAME = 'cloud-notes.json';

const normalizeGistData = (data: unknown): GistData => {
  if (Array.isArray(data)) {
    return { schemaVersion: 1, notes: data, tombstones: [] };
  }

  if (data && typeof data === 'object') {
    const raw = data as Partial<GistData>;
    return {
      schemaVersion: raw.schemaVersion ?? 1,
      notes: Array.isArray(raw.notes) ? raw.notes : [],
      tombstones: Array.isArray(raw.tombstones) ? raw.tombstones : [],
    };
  }

  throw new Error("Cloud-Notizen konnten nicht gelesen werden. Das Format ist ungültig.");
};

export const getGistContent = async (settings: GithubGistSettings): Promise<GistData> => {
  if (!settings.gistId || !settings.token) {
    throw new Error('GitHub Gist ID oder Token nicht konfiguriert.');
  }

  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    headers: {
      'Authorization': `Bearer ${settings.token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Abrufen des Gists: ${response.statusText}`);
  }

  const gist = await response.json();
  const file = gist.files[GIST_FILENAME];

  if (!file) {
    return { schemaVersion: 1, notes: [], tombstones: [] };
  }

  try {
    const parsed = JSON.parse(file.content);
    return normalizeGistData(parsed);
  } catch (e) {
    console.error("Fehler beim Parsen der Gist-Daten:", e);
    throw new Error("Cloud-Notizen konnten nicht gelesen werden. Das Format ist möglicherweise ungültig.");
  }
};

export const updateGistContent = async (settings: GithubGistSettings, data: GistData): Promise<void> => {
  if (!settings.gistId || !settings.token) {
    throw new Error('GitHub Gist ID oder Token nicht konfiguriert.');
  }

  const content = JSON.stringify(data, null, 2);

  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${settings.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: content,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Aktualisieren des Gists: ${response.statusText}`);
  }
};
