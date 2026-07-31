import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideHeader?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md', hideHeader = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizes[size]} glass-strong rounded-2xl shadow-2xl shadow-black/50 animate-scale-in max-h-[90vh] flex flex-col ${hideHeader ? 'overflow-hidden' : ''}`}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
            <div>
              <h3 className="font-serif text-2xl text-cream-50 font-light">{title}</h3>
              {description && <p className="text-sm text-ink-300 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-ink-300 hover:text-cream-50 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className={hideHeader ? '' : 'p-6 overflow-y-auto no-scrollbar'}>{children}</div>
      </div>
    </div>
  );
}
