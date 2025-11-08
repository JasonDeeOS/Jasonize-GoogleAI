
import { Note, GithubGistSettings } from '../types';

const GIST_FILENAME = 'cloud-notes.json';

export const getGistContent = async (settings: GithubGistSettings): Promise<Note[]> => {
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
    // If the file doesn't exist, return an empty array, it will be created on the first save.
    return [];
  }

  try {
    return JSON.parse(file.content);
  } catch (e) {
    console.error("Fehler beim Parsen der Gist-Daten:", e);
    throw new Error("Cloud-Notizen konnten nicht gelesen werden. Das Format ist möglicherweise ungültig.");
  }
};

export const updateGistContent = async (settings: GithubGistSettings, notes: Note[]): Promise<void> => {
  if (!settings.gistId || !settings.token) {
    throw new Error('GitHub Gist ID oder Token nicht konfiguriert.');
  }

  const content = JSON.stringify(notes, null, 2);

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
