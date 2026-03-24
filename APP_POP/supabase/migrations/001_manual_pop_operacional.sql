create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('ADMIN_POP', 'CONSULTA_POP')),
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categorias_pop (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pop_itens (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null,
  subcategoria text,
  criticidade text not null check (criticidade in ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  status text not null check (status in ('RASCUNHO', 'PUBLICADO', 'INATIVO')),
  palavras_chave text,
  o_que_e text not null,
  principais_riscos text not null,
  principais_evidencias text not null,
  principais_causas text not null,
  procedimento_agente text not null,
  observacoes text,
  imagem_capa_url text,
  criado_por uuid references public.usuarios_sistema(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pop_imagens (
  id uuid primary key default gen_random_uuid(),
  pop_id uuid not null references public.pop_itens(id) on delete cascade,
  storage_path text not null unique,
  public_url text,
  legenda text,
  ordem integer not null default 1 check (ordem > 0),
  is_capa boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auditoria_pop (
  id uuid primary key default gen_random_uuid(),
  pop_id uuid references public.pop_itens(id) on delete cascade,
  usuario_id uuid references public.usuarios_sistema(id),
  acao text not null,
  detalhes jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_usuarios_sistema_auth_user_id on public.usuarios_sistema(auth_user_id);
create index if not exists idx_usuarios_sistema_perfil on public.usuarios_sistema(perfil);
create index if not exists idx_pop_itens_status on public.pop_itens(status);
create index if not exists idx_pop_itens_categoria on public.pop_itens(categoria);
create index if not exists idx_pop_itens_criticidade on public.pop_itens(criticidade);
create index if not exists idx_pop_itens_titulo_trgm on public.pop_itens using gin (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(palavras_chave, '') || ' ' || coalesce(categoria, '')));
create index if not exists idx_pop_imagens_pop_id on public.pop_imagens(pop_id);
create index if not exists idx_auditoria_pop_pop_id on public.auditoria_pop(pop_id);
create unique index if not exists idx_pop_imagens_capa_unica on public.pop_imagens(pop_id) where is_capa = true;

create trigger trg_usuarios_sistema_updated_at
before update on public.usuarios_sistema
for each row
execute function public.handle_updated_at();

create trigger trg_categorias_pop_updated_at
before update on public.categorias_pop
for each row
execute function public.handle_updated_at();

create trigger trg_pop_itens_updated_at
before update on public.pop_itens
for each row
execute function public.handle_updated_at();

create or replace function public.current_system_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.usuarios_sistema
  where auth_user_id = auth.uid()
    and ativo = true
  limit 1;
$$;

create or replace function public.current_system_user_profile()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select perfil
  from public.usuarios_sistema
  where auth_user_id = auth.uid()
    and ativo = true
  limit 1;
$$;

create or replace function public.is_admin_pop()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_system_user_profile() = 'ADMIN_POP', false);
$$;

create or replace function public.is_consulta_pop()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_system_user_profile() = 'CONSULTA_POP', false);
$$;

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_perfil text;
begin
  v_nome := coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1));
  v_perfil := coalesce(
    new.raw_user_meta_data ->> 'perfil',
    (
      select us.perfil
      from public.usuarios_sistema us
      where us.auth_user_id = new.id
      limit 1
    ),
    'CONSULTA_POP'
  );

  insert into public.usuarios_sistema (auth_user_id, nome, email, perfil, ativo)
  values (new.id, v_nome, new.email, v_perfil, true)
  on conflict (auth_user_id) do update
    set nome = excluded.nome,
        email = excluded.email,
        perfil = excluded.perfil,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists trg_sync_auth_user_profile on auth.users;
create trigger trg_sync_auth_user_profile
after insert or update on auth.users
for each row
execute function public.sync_auth_user_profile();

create or replace function public.assign_profile_to_user(
  p_email text,
  p_perfil text default 'CONSULTA_POP',
  p_nome text default null
)
returns public.usuarios_sistema
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_id uuid;
  v_result public.usuarios_sistema;
begin
  if p_perfil not in ('ADMIN_POP', 'CONSULTA_POP') then
    raise exception 'Perfil inválido: %', p_perfil;
  end if;

  select id into v_auth_id
  from auth.users
  where email = p_email
  limit 1;

  if v_auth_id is null then
    raise exception 'Usuário auth não encontrado para o email %', p_email;
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'nome', coalesce(p_nome, split_part(p_email, '@', 1)),
    'perfil', p_perfil
  )
  where id = v_auth_id;

  insert into public.usuarios_sistema (auth_user_id, nome, email, perfil, ativo)
  values (v_auth_id, coalesce(p_nome, split_part(p_email, '@', 1)), p_email, p_perfil, true)
  on conflict (auth_user_id) do update
    set nome = coalesce(p_nome, public.usuarios_sistema.nome),
        email = excluded.email,
        perfil = excluded.perfil,
        ativo = true,
        updated_at = timezone('utc', now())
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.registrar_auditoria_pop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
begin
  v_usuario_id := public.current_system_user_id();

  insert into public.auditoria_pop (pop_id, usuario_id, acao, detalhes)
  values (
    case when tg_op = 'DELETE' then null else coalesce(new.id, old.id) end,
    v_usuario_id,
    tg_op,
    case
      when tg_op = 'DELETE' then jsonb_build_object('before', to_jsonb(old))
      when tg_op = 'INSERT' then jsonb_build_object('after', to_jsonb(new))
      else jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_auditoria_pop on public.pop_itens;
create trigger trg_auditoria_pop
after insert or update or delete on public.pop_itens
for each row
execute function public.registrar_auditoria_pop();

alter table public.usuarios_sistema enable row level security;
alter table public.categorias_pop enable row level security;
alter table public.pop_itens enable row level security;
alter table public.pop_imagens enable row level security;
alter table public.auditoria_pop enable row level security;

drop policy if exists "usuarios_admin_all" on public.usuarios_sistema;
create policy "usuarios_admin_all"
on public.usuarios_sistema
for all
to authenticated
using (public.is_admin_pop())
with check (public.is_admin_pop());

drop policy if exists "usuarios_select_self" on public.usuarios_sistema;
create policy "usuarios_select_self"
on public.usuarios_sistema
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "categorias_admin_all" on public.categorias_pop;
create policy "categorias_admin_all"
on public.categorias_pop
for all
to authenticated
using (public.is_admin_pop())
with check (public.is_admin_pop());

drop policy if exists "categorias_consulta_select" on public.categorias_pop;
create policy "categorias_consulta_select"
on public.categorias_pop
for select
to authenticated
using (
  public.is_admin_pop()
  or ((public.is_consulta_pop() or public.is_admin_pop()) and ativo = true)
);

drop policy if exists "pop_itens_admin_all" on public.pop_itens;
create policy "pop_itens_admin_all"
on public.pop_itens
for all
to authenticated
using (public.is_admin_pop())
with check (public.is_admin_pop());

drop policy if exists "pop_itens_consulta_publicados" on public.pop_itens;
create policy "pop_itens_consulta_publicados"
on public.pop_itens
for select
to authenticated
using (
  public.is_admin_pop()
  or ((public.is_consulta_pop() or public.is_admin_pop()) and status = 'PUBLICADO')
);

drop policy if exists "pop_imagens_admin_all" on public.pop_imagens;
create policy "pop_imagens_admin_all"
on public.pop_imagens
for all
to authenticated
using (public.is_admin_pop())
with check (public.is_admin_pop());

drop policy if exists "pop_imagens_consulta_publicadas" on public.pop_imagens;
create policy "pop_imagens_consulta_publicadas"
on public.pop_imagens
for select
to authenticated
using (
  public.is_admin_pop()
  or exists (
    select 1
    from public.pop_itens p
    where p.id = pop_imagens.pop_id
      and p.status = 'PUBLICADO'
      and (public.is_consulta_pop() or public.is_admin_pop())
  )
);

drop policy if exists "auditoria_admin_select" on public.auditoria_pop;
create policy "auditoria_admin_select"
on public.auditoria_pop
for select
to authenticated
using (public.is_admin_pop());

drop policy if exists "auditoria_admin_insert" on public.auditoria_pop;
create policy "auditoria_admin_insert"
on public.auditoria_pop
for insert
to authenticated
with check (public.is_admin_pop());

insert into storage.buckets (id, name, public)
values ('pop-imagens', 'pop-imagens', false)
on conflict (id) do nothing;

drop policy if exists "storage_admin_read_pop_imagens" on storage.objects;
create policy "storage_admin_read_pop_imagens"
on storage.objects
for select
to authenticated
using (bucket_id = 'pop-imagens' and public.is_admin_pop());

drop policy if exists "storage_consulta_read_pop_imagens" on storage.objects;
create policy "storage_consulta_read_pop_imagens"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pop-imagens'
  and (
    public.is_admin_pop()
    or exists (
      select 1
      from public.pop_imagens pi
      join public.pop_itens p on p.id = pi.pop_id
      where pi.storage_path = storage.objects.name
        and p.status = 'PUBLICADO'
        and (public.is_consulta_pop() or public.is_admin_pop())
    )
  )
);

drop policy if exists "storage_admin_insert_pop_imagens" on storage.objects;
create policy "storage_admin_insert_pop_imagens"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pop-imagens' and public.is_admin_pop());

drop policy if exists "storage_admin_update_pop_imagens" on storage.objects;
create policy "storage_admin_update_pop_imagens"
on storage.objects
for update
to authenticated
using (bucket_id = 'pop-imagens' and public.is_admin_pop())
with check (bucket_id = 'pop-imagens' and public.is_admin_pop());

drop policy if exists "storage_admin_delete_pop_imagens" on storage.objects;
create policy "storage_admin_delete_pop_imagens"
on storage.objects
for delete
to authenticated
using (bucket_id = 'pop-imagens' and public.is_admin_pop());
