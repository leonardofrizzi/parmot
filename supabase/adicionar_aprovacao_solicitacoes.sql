-- Adicionar campo de aprovação de admin nas solicitações
ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS aprovado_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aprovado_admin_em TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN solicitacoes.aprovado_admin IS 'Se a solicitação foi aprovada pelo admin para ficar visível aos profissionais';
COMMENT ON COLUMN solicitacoes.aprovado_admin_em IS 'Data e hora em que o admin aprovou a solicitação';

-- Atualizar solicitações existentes para aprovadas (para não quebrar o sistema atual)
UPDATE solicitacoes SET aprovado_admin = true WHERE aprovado_admin IS NULL;
