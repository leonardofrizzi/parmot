-- ================================================
-- MIGRAÇÃO - PERFIL ÚNICO (DUAL)
-- ================================================
-- Permite que usuários sejam cliente E profissional
-- usando o mesmo email como identificador
-- ================================================

-- Adicionar campo para identificar se cliente também é profissional
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES profissionais(id);

-- Adicionar campo para identificar se profissional também é cliente
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_clientes_profissional_id ON clientes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_cliente_id ON profissionais(cliente_id);

-- ================================================
-- FIM DA MIGRAÇÃO
-- ================================================
