# Manual POP Operacional

Aplicação web responsiva, mobile-first e pronta para evolução futura para cadastro, consulta e padronização de POPs operacionais em ambiente ferroviário.

## Stack

- React + Vite
- Supabase Auth
- PostgreSQL no Supabase
- Supabase Storage
- Edge Function para criação administrativa de usuários

## Perfis

- `ADMIN_POP`: gerencia POPs, categorias, usuários e imagens
- `CONSULTA_POP`: consulta apenas POPs publicados

## Estrutura do projeto

```text
.
├─ src/
│  ├─ components/
│  ├─ contexts/
│  ├─ lib/
│  ├─ pages/
│  └─ services/
├─ supabase/
│  ├─ functions/admin-create-user/
│  ├─ migrations/
│  └─ seed.sql
├─ .env.example
├─ package.json
└─ README.md
```

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir de `.env.example`.

3. Preencha:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_STORAGE_BUCKET=pop-imagens
VITE_APP_NAME=Manual POP Operacional
```

4. Rode o projeto:

```bash
npm run dev
```

## Provisionamento do Supabase

### Banco e RLS

1. Execute [`supabase/migrations/001_manual_pop_operacional.sql`](/c:/Users/usuario/Desktop/pop_app/supabase/migrations/001_manual_pop_operacional.sql) no SQL Editor do Supabase.
2. Execute [`supabase/seed.sql`](/c:/Users/usuario/Desktop/pop_app/supabase/seed.sql) para popular categorias e 4 POPs iniciais.

### Primeira conta administradora

Crie um usuário no Supabase Auth e depois associe o perfil administrativo:

```sql
select public.assign_profile_to_user(
  'admin@empresa.com',
  'ADMIN_POP',
  'Administrador POP'
);
```

### Edge Function para criação de usuários

Publique a função [`supabase/functions/admin-create-user/index.ts`](/c:/Users/usuario/Desktop/pop_app/supabase/functions/admin-create-user/index.ts):

```bash
supabase functions deploy admin-create-user
```

Garanta que o projeto tenha as variáveis padrão do Supabase disponíveis para a function, especialmente `SUPABASE_SERVICE_ROLE_KEY`.

## Regras de segurança implementadas

- RLS habilitado em todas as tabelas operacionais
- `ADMIN_POP` com `select/insert/update/delete`
- `CONSULTA_POP` com `select` apenas em POPs publicados e imagens vinculadas
- gestão de usuários restrita ao perfil administrativo
- bucket `pop-imagens` privado com leitura via URL assinada
- sincronização automática entre `auth.users` e `usuarios_sistema`

## Funcionalidades entregues

- Login com redirecionamento por perfil
- Dashboard administrativo
- CRUD de categorias
- Gestão de usuários com Edge Function
- Lista e edição de POPs
- Upload de múltiplas imagens com legenda, ordem e capa
- Tela de consulta otimizada para celular corporativo
- Tela de detalhe com blocos operacionais
- Loading, tratamento de erro e estados vazios

## Seed incluído

O seed entrega os seguintes POPs publicados:

- Desengate entre vagões
- Cabos jumper
- Buzina da locomotiva
- AMV

As imagens ficam com placeholder visual até que imagens reais sejam enviadas pelo painel administrativo.

## Deploy

### Frontend

Pode ser publicado em Vercel, Netlify ou outro host estático:

```bash
npm run build
```

### Vercel

Arquivo de configuracao incluido em `vercel.json`.

Use estas definicoes no projeto da Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variaveis de ambiente necessarias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`
- `VITE_APP_NAME`

As rotas SPA como `/admin`, `/app` e `/app/pop/:id` ficam cobertas pelo rewrite para `index.html`.

### Netlify

Arquivo de configuração incluído em [netlify.toml](/c:/Users/usuario/Desktop/pop_app/netlify.toml).

Use estas definições no painel do Netlify:

- Build command: `npm run build`
- Publish directory: `dist`

Variáveis de ambiente necessárias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`
- `VITE_APP_NAME`

O redirect SPA já está configurado para permitir acesso direto a rotas como `/admin`, `/app` e `/app/pop/:id`.

### Supabase

- banco: migration SQL
- storage: bucket e policies já incluídos na migration
- auth: usar provedores padrão por email/senha
- functions: publicar `admin-create-user`

## Evolução futura sugerida

- versionamento formal de POP
- trilha de leitura/estudo por agente
- anexos complementares em PDF
- dashboards de uso e busca
- fluxo de revisão/aprovação antes da publicação
