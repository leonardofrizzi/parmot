-- Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  resposta_profissional TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional ON avaliacoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_solicitacao ON avaliacoes(solicitacao_id);

-- Garantir que só pode haver uma avaliação por solicitação
CREATE UNIQUE INDEX IF NOT EXISTS idx_avaliacoes_unique_solicitacao
ON avaliacoes(solicitacao_id);

-- RLS (Row Level Security)
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver avaliações
CREATE POLICY "Avaliações são públicas"
  ON avaliacoes FOR SELECT
  USING (true);

-- Policy: Apenas o cliente pode criar avaliação da sua solicitação
CREATE POLICY "Cliente pode criar avaliação"
  ON avaliacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM solicitacoes
      WHERE id = solicitacao_id
      AND cliente_id = avaliacoes.cliente_id
    )
  );

-- Policy: Apenas o cliente pode atualizar sua avaliação (editar comentário/nota)
CREATE POLICY "Cliente pode atualizar sua avaliação"
  ON avaliacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM solicitacoes
      WHERE id = solicitacao_id
      AND cliente_id = avaliacoes.cliente_id
    )
  );

-- Policy: Profissional pode atualizar apenas o campo resposta_profissional
CREATE POLICY "Profissional pode responder avaliação"
  ON avaliacoes FOR UPDATE
  USING (profissional_id = (current_setting('app.current_user_id'))::uuid)
  WITH CHECK (profissional_id = (current_setting('app.current_user_id'))::uuid);

-- Comentários
COMMENT ON TABLE avaliacoes IS 'Tabela de avaliações de profissionais feitas por clientes após conclusão do serviço';
COMMENT ON COLUMN avaliacoes.nota IS 'Nota de 1 a 5 estrelas';
COMMENT ON COLUMN avaliacoes.comentario IS 'Comentário opcional do cliente sobre o serviço';
COMMENT ON COLUMN avaliacoes.resposta_profissional IS 'Resposta opcional do profissional à avaliação';
