// Script para testar o login dos usuários de teste
// Execute com: node scripts/verificar-login.js

const bcrypt = require('bcryptjs');

async function testarLogin() {
  const senha = '123456';
  const senhaAdmin = 'admin123';

  // Estes são os hashes que estão no SQL
  const hashCliente = '$2b$10$m9FzSwLdeJGazCtZibNfo.kewnE2dpMyKUZ5jKY1GNqqC4v0dZmN.';
  const hashAdmin = '$2b$10$dxtu/HrOqG6Wncv1xfKNueUxRNQIyNeN1eAQKsrFMoQjBnWURlNmq';

  console.log('Testando se as senhas batem com os hashes...\n');

  // Testar senha 123456
  const match123456 = await bcrypt.compare(senha, hashCliente);
  console.log('Senha "123456" com hash do cliente:', match123456 ? '✅ OK' : '❌ FALHOU');

  // Testar senha admin123
  const matchAdmin = await bcrypt.compare(senhaAdmin, hashAdmin);
  console.log('Senha "admin123" com hash do admin:', matchAdmin ? '✅ OK' : '❌ FALHOU');

  console.log('\n' + '='.repeat(80));
  console.log('SUGESTÃO:');
  console.log('='.repeat(80));

  if (!match123456 || !matchAdmin) {
    console.log('\n❌ Os hashes não estão corretos!');
    console.log('\nGerando novos hashes...\n');

    const novoHash123456 = await bcrypt.hash('123456', 10);
    const novoHashAdmin = await bcrypt.hash('admin123', 10);

    console.log('Novo hash para "123456":', novoHash123456);
    console.log('Novo hash para "admin123":', novoHashAdmin);

    console.log('\n\nSQL ATUALIZADO:\n');
    console.log(`
-- DELETAR usuários antigos
DELETE FROM clientes WHERE email = 'cliente@teste.com';
DELETE FROM profissionais WHERE email = 'profissional@teste.com';
DELETE FROM admins WHERE email = 'admin@parmot.com';

-- Inserir cliente de teste
INSERT INTO clientes (nome, email, telefone, cidade, estado, senha_hash)
VALUES (
  'Cliente Teste',
  'cliente@teste.com',
  '(11) 98765-4321',
  'São Paulo',
  'SP',
  '${novoHash123456}'
);

-- Inserir profissional de teste
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
  '${novoHash123456}',
  100,
  true
);

-- Inserir admin de teste
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Admin Parmot',
  'admin@parmot.com',
  '${novoHashAdmin}'
);
    `);
  } else {
    console.log('\n✅ Todos os hashes estão corretos!');
    console.log('\nPROVÁVEL CAUSA: Os usuários não existem no banco ou foram inseridos com outros hashes.');
    console.log('\nSOLUÇÃO: Execute o SQL abaixo no Supabase para DELETAR e REINSERIR:\n');

    console.log(`
-- DELETAR usuários antigos (caso existam com senhas diferentes)
DELETE FROM clientes WHERE email = 'cliente@teste.com';
DELETE FROM profissionais WHERE email = 'profissional@teste.com';
DELETE FROM admins WHERE email = 'admin@parmot.com';

-- Inserir cliente de teste
INSERT INTO clientes (nome, email, telefone, cidade, estado, senha_hash)
VALUES (
  'Cliente Teste',
  'cliente@teste.com',
  '(11) 98765-4321',
  'São Paulo',
  'SP',
  '${hashCliente}'
);

-- Inserir profissional de teste
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
  '${hashCliente}',
  100,
  true
);

-- Inserir admin de teste
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Admin Parmot',
  'admin@parmot.com',
  '${hashAdmin}'
);
    `);
  }
}

testarLogin().catch(console.error);
