-- ========================================================
-- OFIR PEDIDOS - Migração: cadastro self-service + bloqueio
-- Rode DEPOIS das migrações anteriores
-- ========================================================

alter table lojas add column if not exists trial_expira_em timestamptz default (now() + interval '14 days');
alter table lojas add column if not exists bloqueado_motivo text;
alter table lojas add column if not exists telefone text;

-- `plano` já existe no schema.sql (default 'trial'). Valores usados: 'trial', 'pago'.
-- `ativo` já existe (default true) — usado pelo painel admin pra bloquear na mão.
