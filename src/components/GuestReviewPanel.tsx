import { useMemo, useState } from 'react';
import {
  Check, X, Ban, Loader2, Star, Clock, CheckCircle2, XCircle,
  Ban as BanIcon, ChevronDown, ChevronUp, Image as ImageIcon,
  GripVertical, Trash2, RotateCcw, CalendarHeart, ListOrdered, Inbox,
} from 'lucide-react';
import {
  useAdminGuestTestimonials, useAdminAllTestimonials, useGuestMemoryMedia,
} from '@/hooks/useGuestTestimonials';
import type { GuestTestimonial, GuestTestimonialStatus } from '@/types/database';
import type { LiveTestimonialRow } from '@/hooks/useGuestTestimonials';

type SubTab = 'pending' | 'live' | 'rejected';

export function GuestReviewPanel() {
  const [tab, setTab] = useState<SubTab>('pending');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-serif text-2xl text-cream-50">Guest Reviews</h2>
      </div>

      <div className="flex gap-1 p-1 rounded-full bg-ink-800/80 border border-white/5 mb-8 w-fit">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')} icon={<Clock size={14} />}>
          Pending
        </TabBtn>
        <TabBtn active={tab === 'live'} onClick={() => setTab('live')} icon={<ListOrdered size={14} />}>
          Live Order
        </TabBtn>
        <TabBtn active={tab === 'rejected'} onClick={() => setTab('rejected')} icon={<BanIcon size={14} />}>
          Rejected / Blocked
        </TabBtn>
      </div>

      {tab === 'pending' && <PendingTab />}
      {tab === 'live' && <LiveOrderTab />}
      {tab === 'rejected' && <RejectedTab />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs uppercase tracking-widest2 transition-all ${
        active ? 'bg-gold-500 text-ink-950' : 'text-ink-300 hover:text-cream-100'
      }`}
    >
      {icon} {children}
    </button>
  );
}

/* ── Pending Tab ── */
function PendingTab() {
  const { pending, loading, error, setStatus } = useAdminGuestTestimonials();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const act = async (id: string, status: GuestTestimonialStatus) => {
    setBusyId(id);
    await setStatus(id, status);
    setBusyId(null);
  };

  if (loading) return <SkeletonList />;
  if (error) return <ErrorBox msg={error} />;
  if (pending.length === 0) return <EmptyState label="No submissions awaiting review." />;

  return (
    <div className="space-y-3">
      {pending.map((t) => (
        <PendingCard
          key={t.id}
          t={t}
          busy={busyId === t.id}
          expanded={expandedId === t.id}
          onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
          onApprove={() => act(t.id, 'approved')}
          onReject={() => act(t.id, 'rejected')}
          onBlock={() => act(t.id, 'blocked')}
        />
      ))}
    </div>
  );
}

function PendingCard({
  t, busy, expanded, onToggle, onApprove, onReject, onBlock,
}: {
  t: GuestTestimonial;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-serif text-lg text-cream-50">{t.author_name}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest2 rounded-full px-2.5 py-0.5 border bg-gold-500/15 text-gold-300 border-gold-500/30">
                <Clock size={10} /> Pending
              </span>
            </div>
            <div className="mt-1.5 flex gap-0.5">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={12} className="fill-gold-400 text-gold-400" />
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-300 line-clamp-2">"{t.quote}"</p>
            <p className="mt-2 text-[10px] text-ink-500">
              {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="shrink-0 grid place-items-center h-8 w-8 rounded-full border border-white/10 text-ink-300 hover:text-gold-300 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-4 animate-fade-in">
          <MediaStrip testimonialId={t.id} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={onApprove} disabled={busy} className="action-btn bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
            </button>
            <button onClick={onReject} disabled={busy} className="action-btn bg-wine-500/15 border-wine-500/30 text-red-300 hover:bg-wine-500/25">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Reject
            </button>
            <button onClick={onBlock} disabled={busy} className="action-btn bg-ink-700 border-white/10 text-ink-200 hover:bg-ink-600">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Live Order Tab (drag to reorder) ── */
function LiveOrderTab() {
  const { live, loading, error, reorder, deleteRow } = useAdminAllTestimonials();
  const [rows, setRows] = useState<LiveTestimonialRow[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffectSync(() => { setRows(live); }, [live]);

  const persistOrder = async (newRows: LiveTestimonialRow[]) => {
    setBusy(true);
    await reorder(newRows);
    setBusy(false);
  };

  const onDragStart = (i: number) => { setDragIndex(i); };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setOverIndex(i);
    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setRows(next);
    setDragIndex(i);
  };
  const onDrop = () => {
    setDragIndex(null);
    setOverIndex(null);
    persistOrder(rows);
  };

  const onDelete = async (row: LiveTestimonialRow) => {
    if (confirmDelete !== row.id) { setConfirmDelete(row.id); return; }
    setBusy(true);
    setConfirmDelete(null);
    await deleteRow(row);
    setBusy(false);
  };

  if (loading) return <SkeletonList />;
  if (error) return <ErrorBox msg={error} />;
  if (rows.length === 0) return <EmptyState label="No approved testimonials to arrange." />;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest2 text-gold-300/70 mb-4">
        Drag to reorder — this controls the display order on the homepage
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={`${row.table}-${row.id}`}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={onDrop}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            className={`glass rounded-xl p-4 flex items-center gap-4 transition-all ${
              dragIndex === i ? 'opacity-40' : ''
            } ${overIndex === i && dragIndex !== null ? 'border-gold-500/50' : ''}`}
          >
            <GripVertical className="shrink-0 text-ink-500 cursor-grab active:cursor-grabbing" size={18} />
            <span className="shrink-0 grid place-items-center h-7 w-7 rounded-full bg-ink-800 text-xs text-gold-300 font-serif">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base text-cream-50 truncate">{row.author}</h3>
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest2 rounded-full px-2 py-0.5 border ${
                  row.source === 'guest'
                    ? 'bg-gold-500/10 text-gold-300 border-gold-500/20'
                    : 'bg-ink-700 text-ink-300 border-white/10'
                }`}>
                  {row.source === 'guest' ? <CalendarHeart size={9} /> : <Star size={9} />} {row.source}
                </span>
              </div>
              <p className="text-xs text-ink-400 line-clamp-1 mt-0.5">"{row.quote}"</p>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: row.rating }).map((_, si) => (
                <Star key={si} size={10} className="fill-gold-400 text-gold-400" />
              ))}
            </div>
            <button
              onClick={() => onDelete(row)}
              disabled={busy}
              className={`shrink-0 grid place-items-center h-8 w-8 rounded-full transition-colors disabled:opacity-50 ${
                confirmDelete === row.id
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'border border-white/10 text-ink-400 hover:border-red-500/30 hover:text-red-300'
              }`}
              aria-label="Delete"
              title={confirmDelete === row.id ? 'Click again to confirm' : 'Delete'}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        ))}
      </div>
      {busy && <p className="mt-4 text-xs text-gold-300/70 animate-pulse">Saving order…</p>}
    </div>
  );
}

