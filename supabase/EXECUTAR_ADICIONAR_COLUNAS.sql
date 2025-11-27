-- EXECUTAR NO SUPABASE SQL EDITOR
-- Adiciona colunas faltantes na tabela profissionais

-- Slug para URL pública do profissional
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Foto de perfil
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Sobre/descrição do profissional
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS sobre TEXT;

-- Localização (caso não exista)
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- Status de aprovação
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT false;

-- Verificação de email
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false;

-- Atendimento online
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS atende_online BOOLEAN DEFAULT false;
esta 
-- Documentos (frente e verso da identidade)
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS identidade_frente_url TEXT;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS identidade_verso_url TEXT;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS documento_empresa_url TEXT;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS diplomas_urls JSONB;

-- Índice para busca por slug
CREATE INDEX IF NOT EXISTS idx_profissionais_slug ON profissionais(slug);
CREATE INDEX IF NOT EXISTS idx_profissionais_aprovado ON profissionais(aprovado);
CREATE INDEX IF NOT EXISTS idx_profissionais_cidade_estado ON profissionais(cidade, estado);

-- Comentários
COMMENT ON COLUMN profissionais.slug IS 'URL amigável para perfil público do profissional';
COMMENT ON COLUMN profissionais.foto_url IS 'URL da foto de perfil';
COMMENT ON COLUMN profissionais.sobre IS 'Descrição/biografia do profissional';
COMMENT ON COLUMN profissionais.aprovado IS 'Se o cadastro foi aprovado pelo admin';
COMMENT ON COLUMN profissionais.atende_online IS 'Se o profissional atende online';

SELECT 'Colunas adicionadas com sucesso!' as resultado;
