import { supabase, storageBucket } from '../lib/supabaseClient';
import { normalizeKeywords, normalizePositiveOrder, sanitizeSearchTerm } from '../lib/popUtils';

async function withSignedUrls(rows) {
  const paths = rows.flatMap((row) => (row.pop_imagens ?? []).map((image) => image.storage_path)).filter(Boolean);
  const uniquePaths = [...new Set(paths)];

  if (!uniquePaths.length) {
    return rows;
  }

  const { data, error } = await supabase.storage.from(storageBucket).createSignedUrls(uniquePaths, 3600);
  if (error) throw error;

  const urlMap = new Map(data.map((item) => [item.path, item.signedUrl]));

  return rows.map((row) => ({
    ...row,
    pop_imagens: (row.pop_imagens ?? []).map((image) => ({
      ...image,
      signed_url: urlMap.get(image.storage_path) ?? null,
    })),
  }));
}

export async function fetchDashboardStats() {
  const [popsResult, usersResult] = await Promise.all([
    supabase.from('pop_itens').select('status'),
    supabase.from('usuarios_sistema').select('id', { count: 'exact', head: true }).eq('ativo', true),
  ]);

  if (popsResult.error) throw popsResult.error;
  if (usersResult.error) throw usersResult.error;

  const rows = popsResult.data ?? [];
  return {
    totalPops: rows.length,
    totalPublicado: rows.filter((item) => item.status === 'PUBLICADO').length,
    totalRascunho: rows.filter((item) => item.status === 'RASCUNHO').length,
    totalUsuarios: usersResult.count ?? 0,
  };
}

export async function fetchPops(filters = {}, isAdmin = false) {
  let query = supabase
    .from('pop_itens')
    .select('*, pop_imagens(id, storage_path, public_url, legenda, ordem, is_capa)')
    .order('updated_at', { ascending: false });

  if (filters.search) {
    const searchTerm = sanitizeSearchTerm(filters.search);
    if (searchTerm) {
      query = query.or(`titulo.ilike.%${searchTerm}%,palavras_chave.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`);
    }
  }

  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria);
  }

  if (filters.status && isAdmin) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return withSignedUrls(data ?? []);
}

export async function fetchPopById(id) {
  const { data, error } = await supabase
    .from('pop_itens')
    .select('*, pop_imagens(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  const [row] = await withSignedUrls([data]);
  return row;
}

export async function savePop(pop, authProfileId) {
  const payload = {
    ...pop,
    palavras_chave: normalizeKeywords(pop.palavras_chave),
    criado_por: pop.criado_por ?? authProfileId,
  };

  const query = pop.id
    ? supabase.from('pop_itens').update(payload).eq('id', pop.id).select().single()
    : supabase.from('pop_itens').insert(payload).select().single();

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deletePop(id) {
  const { error } = await supabase.from('pop_itens').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadPopImage(popId, file, metadata = {}) {
  const extension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const storagePath = `${popId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  try {
    const { data, error } = await supabase
      .from('pop_imagens')
      .insert({
        pop_id: popId,
        storage_path: storagePath,
        public_url: null,
        legenda: metadata.legenda ?? null,
        ordem: normalizePositiveOrder(metadata.ordem),
        is_capa: metadata.is_capa ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: signedData, error: signedError } = await supabase.storage.from(storageBucket).createSignedUrl(storagePath, 3600);
    if (signedError) throw signedError;

    return { ...data, signed_url: signedData.signedUrl };
  } catch (error) {
    await supabase.storage.from(storageBucket).remove([storagePath]);
    throw error;
  }
}

export async function updatePopImage(imageId, payload) {
  const normalizedPayload = {
    ...payload,
    ...(Object.hasOwn(payload, 'ordem') ? { ordem: normalizePositiveOrder(payload.ordem) } : {}),
  };

  const { data, error } = await supabase.from('pop_imagens').update(normalizedPayload).eq('id', imageId).select().single();
  if (error) throw error;
  return data;
}

export async function deletePopImage(imageId, storagePath) {
  const dbResult = await supabase.from('pop_imagens').delete().eq('id', imageId);
  if (dbResult.error) throw dbResult.error;

  const storageResult = await supabase.storage.from(storageBucket).remove([storagePath]);
  if (storageResult.error) {
    throw new Error(`Imagem removida do cadastro, mas o arquivo no storage nao foi excluido: ${storageResult.error.message}`);
  }
}
