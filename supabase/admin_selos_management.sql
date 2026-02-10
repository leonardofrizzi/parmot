-- ============================================================
-- Migration: Sistema de Selos gerenciado pelo Admin
-- ============================================================

-- 1. Tabela de tipos de selo (customizáveis pelo admin)
CREATE TABLE IF NOT EXISTS tipos_selo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(50) DEFAULT 'amber',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE tipos_selo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_selo_public_read" ON tipos_selo FOR SELECT USING (true);
CREATE POLICY "tipos_selo_public_all" ON tipos_selo FOR ALL USING (true);

-- 2. Novos campos em selos_qualidade para controle manual
ALTER TABLE selos_qualidade ADD COLUMN IF NOT EXISTS tipo_selo_id UUID REFERENCES tipos_selo(id) ON DELETE SET NULL;
ALTER TABLE selos_qualidade ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE selos_qualidade ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE selos_qualidade ADD COLUMN IF NOT EXISTS atribuido_manualmente BOOLEAN DEFAULT FALSE;

-- Index
CREATE INDEX IF NOT EXISTS idx_selos_tipo_selo ON selos_qualidade(tipo_selo_id);
