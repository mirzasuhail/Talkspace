import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-primary" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-elevated/90 border border-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl animate-slide-up text-sm font-medium">
      {icons[type]}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-zinc-400 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
