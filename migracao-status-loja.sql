-- ========================================================
-- OFIR PEDIDOS - Migração: status da loja e tempos estimados
-- ========================================================

alter table lojas add column if not exists aberto_manual boolean default true;
alter table lojas add column if not exists tempo_estimado_balcao text default '20 a 30 min';
alter table lojas add column if not exists tempo_estimado_entrega text default '40 a 60 min';
