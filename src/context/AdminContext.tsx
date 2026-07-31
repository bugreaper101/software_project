import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export type EntityType =
  | 'settings'
  | 'menu_category'
  | 'menu_item'
  | 'menu_item_image'
  | 'event'
  | 'gallery'
  | 'testimonial';

interface EditorState {
  type: EntityType;
  id: string | null; // null = creating new
  categoryId?: string | null; // for menu items: preselected category
  menuItemId?: string | null; // for menu item images: parent menu item
}

interface AdminContextValue {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  canEdit: boolean;
  editor: EditorState | null;
  openEditor: (state: EditorState) => void;
  closeEditor: () => void;
}

const Ctx = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isStaff } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);

  return (
    <Ctx.Provider
      value={{
        editMode,
        setEditMode,
        canEdit: isStaff,
        editor,
        openEditor: setEditor,
        closeEditor: () => setEditor(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
