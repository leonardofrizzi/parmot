-- Tabela de relacionamento entre profissionais e categorias
-- Um profissional pode atender várias categorias
CREATE TABLE IF NOT EXISTS profissional_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profissional_id, categoria_id)
);

-- Adicionar campo atende_online para profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS atende_online BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profissional_categorias_profissional ON profissional_categorias(profissional_id);
CREATE INDEX IF NOT EXISTS idx_profissional_categorias_categoria ON profissional_categorias(categoria_id);

-- RLS (Row Level Security)
ALTER TABLE profissional_categorias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow public read" ON profissional_categorias FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON profissional_categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON profissional_categorias FOR DELETE USING (true);

-- Comentários
COMMENT ON TABLE profissional_categorias IS 'Categorias de serviço que o profissional atende';
COMMENT ON COLUMN profissionais.atende_online IS 'Se o profissional atende clientes de todo o Brasil (serviços online)';
