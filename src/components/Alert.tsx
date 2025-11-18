import React from 'react';
import CloseIcon from './icons/CloseIcon';

interface AlertProps {
  message: string;
  type?: 'danger' | 'success' | 'warning';
  onDismiss: () => void;
}

const typeClasses = {
  danger: 'bg-danger/10 border-danger text-danger',
  success: 'bg-green-500/10 border-green-500 text-green-400',
  warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
};

const Alert: React.FC<AlertProps> = ({ message, type = 'danger', onDismiss }) => {
  const baseClasses = 'border p-4 rounded-md flex justify-between items-center mb-4';
  const classes = `${baseClasses} ${typeClasses[type]}`;

  return (
    <div className={classes} role="alert">
      <div>
        <p className="font-bold">Fehler bei der Synchronisierung</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Fehlermeldung schließen"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Alert;