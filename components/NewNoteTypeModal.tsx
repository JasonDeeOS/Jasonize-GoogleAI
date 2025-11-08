import React from 'react';
import { NoteType } from '../types';
import CloseIcon from './icons/CloseIcon';
import DocumentIcon from './icons/DocumentIcon';
import ListIcon from './icons/ListIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';

interface NewNoteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (type: NoteType, location: 'local' | 'cloud') => void;
  isCloudConfigured: boolean;
}

const noteTypeOptions = [
  { type: NoteType.Text, label: 'Textnotiz', description: 'Für einfache Memos und Gedanken.', icon: <DocumentIcon className="h-8 w-8 text-primary" /> },
  { type: NoteType.List, label: 'Checkliste', description: 'Für To-Do-Listen mit abhakbaren Einträgen.', icon: <ListIcon className="h-8 w-8 text-primary" /> },
  { type: NoteType.ShoppingList, label: 'Einkaufsliste', description: 'Erweiterte Liste mit Mengen und Kategorien.', icon: <ShoppingCartIcon className="h-8 w-8 text-primary" /> },
];

const NewNoteTypeModal: React.FC<NewNoteTypeModalProps> = ({ isOpen, onClose, onCreate, isCloudConfigured }) => {
  if (!isOpen) return null;

  const handleCreate = (type: NoteType, location: 'local' | 'cloud') => {
    onCreate(type, location);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface/70 hover:text-on-surface">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-on-surface text-center">Welche Art von Notiz möchten Sie erstellen?</h2>
        
        <div className="space-y-4">
          {noteTypeOptions.map(opt => (
            <div key={opt.type} className="bg-background/50 p-4 rounded-lg flex items-center gap-4">
              <div className="flex-shrink-0">{opt.icon}</div>
              <div className="flex-grow">
                <h3 className="font-bold text-on-surface">{opt.label}</h3>
                <p className="text-sm text-on-background/70">{opt.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                 <button onClick={() => handleCreate(opt.type, 'local')} className="px-3 py-1.5 rounded-md bg-on-background/20 text-on-surface text-sm font-semibold hover:bg-on-background/30 transition-colors whitespace-nowrap">
                    Lokal erstellen
                 </button>
                 <button 
                    onClick={() => handleCreate(opt.type, 'cloud')}
                    disabled={!isCloudConfigured}
                    className="px-3 py-1.5 rounded-md bg-secondary/80 text-on-secondary text-sm font-semibold hover:bg-secondary transition-colors disabled:bg-on-background/10 disabled:text-on-background/50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={!isCloudConfigured ? 'Cloud-Speicher ist nicht konfiguriert.' : 'In der Cloud speichern'}
                 >
                    Cloud erstellen
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewNoteTypeModal;
