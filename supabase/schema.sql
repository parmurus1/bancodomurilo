-- Banco do Murilo — estrutura do banco de dados no Supabase.
-- Rode este arquivo inteiro uma vez em: Supabase → SQL Editor → New query → Run.

-- Cada usuário tem um documento com todos os seus dados (lançamentos, potes, cartões...).
-- "version" serve para detectar quando dois aparelhos salvaram ao mesmo tempo.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  version    bigint not null default 1,
  updated_at timestamptz not null default now()
);

-- Segurança: cada pessoa só enxerga e altera os próprios dados.
alter table public.user_data enable row level security;

drop policy if exists "ler os próprios dados" on public.user_data;
create policy "ler os próprios dados" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "criar os próprios dados" on public.user_data;
create policy "criar os próprios dados" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "atualizar os próprios dados" on public.user_data;
create policy "atualizar os próprios dados" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "apagar os próprios dados" on public.user_data;
create policy "apagar os próprios dados" on public.user_data
  for delete using (auth.uid() = user_id);

-- Tempo real: quando você salva no celular, o PC aberto atualiza sozinho.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_data'
  ) then
    alter publication supabase_realtime add table public.user_data;
  end if;
end $$;
