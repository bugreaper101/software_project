import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Reservation, ReservationStatus } from '@/types/database';

interface ReservationsState {
  all: Reservation[];   // staff view
  mine: Reservation[];  // logged-in guest view
  loading: boolean;
  error: string | null;
  reload: () => void;
  create: (input: Omit<Reservation, 'id' | 'status' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateStatus: (id: string, status: ReservationStatus) => Promise<{ error: string | null }>;
}

export function useReservations(): ReservationsState {
  const { user, isStaff } = useAuth();
  const [all, setAll] = useState<Reservation[]>([]);
  const [mine, setMine] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isStaff) {
        const { data, error: err } = await supabase
          .from('reservations')
          .select('*')
          .order('reservation_date', { ascending: false });
        if (err) throw err;
        setAll((data ?? []) as Reservation[]);
      }
      if (user) {
        const { data, error: err } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('reservation_date', { ascending: false });
        if (err) throw err;
        setMine((data ?? []) as Reservation[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [isStaff, user]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback<ReservationsState['create']>(async (input) => {
    const { data: userData } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = { ...input, status: 'pending' };
    if (userData.user) payload.user_id = userData.user.id;
    const { error: err } = await supabase.from('reservations').insert(payload);
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }, [load]);

  const updateStatus = useCallback<ReservationsState['updateStatus']>(async (id, status) => {
    const { error: err } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }, [load]);

  return { all, mine, loading, error, reload: load, create, updateStatus };
}
