import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note, ListItem, NoteType } from '../types';
import CloudOffIcon from './icons/CloudOffIcon';
import TrashIcon from './icons/TrashIcon';
import RestoreIcon from './icons/RestoreIcon';

interface NoteCardProps {
  note: Note;
  onView?: () => void;
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
      // For preview, we might want to strip markdown or just show it rendered but truncated?
      // Let's show rendered markdown but limit height via CSS line-clamp or similar.
      return (
        <div className="text-sm text-on-background/80 prose prose-sm prose-invert max-w-none line-clamp-6">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    if (note.noteType === NoteType.List || note.noteType === NoteType.ShoppingList) {
      const items = note.content as ListItem[];
      if (!items || items.length === 0) {
        return <p className="text-sm text-on-background/70 italic">Leere Liste</p>;
      }
      const completedCount = items.filter(item => item.completed).length;
      const totalCount = items.length;
      const previewItems = items.slice(0, 3);

      return (
        <div className="space-y-1">
          {previewItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-on-background/80">
              <span className={`w-1.5 h-1.5 rounded-full ${item.completed ? 'bg-green-400' : 'bg-primary'}`}></span>
              <span className={item.completed ? 'line-through opacity-60' : ''}>{item.text}</span>
            </div>
          ))}
          {totalCount > 3 && <p className="text-xs text-on-background/50 mt-1">... +{totalCount - 3} weitere</p>}
          <p className="text-xs text-on-background/50 mt-2 pt-2 border-t border-on-background/10">{completedCount} / {totalCount} erledigt</p>
        </div>
      );
    }

    return null;
  }

  const cardClasses = [
    'group', 'relative', note.color || 'bg-surface', 'p-4', 'rounded-lg', 'shadow-lg',
    'transition-all', 'duration-300',
    'flex', 'flex-col', 'justify-between', 'min-h-[130px]',
    isDeleting ? 'opacity-0 scale-95' : '',
    isUpdated ? 'ring-2 ring-primary' : '',
    view === 'active' ? 'cursor-pointer hover:shadow-primary/30 hover:-translate-y-1' : 'opacity-60',
  ].join(' ');

  return (
    <div
      onClick={view === 'active' ? onView : undefined}
      className={cardClasses}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-on-surface truncate mb-2">{note.title}</h3>
        <div className="mb-3">
          {renderContentPreview()}
        </div>

      </div>

      <p className="text-xs text-on-background/50 mt-auto flex justify-between items-center">
        <span>{formatDate(note.updatedAt)}</span>
        {location === 'cloud' && <span className="text-[10px] uppercase tracking-wider opacity-70">Cloud</span>}
      </p>

      {location === 'cloud' && note.isPendingSync && view === 'active' && (
        <div className="absolute bottom-3 right-3" title="Synchronisierung ausstehend">
          <CloudOffIcon className="w-4 h-4 text-on-background/50" />
        </div>
      )}

      {view === 'active' && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-surface text-on-surface/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-danger hover:text-white shadow-sm"
          aria-label="Notiz löschen"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}

      {view === 'deleted' && (
        <div className="absolute top-3 right-3 flex space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={handleRestore}
            className="p-1.5 rounded-full bg-surface text-on-surface/60 hover:bg-secondary hover:text-white shadow-sm"
            aria-label="Notiz wiederherstellen"
            title="Wiederherstellen"
          >
            <RestoreIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handlePermanentDelete}
            className="p-1.5 rounded-full bg-surface text-on-surface/60 hover:bg-danger hover:text-white shadow-sm"
            aria-label="Notiz endgültig löschen"
            title="Endgültig löschen"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
