-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('autonomo', 'empresa')),
  nome VARCHAR(255) NOT NULL,
  razao_social VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  cpf_cnpj VARCHAR(18) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  saldo_moedas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações de serviço (clientes postam aqui)
CREATE TABLE IF NOT EXISTS solicitacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas (profissionais respondem solicitações)
CREATE TABLE IF NOT EXISTS respostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID REFERENCES solicitacoes(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  contato_liberado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações de moedas
CREATE TABLE IF NOT EXISTS transacoes_moedas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('compra', 'uso', 'estorno')),
  quantidade INTEGER NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cliente ON solicitacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_respostas_solicitacao ON respostas(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_respostas_profissional ON respostas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_profissional ON transacoes_moedas(profissional_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at BEFORE UPDATE ON profissionais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON solicitacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_moedas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (você pode ajustar depois)
-- Por enquanto permitindo acesso público para desenvolvimento
CREATE POLICY "Allow public read access" ON clientes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON clientes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON profissionais FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public access" ON solicitacoes FOR ALL USING (true);
CREATE POLICY "Allow public access" ON respostas FOR ALL USING (true);
CREATE POLICY "Allow public access" ON transacoes_moedas FOR ALL USING (true);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  custo_contato_normal INTEGER DEFAULT 15,
  custo_contato_exclusivo INTEGER DEFAULT 50,
  max_profissionais_por_solicitacao INTEGER DEFAULT 4,
  percentual_reembolso INTEGER DEFAULT 30,
  dias_para_reembolso INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO configuracoes (custo_contato_normal, custo_contato_exclusivo, max_profissionais_por_solicitacao, percentual_reembolso, dias_para_reembolso)
SELECT 15, 50, 4, 30, 7
WHERE NOT EXISTS (SELECT 1 FROM configuracoes);

-- Trigger para updated_at da tabela configuracoes
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar coluna moedas_reembolsadas na tabela de reembolsos (para registrar o valor real reembolsado)
ALTER TABLE solicitacoes_reembolso ADD COLUMN IF NOT EXISTS moedas_reembolsadas INTEGER;

-- Adicionar campos para documentos de identidade frente e verso
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS identidade_frente_url TEXT;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS identidade_verso_url TEXT;

-- Adicionar campo slug para URL pública do profissional
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Adicionar campos para perfil público do profissional
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS sobre TEXT;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  solicitacao_id UUID REFERENCES solicitacoes(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  resposta_profissional TEXT,
  visivel BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para avaliações
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional ON avaliacoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_solicitacao ON avaliacoes(solicitacao_id);

-- Trigger para updated_at da tabela avaliacoes
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON avaliacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para avaliações
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON avaliacoes FOR ALL USING (true);

-- Remover campo antigo documento_url se existir (migração)
-- ALTER TABLE profissionais DROP COLUMN IF EXISTS documento_url;

-- Tabela de selos de qualidade
CREATE TABLE IF NOT EXISTS selos_qualidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL DEFAULT 'qualidade_6m',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  media_avaliacoes NUMERIC(2,1) NOT NULL,
  total_avaliacoes INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar selos ativos
CREATE INDEX IF NOT EXISTS idx_selos_profissional ON selos_qualidade(profissional_id);
CREATE INDEX IF NOT EXISTS idx_selos_ativo ON selos_qualidade(ativo, data_fim);

-- RLS para selos
ALTER TABLE selos_qualidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON selos_qualidade FOR ALL USING (true);
