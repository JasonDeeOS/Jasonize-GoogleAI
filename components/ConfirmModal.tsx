import React from 'react';
import CloseIcon from './icons/CloseIcon';
import WarningIcon from './icons/WarningIcon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface/70 hover:text-on-surface">
          <CloseIcon />
        </button>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger/10">
            <WarningIcon className="h-6 w-6 text-danger" />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-2 text-on-surface">{title}</h2>
            <p className="text-on-background/80">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-on-background/20 text-on-surface hover:bg-on-background/30 transition-colors">
            Abbrechen
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-danger text-white font-semibold hover:bg-danger/80 transition-colors">
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
