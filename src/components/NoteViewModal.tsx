import React, { useState, useEffect } from 'react';
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
  const [categorySortOrder, setCategorySortOrder] = useState<string[]>([]);

  // Load category sort order from localStorage
  useEffect(() => {
    if (note?.id && note.noteType === NoteType.ShoppingList) {
      const savedOrder = localStorage.getItem(`category-sort-${note.id}`);
      if (savedOrder) {
        setCategorySortOrder(JSON.parse(savedOrder));
      }
    }
  }, [note?.id, note?.noteType]);

  // Save category sort order to localStorage
  const saveCategorySortOrder = (order: string[]) => {
    if (note?.id) {
      localStorage.setItem(`category-sort-${note.id}`, JSON.stringify(order));
      setCategorySortOrder(order);
    }
  };

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

  const handleAufraumen = () => {
    if (note.noteType !== NoteType.ShoppingList && note.noteType !== NoteType.List) return;

    const items = note.content as ListItem[];
    const sortedItems = [...items].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });

    const updatedNote = { ...note, content: sortedItems, updatedAt: new Date().toISOString() };
    onUpdateNote(updatedNote);
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    if (note.noteType !== NoteType.ShoppingList) return;

    const updatedContent = (note.content as ListItem[]).map(item => {
      if (item.id === itemId) {
        const currentQty = parseInt(item.quantity || '1', 10);
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, quantity: newQty.toString() };
      }
      return item;
    });

    const updatedNote = { ...note, content: updatedContent, updatedAt: new Date().toISOString() };
    onUpdateNote(updatedNote);
  };

  const handleShare = () => {
    if (!note) return;
    const listContent = Array.isArray(note.content) ? note.content : [];
    const text = listContent.map(item =>
      `${item.completed ? '[x]' : '[ ]'} ${item.text} ${item.quantity ? `(${item.quantity})` : ''}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Liste in die Zwischenablage kopiert!');
  };

  const handleTogglePin = () => {
    if (!note) return;
    onUpdateNote({ ...note, isPinned: !note.isPinned });
  };

  const moveCategoryUp = (category: string, allCategories: string[]) => {
    const currentIndex = categorySortOrder.indexOf(category);
    if (currentIndex === -1) {
      // Category not in custom order, use default order
      const defaultIndex = allCategories.indexOf(category);
      if (defaultIndex > 0) {
        const newOrder = [...allCategories];
        [newOrder[defaultIndex - 1], newOrder[defaultIndex]] = [newOrder[defaultIndex], newOrder[defaultIndex - 1]];
        saveCategorySortOrder(newOrder);
      }
    } else if (currentIndex > 0) {
      const newOrder = [...categorySortOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      saveCategorySortOrder(newOrder);
    }
  };

  const moveCategoryDown = (category: string, allCategories: string[]) => {
    const currentIndex = categorySortOrder.indexOf(category);
    if (currentIndex === -1) {
      // Category not in custom order, use default order
      const defaultIndex = allCategories.indexOf(category);
      if (defaultIndex < allCategories.length - 1) {
        const newOrder = [...allCategories];
        [newOrder[defaultIndex], newOrder[defaultIndex + 1]] = [newOrder[defaultIndex + 1], newOrder[defaultIndex]];
        saveCategorySortOrder(newOrder);
      }
    } else if (currentIndex < categorySortOrder.length - 1) {
      const newOrder = [...categorySortOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      saveCategorySortOrder(newOrder);
    }
  };

  const renderContent = () => {
    switch (note.noteType) {
      case NoteType.Text:
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

          // Sort categories based on saved order
          const allCategories = Object.keys(groupedItems);
          const sortedCategories = categorySortOrder.length > 0
            ? categorySortOrder.filter(cat => allCategories.includes(cat)).concat(
              allCategories.filter(cat => !categorySortOrder.includes(cat))
            )
            : allCategories;

          return (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAufraumen}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  🧹 Aufräumen
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-lg hover:bg-secondary/90 transition-colors font-medium ml-2"
                >
                  📤 Teilen
                </button>
              </div>
              <div className="mb-4 p-3 bg-primary/10 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-primary">Gesamtsumme:</span>
                <span className="font-bold text-xl text-primary">
                  {items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)} €
                </span>
              </div>
              {sortedCategories.map((category, categoryIndex) => {
                const categoryItems = groupedItems[category];
                return (
                  <div key={category} className="mb-8">
                    <div className="sticky top-0 bg-surface z-10 py-2 -mx-6 px-6 mb-4">
                      <div className="flex items-center justify-between border-b-2 border-primary/30 pb-2">
                        <h4 className="text-lg font-bold text-primary">{category}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveCategoryUp(category, sortedCategories)}
                            disabled={categoryIndex === 0}
                            className="p-1 rounded hover:bg-on-background/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Kategorie nach oben"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveCategoryDown(category, sortedCategories)}
                            disabled={categoryIndex === sortedCategories.length - 1}
                            className="p-1 rounded hover:bg-on-background/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Kategorie nach unten"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {categoryItems.map(item => (
                        <li key={item.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleListItem(item.id)}
                            className="mt-1 h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`block text-on-surface ${item.completed ? 'line-through text-on-background/50' : ''}`}>
                              {item.text}
                            </span>
                            {item.notes && (
                              <span className="text-sm text-on-background/60 block mt-1">
                                {item.notes}
                              </span>
                            )}
                          </div>
                          {item.quantity && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="w-7 h-7 rounded-full bg-on-background/10 hover:bg-on-background/20 transition-colors flex items-center justify-center font-bold"
                                aria-label="Menge verringern"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-7 h-7 rounded-full bg-on-background/10 hover:bg-on-background/20 transition-colors flex items-center justify-center font-bold"
                                aria-label="Menge erhöhen"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {item.price && (
                            <span className="text-sm font-medium text-on-background/70 ml-2 min-w-[3rem] text-right">
                              {item.price.toFixed(2)} €
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </>
          );
        }

        return (
          <>
            {note.noteType === NoteType.List && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAufraumen}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  🧹 Aufräumen
                </button>
              </div>
            )}
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item.id} className="flex items-center">
                  <input type="checkbox" checked={item.completed} onChange={() => handleToggleListItem(item.id)} className="h-5 w-5 rounded text-primary bg-surface border-on-background/30 focus:ring-primary cursor-pointer" />
                  <span className={`ml-3 ${item.completed ? 'line-through text-on-background/50' : ''}`}>{item.text}</span>
                </li>
              ))}
            </ul>
          </>
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
          <div className="flex items-center gap-1 sm:gap-2">
            {location === 'local' && (
              <button onClick={onMoveToCloud} className="p-2 rounded-full hover:bg-on-background/20 transition-colors" aria-label="In die Cloud verschieben" title="In die Cloud verschieben">
                <CloudUploadIcon />
              </button>
            )}
            <button onClick={handleTogglePin} className={`p-2 rounded-full transition-colors ${note.isPinned ? 'bg-primary/20 text-primary' : 'hover:bg-on-background/20 text-on-surface/50'}`} aria-label={note.isPinned ? "Lösen" : "Anpinnen"}>
              📌
            </button>
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