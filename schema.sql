-- ========================================================
-- OFIR PEDIDOS - Schema inicial (Supabase)
-- Cole isso no SQL Editor do Supabase e rode de uma vez
-- ========================================================

-- LOJAS (cada cliente do OFIR Pedidos é uma loja)
create table if not exists lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique not null,
  pin text not null,
  logo_url text,
  cor_tema text default '#F0B94F',
  plano text default 'trial', -- trial, basico, pro
  ativo boolean default true,
  -- credenciais iFood (preenchidas depois da homologação)
  ifood_merchant_id text,
  ifood_client_id text,
  ifood_client_secret text,
  ifood_access_token text,
  ifood_token_expires_at timestamptz,
  ifood_conectado boolean default false,
  created_at timestamptz default now()
);

-- USUÁRIOS / OPERADORES da loja (quem mexe no painel)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  nome text not null,
  cargo text default 'atendente', -- atendente, gerente
  pin text not null,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- PRODUTOS do cardápio/catálogo
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  nome text not null,
  categoria text,
  preco numeric(10,2) not null default 0,
  imagem_url text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ENTREGADORES (delivery próprio)
create table if not exists entregadores (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  nome text not null,
  telefone text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- PEDIDOS (o coração do sistema)
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  origem text not null default 'balcao', -- ifood, balcao, delivery_proprio
  ifood_order_id text, -- id do pedido no iFood, se vier de lá
  numero_pedido text not null, -- número sequencial exibido pro operador
  cliente_nome text,
  cliente_telefone text,
  tipo_entrega text default 'retirada', -- retirada, entrega
  endereco_entrega text,
  status text not null default 'recebido',
    -- recebido, preparo, pronto, saiu_entrega, concluido, cancelado
  forma_pagamento text,
  valor_itens numeric(10,2) default 0,
  valor_entrega numeric(10,2) default 0,
  valor_total numeric(10,2) default 0,
  observacoes text,
  entregador_id uuid references entregadores(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ITENS de cada pedido
create table if not exists pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  produto_id uuid references produtos(id),
  nome_produto text not null,
  quantidade int not null default 1,
  preco_unitario numeric(10,2) not null default 0,
  observacoes text,
  created_at timestamptz default now()
);

-- Sequência de número de pedido por loja (reinicia por dia é opcional, aqui é incremental)
create table if not exists loja_contadores (
  loja_id uuid primary key references lojas(id) on delete cascade,
  proximo_numero int default 1
);

-- Índices que importam pra performance do kanban
create index if not exists idx_pedidos_loja_status on pedidos(loja_id, status);
create index if not exists idx_pedidos_loja_created on pedidos(loja_id, created_at desc);

-- ========================================================
-- RLS - habilitado, acesso controlado via service role no backend
-- (mesmo padrão usado no FichaPonto e OFIR ERP)
-- ========================================================
alter table lojas enable row level security;
alter table usuarios enable row level security;
alter table produtos enable row level security;
alter table entregadores enable row level security;
alter table pedidos enable row level security;
alter table pedido_itens enable row level security;
alter table loja_contadores enable row level security;

-- Bloqueia acesso direto via chave anon; tudo passa pelas API routes com service role
create policy "bloquear_anon_lojas" on lojas for all using (false);
create policy "bloquear_anon_usuarios" on usuarios for all using (false);
create policy "bloquear_anon_produtos" on produtos for all using (false);
create policy "bloquear_anon_entregadores" on entregadores for all using (false);
create policy "bloquear_anon_pedidos" on pedidos for all using (false);
create policy "bloquear_anon_pedido_itens" on pedido_itens for all using (false);
create policy "bloquear_anon_loja_contadores" on loja_contadores for all using (false);
