import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Calendar, Clock, Users, ChevronDown, Star, Quote, MapPin,
  Phone, Mail, Send, Check, Wine, UtensilsCrossed, Sparkles, Images,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { FoodDetailModal } from '@/components/FoodDetailModal';
import { GuestTestimonialForm } from '@/components/GuestTestimonialForm';
import { GuestMemoryModal } from '@/components/GuestMemoryModal';
import { QuoteModal } from '@/components/QuoteModal';
import { useSiteData } from '@/hooks/useSiteData';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { InlineEditButton, InlineAddButton } from '@/components/AdminToolbar';
import { supabase } from '@/lib/supabase';
import type { MenuItem, MenuItemImage, MenuCategory, GuestTestimonial } from '@/types/database';
import type { Route } from '@/App';

interface HomePageProps {
  onOpenReservation: () => void;
  onNavigate: (route: Route) => void;
}

export function HomePage({ onOpenReservation, onNavigate }: HomePageProps) {
  const { settings, categories, menuItems, menuItemImages, events, gallery, testimonials, guestTestimonials, loading, error } = useSiteData();
  const { canEdit } = useAdmin();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  return (
    <main>
      <Hero settings={settings} loading={loading} onBook={onOpenReservation} />
      <About settings={settings} loading={loading} />
      <MenuSection
        categories={categories}
        items={menuItems}
        menuItemImages={menuItemImages}
        settings={settings}
        loading={loading}
        canEdit={canEdit}
        onNavigateCategory={(catId) => onNavigate({ name: 'menu-category', categoryId: catId })}
        onSelectItem={setSelectedItem}
      />
      <ReservationCta settings={settings} onBook={onOpenReservation} canEdit={canEdit} />
      <EventsSection events={events} settings={settings} loading={loading} onBook={onOpenReservation} canEdit={canEdit} />
      <GallerySection gallery={gallery} settings={settings} loading={loading} canEdit={canEdit} />
      <TestimonialsSection
        testimonials={testimonials}
        guestTestimonials={guestTestimonials}
        settings={settings}
        loading={loading}
        onNavigate={onNavigate}
      />
      <ContactSection settings={settings} canEdit={canEdit} />
      {selectedItem && (
        <FoodDetailModal
          item={selectedItem}
          images={menuItemImages.filter((img) => img.menu_item_id === selectedItem.id)}
          allItems={menuItems}
          categories={categories}
          canEdit={canEdit}
          onClose={() => setSelectedItem(null)}
          onNavigate={(item) => setSelectedItem(item)}
        />
      )}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-wine-500/20 border border-wine-500/50 px-4 py-3 text-sm text-red-200">
          Some content failed to load.
        </div>
      )}
    </main>
  );
}

/* ----------------------------------------------------------- Icon helper */
function DynamicIcon({ name, size = 20 }: { name: string; size?: number }) {
  const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;
  const Icon = iconMap[name] ?? UtensilsCrossed;
  return <Icon size={size} />;
}

