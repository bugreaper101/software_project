import { Star, Quote } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  author: string;
  title: string | null;
  quote: string;
  rating: number;
}

export function QuoteModal({ open, onClose, author, title, quote, rating }: QuoteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="" size="md" hideHeader>
      <div className="px-8 py-12 text-center">
        <Quote className="mx-auto text-gold-500/40 mb-6" size={40} />
        <blockquote className="font-serif text-xl md:text-2xl text-cream-100 font-light leading-relaxed text-balance">
          "{quote}"
        </blockquote>
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} size={16} className="fill-gold-400 text-gold-400" />
            ))}
          </div>
          <p className="font-serif text-lg text-gold-300 mt-1">{author}</p>
          {title && <p className="text-xs uppercase tracking-widest2 text-ink-400">{title}</p>}
        </div>
        <button onClick={onClose} className="btn-ghost mt-8">Close</button>
      </div>
    </Modal>
  );
}
