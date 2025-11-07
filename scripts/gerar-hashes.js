// Script para gerar hashes bcrypt das senhas de teste
// Execute com: node scripts/gerar-hashes.js

const bcrypt = require('bcryptjs');

async function gerarHashes() {
  console.log('Gerando hashes bcrypt...\n');

  // Hash para senha '123456'
  const hash123456 = await bcrypt.hash('123456', 10);
  console.log('Senha: 123456');
  console.log('Hash:', hash123456);
  console.log();

  // Hash para senha 'admin123'
  const hashAdmin = await bcrypt.hash('admin123', 10);
  console.log('Senha: admin123');
  console.log('Hash:', hashAdmin);
  console.log();

  console.log('='.repeat(80));
  console.log('SQL COMPLETO:');
  console.log('='.repeat(80));
  console.log();

  const sql = `
-- Inserir usuários de teste no banco de dados

-- Inserir cliente de teste
INSERT INTO clientes (nome, email, telefone, cidade, estado, senha_hash)
VALUES (
  'Cliente Teste',
  'cliente@teste.com',
  '(11) 98765-4321',
  'São Paulo',
  'SP',
  '${hash123456}'
)
ON CONFLICT (email) DO NOTHING;

-- Inserir profissional de teste (APROVADO)
INSERT INTO profissionais (
  tipo,
  nome,
  email,
  telefone,
  cpf_cnpj,
  cidade,
  estado,
  profissao,
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
  'Desenvolvedor',
  '${hash123456}',
  100,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Inserir admin de teste
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Admin Parmot',
  'admin@parmot.com',
  '${hashAdmin}'
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se foram inseridos
SELECT 'Clientes inseridos:' as info, COUNT(*) as total FROM clientes WHERE email = 'cliente@teste.com'
UNION ALL
SELECT 'Profissionais inseridos:', COUNT(*) FROM profissionais WHERE email = 'profissional@teste.com'
UNION ALL
SELECT 'Admins inseridos:', COUNT(*) FROM admins WHERE email = 'admin@parmot.com';
`;

  console.log(sql);
}

gerarHashes().catch(console.error);
