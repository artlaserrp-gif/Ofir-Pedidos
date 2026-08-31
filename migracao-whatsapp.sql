-- ========================================================
-- OFIR PEDIDOS - Migração: notificações de status via WhatsApp
-- Rode DEPOIS das migrações anteriores
-- ========================================================

alter table lojas add column if not exists whatsapp_phone_number_id text;
alter table lojas add column if not exists whatsapp_access_token text;
alter table lojas add column if not exists whatsapp_notificacoes_ativas boolean default false;
