-- Inserir usuários de teste no banco de dados
-- Execute este SQL no Supabase SQL Editor

-- Inserir cliente de teste
-- Email: cliente@teste.com
-- Senha: 123456
INSERT INTO clientes (nome, email, telefone, cidade, estado, senha_hash)
VALUES (
  'Cliente Teste',
  'cliente@teste.com',
  '(11) 98765-4321',
  'São Paulo',
  'SP',
  '$2b$10$m9FzSwLdeJGazCtZibNfo.kewnE2dpMyKUZ5jKY1GNqqC4v0dZmN.'
)
ON CONFLICT (email) DO NOTHING;

-- Inserir profissional de teste (APROVADO)
-- Email: profissional@teste.com
-- Senha: 123456
INSERT INTO profissionais (
  tipo,
  nome,
  email,
  telefone,
  cpf_cnpj,
  cidade,
  estado,
  senha_hash,
  saldo_moedas,
  aprovado
)
VALUES (
  'autonomo',
  'Profissional Teste',
  'profissional@teste.com',
  '(11) 91234-5678',
  '123.456.789-00',
  'São Paulo',
  'SP',
  '$2b$10$m9FzSwLdeJGazCtZibNfo.kewnE2dpMyKUZ5jKY1GNqqC4v0dZmN.',
  100,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Inserir admin de teste
-- Email: admin@parmot.com
-- Senha: admin123
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Admin Parmot',
  'admin@parmot.com',
  '$2b$10$dxtu/HrOqG6Wncv1xfKNueUxRNQIyNeN1eAQKsrFMoQjBnWURlNmq'
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se foram inseridos
SELECT 'Clientes inseridos:' as info, COUNT(*) as total FROM clientes WHERE email = 'cliente@teste.com'
UNION ALL
SELECT 'Profissionais inseridos:', COUNT(*) FROM profissionais WHERE email = 'profissional@teste.com'
UNION ALL
SELECT 'Admins inseridos:', COUNT(*) FROM admins WHERE email = 'admin@parmot.com';
