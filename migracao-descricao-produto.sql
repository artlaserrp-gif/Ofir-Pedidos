-- ========================================================
-- OFIR PEDIDOS - Migração: ingredientes/descrição do produto
-- ========================================================

alter table produtos add column if not exists descricao text;
