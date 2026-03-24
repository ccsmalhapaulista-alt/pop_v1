import { supabase } from '../lib/supabaseClient';

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { data };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getLoggedUserProfile(authUserId) {
  if (!authUserId) return null;

  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
