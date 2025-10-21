-- Adicionar coluna exclusivo na tabela respostas
ALTER TABLE respostas
ADD COLUMN IF NOT EXISTS exclusivo BOOLEAN DEFAULT false;

-- Atualizar respostas existentes baseado na mensagem
UPDATE respostas
SET exclusivo = true
WHERE mensagem LIKE '%exclusividade%' OR mensagem LIKE '%exclusivo%';
