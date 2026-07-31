import { useMemo, useState, type ReactNode } from 'react';
import { Calendar, Mail, Phone, Users, Clock, Check, X, Loader2, Inbox, MessageSquareHeart } from 'lucide-react';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/context/AuthContext';
import { GuestReviewPanel } from '@/components/GuestReviewPanel';
import type { Reservation, ReservationStatus } from '@/types/database';
import type { Route } from '@/App';

interface ReservationsPageProps {
  onNavigate: (route: Route) => void;
}

const statusStyles: Record<ReservationStatus, string> = {
  pending: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  seated: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  completed: 'bg-ink-700 text-ink-200 border-white/10',
  cancelled: 'bg-wine-500/15 text-red-300 border-wine-500/30',
};

const statusOrder: ReservationStatus[] = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];

export function ReservationsPage({ onNavigate }: ReservationsPageProps) {
  const { all, mine, loading, updateStatus } = useReservations();
  const { isStaff } = useAuth();
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'reservations' | 'reviews'>('reservations');

  const list = isStaff ? all : mine;
  const filtered = filter === 'all' ? list : list.filter((r) => r.status === filter);
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.reservation_date.localeCompare(a.reservation_date)),
    [filtered],
  );

  const change = async (id: string, status: ReservationStatus) => {
    setBusyId(id);
    await updateStatus(id, status);
    setBusyId(null);
  };

  if (!isStaff && mine.length === 0) {
    return (
      <EmptyState
        title="No reservations yet"
        message="When you book a table, your reservations will appear here."
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 section-pad">
      <div className="max-w-5xl mx-auto">
        <p className="eyebrow eyebrow-left mb-4">{isStaff ? 'Staff View' : 'Your Bookings'}</p>
        <h1 className="heading-lg text-cream-50 mb-2">
          {isStaff ? 'Manage Reservations' : 'Your Reservations'}
        </h1>
        <p className="text-ink-300 mb-10">
          {isStaff ? 'Review and update the status of every booking.' : 'Your upcoming and past visits to Lumière.'}
        </p>

        {isStaff && (
          <div className="flex gap-1 p-1 rounded-full bg-ink-800/80 border border-white/5 mb-8 w-fit">
            <TabButton active={tab === 'reservations'} onClick={() => setTab('reservations')}>
              <Calendar size={14} /> Reservations
            </TabButton>
            <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
              <MessageSquareHeart size={14} /> Guest Reviews
            </TabButton>
          </div>
        )}

        {isStaff && tab === 'reviews' ? (
          <GuestReviewPanel />
        ) : (
          <>
            {isStaff && (
              <div className="flex flex-wrap gap-2 mb-8">
                <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
                {statusOrder.map((s) => (
                  <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </FilterChip>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Inbox className="mx-auto text-ink-400 mb-4" size={36} />
                <p className="text-ink-300">No reservations match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((r) => (
                  <ReservationRow key={r.id} r={r} isStaff={isStaff} busy={busyId === r.id} onChange={change} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReservationRow({ r, isStaff, busy, onChange }: {
  r: Reservation;
  isStaff: boolean;
  busy: boolean;
  onChange: (id: string, status: ReservationStatus) => void;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-serif text-xl text-cream-50">{r.name}</h3>
          <span className={`text-[10px] uppercase tracking-widest2 rounded-full px-2.5 py-0.5 border ${statusStyles[r.status]}`}>
            {r.status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-300">
          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gold-500" />
            {new Date(r.reservation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-gold-500" /> {r.reservation_time}</span>
          <span className="flex items-center gap-1.5"><Users size={14} className="text-gold-500" /> {r.party_size}</span>
          <span className="flex items-center gap-1.5"><Mail size={14} className="text-gold-500" /> {r.email}</span>
          {r.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-gold-500" /> {r.phone}</span>}
        </div>
        {r.special_requests && (
          <p className="mt-2 text-sm text-ink-400 italic">"{r.special_requests}"</p>
        )}
      </div>

      {isStaff && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {r.status !== 'confirmed' && (
            <button onClick={() => onChange(r.id, 'confirmed')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 text-xs uppercase tracking-widest2 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirm
            </button>
          )}
          {r.status !== 'seated' && r.status !== 'cancelled' && r.status !== 'completed' && (
            <button onClick={() => onChange(r.id, 'seated')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 px-3 py-1.5 text-xs uppercase tracking-widest2 hover:bg-blue-500/25 transition-colors disabled:opacity-50">
              Seat
            </button>
          )}
          {r.status !== 'completed' && r.status !== 'cancelled' && (
            <button onClick={() => onChange(r.id, 'completed')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-ink-700 border border-white/10 text-ink-200 px-3 py-1.5 text-xs uppercase tracking-widest2 hover:bg-ink-600 transition-colors disabled:opacity-50">
              Complete
            </button>
          )}
          {r.status !== 'cancelled' && (
            <button onClick={() => onChange(r.id, 'cancelled')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-wine-500/15 border border-wine-500/30 text-red-300 px-3 py-1.5 text-xs uppercase tracking-widest2 hover:bg-wine-500/25 transition-colors disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest2 transition-all ${
        active ? 'bg-gold-500 text-ink-950' : 'border border-white/10 text-ink-200 hover:border-gold-500/50'
      }`}
    >
      {children}
    </button>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs uppercase tracking-widest2 transition-all ${
        active ? 'bg-gold-500 text-ink-950' : 'text-ink-300 hover:text-cream-100'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, message, onNavigate }: { title: string; message: string; onNavigate: (r: Route) => void }) {
  return (
    <div className="min-h-screen pt-28 pb-20 section-pad flex items-center">
      <div className="max-w-md mx-auto text-center">
        <Calendar className="mx-auto text-gold-500/40 mb-6" size={48} />
        <h1 className="font-serif text-3xl text-cream-50">{title}</h1>
        <p className="mt-3 text-ink-300">{message}</p>
        <button onClick={() => onNavigate({ name: 'home' })} className="btn-gold mt-8">Book a Table</button>
      </div>
    </div>
  );
}


