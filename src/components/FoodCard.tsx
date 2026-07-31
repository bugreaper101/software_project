import { ChevronRight, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import type { MenuItem } from '@/types/database';

interface FoodCardProps {
  item: MenuItem;
  delay: 0 | 1 | 2;
  canEdit: boolean;
  onEdit: () => void;
  onClick: () => void;
}

export function FoodCard({ item, delay, canEdit, onEdit, onClick }: FoodCardProps) {
  return (
    <Reveal delay={delay}>
      <div className="group relative rounded-2xl overflow-hidden glass cursor-pointer h-80" onClick={onClick}>
        <div className="absolute inset-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
          ) : (
            <div className="h-full w-full bg-ink-800 grid place-items-center text-gold-500/30">
              <UtensilsCrossed size={48} />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

        {item.featured && item.available && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/90 px-3 py-1 text-[10px] uppercase tracking-widest2 text-ink-950 font-medium">
              <Sparkles size={12} /> Chef's Pick
            </span>
          </div>
        )}

        {canEdit && (
          <div className="absolute top-4 right-4 z-10" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <button
              onClick={onEdit}
              className="rounded-full bg-ink-950/70 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest2 text-gold-300 hover:bg-gold-500 hover:text-ink-950 transition-colors"
            >
              Edit
            </button>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-6">
          <h3 className="font-serif text-2xl text-cream-50 group-hover:text-gold-300 transition-colors">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-ink-200 mt-1 line-clamp-2">{item.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="font-serif text-xl text-gold-300">${Number(item.price).toFixed(2)}</span>
            <span className="text-[10px] uppercase tracking-widest2 text-cream-100/60 group-hover:text-gold-300 transition-colors flex items-center gap-1">
              View details <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          {!item.available && (
            <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest2 text-wine-500 bg-wine-500/20 rounded-full px-2 py-0.5 border border-wine-500/40">Unavailable</span>
          )}
        </div>
      </div>
    </Reveal>
  );
}
