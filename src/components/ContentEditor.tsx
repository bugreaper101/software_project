import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Save, Trash2, Plus, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAdmin, type EntityType } from '@/context/AdminContext';
import { useSiteData } from '@/hooks/useSiteData';
import { supabase } from '@/lib/supabase';
import type { MenuCategory, MenuItem } from '@/types/database';

const TABLE_MAP: Record<EntityType, string> = {
  settings: 'restaurant_settings',
  menu_category: 'menu_categories',
  menu_item: 'menu_items',
  menu_item_image: 'menu_item_images',
  event: 'events',
  gallery: 'gallery',
  testimonial: 'testimonials',
};

const TITLE_MAP: Record<EntityType, { edit: string; create: string }> = {
  settings: { edit: 'Edit Restaurant', create: 'Restaurant Settings' },
  menu_category: { edit: 'Edit Category', create: 'Add Menu Category' },
  menu_item: { edit: 'Edit Dish', create: 'Add Dish' },
  menu_item_image: { edit: 'Edit Photo', create: 'Add Photo' },
  event: { edit: 'Edit Event', create: 'Add Event' },
  gallery: { edit: 'Edit Photo', create: 'Add Photo' },
  testimonial: { edit: 'Edit Testimonial', create: 'Add Testimonial' },
};

export function ContentEditor() {
  const { editor, closeEditor } = useAdmin();
  const { categories, menuItems, menuItemImages, reload } = useSiteData();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    setError(null);
    if (editor.id) {
      (async () => {
        const table = TABLE_MAP[editor.type];
        const { data, error } = await supabase.from(table).select('*').eq('id', editor.id).maybeSingle();
        if (error) { setError(error.message); return; }
        if (data) setValues(data as Record<string, unknown>);
      })();
    } else {
      setValues(defaultsFor(editor.type, editor.categoryId, editor.menuItemId, categories));
    }
  }, [editor, categories]);

  if (!editor) return null;

  const title = editor.id ? TITLE_MAP[editor.type].edit : TITLE_MAP[editor.type].create;
  const isNew = !editor.id;

  const set = (key: string, val: unknown) => setValues((v) => ({ ...v, [key]: val }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const table = TABLE_MAP[editor.type];
    const payload = sanitize(editor.type, values);
    let result;
    if (editor.id) {
      result = await supabase.from(table).update(payload).eq('id', editor.id).select().maybeSingle();
    } else {
      result = await supabase.from(table).insert(payload).select().maybeSingle();
    }
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    await reload();
    setBusy(false);
    closeEditor();
  };

  const remove = async () => {
    if (!editor?.id) return;
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setBusy(true);
    const { error } = await supabase.from(TABLE_MAP[editor.type]).delete().eq('id', editor.id);
    if (error) { setError(error.message); setBusy(false); return; }
    await reload();
    setBusy(false);
    closeEditor();
  };

  // For menu_item_image editing: show the parent menu item's other photos inline
  const parentMenuItem = editor.type === 'menu_item_image' && editor.menuItemId
    ? menuItems.find((m) => m.id === editor.menuItemId)
    : null;

  return (
    <Modal open={!!editor} onClose={closeEditor} title={title} size="lg">
      <form onSubmit={save} className="space-y-4">
        <Fields
          type={editor.type}
          values={values}
          set={set}
          categories={categories}
          menuItems={menuItems}
          menuItemImages={menuItemImages}
          parentMenuItemId={editor.menuItemId ?? null}
          reload={reload}
        />
        {error && (
          <div className="rounded-xl bg-wine-500/15 border border-wine-500/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Inline image manager for menu_item_image editing */}
        {editor.type === 'menu_item_image' && parentMenuItem && (
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest2 text-ink-400">
              All photos for {parentMenuItem.name}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {menuItemImages
                .filter((img) => img.menu_item_id === parentMenuItem.id)
                .map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden">
                    <img src={img.image_url} alt={img.caption ?? ''} className="h-20 w-full object-cover" />
                    <button
                      type="button"
                      onClick={async () => {
                        await supabase.from('menu_item_images').delete().eq('id', img.id);
                        await reload();
                      }}
                      className="absolute inset-0 bg-ink-950/80 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
                    >
                      <Trash2 size={16} className="text-red-300" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {editor.id ? (
            <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200 transition-colors">
              <Trash2 size={16} /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={closeEditor} className="btn-ghost !py-2.5">Cancel</button>
            <button type="submit" disabled={busy} className="btn-gold !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------- Field UI */
function Fields({ type, values, set, categories, menuItems, menuItemImages, parentMenuItemId, reload }: {
  type: EntityType;
  values: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  menuItemImages: ReturnType<typeof useSiteData>['menuItemImages'];
  parentMenuItemId: string | null;
  reload: () => void;
}) {
  switch (type) {
    case 'settings':
      return <SettingsFields values={values} set={set} />;
    case 'menu_category':
      return (
        <div className="space-y-4">
          <Field label="Category name"><input className="input-field" value={str(values.name)} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Subtitle (shown under name on the category card)"><input className="input-field" value={str(values.subtitle)} onChange={(e) => set('subtitle', e.target.value)} placeholder="Small plates to awaken the palate" /></Field>
          <Field label="Description"><input className="input-field" value={str(values.description)} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Category image URL"><input className="input-field" value={str(values.image_url)} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." /></Field>
          {str(values.image_url) && <img src={str(values.image_url)} alt="" className="h-40 w-full object-cover rounded-xl" />}
          <Field label="Sort order"><input type="number" className="input-field" value={num(values.sort_order)} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field>
        </div>
      );

    case 'menu_item':
      return (
        <div className="space-y-4">
          <Field label="Dish name"><input className="input-field" value={str(values.name)} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Short description (shown on the menu card)"><textarea rows={2} className="input-field resize-none" value={str(values.description)} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Long description (shown when the dish is opened)"><textarea rows={4} className="input-field resize-none" value={str(values.long_description)} onChange={(e) => set('long_description', e.target.value)} placeholder="The full story behind this dish..." /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Price ($)">
              <input type="number" step="0.01" className="input-field" value={num(values.price)} onChange={(e) => set('price', Number(e.target.value))} />
            </Field>
            <Field label="Category">
              <select className="input-field" value={str(values.category_id)} onChange={(e) => set('category_id', e.target.value || null)}>
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Main image URL"><input className="input-field" value={str(values.image_url)} onChange={(e) => set('image_url', e.target.value)} /></Field>
            <Field label="Dietary tags (comma separated)">
              <input className="input-field" value={Array.isArray(values.dietary_tags) ? (values.dietary_tags as string[]).join(', ') : ''} onChange={(e) => set('dietary_tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ingredients"><input className="input-field" value={str(values.ingredients)} onChange={(e) => set('ingredients', e.target.value)} placeholder="List of key ingredients" /></Field>
            <Field label="Wine / drink pairing"><input className="input-field" value={str(values.pairing)} onChange={(e) => set('pairing', e.target.value)} placeholder="Suggested pairing" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Sort order"><input type="number" className="input-field" value={num(values.sort_order)} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field>
            <div className="flex items-end gap-5 pb-2">
              <Toggle label="Available" checked={!!values.available} onChange={(v) => set('available', v)} />
              <Toggle label="Featured (Chef's pick)" checked={!!values.featured} onChange={(v) => set('featured', v)} />
            </div>
          </div>
          {str(values.image_url) && <img src={str(values.image_url)} alt="" className="h-40 w-full object-cover rounded-xl" />}

          {/* Inline food photo manager */}
          {str(values.id) && (
            <FoodImageManager menuItemId={str(values.id)} images={menuItemImages.filter((img) => img.menu_item_id === str(values.id))} onReload={reload} />
          )}
        </div>
      );

    case 'menu_item_image':
      return (
        <div className="space-y-4">
          {parentMenuItemId && (
            <input type="hidden" value={parentMenuItemId} onChange={() => set('menu_item_id', parentMenuItemId)} />
          )}
          <Field label="Photo URL"><input className="input-field" value={str(values.image_url)} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." /></Field>
          <Field label="Caption (optional)"><input className="input-field" value={str(values.caption)} onChange={(e) => set('caption', e.target.value)} /></Field>
          <Field label="Sort order"><input type="number" className="input-field" value={num(values.sort_order)} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field>
          {str(values.image_url) && <img src={str(values.image_url)} alt="" className="h-40 w-full object-cover rounded-xl" />}
        </div>
      );

    case 'event':
      return (
        <div className="space-y-4">
          <Field label="Title"><input className="input-field" value={str(values.title)} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Description"><textarea rows={3} className="input-field resize-none" value={str(values.description)} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Date"><input type="date" className="input-field" value={str(values.event_date)} onChange={(e) => set('event_date', e.target.value)} /></Field>
            <Field label="Price/person ($)"><input type="number" step="0.01" className="input-field" value={num(values.price_per_person)} onChange={(e) => set('price_per_person', Number(e.target.value))} /></Field>
            <Field label="Capacity"><input type="number" className="input-field" value={num(values.capacity)} onChange={(e) => set('capacity', Number(e.target.value))} /></Field>
          </div>
          <Field label="Image URL"><input className="input-field" value={str(values.image_url)} onChange={(e) => set('image_url', e.target.value)} /></Field>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-4">
          <Field label="Image URL"><input className="input-field" value={str(values.image_url)} onChange={(e) => set('image_url', e.target.value)} /></Field>
          <Field label="Caption"><input className="input-field" value={str(values.caption)} onChange={(e) => set('caption', e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Group">
              <select className="input-field" value={str(values.category)} onChange={(e) => set('category', e.target.value)}>
                <option value="interior">Interior</option>
                <option value="food">Food</option>
                <option value="events">Events</option>
              </select>
            </Field>
            <Field label="Sort order"><input type="number" className="input-field" value={num(values.sort_order)} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field>
          </div>
          {str(values.image_url) && <img src={str(values.image_url)} alt="" className="h-40 w-full object-cover rounded-xl" />}
        </div>
      );

    case 'testimonial':
      return (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Author name"><input className="input-field" value={str(values.author)} onChange={(e) => set('author', e.target.value)} /></Field>
            <Field label="Title / role"><input className="input-field" value={str(values.title)} onChange={(e) => set('title', e.target.value)} /></Field>
          </div>
          <Field label="Quote"><textarea rows={3} className="input-field resize-none" value={str(values.quote)} onChange={(e) => set('quote', e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Rating (1-5)"><input type="number" min={1} max={5} className="input-field" value={num(values.rating)} onChange={(e) => set('rating', Number(e.target.value))} /></Field>
            <Field label="Sort order"><input type="number" className="input-field" value={num(values.sort_order)} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field>
          </div>
        </div>
      );
  }
}

/* -------------------------------------------------------- Settings fields */
function SettingsFields({ values, set }: { values: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <SectionLabel>Restaurant Identity</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Restaurant name"><input className="input-field" value={str(values.name)} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Tagline (hero eyebrow)"><input className="input-field" value={str(values.tagline)} onChange={(e) => set('tagline', e.target.value)} /></Field>
      </div>

      <SectionLabel>Hero Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Hero title (main line)"><input className="input-field" value={str(values.hero_title)} onChange={(e) => set('hero_title', e.target.value)} /></Field>
        <Field label="Hero title accent (the italicized word)"><input className="input-field" value={str(values.hero_title_accent)} onChange={(e) => set('hero_title_accent', e.target.value)} /></Field>
      </div>
      <Field label="Hero subtitle text"><textarea rows={2} className="input-field resize-none" value={str(values.hero_subtitle)} onChange={(e) => set('hero_subtitle', e.target.value)} /></Field>
      <Field label="Hero background image URL"><input className="input-field" value={str(values.hero_image)} onChange={(e) => set('hero_image', e.target.value)} /></Field>

      <SectionLabel>About Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="About eyebrow"><input className="input-field" value={str(values.about_eyebrow)} onChange={(e) => set('about_eyebrow', e.target.value)} /></Field>
        <Field label="About title"><input className="input-field" value={str(values.about_title)} onChange={(e) => set('about_title', e.target.value)} /></Field>
      </div>
      <Field label="About story text"><textarea rows={4} className="input-field resize-none" value={str(values.story)} onChange={(e) => set('story', e.target.value)} /></Field>
      <Field label="About image URL"><input className="input-field" value={str(values.about_image)} onChange={(e) => set('about_image', e.target.value)} /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Stat number (e.g. 10)"><input className="input-field" value={str(values.stat_number)} onChange={(e) => set('stat_number', e.target.value)} /></Field>
        <Field label="Stat label (e.g. Years of craftsmanship)"><input className="input-field" value={str(values.stat_label)} onChange={(e) => set('stat_label', e.target.value)} /></Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Feature 1 icon"><input className="input-field" value={str(values.feature_1_icon)} onChange={(e) => set('feature_1_icon', e.target.value)} /></Field>
        <Field label="Feature 2 icon"><input className="input-field" value={str(values.feature_2_icon)} onChange={(e) => set('feature_2_icon', e.target.value)} /></Field>
        <Field label="Feature 3 icon"><input className="input-field" value={str(values.feature_3_icon)} onChange={(e) => set('feature_3_icon', e.target.value)} /></Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Feature 1 label"><input className="input-field" value={str(values.feature_1_label)} onChange={(e) => set('feature_1_label', e.target.value)} /></Field>
        <Field label="Feature 2 label"><input className="input-field" value={str(values.feature_2_label)} onChange={(e) => set('feature_2_label', e.target.value)} /></Field>
        <Field label="Feature 3 label"><input className="input-field" value={str(values.feature_3_label)} onChange={(e) => set('feature_3_label', e.target.value)} /></Field>
      </div>

      <SectionLabel>Menu Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Menu eyebrow"><input className="input-field" value={str(values.menu_eyebrow)} onChange={(e) => set('menu_eyebrow', e.target.value)} /></Field>
        <Field label="Menu title"><input className="input-field" value={str(values.menu_title)} onChange={(e) => set('menu_title', e.target.value)} /></Field>
      </div>
      <Field label="Menu subtitle"><textarea rows={2} className="input-field resize-none" value={str(values.menu_subtitle)} onChange={(e) => set('menu_subtitle', e.target.value)} /></Field>

      <SectionLabel>Events Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Events eyebrow"><input className="input-field" value={str(values.events_eyebrow)} onChange={(e) => set('events_eyebrow', e.target.value)} /></Field>
        <Field label="Events title"><input className="input-field" value={str(values.events_title)} onChange={(e) => set('events_title', e.target.value)} /></Field>
      </div>

      <SectionLabel>Gallery Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gallery eyebrow"><input className="input-field" value={str(values.gallery_eyebrow)} onChange={(e) => set('gallery_eyebrow', e.target.value)} /></Field>
        <Field label="Gallery title"><input className="input-field" value={str(values.gallery_title)} onChange={(e) => set('gallery_title', e.target.value)} /></Field>
      </div>

      <SectionLabel>Testimonials Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Testimonials eyebrow"><input className="input-field" value={str(values.testimonials_eyebrow)} onChange={(e) => set('testimonials_eyebrow', e.target.value)} /></Field>
        <Field label="Testimonials title"><input className="input-field" value={str(values.testimonials_title)} onChange={(e) => set('testimonials_title', e.target.value)} /></Field>
      </div>

      <SectionLabel>Reservation Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Reservation eyebrow"><input className="input-field" value={str(values.reservation_eyebrow)} onChange={(e) => set('reservation_eyebrow', e.target.value)} /></Field>
        <Field label="Reservation title"><input className="input-field" value={str(values.reservation_title)} onChange={(e) => set('reservation_title', e.target.value)} /></Field>
      </div>
      <Field label="Reservation subtitle"><textarea rows={2} className="input-field resize-none" value={str(values.reservation_subtitle)} onChange={(e) => set('reservation_subtitle', e.target.value)} /></Field>
      <Field label="Reservation background image URL"><input className="input-field" value={str(values.reservation_bg_image)} onChange={(e) => set('reservation_bg_image', e.target.value)} /></Field>

      <SectionLabel>Contact Section</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Contact eyebrow"><input className="input-field" value={str(values.contact_eyebrow)} onChange={(e) => set('contact_eyebrow', e.target.value)} /></Field>
        <Field label="Contact title"><input className="input-field" value={str(values.contact_title)} onChange={(e) => set('contact_title', e.target.value)} /></Field>
      </div>

      <SectionLabel>Contact Details & Social</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone"><input className="input-field" value={str(values.phone)} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Email"><input className="input-field" value={str(values.email)} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <Field label="Address"><input className="input-field" value={str(values.address)} onChange={(e) => set('address', e.target.value)} /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Map URL"><input className="input-field" value={str(values.map_url)} onChange={(e) => set('map_url', e.target.value)} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Instagram URL"><input className="input-field" value={str(values.social_instagram)} onChange={(e) => set('social_instagram', e.target.value)} /></Field>
        <Field label="Facebook URL"><input className="input-field" value={str(values.social_facebook)} onChange={(e) => set('social_facebook', e.target.value)} /></Field>
      </div>
    </div>
  );
}

/* --------------------------------------------------- Food image manager */
function FoodImageManager({ menuItemId, images, onReload }: {
  menuItemId: string;
  images: ReturnType<typeof useSiteData>['menuItemImages'];
  onReload: () => void;
}) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    await supabase.from('menu_item_images').insert({
      menu_item_id: menuItemId,
      image_url: url.trim(),
      caption: caption.trim() || null,
      sort_order: images.length,
    });
    setUrl('');
    setCaption('');
    setBusy(false);
    onReload();
  };

  const remove = async (id: string) => {
    await supabase.from('menu_item_images').delete().eq('id', id);
    onReload();
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 space-y-3">
      <p className="text-xs uppercase tracking-widest2 text-ink-400">Extra photos for this dish</p>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden">
              <img src={img.image_url} alt={img.caption ?? ''} className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute inset-0 bg-ink-950/80 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
              >
                <X size={16} className="text-red-300" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={add} className="flex gap-2">
        <input className="input-field flex-1" placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="input-field flex-1" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <button type="submit" disabled={busy} className="btn-ghost !py-2.5 whitespace-nowrap">
          <Plus size={16} /> Add
        </button>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------- helpers */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-widest2 text-gold-400/80 font-medium">{children}</span>
      <span className="flex-1 h-px bg-gold-500/20" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-gold-500' : 'bg-ink-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span className="text-sm text-ink-200">{label}</span>
    </label>
  );
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}
function num(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function defaultsFor(type: EntityType, categoryId?: string | null, menuItemId?: string | null, categories?: MenuCategory[]): Record<string, unknown> {
  switch (type) {
    case 'menu_item':
      return { name: '', description: '', long_description: '', ingredients: '', pairing: '', price: 0, image_url: '', available: true, featured: false, dietary_tags: [], sort_order: 0, category_id: categoryId ?? categories?.[0]?.id ?? null };
    case 'menu_category':
      return { name: '', description: '', image_url: '', subtitle: '', sort_order: 0 };
    case 'menu_item_image':
      return { image_url: '', caption: '', sort_order: 0, menu_item_id: menuItemId ?? null };
    case 'event':
      return { title: '', description: '', event_date: new Date().toISOString().split('T')[0], image_url: '', price_per_person: 0, capacity: 0 };
    case 'gallery':
      return { image_url: '', caption: '', category: 'interior', sort_order: 0 };
    case 'testimonial':
      return { author: '', title: '', rating: 5, quote: '', sort_order: 0 };
    case 'settings':
      return {};
  }
}

function sanitize(type: EntityType, values: Record<string, unknown>): Record<string, unknown> {
  const v = { ...values };
  if (type === 'settings') {
    return {
      name: v.name, tagline: v.tagline, story: v.story, phone: v.phone,
      email: v.email, address: v.address, map_url: v.map_url, hero_image: v.hero_image,
      social_instagram: v.social_instagram, social_facebook: v.social_facebook,
      hero_title: v.hero_title, hero_title_accent: v.hero_title_accent, hero_subtitle: v.hero_subtitle,
      about_eyebrow: v.about_eyebrow, about_title: v.about_title, about_image: v.about_image,
      stat_number: v.stat_number, stat_label: v.stat_label,
      feature_1_icon: v.feature_1_icon, feature_1_label: v.feature_1_label,
      feature_2_icon: v.feature_2_icon, feature_2_label: v.feature_2_label,
      feature_3_icon: v.feature_3_icon, feature_3_label: v.feature_3_label,
      menu_eyebrow: v.menu_eyebrow, menu_title: v.menu_title, menu_subtitle: v.menu_subtitle,
      events_eyebrow: v.events_eyebrow, events_title: v.events_title,
      gallery_eyebrow: v.gallery_eyebrow, gallery_title: v.gallery_title,
      testimonials_eyebrow: v.testimonials_eyebrow, testimonials_title: v.testimonials_title,
      contact_eyebrow: v.contact_eyebrow, contact_title: v.contact_title,
      reservation_eyebrow: v.reservation_eyebrow, reservation_title: v.reservation_title,
      reservation_subtitle: v.reservation_subtitle, reservation_bg_image: v.reservation_bg_image,
    };
  }
  delete v.id;
  delete v.created_at;
  return v;
}
