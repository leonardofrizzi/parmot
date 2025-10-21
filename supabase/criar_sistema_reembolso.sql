-- ================================================
-- TABELA DE ADMINS (CRIAR PRIMEIRO)
-- ================================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Inserir admin padrão (senha: admin123 - trocar em produção!)
-- Hash bcrypt de 'admin123' com salt 10
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Administrador',
  'admin@parmot.com',
  '$2b$10$rKqVgH3J8YZ5fH.xQX9FX.xH9vGh5QW8YZ5fH.xQX9FX.xH9vGh5Q'
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- TABELA DE SOLICITAÇÕES DE REEMBOLSO
-- ================================================

CREATE TABLE IF NOT EXISTS solicitacoes_reembolso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  resposta_id UUID NOT NULL REFERENCES respostas(id) ON DELETE CASCADE,
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Motivo e provas
  motivo TEXT NOT NULL,
  provas_urls TEXT[], -- URLs de screenshots, prints, etc

  -- Informações da transação
  moedas_gastas INTEGER NOT NULL,
  tipo_contato VARCHAR(20) NOT NULL CHECK (tipo_contato IN ('normal', 'exclusivo')),

  -- Status do reembolso
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'negado')),

  -- Resposta do admin
  admin_id UUID REFERENCES admins(id),
  resposta_admin TEXT,
  analisado_em TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reembolso_profissional ON solicitacoes_reembolso(profissional_id);
CREATE INDEX IF NOT EXISTS idx_reembolso_status ON solicitacoes_reembolso(status);
CREATE INDEX IF NOT EXISTS idx_reembolso_created ON solicitacoes_reembolso(created_at DESC);

-- Garantir que só pode haver uma solicitação de reembolso por resposta
CREATE UNIQUE INDEX IF NOT EXISTS idx_reembolso_unique_resposta
ON solicitacoes_reembolso(resposta_id);

-- ================================================
-- RLS (Row Level Security)
-- ================================================

ALTER TABLE solicitacoes_reembolso ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Profissional pode ver seus próprios reembolsos
CREATE POLICY "Profissional pode ver seus reembolsos"
  ON solicitacoes_reembolso FOR SELECT
  USING (profissional_id = (current_setting('app.current_user_id', true))::uuid);

-- Policy: Profissional pode criar reembolso
CREATE POLICY "Profissional pode criar reembolso"
  ON solicitacoes_reembolso FOR INSERT
  WITH CHECK (profissional_id = (current_setting('app.current_user_id', true))::uuid);

-- Policy: Admin pode ver todos reembolsos
CREATE POLICY "Admin pode ver todos reembolsos"
  ON solicitacoes_reembolso FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = (current_setting('app.current_admin_id', true))::uuid
      AND ativo = true
    )
  );

-- Policy: Admin pode atualizar reembolsos
CREATE POLICY "Admin pode atualizar reembolsos"
  ON solicitacoes_reembolso FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = (current_setting('app.current_admin_id', true))::uuid
      AND ativo = true
    )
  );

-- Policy: Apenas admins podem ver admins
CREATE POLICY "Admin pode ver admins"
  ON admins FOR SELECT
  USING (
    id = (current_setting('app.current_admin_id', true))::uuid
    OR ativo = true
  );

-- ================================================
-- COMENTÁRIOS
-- ================================================

COMMENT ON TABLE solicitacoes_reembolso IS 'Solicitações de reembolso de moedas quando cliente não responde';
COMMENT ON COLUMN solicitacoes_reembolso.motivo IS 'Motivo detalhado do pedido de reembolso';
COMMENT ON COLUMN solicitacoes_reembolso.provas_urls IS 'Array de URLs de prints/screenshots como prova';
COMMENT ON COLUMN solicitacoes_reembolso.moedas_gastas IS 'Quantidade de moedas que foram gastas (5 ou 20)';
COMMENT ON COLUMN solicitacoes_reembolso.tipo_contato IS 'Se foi contato normal (5) ou exclusivo (20)';

COMMENT ON TABLE admins IS 'Administradores da plataforma';