/* ── Rejected / Blocked Tab ── */
function RejectedTab() {
  const { reviewed, loading, error, setStatus, remove } = useAdminGuestTestimonials();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = reviewed.filter((t) => t.status === 'rejected' || t.status === 'blocked');

  const act = async (id: string, fn: () => Promise<{ error: string | null }>) => {
    setBusyId(id);
    await fn();
    setBusyId(null);
  };

  if (loading) return <SkeletonList />;
  if (error) return <ErrorBox msg={error} />;
  if (filtered.length === 0) return <EmptyState label="No rejected or blocked submissions." />;

  return (
    <div className="space-y-3">
      {filtered.map((t) => {
        const isBlocked = t.status === 'blocked';
        return (
          <div key={t.id} className="glass rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-serif text-lg text-cream-50">{t.author_name}</h3>
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest2 rounded-full px-2.5 py-0.5 border ${isBlocked ? 'bg-ink-700 text-ink-300 border-white/10' : 'bg-wine-500/15 text-red-300 border-wine-500/30'}`}>
                  {isBlocked ? <><BanIcon size={10} /> Blocked</> : <><XCircle size={10} /> Rejected</>}
                </span>
              </div>
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-gold-400 text-gold-400" />
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-300 line-clamp-2">"{t.quote}"</p>
              <p className="mt-2 text-[10px] text-ink-500">
                {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => act(t.id, () => setStatus(t.id, 'approved'))}
                disabled={busyId === t.id}
                className="action-btn bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                title="Re-approve — make visible on homepage"
              >
                {busyId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
              </button>
              <button
                onClick={() => act(t.id, () => setStatus(t.id, 'pending'))}
                disabled={busyId === t.id}
                className="action-btn bg-ink-700 border-white/10 text-ink-200 hover:bg-ink-600"
                title="Send back to pending review"
              >
                <RotateCcw size={12} /> Re-review
              </button>
              <button
                onClick={() => {
                  if (confirmDelete !== t.id) { setConfirmDelete(t.id); return; }
                  setConfirmDelete(null);
                  act(t.id, () => remove(t.id));
                }}
                disabled={busyId === t.id}
                className={`action-btn transition-colors ${
                  confirmDelete === t.id
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-transparent border-white/10 text-ink-400 hover:border-red-500/30 hover:text-red-300'
                }`}
                title={confirmDelete === t.id ? 'Click again to confirm' : 'Delete permanently'}
              >
                {busyId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Shared bits ── */
function MediaStrip({ testimonialId }: { testimonialId: string }) {
  const { media, loading } = useGuestMemoryMedia(testimonialId);
  const preview = useMemo(() => media.slice(0, 8), [media]);

  if (loading) return <div className="skeleton h-16 rounded-lg" />;
  if (media.length === 0) return <p className="text-xs text-ink-500">No media attached.</p>;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {preview.map((m) => (
        <div key={m.id} className="relative shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-ink-800">
          {m.media_type === 'image' ? (
            <img src={m.media_url} alt={m.caption ?? ''} className="h-full w-full object-cover" />
          ) : (
            <>
              <video src={m.media_url} className="h-full w-full object-cover" muted />
              <ImageIcon className="absolute inset-0 m-auto text-white/70" size={16} />
            </>
          )}
        </div>
      ))}
      {media.length > 8 && (
        <div className="shrink-0 h-16 w-16 rounded-lg bg-ink-800 grid place-items-center text-xs text-ink-400">
          +{media.length - 8}
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="glass rounded-2xl p-6 text-red-300 text-sm">{msg}</div>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Inbox className="mx-auto text-ink-400 mb-4" size={36} />
      <p className="text-ink-300">{label}</p>
    </div>
  );
}

/* Tiny effect wrapper to sync external data into local state */
import { useEffect } from 'react';
function useEffectSync(fn: () => void, deps: unknown[]) { useEffect(fn, deps); }
