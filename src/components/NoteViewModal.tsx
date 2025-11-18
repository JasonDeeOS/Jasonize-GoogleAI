import React from 'react';
import { Note, ListItem, NoteType } from '../types';
import CloudUploadIcon from './icons/CloudUploadIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CloseIcon from './icons/CloseIcon';

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  note: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
  onMoveToCloud?: () => void;
  location?: 'local' | 'cloud' | null;
}

const NoteViewModal: React.FC<NoteViewModalProps> = ({ isOpen, onClose, onEdit, onDelete, note, onUpdateNote, onMoveToCloud, location }) => {
  if (!isOpen || !note) return null;

  const handleDelete = () => {
    onDelete();
  };

  const handleToggleListItem = (itemId: string) => {
    if (note.noteType === NoteType.Text) return;

    const updatedContent = (note.content as ListItem[]).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updatedNote = { ...note, content: updatedContent, updatedAt: new Date().toISOString() };
    onUpdateNote(updatedNote);
  };

  const renderContent = () => {
    switch (note.noteType) {
      case NoteType.Text:
        // FIX: Cast note.content to string. TypeScript cannot infer that for NoteType.Text, the content must be a string. This resolves the ReactNode type error.
        return <p className="whitespace-pre-wrap text-on-background/90">{note.content as string}</p>;
      case NoteType.List:
      case NoteType.ShoppingList:
        const items = note.content as ListItem[];
        if (note.noteType === NoteType.ShoppingList) {
          const groupedItems = items.reduce((acc, item) => {
            const category = item.category || 'Sonstiges';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
          }, {} as Record<string, ListItem[]>);

          return Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">{category}</h4>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.id} className="flex items-start">
                    <input type="checkbox" checked={item.completed} onChange={() => handleToggleListItem(item.id)} className="mt-1 h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                    <div className="ml-3">
                      <span className={`block text-on-surface ${item.completed ? 'line-through text-on-background/50' : ''}`}>{item.text}</span>
                      {(item.quantity || item.notes) && <span className="text-sm text-on-background/60 block mt-1">
                        {item.quantity && `Menge: ${item.quantity}`}{item.quantity && item.notes && " - "}{item.notes}
                      </span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ));
        }

        return (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="flex items-center">
                <input type="checkbox" checked={item.completed} onChange={() => handleToggleListItem(item.id)} className="h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                <span className={`ml-3 ${item.completed ? 'line-through text-on-background/50' : ''}`}>{item.text}</span>
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-on-background/20 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-on-surface truncate pr-4">{note.title}</h2>
          <div className="flex items-center space-x-0 sm:space-x-2">
            {location === 'local' && (
              <button onClick={onMoveToCloud} className="p-2 rounded-full hover:bg-on-background/20 transition-colors" aria-label="In die Cloud verschieben" title="In die Cloud verschieben">
                <CloudUploadIcon />
              </button>
            )}
            <button onClick={onEdit} className="p-2 rounded-full hover:bg-on-background/20 transition-colors" aria-label="Bearbeiten"><EditIcon /></button>
            <button onClick={handleDelete} className="p-2 rounded-full hover:bg-danger/20 text-danger transition-colors" aria-label="Löschen"><TrashIcon className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-on-background/20 transition-colors" aria-label="Schließen"><CloseIcon /></button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default NoteViewModal;