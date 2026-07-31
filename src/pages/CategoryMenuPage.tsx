import { useMemo, useState } from 'react';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { FoodCard } from '@/components/FoodCard';
import { FoodDetailModal } from '@/components/FoodDetailModal';
import { InlineEditButton, InlineAddButton } from '@/components/AdminToolbar';
import { useSiteData } from '@/hooks/useSiteData';
import { useAdmin } from '@/context/AdminContext';
import type { MenuItem } from '@/types/database';
import type { Route } from '@/App';

interface CategoryMenuPageProps {
  categoryId: string;
  onNavigate: (route: Route) => void;
}

export function CategoryMenuPage({ categoryId, onNavigate }: CategoryMenuPageProps) {
  const { categories, menuItems, menuItemImages, loading } = useSiteData();
  const { canEdit, openEditor } = useAdmin();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const category = categories.find((c) => c.id === categoryId);
  const items = useMemo(
    () => menuItems.filter((i) => i.category_id === categoryId),
    [menuItems, categoryId],
  );

  const goBackToMenu = () => {
    onNavigate({ name: 'home' });
    setTimeout(() => {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  if (!loading && !category) {
    return (
      <main className="min-h-[60vh] grid place-items-center section-pad text-center">
        <div>
          <UtensilsCrossed size={48} className="mx-auto text-gold-500/30 mb-4" />
          <p className="text-ink-300 mb-6">This category could not be found.</p>
          <button onClick={goBackToMenu} className="btn-gold">
            <ArrowLeft size={16} /> Back to Menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Category hero banner */}
      <section className="relative h-[44vh] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {loading ? (
            <div className="skeleton h-full w-full" />
          ) : category?.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-full w-full object-cover animate-ken-burns"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-ink-800 to-ink-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/30" />
        </div>

        <div className="relative section-pad w-full pt-28 pb-12">
          <button
            onClick={goBackToMenu}
            className="group flex items-center gap-2 text-sm uppercase tracking-widest2 text-cream-100/70 hover:text-gold-300 transition-colors mb-6"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All Categories
          </button>

          <Reveal>
            <p className="eyebrow eyebrow-left mb-4">{category?.subtitle ?? 'The Menu'}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="heading-xl text-cream-50 text-balance">{category?.name ?? 'Category'}</h1>
          </Reveal>
          {category?.description && (
            <Reveal delay={2}>
              <p className="mt-5 text-lg text-cream-200/85 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Dishes grid */}
      <section className="py-20 lg:py-28 section-pad">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-10">
              <p className="text-sm uppercase tracking-widest2 text-ink-400">
                {items.length} {items.length === 1 ? 'dish' : 'dishes'}
              </p>
              {canEdit && (
                <InlineEditButton label="Edit Category" onClick={() => openEditor({ type: 'menu_category', id: categoryId })} />
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  delay={(i % 3) as 0 | 1 | 2}
                  canEdit={canEdit}
                  onEdit={() => openEditor({ type: 'menu_item', id: item.id })}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <UtensilsCrossed size={48} className="mx-auto text-gold-500/30 mb-4" />
            <p className="text-ink-400">No dishes in this category yet.</p>
          </div>
        )}

        {canEdit && !loading && (
          <div className="flex justify-center mt-8">
            <InlineAddButton
              label="Add Dish to This Category"
              onClick={() => openEditor({ type: 'menu_item', id: null, categoryId })}
            />
          </div>
        )}
      </section>

      {selectedItem && (
        <FoodDetailModal
          item={selectedItem}
          images={menuItemImages.filter((img) => img.menu_item_id === selectedItem.id)}
          allItems={menuItems}
          categories={categories}
          canEdit={canEdit}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
        />
      )}
    </main>
  );
}
