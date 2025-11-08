import { useMemo } from 'react';
import { Note, NoteType, ListItem } from '../types.ts';

const useShoppingHistory = (allNotes: Note[]): string[] => {
  const frequentlyBought = useMemo(() => {
    const itemCounts: { [key: string]: number } = {};

    allNotes.forEach(note => {
      if (note.noteType === NoteType.ShoppingList && Array.isArray(note.content)) {
        (note.content as ListItem[]).forEach(item => {
          if (item.text && item.text.trim()) {
            const itemName = item.text.trim();
            itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(itemCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([name]) => name);

  }, [allNotes]);

  return frequentlyBought;
};

export default useShoppingHistory;