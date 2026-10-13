'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  push: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  push: () => {},
  success: () => {},
  error: () => {},
});

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const success = useCallback(
    (message: string) => push('success', message),
    [push]
  );
  const error = useCallback((message: string) => push('error', message), [push]);

  return (
    <ToastContext.Provider value={{ push, success, error }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success:
    'bg-white dark:bg-stone-900 border-emerald-200 dark:border-emerald-800/60',
  error: 'bg-white dark:bg-stone-900 border-red-200 dark:border-red-800/60',
  info: 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700',
};

const iconStyles = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-stone-500 dark:text-stone-400',
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const Icon = icons[toast.type];
  return (
    <div
      className={`
        slide-in pointer-events-auto
        flex items-start gap-3 px-4 py-3 rounded-xl
        border shadow-lg shadow-stone-900/5 dark:shadow-black/20
        min-w-[280px] max-w-[400px]
        ${styles[toast.type]}
      `}
    >
      <Icon
        className={`w-5 h-5 shrink-0 mt-0.5 ${iconStyles[toast.type]}`}
        strokeWidth={2.5}
      />
      <p className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-100 leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);