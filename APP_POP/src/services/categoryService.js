import { supabase } from '../lib/supabaseClient';

export async function fetchCategories() {
  const { data, error } = await supabase.from('categorias_pop').select('*').order('nome');
  if (error) throw error;
  return data ?? [];
}

export async function saveCategory(category) {
  const query = category.id
    ? supabase.from('categorias_pop').update(category).eq('id', category.id).select().single()
    : supabase.from('categorias_pop').insert(category).select().single();

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categorias_pop').delete().eq('id', id);
  if (error) throw error;
}
