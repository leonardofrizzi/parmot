-- =============================================
-- SOFT DELETE - Exclusão de contas
-- =============================================

-- Adicionar colunas de soft delete na tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;

-- Adicionar colunas de soft delete na tabela profissionais
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT FALSE;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;
