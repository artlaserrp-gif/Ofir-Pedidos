-- ========================================================
-- OFIR PEDIDOS - Migração: impressão térmica
-- ========================================================

alter table lojas add column if not exists largura_papel_impressao text default '80mm'; -- '58mm' ou '80mm'