/* ------------------------------------------------------------------ Hero */
function Hero({ settings, loading, onBook }: {
  settings: ReturnType<typeof useSiteData>['settings'];
  loading: boolean;
  onBook: () => void;
}) {
  const title = settings?.hero_title ?? 'Where every plate tells a story';
  const accent = settings?.hero_title_accent ?? 'story';
  const subtitle = settings?.hero_subtitle ?? 'A candlelit room, an open kitchen, and a seasonal tasting menu that honors classical French technique. Welcome to Lumière.';

  // Split title around the accent word to italicize it
  const parts = title.split(accent);
  const hasAccent = parts.length > 1;

  return (
    <section id="top" className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        {loading ? (
          <div className="skeleton h-full w-full" />
        ) : (
          <img
            src={settings?.hero_image ?? 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1600'}
            alt="Lumière dining room"
            className="h-full w-full object-cover animate-ken-burns"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/40 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 to-transparent" />
      </div>

      <div className="relative section-pad w-full pt-28 pb-20">
        <div className="max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-6">{settings?.tagline ?? 'An Evening of French Elegance'}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="heading-xl text-cream-50 text-shadow-lg text-balance">
              {hasAccent ? (
                <>{parts[0]}<em className="text-gold-300 not-italic font-normal">{accent}</em>{parts.slice(1).join(accent)}</>
              ) : (
                title
              )}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-7 text-lg text-cream-200/85 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onBook} className="btn-gold btn-gold-lg">
                <Calendar size={18} /> Reserve a Table
              </button>
              <button
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost btn-gold-lg"
              >
                Explore the Menu
              </button>
            </div>
          </Reveal>

        </div>
      </div>

      <button
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream-100/60 hover:text-gold-300 transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} />
      </button>
    </section>
  );
}

/* ----------------------------------------------------------------- About */
function About({ settings, loading }: { settings: ReturnType<typeof useSiteData>['settings']; loading: boolean }) {

  const features = [
    { icon: settings?.feature_1_icon ?? 'UtensilsCrossed', label: settings?.feature_1_label ?? 'Seasonal Tasting Menu' },
    { icon: settings?.feature_2_icon ?? 'Wine', label: settings?.feature_2_label ?? 'Curated Cellar' },
    { icon: settings?.feature_3_icon ?? 'Sparkles', label: settings?.feature_3_label ?? 'Open Kitchen' },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 section-pad">
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <Reveal>
          <div className="relative">
            <div className="img-zoom rounded-3xl overflow-hidden aspect-[4/5]">
              {loading ? (
                <div className="skeleton h-full w-full" />
              ) : (
                <img
                  src={settings?.about_image ?? 'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=900'}
                  alt="The Lumière kitchen"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-6 -right-6 hidden md:block glass-strong rounded-2xl p-6 max-w-[220px]">
              <p className="font-serif text-4xl text-gold-300 font-light">{settings?.stat_number ?? '10'}</p>
              <p className="text-xs uppercase tracking-widest2 text-ink-300 mt-1">
                {(settings?.stat_label ?? 'Years of craftsmanship').split(' of ')[0]}<br />
                {(settings?.stat_label ?? 'Years of craftsmanship').split(' of ').slice(1).join(' of ') || 'craftsmanship'}
              </p>
            </div>

          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow eyebrow-left mb-5">{settings?.about_eyebrow ?? 'Our Story'}</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="heading-lg text-cream-50 text-balance">
              {settings?.about_title ?? 'A love letter to French gastronomy'}
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-6 text-ink-200 leading-relaxed text-lg">
              {settings?.story ??
                'Founded in 2014, Lumière is a love letter to French gastronomy. Chef Antoine Mercier crafts seasonal tasting menus that honor classical technique while embracing the produce of our region. Every evening begins with candlelight, an open kitchen, and a glass of something memorable.'}
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto grid place-items-center h-12 w-12 rounded-full border border-gold-500/30 text-gold-300 mb-3 transition-all hover:border-gold-400 hover:scale-110 duration-300">
                    <DynamicIcon name={f.icon} size={20} />
                  </div>
                  <p className="text-xs text-ink-300 leading-snug">{f.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Menu */
function MenuSection({ categories, items, menuItemImages, settings, loading, canEdit, onSelectItem, onNavigateCategory }: {
  categories: MenuCategory[];
  items: MenuItem[];
  menuItemImages: MenuItemImage[];
  settings: ReturnType<typeof useSiteData>['settings'];
  loading: boolean;
  canEdit: boolean;
  onSelectItem: (item: MenuItem) => void;
  onNavigateCategory: (categoryId: string) => void;
}) {
  const { openEditor } = useAdmin();
  const [activeId, setActiveId] = useState<string | null>(null);

  const resolvedId = activeId ?? categories[0]?.id ?? null;
  const activeItems = useMemo(
    () => (resolvedId ? items.filter((i) => i.category_id === resolvedId) : []),
    [items, resolvedId],
  );
  const colA = activeItems.filter((_, i) => i % 2 === 0);
  const colB = activeItems.filter((_, i) => i % 2 === 1);

  return (
    <section id="menu" className="relative bg-ink-950 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/3 h-[500px] w-[500px] rounded-full bg-gold-500/[0.05] blur-[140px] animate-menu-glow" />
        <div className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-gold-600/[0.04] blur-[120px] animate-menu-glow" style={{ animationDelay: '4s' }} />
      </div>

      {loading ? (
        <div className="section-pad py-12 grid lg:grid-cols-[380px_1fr] gap-8 min-h-[500px]">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        </div>
      ) : categories.length > 0 ? (
        <div className="flex flex-col lg:flex-row">

          {/* ── LEFT PANEL ─────────────────────────────────────────── */}
          <div className="lg:w-[360px] xl:w-[400px] shrink-0 relative flex flex-col justify-center px-8 xl:px-12 py-10 lg:py-14 bg-ink-950 border-b lg:border-b-0 lg:border-r border-white/[0.06] z-10">
            {/* Eyebrow + heading */}
            <div className="mb-10">
              <p className="eyebrow eyebrow-left mb-5 text-gold-400/70">
                Seasonal Selection
              </p>
              <h2 className="font-serif leading-[1.0]">
                <span className="block text-5xl xl:text-6xl text-gold-400 font-light">
                  {settings?.menu_title ?? 'The Menu'}
                </span>
              </h2>
              <div className="h-px w-10 bg-gold-500/50 mt-6 mb-6" />
              <p className="text-sm text-ink-400 leading-relaxed">
                {settings?.menu_subtitle ?? 'Our menu changes with the harvest. Below is a selection of what is gracing our tables this season.'}
              </p>
            </div>

            {/* Admin add buttons */}
            {canEdit && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => openEditor({ type: 'menu_category', id: null })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-widest2 text-ink-300 hover:text-gold-300 hover:border-gold-500/40 transition-colors"
                >
                  + Category
                </button>
                {resolvedId && (
                  <button
                    onClick={() => openEditor({ type: 'menu_item', id: null, categoryId: resolvedId })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-widest2 text-ink-300 hover:text-gold-300 hover:border-gold-500/40 transition-colors"
                  >
                    + Dish
                  </button>
                )}
              </div>
            )}

            {/* Category list */}
            <div className="space-y-0.5">
              {categories.map((cat) => {
                const isActive = resolvedId === cat.id;
                const count = items.filter((it) => it.category_id === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onClick={() => onNavigateCategory(cat.id)}
                    className={`group relative flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer transition-all duration-400 select-none ${
                      isActive
                        ? 'bg-white/[0.05] border-l-2 border-gold-400'
                        : 'border-l-2 border-transparent hover:bg-white/[0.025] hover:border-gold-400/30'
                    }`}
                  >
                    {/* Category thumbnail */}
                    <div className={`shrink-0 h-12 w-12 rounded-xl overflow-hidden transition-all duration-300 ring-1 ${
                      isActive ? 'ring-gold-400/60' : 'ring-white/[0.06] group-hover:ring-gold-400/30'
                    }`}>
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className={`h-full w-full grid place-items-center transition-colors duration-300 ${
                          isActive ? 'bg-gold-500/15 text-gold-300' : 'bg-ink-800/60 text-ink-500 group-hover:text-ink-300'
                        }`}>
                          <UtensilsCrossed size={16} />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-serif text-xl leading-tight transition-colors duration-300 ${
                        isActive ? 'text-cream-50' : 'text-ink-200 group-hover:text-cream-100'
                      }`}>
                        {cat.name}
                      </p>
                      {cat.subtitle && (
                        <p className={`text-[11px] mt-0.5 leading-snug line-clamp-1 transition-colors duration-300 ${
                          isActive ? 'text-gold-400/60' : 'text-ink-500 group-hover:text-ink-400'
                        }`}>
                          {cat.subtitle}
                        </p>
                      )}
                      <p className={`text-[10px] uppercase tracking-widest2 mt-1 transition-colors duration-300 ${
                        isActive ? 'text-gold-300' : 'text-ink-600 group-hover:text-ink-500'
                      }`}>
                        {count} {count === 1 ? 'dish' : 'dishes'}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className={`shrink-0 transition-all duration-300 text-gold-400 ${
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    }`}>
                      →
                    </div>

                    {canEdit && (
                      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <InlineEditButton onClick={() => openEditor({ type: 'menu_category', id: cat.id })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT SCROLL COLUMNS ─────────────────────────────── */}
          <div className="flex-1 relative overflow-hidden">
            {/* Bounded scroll area — matches left panel's content height (py-10 lg:py-14) */}
            <div className="absolute inset-x-0 top-10 bottom-10 lg:top-14 lg:bottom-14 overflow-hidden">
              {/* Top / bottom fade masks */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 z-20 bg-gradient-to-b from-ink-950 via-ink-950/70 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />

              {resolvedId && activeItems.length > 0 ? (
                <div key={resolvedId} className="absolute inset-0 px-4 md:px-6 grid grid-cols-2 gap-4 menu-showcase-enter">
                  {/* Column A — scrolls UP */}
                  <div className="flex flex-col gap-4 menu-scroll-up" style={{ willChange: 'transform' }}>
                    {[...colA, ...colA, ...colA].map((item, i) => (
                      <MenuDishCard key={`${item.id}-a-${i}`} item={item} onClick={() => onSelectItem(item)} />
                    ))}
                  </div>
                  {/* Column B — scrolls DOWN, offset for rhythm */}
                  <div className="flex flex-col gap-4 menu-scroll-down" style={{ willChange: 'transform', marginTop: '-180px' }}>
                    {[...colB, ...colB, ...colB].map((item, i) => (
                      <MenuDishCard key={`${item.id}-b-${i}`} item={item} onClick={() => onSelectItem(item)} />
                    ))}
                  </div>
                </div>
              ) : resolvedId ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <UtensilsCrossed size={48} className="mx-auto text-gold-500/20 mb-4" />
                    <p className="text-ink-400">No dishes in this category yet.</p>
                    {canEdit && (
                      <div className="mt-4">
                        <InlineAddButton label="Add Dish" onClick={() => openEditor({ type: 'menu_item', id: null, categoryId: resolvedId })} />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div className="section-pad py-24 text-center">
          <p className="text-ink-400">No menu categories yet.</p>
          {canEdit && (
            <div className="mt-4">
              <InlineAddButton label="Add Category" onClick={() => openEditor({ type: 'menu_category', id: null })} />
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

/* ─────────────────────────────── Menu dish card (reference style) */
function MenuDishCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left focus:outline-none shrink-0"
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '3/1' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-ink-800 grid place-items-center text-gold-500/20">
            <UtensilsCrossed size={36} />
          </div>
        )}
        {/* Price badge */}
        <div className="absolute bottom-2.5 right-2.5 bg-ink-950/80 backdrop-blur-sm rounded-full px-2.5 py-0.5">
          <span className="font-serif text-sm text-gold-300">${Number(item.price).toFixed(0)}</span>
        </div>
        {/* Chef's pick */}
        {item.featured && item.available && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[8px] uppercase tracking-widest2 text-ink-950 font-semibold">
              <Sparkles size={8} /> Chef's Pick
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Text below image — reference style */}
      <div className="pt-2.5 pb-1 px-0.5">
        <p className="font-serif text-base text-cream-100 leading-snug group-hover:text-gold-200 transition-colors line-clamp-1">
          {item.name}
        </p>
        {item.description && (
          <p className="text-[11px] text-ink-400 mt-0.5 line-clamp-1 leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------- Reservation CTA */
function ReservationCta({ settings, onBook, canEdit }: {
  settings: ReturnType<typeof useSiteData>['settings'];
  onBook: () => void;
  canEdit: boolean;
}) {
  const { openEditor } = useAdmin();
  return (
    <section id="reservations" className="relative py-20 section-pad">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={settings?.reservation_bg_image ?? 'https://images.pexels.com/photos/2577934/pexels-photo-2577934.jpeg?auto=compress&cs=tinysrgb&w=1600'}
            alt="Reservation"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink-950/70" />
          <div className="relative px-8 py-16 md:p-20 text-center">
            <p className="eyebrow justify-center mb-5">{settings?.reservation_eyebrow ?? 'Reservations'}</p>
            <h2 className="heading-lg text-cream-50 text-balance">{settings?.reservation_title ?? 'Reserve your evening'}</h2>
            <p className="mt-5 text-cream-200/80 max-w-lg mx-auto leading-relaxed">
              {settings?.reservation_subtitle ?? 'We seat parties of one to eight. Book below and we\'ll confirm your table by email.'}
            </p>
            <button onClick={onBook} className="btn-gold btn-gold-lg mt-8">
              <Calendar size={18} /> Book a Table
            </button>
          </div>
        </div>
      </Reveal>
      {canEdit && (
        <div className="flex justify-center mt-4">
          <InlineEditButton label="Edit Reservation Section" onClick={() => openEditor({ type: 'settings', id: '1' })} />
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- Events */
function EventsSection({ events, settings, loading, onBook, canEdit }: {
  events: ReturnType<typeof useSiteData>['events'];
  settings: ReturnType<typeof useSiteData>['settings'];
  loading: boolean;
  onBook: () => void;
  canEdit: boolean;
}) {
  const { openEditor } = useAdmin();
  const upcoming = events.filter((e) => new Date(e.event_date) >= new Date(new Date().toDateString()));
  if (!loading && upcoming.length === 0) return null;

  return (
    <section id="events" className="py-24 lg:py-32 section-pad bg-ink-900/40">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Reveal><p className="eyebrow justify-center mb-5">{settings?.events_eyebrow ?? 'Special Evenings'}</p></Reveal>
        <Reveal delay={1}><h2 className="heading-lg text-cream-50">{settings?.events_title ?? 'Upcoming events'}</h2></Reveal>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-96 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {upcoming.map((ev, i) => (
            <Reveal key={ev.id} delay={(i % 3) as 0 | 1 | 2}>
              <article className="group glass rounded-2xl overflow-hidden h-full flex flex-col relative">
                {canEdit && (
                  <div className="absolute top-3 right-3 z-10">
                    <InlineEditButton onClick={() => openEditor({ type: 'event', id: ev.id })} />
                  </div>
                )}
                <div className="img-zoom h-56 overflow-hidden">
                  <img src={ev.image_url ?? ''} alt={ev.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-gold-300 uppercase tracking-widest2 mb-3">
                    <Calendar size={13} />
                    {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="font-serif text-2xl text-cream-50">{ev.title}</h3>
                  <p className="mt-2 text-sm text-ink-300 leading-relaxed flex-1">{ev.description}</p>
                  <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                    <div>
                      {ev.price_per_person != null && (
                        <p className="font-serif text-xl text-gold-300">${Number(ev.price_per_person).toFixed(0)}<span className="text-xs text-ink-400"> /person</span></p>
                      )}
                      {ev.capacity != null && (
                        <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1"><Users size={12} /> {ev.capacity} seats</p>
                      )}
                    </div>
                    <button onClick={onBook} className="text-xs uppercase tracking-widest2 text-ink-200 hover:text-gold-300 transition-colors">
                      Reserve →
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
      {canEdit && !loading && (
        <div className="flex justify-center mt-8">
          <InlineAddButton label="Add Event" onClick={() => openEditor({ type: 'event', id: null })} />
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- Gallery */
function GallerySection({ gallery, settings, loading, canEdit }: {
  gallery: ReturnType<typeof useSiteData>['gallery'];
  settings: ReturnType<typeof useSiteData>['settings'];
  loading: boolean;
  canEdit: boolean;
}) {
  const { openEditor } = useAdmin();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'interior' | 'food' | 'events'>('all');

  const filtered = filter === 'all' ? gallery : gallery.filter((g) => g.category === filter);

  return (
    <section id="gallery" className="py-24 lg:py-32 section-pad">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Reveal><p className="eyebrow justify-center mb-5">{settings?.gallery_eyebrow ?? 'The Gallery'}</p></Reveal>
        <Reveal delay={1}><h2 className="heading-lg text-cream-50">{settings?.gallery_title ?? 'Moments at Lumière'}</h2></Reveal>
      </div>

      {!loading && (
        <Reveal>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {(['all', 'interior', 'food', 'events'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm uppercase tracking-widest2 transition-all ${
                  filter === f ? 'bg-gold-500 text-ink-950' : 'border border-white/10 text-ink-200 hover:border-gold-500/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
          {filtered.map((img, i) => (
            <Reveal key={img.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="relative group">
                {canEdit && (
                  <div className="absolute top-2 right-2 z-10">
                    <InlineEditButton onClick={() => openEditor({ type: 'gallery', id: img.id })} />
                  </div>
                )}
                <button
                  onClick={() => setLightbox(img.image_url)}
                  className="block w-full img-zoom rounded-2xl overflow-hidden relative"
                >
                  <img src={img.image_url} alt={img.caption ?? ''} className="w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/30 transition-colors" />
                  {img.caption && (
                    <p className="absolute bottom-0 inset-x-0 p-4 text-sm text-cream-50 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-ink-950/80 to-transparent">
                      {img.caption}
                    </p>
                  )}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}
      {canEdit && !loading && (
        <div className="flex justify-center mt-8">
          <InlineAddButton label="Add Photo" onClick={() => openEditor({ type: 'gallery', id: null })} />
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-ink-950/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-2xl animate-scale-in" />
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------- Testimonials */
interface MergedTestimonial {
  id: string;
  author: string;
  title: string | null;
  rating: number;
  quote: string;
  source: 'curated' | 'guest';
  guest?: GuestTestimonial;
  hasMedia: boolean;
}

function TestimonialsSection({ testimonials, guestTestimonials, settings, loading, onNavigate }: {
  testimonials: ReturnType<typeof useSiteData>['testimonials'];
  guestTestimonials: GuestTestimonial[];
  settings: ReturnType<typeof useSiteData>['settings'];
  loading: boolean;
  onNavigate: (route: Route) => void;
}) {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [memoryItem, setMemoryItem] = useState<GuestTestimonial | null>(null);
  const [quoteModal, setQuoteModal] = useState<{ author: string; title: string | null; quote: string; rating: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const dragState = useRef<{ startX: number; dragging: boolean }>({ startX: 0, dragging: false });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const merged: MergedTestimonial[] = useMemo(() => {
    const curated = testimonials.map((t) => ({
      id: t.id, author: t.author, title: t.title ?? null, rating: t.rating, quote: t.quote,
      source: 'curated' as const, guest: undefined, hasMedia: false,
    }));
    const guest = guestTestimonials.map((t) => ({
      id: t.id, author: t.author_name, title: 'Guest of Lumiere', rating: t.rating, quote: t.quote,
      source: 'guest' as const, guest: t, hasMedia: true,
    }));
    return [...curated, ...guest];
  }, [testimonials, guestTestimonials]);

  const count = merged.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(() => setIdx((v) => (v + 1) % count), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, paused]);

  useEffect(() => { if (idx >= count && count > 0) setIdx(0); }, [count, idx]);

  const wrappedOffset = (cardIndex: number): number => {
    let raw = cardIndex - idx;
    if (raw > count / 2) raw -= count;
    if (raw < -count / 2) raw += count;
    return raw;
  };

  const cardStyle = (offset: number): React.CSSProperties => {
    const abs = Math.abs(offset);
    let scale = 1, opacity = 1, x = 0, rotateY = 0, z = 30, bright = 1;
    if (abs === 0) { scale = 1; opacity = 1; x = 0; rotateY = 0; z = 30; bright = 1; }
    else if (abs === 1) { scale = 0.8; opacity = 0.55; x = offset * 240; rotateY = offset * 5; z = 20; bright = 0.8; }
    else if (abs === 2) { scale = 0.62; opacity = 0.25; x = offset * 420; rotateY = offset * 10; z = 10; bright = 0.6; }
    else { scale = 0.55; opacity = 0; x = offset * 560; rotateY = offset * 14; z = 0; bright = 0.5; }
    return {
      transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      zIndex: z,
      filter: `brightness(${bright})`,
      pointerEvents: abs <= 2 ? 'auto' : 'none',
    };
  };

  const onNameClick = (t: MergedTestimonial) => {
    if (t.source === 'guest' && t.guest) setMemoryItem(t.guest);
    else setQuoteModal({ author: t.author, title: t.title, quote: t.quote, rating: t.rating });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { startX: e.clientX, dragging: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > 60 && count > 1) {
      if (delta < 0) setIdx((v) => (v + 1) % count);
      else setIdx((v) => (v - 1 + count) % count);
    }
    dragState.current.dragging = false;
  };

  if (!loading && count === 0) return null;

  return (
    <section className="py-24 lg:py-32 bg-ink-900/40 overflow-hidden">
      <div className="text-center max-w-3xl mx-auto section-pad">
        <Reveal><p className="eyebrow justify-center mb-5">{settings?.testimonials_eyebrow ?? 'Guest Words'}</p></Reveal>
        <Reveal delay={1}><h2 className="heading-lg text-cream-50 mb-16">{settings?.testimonials_title ?? 'What our guests say'}</h2></Reveal>
      </div>

      {loading ? (
        <div className="skeleton h-80 rounded-2xl max-w-5xl mx-auto" />
      ) : count > 0 ? (
        <>
          <div
            className="relative h-[400px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-none"
            style={{ perspective: '1400px' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); dragState.current.dragging = false; }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { dragState.current.dragging = false; }}
          >
            {merged.map((t, i) => {
              const offset = wrappedOffset(i);
              const abs = Math.abs(offset);
              const style = cardStyle(offset);
              return (
                <div
                  key={t.id}
                  className="absolute w-[280px] md:w-[340px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ ...style, transformStyle: 'preserve-3d' }}
                >
                  <div className="glass-strong rounded-3xl p-8 text-center">
                    <Quote className="mx-auto text-gold-500/40 mb-5" size={32} />
                    <p className={`font-serif text-cream-100 font-light leading-relaxed ${abs === 0 ? 'text-lg' : 'text-base'} ${abs > 0 ? 'line-clamp-3' : 'line-clamp-6'}`}>
                      “{t.quote}”
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, si) => (
                          <Star key={si} size={abs === 0 ? 14 : 12} className="fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                      <button
                        onClick={() => onNameClick(t)}
                        className="font-serif text-gold-300 hover:text-gold-200 transition-colors underline underline-offset-4 decoration-gold-500/30 hover:decoration-gold-400"
                      >
                        {t.author}
                      </button>
                      {t.title && <p className="text-[10px] uppercase tracking-widest2 text-ink-400">{t.title}</p>}
                      {t.source === 'guest' && t.hasMedia && abs === 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest2 text-gold-400/70 border border-gold-500/20 rounded-full px-2 py-0.5 mt-1">
                          <Images size={9} /> View Gallery
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots */}
          {count > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {merged.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-gold-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Share Your Story */}
          <div className="text-center mt-12">
            {user ? (
              <button onClick={() => setFormOpen(true)} className="btn-ghost">
                <Star size={16} /> Share Your Story
              </button>
            ) : (
              <p className="text-sm text-ink-400">
                <button onClick={() => onNavigate({ name: 'auth' })} className="text-gold-300 hover:text-gold-200 underline underline-offset-4 transition-colors">
                  Sign in
                </button>
                {' '}to share your own story and photos.
              </p>
            )}
          </div>
        </>
      ) : null}

      <GuestTestimonialForm open={formOpen} onClose={() => setFormOpen(false)} onSubmitted={() => setFormOpen(false)} />
      {memoryItem && <GuestMemoryModal testimonial={memoryItem} onClose={() => setMemoryItem(null)} />}
      {quoteModal && (
        <QuoteModal
          open={true}
          onClose={() => setQuoteModal(null)}
          author={quoteModal.author}
          title={quoteModal.title}
          quote={quoteModal.quote}
          rating={quoteModal.rating}
        />
      )}
    </section>
  );
}

/* --------------------------------------------------------------- Contact */
function ContactSection({ settings, canEdit }: { settings: ReturnType<typeof useSiteData>['settings']; canEdit: boolean }) {
  const { openEditor } = useAdmin();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name, email: form.email, message: form.message,
    });
    if (error) { setStatus('error'); return; }
    setStatus('sent');
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <section id="contact" className="py-24 lg:py-32 section-pad">
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20">
        <div>
          <Reveal><p className="eyebrow eyebrow-left mb-5">{settings?.contact_eyebrow ?? 'Get in Touch'}</p></Reveal>
          <Reveal delay={1}><h2 className="heading-lg text-cream-50">{settings?.contact_title ?? 'Visit Lumière'}</h2></Reveal>
          <Reveal delay={2}>
            <div className="mt-8 space-y-5">
              {settings?.address && (
                <div className="flex gap-4">
                  <div className="grid place-items-center h-11 w-11 rounded-full border border-gold-500/30 text-gold-300 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-ink-400 mb-1">Address</p>
                    <p className="text-cream-100">{settings.address}</p>
                  </div>
                </div>
              )}
              {settings?.phone && (
                <div className="flex gap-4">
                  <div className="grid place-items-center h-11 w-11 rounded-full border border-gold-500/30 text-gold-300 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-ink-400 mb-1">Phone</p>
                    <a href={`tel:${settings.phone}`} className="text-cream-100 hover:text-gold-300 transition-colors">{settings.phone}</a>
                  </div>
                </div>
              )}
              {settings?.email && (
                <div className="flex gap-4">
                  <div className="grid place-items-center h-11 w-11 rounded-full border border-gold-500/30 text-gold-300 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest2 text-ink-400 mb-1">Email</p>
                    <a href={`mailto:${settings.email}`} className="text-cream-100 hover:text-gold-300 transition-colors">{settings.email}</a>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
          {settings?.map_url && (
            <Reveal delay={3}>
              <a
                href={settings.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost mt-8"
              >
                <MapPin size={16} /> Open in Maps
              </a>
            </Reveal>
          )}
          {canEdit && (
            <div className="mt-4">
              <InlineEditButton label="Edit Contact & Settings" onClick={() => openEditor({ type: 'settings', id: '1' })} />
            </div>
          )}
        </div>

        <Reveal delay={2}>
          <form onSubmit={submit} className="glass rounded-3xl p-8 space-y-5">
            <h3 className="font-serif text-2xl text-cream-50">Send us a message</h3>
            <div>
              <label className="label-field" htmlFor="c-name">Name</label>
              <input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="label-field" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label-field" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field resize-none" placeholder="How can we help?" />
            </div>
            <button type="submit" disabled={status === 'sending'} className="btn-gold w-full">
              {status === 'sending' ? 'Sending…' : (<><Send size={16} /> Send Message</>)}
            </button>
            {status === 'sent' && (
              <div className="flex items-center gap-2 text-sm text-gold-300 animate-fade-in">
                <Check size={16} /> Thank you — your message has been received.
              </div>
            )}
            {status === 'error' && (
              <div className="text-sm text-red-300">Something went wrong. Please try again.</div>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
