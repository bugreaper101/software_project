import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GuestTestimonial, GuestTestimonialStatus, GuestMemoryMedia, Testimonial as TestimonialCuratedRow } from '@/types/database';

export interface SubmitPayload {
  authorName: string;
  avatarUrl: string | null;
  rating: number;
  quote: string;
  media: { url: string; type: 'image' | 'video'; caption?: string }[];
}

export function useGuestTestimonials() {
  const submit = useCallback(async (payload: SubmitPayload): Promise<{ error: string | null; id: string | null }> => {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { error: 'You must be signed in to share your story.', id: null };

    const userId = userData.user.id;

    const { data: blocked } = await supabase
      .from('guest_testimonials')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'blocked')
      .maybeSingle();

    if (blocked) return { error: 'Your account has been blocked from submitting testimonials.', id: null };

    const { data, error } = await supabase
      .from('guest_testimonials')
      .insert({
        user_id: userId,
        author_name: payload.authorName,
        avatar_url: payload.avatarUrl,
        rating: payload.rating,
        quote: payload.quote,
      })
      .select('id')
      .single();

    if (error) return { error: error.message, id: null };
    const testimonialId = data.id;

    if (payload.media.length > 0) {
      const mediaRows = payload.media.map((m, i) => ({
        testimonial_id: testimonialId,
        user_id: userId,
        media_url: m.url,
        media_type: m.type,
        caption: m.caption ?? null,
        sort_order: i,
      }));
      const { error: mediaErr } = await supabase.from('guest_memory_media').insert(mediaRows);
      if (mediaErr) return { error: mediaErr.message, id: testimonialId };
    }

    return { error: null, id: testimonialId };
  }, []);

  return { submit };
}

export function useGuestMemoryMedia(testimonialId: string | null) {
  const [media, setMedia] = useState<GuestMemoryMedia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!testimonialId) { setMedia([]); return; }
    setLoading(true);
    supabase
      .from('guest_memory_media')
      .select('*')
      .eq('testimonial_id', testimonialId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setMedia((data ?? []) as GuestMemoryMedia[]);
        setLoading(false);
      });
  }, [testimonialId]);

  return { media, loading };
}

export function useAdminGuestTestimonials() {
  const [pending, setPending] = useState<GuestTestimonial[]>([]);
  const [reviewed, setReviewed] = useState<GuestTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('guest_testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    const rows = (data ?? []) as GuestTestimonial[];
    setPending(rows.filter((r) => r.status === 'pending'));
    setReviewed(rows.filter((r) => r.status !== 'pending'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = useCallback(async (id: string, status: GuestTestimonialStatus) => {
    const { error } = await supabase.from('guest_testimonials').update({ status }).eq('id', id);
    if (error) return { error: error.message };
    await load();
    return { error: null };
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('guest_testimonials').delete().eq('id', id);
    if (error) return { error: error.message };
    await load();
    return { error: null };
  }, [load]);

  return { pending, reviewed, loading, error, setStatus, remove, reload: load };
}

export interface LiveTestimonialRow {
  table: 'guest_testimonials' | 'testimonials';
  id: string;
  author: string;
  quote: string;
  rating: number;
  sort_order: number;
  source: 'guest' | 'curated';
}

export function useAdminAllTestimonials() {
  const [live, setLive] = useState<LiveTestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [guestRes, curRes] = await Promise.all([
      supabase.from('guest_testimonials').select('*').eq('status', 'approved').order('sort_order', { ascending: true }),
      supabase.from('testimonials').select('*').order('sort_order', { ascending: true }),
    ]);
    if (guestRes.error) { setError(guestRes.error.message); setLoading(false); return; }
    if (curRes.error) { setError(curRes.error.message); setLoading(false); return; }

    const guestRows = ((guestRes.data ?? []) as GuestTestimonial[]).map((t) => ({
      table: 'guest_testimonials' as const,
      id: t.id,
      author: t.author_name,
      quote: t.quote,
      rating: t.rating,
      sort_order: t.sort_order,
      source: 'guest' as const,
    }));
    const curRows = ((curRes.data ?? []) as TestimonialCuratedRow[]).map((t) => ({
      table: 'testimonials' as const,
      id: t.id,
      author: t.author,
      quote: t.quote,
      rating: t.rating,
      sort_order: t.sort_order,
      source: 'curated' as const,
    }));
    setLive([...guestRows, ...curRows].sort((a, b) => a.sort_order - b.sort_order));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reorder = useCallback(async (rows: LiveTestimonialRow[]) => {
    // Assign sequential sort_order then persist per table
    const indexed = rows.map((r, i) => ({ ...r, sort_order: i }));
    const guest = indexed.filter((r) => r.table === 'guest_testimonials');
    const curated = indexed.filter((r) => r.table === 'testimonials');

    const updates: Promise<{ error: { message: string } | null }>[] = [];
    for (const g of guest) {
      updates.push(
        Promise.resolve(supabase.from('guest_testimonials').update({ sort_order: g.sort_order }).eq('id', g.id)
          .then(({ error }) => ({ error: error ? { message: error.message } : null }))),
      );
    }
    for (const c of curated) {
      updates.push(
        Promise.resolve(supabase.from('testimonials').update({ sort_order: c.sort_order }).eq('id', c.id)
          .then(({ error }) => ({ error: error ? { message: error.message } : null }))),
      );
    }
    const results = await Promise.all(updates);
    const firstErr = results.find((r) => r.error);
    if (firstErr?.error) return { error: firstErr.error.message };
    await load();
    return { error: null };
  }, [load]);

  const deleteRow = useCallback(async (row: LiveTestimonialRow) => {
    const { error } = await supabase.from(row.table).delete().eq('id', row.id);
    if (error) return { error: error.message };
    await load();
    return { error: null };
  }, [load]);

  return { live, loading, error, reorder, deleteRow, reload: load };
}

export async function uploadGuestMedia(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('guest-memories').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return { url: null, error: error.message };
  const { data: pub } = supabase.storage.from('guest-memories').getPublicUrl(path);
  return { url: pub.publicUrl, error: null };
}
