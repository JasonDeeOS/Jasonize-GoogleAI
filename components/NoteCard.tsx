import React from 'react';
import { Note, ListItem, NoteType } from '../types';
import TrashIcon from './icons/TrashIcon';
import RestoreIcon from './icons/RestoreIcon';
import CloudOffIcon from './icons/CloudOffIcon';

interface NoteCardProps {
  note: Note;
  onView: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  isDeleting?: boolean;
  isUpdated?: boolean;
  view: 'active' | 'deleted';
  location: 'local' | 'cloud';
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onView, onDelete, onRestore, onPermanentDelete, isDeleting, isUpdated, view, location }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore?.();
  };
  
  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPermanentDelete?.();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderContentPreview = () => {
    if (note.noteType === NoteType.Text) {
      const content = note.content as string;
      if (!content) return null;
      const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      return <p className="text-sm text-on-background/70 italic whitespace-pre-wrap">{preview}</p>;
    }

    if (note.noteType === NoteType.List || note.noteType === NoteType.ShoppingList) {
      const items = note.content as ListItem[];
      if (!items || items.length === 0) {
        return <p className="text-sm text-on-background/70 italic">Leere Liste</p>;
      }
      const completedCount = items.filter(item => item.completed).length;
      const totalCount = items.length;
      return <p className="text-sm text-on-background/70 italic">{completedCount} / {totalCount} erledigt</p>;
    }

    return null;
  }

  const cardClasses = [
    'group', 'relative', 'bg-surface', 'p-4', 'rounded-lg', 'shadow-lg', 
    'transition-all', 'duration-300', 
    'flex', 'flex-col', 'justify-between', 'min-h-[130px]',
    'animate-scale-in',
    isDeleting ? 'opacity-0 scale-95' : '',
    isUpdated ? 'animate-highlight-pulse' : '',
    view === 'active' ? 'cursor-pointer hover:shadow-primary/30 hover:-translate-y-1' : 'opacity-60',
  ].join(' ');

  return (
    <div
      onClick={view === 'active' ? onView : undefined}
      className={cardClasses}
    >
      <div>
        <h3 className="text-lg font-bold text-on-surface truncate mb-2">{note.title}</h3>
        <div className="mb-2">
           {renderContentPreview()}
        </div>
      </div>
      <p className="text-sm text-on-background/70 mt-auto">
        {view === 'deleted' && note.deletedAt ? `Gelöscht: ${formatDate(note.deletedAt)}` : `Erstellt: ${formatDate(note.createdAt)}`}
      </p>

      {location === 'cloud' && note.isPendingSync && view === 'active' && (
        <div className="absolute bottom-3 left-3" title="Synchronisierung ausstehend">
          <CloudOffIcon className="w-4 h-4 text-on-background/50" />
        </div>
      )}

      {view === 'active' && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-1 rounded-full bg-surface text-on-surface/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-danger hover:text-white"
          aria-label="Notiz löschen"
        >
          <TrashIcon />
        </button>
      )}

      {view === 'deleted' && (
        <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <button
            onClick={handleRestore}
            className="p-1 rounded-full bg-surface text-on-surface/60 hover:bg-secondary hover:text-white"
            aria-label="Notiz wiederherstellen"
            title="Wiederherstellen"
          >
            <RestoreIcon />
          </button>
          <button
            onClick={handlePermanentDelete}
            className="p-1 rounded-full bg-surface text-on-surface/60 hover:bg-danger hover:text-white"
            aria-label="Notiz endgültig löschen"
            title="Endgültig löschen"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
