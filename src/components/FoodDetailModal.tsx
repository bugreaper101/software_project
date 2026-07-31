import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, UtensilsCrossed, Wine, X,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { InlineEditButton, InlineAddButton } from '@/components/AdminToolbar';
import { useAdmin } from '@/context/AdminContext';
import type { MenuCategory, MenuItem, MenuItemImage } from '@/types/database';

interface FoodDetailModalProps {
  item: MenuItem;
  images: MenuItemImage[];
  allItems: MenuItem[];
  categories: MenuCategory[];
  canEdit: boolean;
  onClose: () => void;
  onNavigate: (item: MenuItem) => void;
}

export function FoodDetailModal({ item, images, allItems, categories, canEdit, onClose, onNavigate }: FoodDetailModalProps) {
  const { openEditor } = useAdmin();
  const [photoIdx, setPhotoIdx] = useState(0);

  const gallery = useMemo(() => {
    const imgs: { url: string; caption: string | null }[] = [];
    if (item.image_url) imgs.push({ url: item.image_url, caption: null });
    images.forEach((img) => imgs.push({ url: img.image_url, caption: img.caption }));
    return imgs;
  }, [item, images]);

  const sameCategoryItems = allItems.filter((i) => i.category_id === item.category_id);
  const currentIdx = sameCategoryItems.findIndex((i) => i.id === item.id);
  const prevItem = currentIdx > 0 ? sameCategoryItems[currentIdx - 1] : null;
  const nextItem = currentIdx < sameCategoryItems.length - 1 ? sameCategoryItems[currentIdx + 1] : null;
  const categoryName = categories.find((c) => c.id === item.category_id)?.name ?? '';

  useEffect(() => { setPhotoIdx(0); }, [item.id]);

  return (
    <Modal open onClose={onClose} title="" size="xl" hideHeader>
      <div className="grid md:grid-cols-2 gap-0 -m-6 max-h-[90vh] overflow-hidden">
        <div className="relative bg-ink-950 h-72 md:h-full min-h-[300px]">
          {gallery.length > 0 ? (
            <>
              <img
                key={gallery[photoIdx]?.url}
                src={gallery[photoIdx]?.url}
                alt={item.name}
                className="h-full w-full object-cover animate-fade-in"
              />
              {gallery[photoIdx]?.caption && (
                <p className="absolute bottom-0 inset-x-0 p-4 text-sm text-cream-50 bg-gradient-to-t from-ink-950/80 to-transparent animate-fade-in">
                  {gallery[photoIdx].caption}
                </p>
              )}

              {gallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-ink-950/60 backdrop-blur-md rounded-full p-2">
                  {gallery.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-gold-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={g.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-ink-950/60 backdrop-blur-md text-cream-100 hover:bg-gold-500 hover:text-ink-950 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIdx((i) => (i + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-ink-950/60 backdrop-blur-md text-cream-100 hover:bg-gold-500 hover:text-ink-950 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="h-full grid place-items-center text-gold-500/30">
              <UtensilsCrossed size={64} />
            </div>
          )}

          {item.featured && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500/90 px-3 py-1 text-[10px] uppercase tracking-widest2 text-ink-950 font-medium">
              <Sparkles size={12} /> Chef's Pick
            </span>
          )}
        </div>

        <div className="p-8 overflow-y-auto max-h-[90vh] md:max-h-full">
          <div className="flex items-start justify-between gap-4 mb-1">
            <span className="text-xs uppercase tracking-widest2 text-gold-300/80">{categoryName}</span>
            <button onClick={onClose} className="text-ink-400 hover:text-cream-100 transition-colors -mt-1 -mr-1">
              <X size={22} />
            </button>
          </div>

          <h2 className="font-serif text-3xl text-cream-50 mt-1">{item.name}</h2>
          <p className="font-serif text-2xl text-gold-300 mt-2">${Number(item.price).toFixed(2)}</p>

          {item.description && (
            <p className="mt-4 text-ink-200 leading-relaxed">{item.description}</p>
          )}

          {item.long_description && (
            <p className="mt-4 text-ink-300 leading-relaxed text-sm">{item.long_description}</p>
          )}

          {item.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {item.dietary_tags.map((t) => (
                <span key={t} className="text-[10px] uppercase tracking-widest2 text-gold-400/70 border border-gold-500/20 rounded-full px-2.5 py-0.5">
                  {t.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {item.ingredients && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-xs uppercase tracking-widest2 text-gold-300/80 mb-2">Ingredients</p>
              <p className="text-sm text-ink-200 leading-relaxed">{item.ingredients}</p>
            </div>
          )}

          {item.pairing && (
            <div className="mt-4 pt-5 border-t border-white/10">
              <p className="text-xs uppercase tracking-widest2 text-gold-300/80 mb-2 flex items-center gap-2">
                <Wine size={14} /> Pairing
              </p>
              <p className="text-sm text-ink-200 leading-relaxed">{item.pairing}</p>
            </div>
          )}

          {canEdit && (
            <div className="mt-6 flex flex-wrap gap-2">
              <InlineEditButton label="Edit This Dish" onClick={() => openEditor({ type: 'menu_item', id: item.id })} />
              <InlineAddButton label="Add Photo to This Dish" onClick={() => openEditor({ type: 'menu_item_image', id: null, menuItemId: item.id })} />
            </div>
          )}

          {(prevItem || nextItem) && (
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => prevItem && onNavigate(prevItem)}
                disabled={!prevItem}
                className="flex items-center gap-2 text-sm text-ink-300 hover:text-gold-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} /> {prevItem?.name ?? ''}
              </button>
              <button
                onClick={() => nextItem && onNavigate(nextItem)}
                disabled={!nextItem}
                className="flex items-center gap-2 text-sm text-ink-300 hover:text-gold-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {nextItem?.name ?? ''} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
