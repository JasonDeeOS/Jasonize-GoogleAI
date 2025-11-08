
import React, { useState, useEffect, useMemo } from 'react';
import { Note, NoteType, ListItem } from '../types';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import SparklesIcon from './icons/SparklesIcon';
import { SHOPPING_CATEGORIES, COMMON_GROCERY_ITEMS } from '../constants';
import useShoppingHistory from '../hooks/useShoppingHistory';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  noteToEdit: Note | null;
  noteType: NoteType;
  allNotes: Note[];
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ isOpen, onClose, onSave, noteToEdit, noteType, allNotes }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | ListItem[]>('');
  
  // State for smart shopping list features
  const frequentlyBought = useShoppingHistory(allNotes);
  const [quickAddItemText, setQuickAddItemText] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; category: string }[]>([]);
  const [frequentlyBoughtVisible, setFrequentlyBoughtVisible] = useState(true);


  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
      } else {
        setTitle('');
        setContent(noteType === NoteType.Text ? '' : []);
      }
      setQuickAddItemText('');
      setSuggestions([]);
    }
  }, [isOpen, noteToEdit, noteType]);
  
  const handleQuickAddItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuickAddItemText(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerCaseValue = value.toLowerCase();
    
    const historyMatches = frequentlyBought
        .filter(item => item.toLowerCase().includes(lowerCaseValue))
        .map(name => ({ name, category: COMMON_GROCERY_ITEMS.find(i => i.name === name)?.category || 'Sonstiges' }));

    const commonItemsMatches = COMMON_GROCERY_ITEMS
        .filter(item => item.name.toLowerCase().includes(lowerCaseValue));
    
    const combined = [...historyMatches, ...commonItemsMatches];
    const uniqueNames = new Set(combined.map(i => i.name));
    const uniqueSuggestions = Array.from(uniqueNames).map(name => combined.find(i => i.name === name)!);

    setSuggestions(uniqueSuggestions.slice(0, 5));
  };

  const handleAddItem = (name: string, category?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    const existingItem = (Array.isArray(content) ? content : []).find(item => item.text.toLowerCase() === trimmedName.toLowerCase());
    if (existingItem) {
        // Optional: Maybe highlight the existing item instead of doing nothing
        setQuickAddItemText('');
        setSuggestions([]);
        return;
    }

    const itemCategory = category || COMMON_GROCERY_ITEMS.find(i => i.name.toLowerCase() === trimmedName.toLowerCase())?.category || 'Sonstiges';
    const newItem: ListItem = { 
        id: Date.now().toString(), 
        text: trimmedName, 
        completed: false,
        quantity: '',
        notes: '',
        category: itemCategory
    };
    setContent(c => [...(Array.isArray(c) ? c : []), newItem]);
    setQuickAddItemText('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: { name: string; category: string }) => {
    handleAddItem(suggestion.name, suggestion.category);
  };
  
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
        return (
            <div>
                {(Array.isArray(content) ? content : []).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 mb-2 p-2 border border-on-background/10 rounded-md">
                        <input type="checkbox" checked={item.completed} onChange={e => updateListItem(item.id, { completed: e.target.checked })} className="h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                        <input type="text" value={item.text} onChange={e => updateListItem(item.id, { text: e.target.value })} placeholder={`Eintrag ${index + 1}`} className="flex-grow bg-transparent p-1 text-on-background focus:ring-0 focus:border-primary border-0 border-b-2 border-on-background/20 outline-none" />
                        <button onClick={() => removeListItem(item.id)} className="p-2 text-on-surface/60 hover:text-danger"><TrashIcon /></button>
                    </div>
                ))}
                <button onClick={addListItem} className="mt-2 px-3 py-1.5 rounded-md border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors">
                    Eintrag hinzufügen
                </button>
            </div>
        );
      case NoteType.ShoppingList:
        const listContent = Array.isArray(content) ? content : [];
        return (
            <div>
                {/* Smart Quick Add Bar */}
                <div className="relative mb-4">
                    <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border border-primary/50">
                        <SparklesIcon className="h-5 w-5 text-primary flex-shrink-0" />
                        <input
                            type="text"
                            value={quickAddItemText}
                            onChange={handleQuickAddItemChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(quickAddItemText)}
                            placeholder="Artikel hinzufügen (z.B. 2kg Äpfel)"
                            className="w-full bg-transparent text-on-background placeholder-on-background/50 focus:ring-0 border-0 outline-none"
                        />
                    </div>
                    {suggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-surface border border-on-background/20 rounded-b-lg shadow-lg mt-1">
                            {suggestions.map(s => (
                                <div key={s.name} onClick={() => handleSuggestionClick(s)} className="p-2 hover:bg-primary/20 cursor-pointer">
                                    <span className="font-semibold">{s.name}</span>
                                    <span className="text-xs text-on-background/60 ml-2">({s.category})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Frequently Bought Section */}
                {frequentlyBought.length > 0 && (
                     <div>
                        <button onClick={() => setFrequentlyBoughtVisible(!frequentlyBoughtVisible)} className="text-sm font-semibold text-on-background/80 mb-2">
                           {frequentlyBoughtVisible ? '▼' : '►'} Häufig gekauft
                        </button>
                        {frequentlyBoughtVisible && (
                            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-background/50 rounded-lg">
                                {frequentlyBought.slice(0, 10).map(item => (
                                    <button key={item} onClick={() => handleAddItem(item)} className="px-2 py-1 bg-on-background/10 text-on-surface text-sm rounded-md hover:bg-secondary hover:text-on-secondary transition-colors">
                                        + {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {/* Manual Editor */}
                {listContent.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 mb-3 p-2 border border-on-background/10 rounded-md">
                        <input type="checkbox" checked={item.completed} onChange={e => updateListItem(item.id, { completed: e.target.checked })} className="mt-2 h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                        <div className="flex-grow space-y-1">
                             <input type="text" value={item.text} onChange={e => updateListItem(item.id, { text: e.target.value })} placeholder={`Eintrag ${index + 1}`} className="w-full bg-transparent p-1 text-on-background font-semibold focus:ring-0 focus:border-primary border-0 border-b-2 border-on-background/20 outline-none" />
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                 <input type="text" value={item.quantity || ''} onChange={e => updateListItem(item.id, { quantity: e.target.value })} placeholder="Menge (z.B. 1kg)" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                                 <input list="categories" value={item.category || ''} onChange={e => updateListItem(item.id, { category: e.target.value })} placeholder="Kategorie" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                                 <input type="text" value={item.notes || ''} onChange={e => updateListItem(item.id, { notes: e.target.value })} placeholder="Notizen (z.B. Bio)" className="w-full bg-on-background/10 rounded-sm p-1 text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none"/>
                             </div>
                        </div>
                        <button onClick={() => removeListItem(item.id)} className="p-2 text-on-surface/60 hover:text-danger self-center"><TrashIcon /></button>
                    </div>
                ))}
                <datalist id="categories">
                    {SHOPPING_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <button onClick={addListItem} className="mt-2 px-3 py-1.5 rounded-md border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors">
                    Manuellen Eintrag hinzufügen
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
