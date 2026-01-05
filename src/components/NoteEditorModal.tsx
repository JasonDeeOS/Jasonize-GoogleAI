import React, { useState, useEffect, useMemo } from 'react';
import { Reorder } from 'framer-motion';
import { Note, NoteType, ListItem } from '../types';
import useShoppingHistory from '../hooks/useShoppingHistory';
import { COMMON_GROCERY_ITEMS, SHOPPING_CATEGORIES } from '../constants';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import SparklesIcon from './icons/SparklesIcon';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  noteToEdit: Note | null;
  noteType: NoteType;
  allNotes: Note[];
}

const highlightMatch = (text: string, query: string) => {
  if (!query) return <span>{text}</span>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const startIndex = lowerText.indexOf(lowerQuery);
  if (startIndex === -1) return <span>{text}</span>;

  const endIndex = startIndex + query.length;
  return (
    <span>
      {text.substring(0, startIndex)}
      <strong className="text-primary">{text.substring(startIndex, endIndex)}</strong>
      {text.substring(endIndex)}
    </span>
  );
};

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ isOpen, onClose, onSave, noteToEdit, noteType, allNotes }) => {
  const defaultCategory = SHOPPING_CATEGORIES.find(cat => cat !== 'Sonstiges') || 'Sonstiges';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | ListItem[]>('');
  const [color, setColor] = useState<string | undefined>(undefined);

  const frequentlyBought = useShoppingHistory(allNotes);
  const [quickAddItemText, setQuickAddItemText] = useState('');
  const [frequentlyBoughtVisible, setFrequentlyBoughtVisible] = useState(true);
  const [pendingItemName, setPendingItemName] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState(defaultCategory);


  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
        setColor(noteToEdit.color);
      } else {
        setTitle('');
        setContent(noteType === NoteType.Text ? '' : []);
        setColor(undefined);
      }
      setQuickAddItemText('');
      setPendingItemName(null);
      setPendingCategory(defaultCategory);
    }
  }, [isOpen, noteToEdit, noteType, defaultCategory]);

  const filteredSuggestions = useMemo(() => {
    if (quickAddItemText.length < 2) {
      return [];
    }
    const lowerCaseValue = quickAddItemText.toLowerCase();
    const frequentlyBoughtSet = new Set(frequentlyBought);

    const scoredSuggestions = COMMON_GROCERY_ITEMS.map(item => {
      let score = 0;
      const lowerCaseName = item.name.toLowerCase();

      // Exact match or starts with
      if (lowerCaseName === lowerCaseValue) {
        score += 100;
      } else if (lowerCaseName.startsWith(lowerCaseValue)) {
        score += 50;
      } else if (lowerCaseName.includes(` ${lowerCaseValue}`)) { // Word boundary match
        score += 25;
      } else if (lowerCaseName.includes(lowerCaseValue)) {
        score += 10;
      }

      if (frequentlyBoughtSet.has(item.name)) {
        score += 20; // Boost score for frequently bought items
      }

      return { ...item, score };
    }).filter(item => item.score > 0);

    // Add items from history that might not be in the common list
    frequentlyBought.forEach(name => {
      if (!scoredSuggestions.some(s => s.name === name)) {
        const lowerCaseName = name.toLowerCase();
        let score = 15; // Base score for being in history

        if (lowerCaseName === lowerCaseValue) {
          score += 100;
        } else if (lowerCaseName.startsWith(lowerCaseValue)) {
          score += 50;
        } else if (lowerCaseName.includes(` ${lowerCaseValue}`)) {
          score += 25;
        } else if (lowerCaseName.includes(lowerCaseValue)) {
          score += 10;
        }

        if (score > 15) { // Only include if it's a match (score increased from base)
          scoredSuggestions.push({ name, category: 'Sonstiges', score });
        }
      }
    });

    scoredSuggestions.sort((a, b) => b.score - a.score);

    const uniqueNames = new Set();
    const uniqueSuggestions = scoredSuggestions.filter(item => {
      if (uniqueNames.has(item.name)) {
        return false;
      }
      uniqueNames.add(item.name);
      return true;
    });

    return uniqueSuggestions.slice(0, 5);
  }, [quickAddItemText, frequentlyBought]);


  const handleAddItem = (name: string, category?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const existingItem = (Array.isArray(content) ? content : []).find(item => item.text.toLowerCase() === trimmedName.toLowerCase());
    if (existingItem) {
      setQuickAddItemText('');
      return;
    }

    const matchedCategory = COMMON_GROCERY_ITEMS.find(i => i.name.toLowerCase() === trimmedName.toLowerCase())?.category;
    if (!category && !matchedCategory) {
      setPendingItemName(trimmedName);
      setPendingCategory(defaultCategory);
      setQuickAddItemText('');
      return;
    }

    const itemCategory = category || matchedCategory || 'Sonstiges';
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
  };

  const handleConfirmCategory = () => {
    if (!pendingItemName) return;
    const newItem: ListItem = {
      id: Date.now().toString(),
      text: pendingItemName,
      completed: false,
      quantity: '',
      notes: '',
      category: pendingCategory
    };
    setContent(c => [...(Array.isArray(c) ? c : []), newItem]);
    setPendingItemName(null);
  };

  const handleCancelCategory = () => {
    setPendingItemName(null);
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
      color,
      createdAt: noteToEdit?.createdAt || now,
      updatedAt: now,
    };
    onSave(finalNote);
  };

  const addListItem = (category = 'Sonstiges') => {
    const newItem: ListItem = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      quantity: '',
      notes: '',
      category: category,
    };
    setContent(c => [...(Array.isArray(c) ? c : []), newItem]);
  };

  const updateListItem = (id: string, newValues: Partial<ListItem>) => {
    setContent(c => (Array.isArray(c) ? c : []).map(item => item.id === id ? { ...item, ...newValues } : item));
  };

  const removeListItem = (id: string) => {
    setContent(c => (Array.isArray(c) ? c : []).filter(item => item.id !== id));
  };

  const handleReorder = (category: string, newOrder: ListItem[]) => {
    setContent(currentContent => {
      if (!Array.isArray(currentContent)) return currentContent;

      // Group current items to preserve other categories
      const currentGrouped = currentContent.reduce((acc, item) => {
        const cat = item.category || 'Sonstiges';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, ListItem[]>);

      // Update the specific category
      currentGrouped[category] = newOrder;

      // Flatten back to array, respecting SHOPPING_CATEGORIES order for consistency
      const newContent: ListItem[] = [];
      const processedCategories = new Set<string>();

      // First add standard categories in order
      SHOPPING_CATEGORIES.forEach(cat => {
        if (currentGrouped[cat]) {
          newContent.push(...currentGrouped[cat]);
          processedCategories.add(cat);
        }
      });

      // Then add any other categories (like 'Sonstiges' or custom ones)
      Object.keys(currentGrouped).forEach(cat => {
        if (!processedCategories.has(cat)) {
          newContent.push(...currentGrouped[cat]);
        }
      });

      return newContent;
    });
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
            <button onClick={() => addListItem()} className="mt-2 px-3 py-1.5 rounded-md border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors">
              Eintrag hinzufügen
            </button>
          </div>
        );
      case NoteType.ShoppingList:
        const listContent = Array.isArray(content) ? content : [];
        const groupedItems = listContent.reduce((acc, item) => {
          const category = item.category || 'Sonstiges';
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {} as Record<string, ListItem[]>);

        return (
          <div>
            {/* Smart Quick Add Bar */}
            <div className="relative mb-4">
              <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border border-primary/50">
                <SparklesIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  type="text"
                  value={quickAddItemText}
                  onChange={(e) => setQuickAddItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(quickAddItemText)}
                  placeholder="Artikel hinzufügen..."
                  className="w-full bg-transparent text-on-background placeholder-on-background/50 focus:ring-0 border-0 outline-none"
                />
                </div>
                {pendingItemName && (
                  <div className="mt-2 p-3 rounded-lg border border-on-background/20 bg-surface">
                    <div className="text-sm text-on-background/80 mb-2">
                      Kategorie fuer "{pendingItemName}" auswaehlen
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={pendingCategory}
                        onChange={(e) => setPendingCategory(e.target.value)}
                        className="bg-background border border-on-background/20 rounded-md px-2 py-1 text-sm text-on-background"
                      >
                        {SHOPPING_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleConfirmCategory}
                        className="px-3 py-1 text-sm rounded-md bg-primary text-on-primary hover:bg-primary-variant transition-colors"
                      >
                        Hinzufuegen
                      </button>
                      <button
                        onClick={handleCancelCategory}
                        className="px-3 py-1 text-sm rounded-md border border-on-background/20 text-on-background hover:bg-on-background/10 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
                {filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-surface border border-on-background/20 rounded-b-lg shadow-lg mt-1">
                  {filteredSuggestions.map(s => (
                    <div key={s.name} onClick={() => handleSuggestionClick(s)} className="p-3 hover:bg-primary/20 cursor-pointer">
                      <span className="font-semibold">{highlightMatch(s.name, quickAddItemText)}</span>
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

            {/* Items grouped by category */}
            <div className="space-y-6">
              {SHOPPING_CATEGORIES.map(category => (
                groupedItems[category] && (
                  <div key={category}>
                    <h4 className="text-md font-semibold text-primary mb-2 border-b border-on-background/20 pb-1">{category}</h4>
                    <div className="space-y-2">
                      <Reorder.Group axis="y" values={groupedItems[category]} onReorder={(newOrder) => handleReorder(category, newOrder)}>
                        {groupedItems[category].map(item => (
                          <Reorder.Item key={item.id} value={item} className="mb-2">
                            <div className="flex items-center gap-2 p-1.5 rounded-md bg-surface border border-on-background/10 hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing">
                              <span className="text-on-background/30 cursor-grab active:cursor-grabbing select-none">⋮⋮</span>
                              <input type="text" value={item.text} onChange={e => updateListItem(item.id, { text: e.target.value })} placeholder="Artikelname" className="flex-grow bg-transparent p-1 text-on-background font-semibold focus:ring-0 focus:border-primary border-0 border-b border-on-background/20 outline-none" />
                              <div className="flex items-center gap-2">
                                <input type="text" value={item.quantity || ''} onChange={e => updateListItem(item.id, { quantity: e.target.value })} placeholder="Menge" className="w-20 bg-on-background/10 rounded-sm p-1 text-sm text-on-background/80 placeholder-on-background/50 focus:ring-1 focus:ring-primary outline-none" />
                                <button onClick={() => removeListItem(item.id)} className="p-2 text-on-surface/60 hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  </div>
                )
              ))}
            </div>

            <datalist id="categories">
              {SHOPPING_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
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
        className="bg-surface rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
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
        <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-on-background/20 flex-shrink-0 flex justify-between items-center">
          <div className="flex gap-2">
            {[undefined, 'bg-red-100 dark:bg-red-900', 'bg-orange-100 dark:bg-orange-900', 'bg-yellow-100 dark:bg-yellow-900', 'bg-green-100 dark:bg-green-900', 'bg-blue-100 dark:bg-blue-900', 'bg-purple-100 dark:bg-purple-900', 'bg-pink-100 dark:bg-pink-900'].map((c) => (
              <button
                key={c || 'default'}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border border-on-background/20 ${c || 'bg-surface'} ${color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''}`}
                title="Farbe wählen"
              />
            ))}
          </div>
          <button onClick={handleSave} className="px-6 py-2 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-variant transition-colors">
            Speichern
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NoteEditorModal;
