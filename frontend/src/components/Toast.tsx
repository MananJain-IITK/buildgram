import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-zinc-900/90 text-zinc-100',
    error: 'border-rose-500/20 bg-zinc-900/90 text-zinc-100',
    info: 'border-purple-500/20 bg-zinc-900/90 text-zinc-100',
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm',
        borders[type]
      )}
    >
      {icons[type]}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-300 transition-colors ml-auto p-1 rounded-lg hover:bg-zinc-800"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
