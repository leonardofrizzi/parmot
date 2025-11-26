-- ================================================
-- MIGRAÇÃO V2 - PARMOT EDUCAÇÃO
-- ================================================
-- Execute este arquivo no Supabase SQL Editor
-- ================================================

-- 1. Telefone opcional para clientes
ALTER TABLE clientes ALTER COLUMN telefone DROP NOT NULL;

-- 2. Adicionar modalidade (presencial/online) nas solicitações
ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS modalidade VARCHAR(20) DEFAULT 'presencial'
CHECK (modalidade IN ('presencial', 'online', 'ambos'));

-- 3. Adicionar aceite de termos nas tabelas de usuários
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aceite_termos BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aceite_termos_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS aceite_termos BOOLEAN DEFAULT false;
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS aceite_termos_em TIMESTAMP WITH TIME ZONE;

-- 4. Limpar categorias antigas e inserir apenas Educação
-- IMPORTANTE: Primeiro precisamos limpar as solicitações que referenciam categorias/subcategorias antigas

-- Deletar respostas das solicitações que usam subcategorias fora de Aulas
DELETE FROM respostas
WHERE solicitacao_id IN (
  SELECT s.id FROM solicitacoes s
  JOIN subcategorias sub ON s.subcategoria_id = sub.id
  JOIN categorias cat ON sub.categoria_id = cat.id
  WHERE cat.slug != 'aulas'
);

-- Deletar solicitações que usam subcategorias fora de Aulas
DELETE FROM solicitacoes
WHERE subcategoria_id IN (
  SELECT sub.id FROM subcategorias sub
  JOIN categorias cat ON sub.categoria_id = cat.id
  WHERE cat.slug != 'aulas'
);

-- Também deletar solicitações que usam subcategorias antigas de Aulas (que vamos substituir)
DELETE FROM respostas
WHERE solicitacao_id IN (
  SELECT s.id FROM solicitacoes s
  JOIN subcategorias sub ON s.subcategoria_id = sub.id
  JOIN categorias cat ON sub.categoria_id = cat.id
  WHERE cat.slug = 'aulas'
);

DELETE FROM solicitacoes
WHERE subcategoria_id IN (
  SELECT sub.id FROM subcategorias sub
  JOIN categorias cat ON sub.categoria_id = cat.id
  WHERE cat.slug = 'aulas'
);

-- Agora podemos remover subcategorias antigas (exceto as de Aulas)
DELETE FROM subcategorias
WHERE categoria_id NOT IN (SELECT id FROM categorias WHERE slug = 'aulas');

-- Remover categorias antigas (exceto Aulas)
DELETE FROM categorias WHERE slug != 'aulas';

-- Renomear categoria "Aulas" para "Educação"
UPDATE categorias SET nome = 'Educação', ordem = 1 WHERE slug = 'aulas';

-- Remover subcategorias antigas de Aulas
DELETE FROM subcategorias WHERE categoria_id = (SELECT id FROM categorias WHERE slug = 'aulas');

-- Inserir novas subcategorias de Educação
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Aulas de Música', 'aulas-musica', 'Piano, Violão, Guitarra, Canto, Bateria e outros instrumentos', 1
FROM categorias WHERE slug = 'aulas'
ON CONFLICT DO NOTHING;

INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Reforço Escolar', 'reforco-escolar', 'Matemática, Português, Física, Química, Biologia, História e outras matérias', 2
FROM categorias WHERE slug = 'aulas'
ON CONFLICT DO NOTHING;

INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Idiomas', 'idiomas', 'Inglês, Espanhol, Francês, Alemão, Italiano e outros idiomas', 3
FROM categorias WHERE slug = 'aulas'
ON CONFLICT DO NOTHING;

-- 5. Tabela de administradores
CREATE TABLE IF NOT EXISTS administradores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para administradores
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public read administradores" ON administradores;
DROP POLICY IF EXISTS "Allow public insert administradores" ON administradores;
DROP POLICY IF EXISTS "Allow public update administradores" ON administradores;

CREATE POLICY "Allow public read administradores" ON administradores FOR SELECT USING (true);
CREATE POLICY "Allow public insert administradores" ON administradores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update administradores" ON administradores FOR UPDATE USING (true);

-- Trigger para updated_at (só cria se não existir)
DROP TRIGGER IF EXISTS update_administradores_updated_at ON administradores;
CREATE TRIGGER update_administradores_updated_at BEFORE UPDATE ON administradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FIM DA MIGRAÇÃO
-- ================================================
