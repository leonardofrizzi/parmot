-- Adicionar coluna profissional_contratado_id na tabela solicitacoes
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS profissional_contratado_id UUID REFERENCES profissionais(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_profissional_contratado ON solicitacoes(profissional_contratado_id);
