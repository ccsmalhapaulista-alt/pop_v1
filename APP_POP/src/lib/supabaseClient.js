import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de deploy.'
    : '';

if (supabaseConfigError) {
  console.error(supabaseConfigError);
}

export const supabase = createClient(
  supabaseUrl ?? 'https://missing-supabase-project.invalid',
  supabaseAnonKey ?? 'missing-supabase-anon-key',
);

export const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'pop-imagens';

export function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach((key) => window.localStorage.removeItem(key));
}
