-- Criar bucket para documentos de profissionais via SQL
-- Execute este arquivo no Supabase SQL Editor

-- 1. Adicionar coluna documento_url na tabela profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS documento_url TEXT;

COMMENT ON COLUMN profissionais.documento_url IS 'URL do documento de identificação/comprovação (MEI, CNPJ, RG, etc.) armazenado no Supabase Storage';

-- 2. Inserir bucket no storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais-documentos',
  'profissionais-documentos',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar política RLS para permitir INSERT (upload) - authenticated users
CREATE POLICY "Enable upload for authenticated users"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profissionais-documentos');

-- 4. Criar política RLS para permitir SELECT (leitura) - todos
CREATE POLICY "Enable read access for all users"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profissionais-documentos');

-- 5. Criar política RLS para permitir UPDATE (atualizar) - authenticated users
CREATE POLICY "Enable update for authenticated users"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profissionais-documentos')
WITH CHECK (bucket_id = 'profissionais-documentos');

-- 6. Criar política RLS para permitir DELETE (deletar) - authenticated users
CREATE POLICY "Enable delete for authenticated users"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profissionais-documentos');

-- Verificar se foi criado
SELECT * FROM storage.buckets WHERE id = 'profissionais-documentos';
