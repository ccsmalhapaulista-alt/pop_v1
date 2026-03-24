import { supabase } from '../lib/supabaseClient';

export async function fetchUsers() {
  const { data, error } = await supabase.from('usuarios_sistema').select('*').order('nome');
  if (error) throw error;
  return data ?? [];
}

export async function updateUserProfile(id, payload) {
  const { data, error } = await supabase.from('usuarios_sistema').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function createManagedUser(payload) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
