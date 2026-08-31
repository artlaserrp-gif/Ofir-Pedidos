-- ========================================================
-- OFIR PEDIDOS - Migração: rastreamento de entregador
-- Rode isso no SQL Editor do Supabase DEPOIS do schema.sql original
-- (se for uma loja já em produção, não afeta pedidos existentes)
-- ========================================================

-- Token público para a página de rastreio do entregador (sem precisar de login)
alter table pedidos add column if not exists rastreio_token uuid;
create index if not exists idx_pedidos_rastreio_token on pedidos(rastreio_token);

-- Última posição conhecida de cada entregador (um registro por entregador, sobrescrito a cada atualização)
create table if not exists posicoes_entregador (
  entregador_id uuid primary key references entregadores(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  atualizado_em timestamptz default now()
);

alter table posicoes_entregador enable row level security;
create policy "bloquear_anon_posicoes_entregador" on posicoes_entregador for all using (false);
