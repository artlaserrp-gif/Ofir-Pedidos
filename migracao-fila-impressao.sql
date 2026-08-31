-- ========================================================
-- OFIR PEDIDOS - Migração: fila de impressão (agente local, sem mensalidade)
-- ========================================================

alter table lojas add column if not exists impressao_api_token text;
alter table lojas add column if not exists impressao_automatica_ativa boolean default false;

create table if not exists fila_impressao (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  pedido_id uuid references pedidos(id) on delete cascade,
  status text not null default 'pendente', -- pendente, impresso, erro, expirado
  tentativas int default 0,
  erro_mensagem text,
  criado_em timestamptz default now(),
  impresso_em timestamptz
);

create index if not exists idx_fila_impressao_loja_status on fila_impressao(loja_id, status);

alter table fila_impressao enable row level security;
create policy "bloquear_anon_fila_impressao" on fila_impressao for all using (false);
