-- ========================================================
-- OFIR PEDIDOS - Migração: aceite automático de pedidos iFood
-- Rode DEPOIS do schema.sql e do migracao-rastreio.sql
-- ========================================================

alter table lojas add column if not exists aceitar_pedidos_automaticamente boolean default true;

-- Pedidos do iFood que aguardam aceite manual (quando o toggle está desligado)
-- entram com este status antes de virar "recebido".
-- Nenhuma mudança de schema adicional é necessária: 'pendente_aceite' é só
-- mais um valor de texto no campo `status` que já existe em `pedidos`.
