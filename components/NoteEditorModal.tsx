
import React, { useState, useEffect } from 'react';
import { Note, NoteType, ListItem } from '../types';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import { SHOPPING_CATEGORIES } from '../constants';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  noteToEdit: Note | null;
  noteType: NoteType;
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ isOpen, onClose, onSave, noteToEdit, noteType }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | ListItem[]>('');
  
  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
      } else {
        setTitle('');
        setContent(noteType === NoteType.Text ? '' : []);
      }
    }
  }, [isOpen, noteToEdit, noteType]);
  
  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert("Der Titel darf nicht leer sein.");
      return;
    }

    const now = new Date().toISOString();
    const finalNote: Note = {
      id: noteToEdit?.id || Date.now().toString(),
      title: title.trim(),
      noteType: noteToEdit?.noteType || noteType,
      content,
      createdAt: noteToEdit?.createdAt || now,
      updatedAt: now,
    };
    onSave(finalNote);
  };
  
  const addListItem = () => {
    const newItem: ListItem = { id: Date.now().toString(), text: '', completed: false };
    if (noteType === NoteType.ShoppingList) {
        newItem.quantity = '';
        newItem.notes = '';
        newItem.category = '';
    }
    setContent(c => [...(Array.isArray(c) ? c : []), newItem]);
  };
  
  const updateListItem = (id: string, newValues: Partial<ListItem>) => {
    setContent(c => (Array.isArray(c) ? c : []).map(item => item.id === id ? { ...item, ...newValues } : item));
  };
  
  const removeListItem = (id: string) => {
    setContent(c => (Array.isArray(c) ? c : []).filter(item => item.id !== id));
  };

  const renderContentEditor = () => {
    switch (noteType) {
      case NoteType.Text:
        return (
          <textarea
            value={content as string}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 bg-background border border-on-background/20 rounded-md p-3 text-on-background focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
            placeholder="Schreiben Sie Ihre Notiz..."
          />
        );
      case NoteType.List:
      case NoteType.ShoppingList:
        const listContent = Array.isArray(content) ? content : [];
        return (
            <div>
                {listContent.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 mb-3 p-2 border border-on-background/10 rounded-md">
                        <input type="checkbox" checked={item.completed} onChange={e => updateListItem(item.id, { completed: e.target.checked })} className="mt-2 h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                        <div className="flex-grow space-y-1">
                             <input type="text" value={item.text} onChange={e => updateListItem(item.id, { text: e.target.value })} placeholder={`Eintrag ${index + 1}`} className="w-full bg-transparent p-1 text-on-background focus:ring-0 focus:border-primary border-0 border-b-2 border-on-background/20 outline-none" />
                             {noteType === NoteType.ShoppingList && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                    <input type="text" value={item.quantity} onChange={e => updateListItem(item.id, { quantity: e.target.value })} placeholder="Menge (z.B. 1kg)" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                                    <input list="categories" value={item.category} onChange={e => updateListItem(item.id, { category: e.target.value })} placeholder="Kategorie" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                                    <input type="text" value={item.notes} onChange={e => updateListItem(item.id, { notes: e.target.value })} placeholder="Notizen (z.B. Bio)" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                                </div>
                             )}
                        </div>
                        <button onClick={() => removeListItem(item.id)} className="p-2 text-on-surface/60 hover:text-danger self-center"><TrashIcon /></button>
                    </div>
                ))}
                <datalist id="categories">
                    {SHOPPING_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <button onClick={addListItem} className="mt-2 px-3 py-1.5 rounded-md border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors">
                    Eintrag hinzufügen
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-on-background/20 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-on-surface">{noteToEdit ? 'Notiz bearbeiten' : 'Neue Notiz'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-on-background/20 transition-colors"><CloseIcon /></button>
        </header>
        <main className="p-6 overflow-y-auto flex-grow space-y-4">
          <div>
            <label htmlFor="noteTitle" className="sr-only">Titel</label>
            <input
              id="noteTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel der Notiz"
              className="w-full bg-transparent text-xl font-semibold p-2 text-on-background focus:ring-0 focus:border-primary border-0 border-b-2 border-on-background/20 outline-none transition-colors"
            />
          </div>
          {renderContentEditor()}
        </main>
        <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-on-background/20 flex-shrink-0 flex justify-end">
          <button onClick={handleSave} className="px-6 py-2 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-variant transition-colors">
            Speichern
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NoteEditorModal;
