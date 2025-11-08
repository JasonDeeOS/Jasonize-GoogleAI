import React, { useState } from 'react';
import { GithubGistSettings } from '../types';
import CloseIcon from './icons/CloseIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: GithubGistSettings) => void;
  initialSettings: GithubGistSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [gistId, setGistId] = useState(initialSettings.gistId || '');
  const [token, setToken] = useState(initialSettings.token || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ gistId, token });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4 pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md p-6 relative animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface/70 hover:text-on-surface">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-on-surface">Cloud-Einstellungen</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="gistId" className="block text-sm font-medium text-on-background/80 mb-1">GitHub Gist ID</label>
            <input
              type="text"
              id="gistId"
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              className="w-full bg-background border border-on-background/20 rounded-md px-3 py-2 text-on-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Ihre Gist ID"
            />
          </div>
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-on-background/80 mb-1">Personal Access Token (PAT)</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-background border border-on-background/20 rounded-md px-3 py-2 text-on-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="ghp_..."
            />
            <p className="text-xs text-on-background/60 mt-1">Ihr Token wird nur in Ihrem Browser gespeichert und benötigt die `gist`-Berechtigung.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-on-background/20 text-on-surface hover:bg-on-background/30 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-variant transition-colors">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;