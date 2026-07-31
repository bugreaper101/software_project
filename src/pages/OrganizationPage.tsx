import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Trash2, Shield, Crown, User, Mail, Loader2, Check, X, ArrowLeft, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { TeamMember, UserRole } from '@/types/database';
import type { Route } from '@/App';

const ROLE_META: Record<UserRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-gold-300 border-gold-500/40 bg-gold-500/10' },
  manager: { label: 'Manager', icon: Shield, color: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
  staff: { label: 'Staff', icon: User, color: 'text-ink-200 border-white/15 bg-white/5' },
  guest: { label: 'Guest', icon: User, color: 'text-ink-400 border-white/10 bg-white/5' },
};

export function OrganizationPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { isAdmin } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // invite form
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('staff');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke('team', { method: 'GET' });
    if (error) { setError(error.message); setLoading(false); return; }
    setTeam((data?.team ?? []) as TeamMember[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setFeedback(null);
    const { error } = await supabase.functions.invoke('team', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), role },
    });
    if (error) {
      setFeedback({ type: 'err', text: error.message });
    } else {
      setFeedback({ type: 'ok', text: `${email} invited as ${role}.` });
      setEmail('');
      await load();
    }
    setBusy(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const startEdit = (m: TeamMember) => { setEditingId(m.id); setEditRole(m.role); };

  const saveEdit = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke(`team?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { role: editRole },
    });
    if (!error) { setEditingId(null); await load(); }
    setBusy(false);
  };

  const remove = async (id: string, em: string) => {
    if (!confirm(`Remove ${em} from the team? They will lose all access.`)) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke(`team?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!error) await load();
    setBusy(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-28 section-pad flex items-center">
        <div className="max-w-md mx-auto text-center">
          <Shield className="mx-auto text-wine-500 mb-6" size={48} />
          <h1 className="font-serif text-3xl text-cream-50">Admin access required</h1>
          <p className="mt-3 text-ink-300">This page is only available to organization admins.</p>
          <button onClick={() => onNavigate({ name: 'home' })} className="btn-gold mt-8">Back to site</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 section-pad">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => onNavigate({ name: 'home' })} className="inline-flex items-center gap-2 text-xs uppercase tracking-widest2 text-ink-300 hover:text-gold-300 transition-colors mb-8">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="text-gold-300" size={28} />
          <p className="eyebrow eyebrow-left">Admin Only</p>
        </div>
        <h1 className="heading-lg text-cream-50">Organization</h1>
        <p className="text-ink-300 mt-3 mb-12 max-w-xl">
          Manage your team. Invite members by email and assign roles. When a member
          signs up with their invited email, they automatically receive their role.
        </p>

        {/* Invite card */}
        <div className="glass rounded-2xl p-6 mb-10">
          <h2 className="font-serif text-xl text-cream-50 mb-1">Invite a team member</h2>
          <p className="text-sm text-ink-400 mb-5">They'll appear as "invited" until they create an account with this email.</p>
          <form onSubmit={invite} className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
            <div>
              <label className="label-field" htmlFor="inv-email">Email</label>
              <input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="teammate@example.com" />
            </div>
            <div>
              <label className="label-field" htmlFor="inv-role">Role</label>
              <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input-field min-w-[140px]">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={busy} className="btn-gold w-full sm:w-auto">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Invite
              </button>
            </div>
          </form>
          {feedback && (
            <div className={`mt-4 flex items-center gap-2 text-sm animate-fade-in ${feedback.type === 'ok' ? 'text-gold-300' : 'text-red-300'}`}>
              {feedback.type === 'ok' ? <Check size={16} /> : <X size={16} />} {feedback.text}
            </div>
          )}
        </div>

        {/* Team list */}
        <h2 className="font-serif text-xl text-cream-50 mb-4">Team members</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-6 text-red-300 text-sm">{error}</div>
        ) : team.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-ink-400">No team members yet. Invite your first member above.</div>
        ) : (
          <div className="space-y-3">
            {team.map((m) => {
              const meta = ROLE_META[m.role];
              const RoleIcon = meta.icon;
              return (
                <div key={m.id} className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="grid place-items-center h-11 w-11 rounded-full bg-gold-500/10 text-gold-300 font-serif text-lg">
                      {m.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-cream-50">{m.email}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest2 rounded-full px-2 py-0.5 border ${meta.color}`}>
                          <RoleIcon size={10} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 mt-1 flex items-center gap-2">
                        <Mail size={11} />
                        {m.status === 'active' ? 'Active — has signed in' : m.status === 'invited' ? 'Invited — awaiting sign-up' : 'Revoked'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === m.id ? (
                      <>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="input-field !py-1.5 !text-sm min-w-[120px]">
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => saveEdit(m.id)} disabled={busy} className="grid place-items-center h-9 w-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="grid place-items-center h-9 w-9 rounded-full bg-white/5 border border-white/10 text-ink-300 hover:text-cream-50 transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(m)} className="text-xs uppercase tracking-widest2 text-ink-200 hover:text-gold-300 transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-gold-500/40">
                          Change role
                        </button>
                        <button onClick={() => remove(m.id, m.email)} disabled={busy} className="grid place-items-center h-9 w-9 rounded-full bg-wine-500/15 border border-wine-500/30 text-red-300 hover:bg-wine-500/25 transition-colors" aria-label="Remove">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Role legend */}
        <div className="mt-10 glass rounded-2xl p-6">
          <h3 className="text-xs uppercase tracking-widest2 text-gold-300 mb-4">Role permissions</h3>
          <ul className="space-y-3 text-sm text-ink-200">
            <li className="flex gap-3"><Crown size={16} className="text-gold-300 mt-0.5 shrink-0" /> <span><b className="text-cream-50">Admin</b> — Full control. Edit all content, manage reservations, invite and remove team members, assign roles.</span></li>
            <li className="flex gap-3"><Shield size={16} className="text-blue-300 mt-0.5 shrink-0" /> <span><b className="text-cream-50">Manager</b> — Edit content and manage reservations. Cannot manage the team.</span></li>
            <li className="flex gap-3"><User size={16} className="text-ink-200 mt-0.5 shrink-0" /> <span><b className="text-cream-50">Staff</b> — Manage reservations and view the team roster.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
