import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  GalleryImage,
  GuestTestimonial,
  MenuCategory,
  MenuItem,
  MenuItemImage,
  RestaurantEvent,
  RestaurantSettings,
  Testimonial,
} from '@/types/database';

interface SiteData {
  settings: RestaurantSettings | null;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  menuItemImages: MenuItemImage[];
  events: RestaurantEvent[];
  gallery: GalleryImage[];
  testimonials: Testimonial[];
  guestTestimonials: GuestTestimonial[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useSiteData(): SiteData {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [guestTestimonials, setGuestTestimonials] = useState<GuestTestimonial[]>([]);
  const [menuItemImages, setMenuItemImages] = useState<MenuItemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const withTimeout = <T,>(promise: Promise<T>, ms = 8000) =>
        Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            window.setTimeout(() => reject(new Error('Content request timed out.')), ms);
          }),
        ]);

      const [settingsRes, catRes, itemsRes, imagesRes, eventsRes, galleryRes, testRes, guestTestRes] = await withTimeout(Promise.all([
        supabase.from('restaurant_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_item_images').select('*').order('sort_order', { ascending: true }),
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        supabase.from('gallery').select('*').order('sort_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('sort_order', { ascending: true }),
        supabase.from('guest_testimonials').select('*').eq('status', 'approved').order('sort_order', { ascending: true }),
      ]));

      if (settingsRes.error) throw settingsRes.error;
      if (catRes.error) throw catRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (galleryRes.error) throw galleryRes.error;
      if (testRes.error) throw testRes.error;
      if (guestTestRes.error) throw guestTestRes.error;
      if (imagesRes.error) throw imagesRes.error;

      setSettings(settingsRes.data as RestaurantSettings | null);
      setCategories((catRes.data ?? []) as MenuCategory[]);
      setMenuItems((itemsRes.data ?? []) as MenuItem[]);
      setEvents((eventsRes.data ?? []) as RestaurantEvent[]);
      setGallery((galleryRes.data ?? []) as GalleryImage[]);
      setTestimonials((testRes.data ?? []) as Testimonial[]);
      setGuestTestimonials((guestTestRes.data ?? []) as GuestTestimonial[]);
      setMenuItemImages((imagesRes.data ?? []) as MenuItemImage[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, categories, menuItems, menuItemImages, events, gallery, testimonials, guestTestimonials, loading, error, reload: load };
}
