-- Adicionar coluna negocio_fechado na tabela respostas
-- Indica que o profissional marcou que fechou negócio com o cliente (informação local dele)
-- Não altera o status da solicitação - quem controla é o cliente
ALTER TABLE respostas ADD COLUMN IF NOT EXISTS negocio_fechado BOOLEAN DEFAULT FALSE;
