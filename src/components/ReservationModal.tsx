import { useState, type FormEvent } from 'react';
import { Calendar, Clock, Users, Check, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/context/AuthContext';

interface ReservationModalProps {
  open: boolean;
  onClose: () => void;
}

const times = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

export function ReservationModal({ open, onClose }: ReservationModalProps) {
  const { create } = useReservations();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', email: user?.email ?? '', phone: '',
    party_size: 2, reservation_date: '', reservation_time: '19:00',
    special_requests: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorText('');
    const { error } = await create({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      party_size: Number(form.party_size),
      reservation_date: form.reservation_date,
      reservation_time: form.reservation_time,
      special_requests: form.special_requests || null,
    });
    if (error) {
      setStatus('error');
      setErrorText(error);
      return;
    }
    setStatus('sent');
    setForm({ name: '', email: user?.email ?? '', phone: '', party_size: 2, reservation_date: '', reservation_time: '19:00', special_requests: '' });
    setTimeout(() => { onClose(); setStatus('idle'); }, 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Reserve a Table" description="We look forward to hosting you." size="md">
      {status === 'sent' ? (
        <div className="text-center py-10 animate-scale-in">
          <div className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-gold-500/15 text-gold-300 mb-5">
            <Check size={32} />
          </div>
          <h3 className="font-serif text-2xl text-cream-50">Reservation Requested</h3>
          <p className="mt-3 text-ink-300 text-sm">
            We've received your booking and will confirm by email shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="r-name">Full name</label>
              <input id="r-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="label-field" htmlFor="r-email">Email</label>
              <input id="r-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="r-phone">Phone (optional)</label>
            <input id="r-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1 (212) 555-0148" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field" htmlFor="r-date">Date</label>
              <input id="r-date" type="date" required min={today} value={form.reservation_date} onChange={(e) => setForm({ ...form, reservation_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label-field" htmlFor="r-time">Time</label>
              <select id="r-time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} className="input-field">
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field" htmlFor="r-size">Party size</label>
              <select id="r-size" value={form.party_size} onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })} className="input-field">
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'guest' : 'guests'}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="r-req">Special requests (optional)</label>
            <textarea id="r-req" rows={3} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="input-field resize-none" placeholder="Dietary needs, celebrations, seating preferences…" />
          </div>

          {status === 'error' && (
            <div className="rounded-xl bg-wine-500/15 border border-wine-500/40 px-4 py-3 text-sm text-red-300">
              {errorText || 'Something went wrong. Please try again.'}
            </div>
          )}

          <button type="submit" disabled={status === 'sending'} className="btn-gold w-full btn-gold-lg">
            {status === 'sending' ? (<><Loader2 size={18} className="animate-spin" /> Requesting…</>) : (
              <><Calendar size={18} /> Request Reservation</>
            )}
          </button>
          <p className="text-center text-xs text-ink-400">
            <Clock size={12} className="inline mr-1" /> We'll confirm your table by email.
          </p>
        </form>
      )}
    </Modal>
  );
}
