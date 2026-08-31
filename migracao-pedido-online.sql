-- ========================================================
-- OFIR PEDIDOS - Migração: cardápio público (pedido direto do cliente)
-- ========================================================

alter table lojas add column if not exists slug text unique;

-- Preenche um slug simples pra lojas já existentes que ainda não têm
update lojas set slug = lower(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 4)
where slug is null;
