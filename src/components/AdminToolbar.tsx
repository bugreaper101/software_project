import { Pencil, Plus, X, Sparkles } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

/**
 * Floating toolbar shown to staff (admin/manager/staff) in the corner.
 * Toggles "edit mode" which reveals inline Edit/Add buttons across the site.
 */
export function AdminToolbar() {
  const { canEdit, editMode, setEditMode } = useAdmin();
  if (!canEdit) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      <button
        onClick={() => setEditMode(!editMode)}
        className={`group flex items-center gap-2.5 rounded-full px-5 py-3.5 shadow-2xl shadow-black/40 transition-all duration-300 ${
          editMode
            ? 'bg-gold-500 text-ink-950 hover:bg-gold-400'
            : 'glass-strong text-cream-50 hover:border-gold-500/60'
        }`}
      >
        {editMode ? (
          <>
            <X size={18} />
            <span className="text-sm uppercase tracking-widest2 font-medium">Done Editing</span>
          </>
        ) : (
          <>
            <Pencil size={18} className="text-gold-300 group-hover:text-gold-200" />
            <span className="text-sm uppercase tracking-widest2 font-medium">Edit Mode</span>
          </>
        )}
      </button>

      {editMode && (
        <div className="absolute bottom-full right-0 mb-3 glass-strong rounded-xl px-4 py-2.5 text-xs text-ink-200 whitespace-nowrap animate-fade-in flex items-center gap-2">
          <Sparkles size={13} className="text-gold-300" />
          Edit/Add buttons are now visible. Click them to change content.
        </div>
      )}
    </div>
  );
}

/**
 * Small inline Edit button shown over a piece of content when edit mode is on.
 */
export function InlineEditButton({ onClick, label = 'Edit' }: { onClick: () => void; label?: string }) {
  const { editMode } = useAdmin();
  if (!editMode) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/90 border border-gold-500/50 text-gold-300 px-3 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-gold-500 hover:text-ink-950 transition-all backdrop-blur-md"
    >
      <Pencil size={12} /> {label}
    </button>
  );
}

/**
 * Inline Add button — dashed pill, shows when edit mode is on.
 */
export function InlineAddButton({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
  const { editMode } = useAdmin();
  if (!editMode) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gold-500/50 text-gold-300 px-4 py-2 text-xs uppercase tracking-widest2 hover:bg-gold-500/10 hover:border-gold-500 transition-all"
    >
      <Plus size={14} /> {label}
    </button>
  );
}
