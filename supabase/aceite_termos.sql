-- Migração para adicionar campos de aceite de termos
-- Isso serve como prova legal de que o usuário aceitou os termos

-- Adicionar campos na tabela de clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS termos_versao VARCHAR(50),
ADD COLUMN IF NOT EXISTS termos_ip VARCHAR(45);

-- Adicionar campos na tabela de profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS termos_versao VARCHAR(50),
ADD COLUMN IF NOT EXISTS termos_ip VARCHAR(45);

-- Comentários para documentação
COMMENT ON COLUMN clientes.termos_aceitos_em IS 'Data e hora em que o usuário aceitou os termos de uso';
COMMENT ON COLUMN clientes.termos_versao IS 'Versão dos termos aceitos (ex: 2024.1)';
COMMENT ON COLUMN clientes.termos_ip IS 'IP do usuário no momento do aceite';

COMMENT ON COLUMN profissionais.termos_aceitos_em IS 'Data e hora em que o usuário aceitou os termos de uso';
COMMENT ON COLUMN profissionais.termos_versao IS 'Versão dos termos aceitos (ex: 2024.1)';
COMMENT ON COLUMN profissionais.termos_ip IS 'IP do usuário no momento do aceite';
