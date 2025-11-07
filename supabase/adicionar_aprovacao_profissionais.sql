-- Adicionar campo de aprovação para profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT false;

-- Atualizar profissionais existentes para aprovados (opcional - comentar se quiser revisar manualmente)
-- UPDATE profissionais SET aprovado = true WHERE aprovado IS NULL;

-- Criar índice para buscar profissionais pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_profissionais_aprovado ON profissionais(aprovado);
