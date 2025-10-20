-- Tabela de categorias principais
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria_id, slug)
);

-- Adicionar campos de categoria na tabela de solicitações
ALTER TABLE solicitacoes DROP COLUMN IF EXISTS categoria;
ALTER TABLE solicitacoes ADD COLUMN categoria_id UUID REFERENCES categorias(id);
ALTER TABLE solicitacoes ADD COLUMN subcategoria_id UUID REFERENCES subcategorias(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_categoria ON solicitacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_subcategoria ON solicitacoes(subcategoria_id);

-- RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Allow public read subcategorias" ON subcategorias FOR SELECT USING (true);

-- Inserir categorias principais
INSERT INTO categorias (nome, slug, icone, ordem) VALUES
('Reformas e Reparos', 'reformas-reparos', 'Wrench', 1),
('Assistência Técnica', 'assistencia-tecnica', 'Monitor', 2),
('Serviços Domésticos', 'servicos-domesticos', 'Home', 3),
('Aulas', 'aulas', 'GraduationCap', 4),
('Eventos', 'eventos', 'Calendar', 5),
('Saúde', 'saude', 'Heart', 6),
('Moda e Beleza', 'moda-beleza', 'Sparkles', 7),
('Design e Tecnologia', 'design-tecnologia', 'Monitor', 8),
('Autos', 'autos', 'Car', 9),
('Consultoria', 'consultoria', 'Briefcase', 10)
ON CONFLICT (slug) DO NOTHING;

-- Inserir subcategorias para Reformas e Reparos
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Pedreiro', 'pedreiro', 'Construção, alvenaria e acabamentos', 1
FROM categorias WHERE slug = 'reformas-reparos'
UNION ALL
SELECT id, 'Pintor', 'pintor', 'Pintura residencial e comercial', 2
FROM categorias WHERE slug = 'reformas-reparos'
UNION ALL
SELECT id, 'Eletricista', 'eletricista', 'Instalações e reparos elétricos', 3
FROM categorias WHERE slug = 'reformas-reparos'
UNION ALL
SELECT id, 'Encanador', 'encanador', 'Hidráulica e encanamentos', 4
FROM categorias WHERE slug = 'reformas-reparos'
UNION ALL
SELECT id, 'Marceneiro', 'marceneiro', 'Móveis planejados e carpintaria', 5
FROM categorias WHERE slug = 'reformas-reparos'
UNION ALL
SELECT id, 'Serralheiro', 'serralheiro', 'Portões, grades e estruturas metálicas', 6
FROM categorias WHERE slug = 'reformas-reparos'
ON CONFLICT DO NOTHING;

-- Inserir subcategorias para Serviços Domésticos
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Diarista', 'diarista', 'Limpeza e organização residencial', 1
FROM categorias WHERE slug = 'servicos-domesticos'
UNION ALL
SELECT id, 'Passadeira', 'passadeira', 'Passar roupas', 2
FROM categorias WHERE slug = 'servicos-domesticos'
UNION ALL
SELECT id, 'Cozinheira', 'cozinheira', 'Preparo de refeições', 3
FROM categorias WHERE slug = 'servicos-domesticos'
UNION ALL
SELECT id, 'Babá', 'baba', 'Cuidado de crianças', 4
FROM categorias WHERE slug = 'servicos-domesticos'
UNION ALL
SELECT id, 'Cuidador de Idosos', 'cuidador-idosos', 'Acompanhamento e cuidados', 5
FROM categorias WHERE slug = 'servicos-domesticos'
ON CONFLICT DO NOTHING;

-- Inserir subcategorias para Assistência Técnica
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Manutenção de Celular', 'manutencao-celular', 'Conserto e reparo de smartphones', 1
FROM categorias WHERE slug = 'assistencia-tecnica'
UNION ALL
SELECT id, 'Manutenção de Notebook', 'manutencao-notebook', 'Reparo de computadores', 2
FROM categorias WHERE slug = 'assistencia-tecnica'
UNION ALL
SELECT id, 'Técnico de TV', 'tecnico-tv', 'Instalação e reparo de televisores', 3
FROM categorias WHERE slug = 'assistencia-tecnica'
UNION ALL
SELECT id, 'Técnico de Geladeira', 'tecnico-geladeira', 'Reparo de refrigeradores', 4
FROM categorias WHERE slug = 'assistencia-tecnica'
UNION ALL
SELECT id, 'Técnico de Máquina de Lavar', 'tecnico-maquina-lavar', 'Reparo de lavadoras', 5
FROM categorias WHERE slug = 'assistencia-tecnica'
ON CONFLICT DO NOTHING;

-- Inserir subcategorias para Aulas
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Aula de Inglês', 'aula-ingles', 'Inglês particular', 1
FROM categorias WHERE slug = 'aulas'
UNION ALL
SELECT id, 'Aula de Matemática', 'aula-matematica', 'Reforço escolar', 2
FROM categorias WHERE slug = 'aulas'
UNION ALL
SELECT id, 'Aula de Violão', 'aula-violao', 'Música e instrumentos', 3
FROM categorias WHERE slug = 'aulas'
UNION ALL
SELECT id, 'Personal Trainer', 'personal-trainer', 'Treino personalizado', 4
FROM categorias WHERE slug = 'aulas'
UNION ALL
SELECT id, 'Professor Particular', 'professor-particular', 'Reforço escolar geral', 5
FROM categorias WHERE slug = 'aulas'
ON CONFLICT DO NOTHING;

-- Inserir subcategorias para Eventos
INSERT INTO subcategorias (categoria_id, nome, slug, descricao, ordem)
SELECT id, 'Buffet', 'buffet', 'Comida para eventos', 1
FROM categorias WHERE slug = 'eventos'
UNION ALL
SELECT id, 'Fotógrafo', 'fotografo', 'Fotografia de eventos', 2
FROM categorias WHERE slug = 'eventos'
UNION ALL
SELECT id, 'DJ', 'dj', 'Música para festas', 3
FROM categorias WHERE slug = 'eventos'
UNION ALL
SELECT id, 'Decoração', 'decoracao', 'Decoração de festas', 4
FROM categorias WHERE slug = 'eventos'
UNION ALL
SELECT id, 'Bartender', 'bartender', 'Drinks e coquetéis', 5
FROM categorias WHERE slug = 'eventos'
ON CONFLICT DO NOTHING;
