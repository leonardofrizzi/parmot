-- Adicionar campos de localização para clientes
ALTER TABLE clientes
ADD COLUMN cidade VARCHAR(100),
ADD COLUMN estado VARCHAR(2);

-- Adicionar campos de localização para profissionais
ALTER TABLE profissionais
ADD COLUMN cidade VARCHAR(100),
ADD COLUMN estado VARCHAR(2);

-- Comentários para documentação
COMMENT ON COLUMN clientes.cidade IS 'Cidade do cliente';
COMMENT ON COLUMN clientes.estado IS 'Estado do cliente (sigla: SP, RJ, MG, etc)';
COMMENT ON COLUMN profissionais.cidade IS 'Cidade do profissional';
COMMENT ON COLUMN profissionais.estado IS 'Estado do profissional (sigla: SP, RJ, MG, etc)';
