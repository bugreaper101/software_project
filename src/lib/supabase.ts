import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const missingConfigMessage = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.';

function createStubQuery() {
  const stub: any = {
    select: () => stub,
    eq: () => stub,
    order: () => stub,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    insert: () => stub,
    update: () => stub,
    delete: () => stub,
    upsert: () => stub,
    limit: () => stub,
    then: (onFulfilled: any) => Promise.resolve({ data: null, error: null }).then(onFulfilled),
    catch: (onRejected: any) => Promise.resolve({ data: null, error: null }).catch(onRejected),
  };
  return stub;
}

function createStubSupabase() {
  const query = createStubQuery();
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signUp: async () => ({ error: { message: missingConfigMessage } }),
      signInWithPassword: async () => ({ error: { message: missingConfigMessage } }),
      resetPasswordForEmail: async () => ({ error: { message: missingConfigMessage } }),
      signOut: async () => ({ error: { message: missingConfigMessage } }),
    },
    from: () => query,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: missingConfigMessage } }),
        getPublicUrl: () => ({ data: null, error: { message: missingConfigMessage } }),
      }),
    },
    functions: {
      invoke: async () => ({ data: null, error: { message: missingConfigMessage } }),
    },
  } as any;
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createStubSupabase();
