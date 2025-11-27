-- EXECUTAR NO SUPABASE SQL EDITOR
-- Adiciona colunas para banir profissionais e clientes

-- ===============================
-- PROFISSIONAIS
-- ===============================

-- Coluna de banimento
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS banido BOOLEAN DEFAULT false;

-- Data do banimento
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS banido_em TIMESTAMP WITH TIME ZONE;

-- Motivo do banimento
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS motivo_banimento TEXT;

-- Índice para busca de banidos
CREATE INDEX IF NOT EXISTS idx_profissionais_banido ON profissionais(banido);

-- Comentários
COMMENT ON COLUMN profissionais.banido IS 'Se o profissional foi banido da plataforma';
COMMENT ON COLUMN profissionais.banido_em IS 'Data e hora do banimento';
COMMENT ON COLUMN profissionais.motivo_banimento IS 'Motivo do banimento';

-- ===============================
-- CLIENTES
-- ===============================

-- Coluna de banimento
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS banido BOOLEAN DEFAULT false;

-- Data do banimento
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS banido_em TIMESTAMP WITH TIME ZONE;

-- Motivo do banimento
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS motivo_banimento TEXT;

-- Índice para busca de banidos
CREATE INDEX IF NOT EXISTS idx_clientes_banido ON clientes(banido);

-- Comentários
COMMENT ON COLUMN clientes.banido IS 'Se o cliente foi banido da plataforma';
COMMENT ON COLUMN clientes.banido_em IS 'Data e hora do banimento';
COMMENT ON COLUMN clientes.motivo_banimento IS 'Motivo do banimento';

SELECT 'Colunas de banimento adicionadas em profissionais e clientes!' as resultado;
