import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon.tsx';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

const typeClasses = {
  success: {
    bg: 'bg-secondary',
    icon: <CheckCircleIcon className="h-6 w-6 text-on-secondary" />,
  },
  error: {
    bg: 'bg-danger',
    icon: null, // Replace with an error icon if needed
  },
};

const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  const selectedType = typeClasses[type];

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-on-secondary animate-fade-in-right ${selectedType.bg}`}
      role="status"
    >
      {selectedType.icon}
      <div className="ml-3 text-sm font-medium">
        {message}
      </div>
    </div>
  );
};

export default Toast;