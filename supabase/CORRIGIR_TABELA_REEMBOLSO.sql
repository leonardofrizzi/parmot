-- ================================================
-- CORREÇÃO DA TABELA solicitacoes_reembolso
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. Permitir cliente_id como NULL (para reembolsos automáticos onde pode não ter cliente vinculado)
ALTER TABLE solicitacoes_reembolso
ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. Adicionar coluna moedas_reembolsadas (quantidade efetivamente devolvida)
ALTER TABLE solicitacoes_reembolso
ADD COLUMN IF NOT EXISTS moedas_reembolsadas INTEGER DEFAULT 0;

-- 3. Adicionar coluna observacao_admin (para notas do admin ou sistema)
ALTER TABLE solicitacoes_reembolso
ADD COLUMN IF NOT EXISTS observacao_admin TEXT;

-- 4. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitacoes_reembolso'
ORDER BY ordinal_position;
