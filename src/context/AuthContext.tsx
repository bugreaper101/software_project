import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  profileName: string | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function roleFromUser(user: User | null): UserRole {
  if (!user) return 'guest';
  const role = user.app_metadata?.role as string | undefined;
  if (role === 'admin' || role === 'manager' || role === 'staff') return role;
  return 'guest';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession);
      setLoading(false);
      // Fetch profile name asynchronously (avoid awaiting inside the callback)
      (async () => {
        if (!newSession?.user) {
          setProfileName(null);
          return;
        }
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newSession.user.id)
          .maybeSingle();
        setProfileName(prof?.full_name ?? null);
      })();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const role = roleFromUser(user);
    return {
      session,
      user,
      role,
      isAdmin: role === 'admin',
      isStaff: role === 'admin' || role === 'manager' || role === 'staff',
      loading,
      profileName,
      async signUp(email, password, fullName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName ?? '' } },
        });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async signOut() {
        await supabase.auth.signOut();
        setProfileName(null);
      },
    };
  }, [session, loading, profileName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('user already registered')) return 'An account with this email already exists.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('password should be at least')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return 'Something went wrong. Please try again.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
