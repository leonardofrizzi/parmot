-- Tabela para armazenar códigos de verificação de email
CREATE TABLE IF NOT EXISTS verificacao_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'cadastro', -- cadastro, recuperacao
  verificado BOOLEAN DEFAULT FALSE,
  tentativas INT DEFAULT 0,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_verificacao_email_email ON verificacao_email(email);
CREATE INDEX IF NOT EXISTS idx_verificacao_email_codigo ON verificacao_email(codigo);
CREATE INDEX IF NOT EXISTS idx_verificacao_email_expira ON verificacao_email(expira_em);

-- Adicionar campo email_verificado nas tabelas de usuários (se não existir)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Função para limpar códigos expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION limpar_codigos_expirados()
RETURNS void AS $$
BEGIN
  DELETE FROM verificacao_email WHERE expira_em < NOW();
END;
$$ LANGUAGE plpgsql;
