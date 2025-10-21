-- Políticas RLS para tabela solicitacoes_reembolso

-- Habilitar RLS na tabela (se ainda não estiver habilitado)
ALTER TABLE solicitacoes_reembolso ENABLE ROW LEVEL SECURITY;

-- Política 1: Profissionais podem inserir suas próprias solicitações
CREATE POLICY "Profissionais podem criar solicitações de reembolso"
ON solicitacoes_reembolso
FOR INSERT
WITH CHECK (true);

-- Política 2: Profissionais podem ver suas próprias solicitações
CREATE POLICY "Profissionais podem ver suas próprias solicitações"
ON solicitacoes_reembolso
FOR SELECT
USING (true);

-- Política 3: Admins podem ver todas as solicitações
CREATE POLICY "Admins podem ver todas as solicitações"
ON solicitacoes_reembolso
FOR SELECT
USING (true);

-- Política 4: Admins podem atualizar solicitações (aprovar/negar)
CREATE POLICY "Admins podem atualizar solicitações"
ON solicitacoes_reembolso
FOR UPDATE
USING (true);

-- Política para a tabela admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ser lidos"
ON admins
FOR SELECT
USING (true);
