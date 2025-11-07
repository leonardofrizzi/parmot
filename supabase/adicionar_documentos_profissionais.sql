-- Adicionar campo para armazenar URL do documento do profissional
-- (MEI, CNPJ, RG, etc.)

ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS documento_url TEXT;

COMMENT ON COLUMN profissionais.documento_url IS 'URL do documento de identificação/comprovação (MEI, CNPJ, RG, etc.) armazenado no Supabase Storage';

-- ==============================================================================
-- INSTRUÇÕES PARA CRIAR O BUCKET NO SUPABASE DASHBOARD:
-- ==============================================================================
--
-- 1. Acesse: Storage > Create a new bucket
-- 2. Configure:
--    - Name: profissionais-documentos
--    - Public bucket: false (desmarcar - apenas admin pode acessar)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png
--
-- 3. Após criar, vá em "Policies" e adicione:
--
--    POLÍTICA 1 - Upload (apenas pela API):
--    Name: Enable upload for authenticated users
--    Policy: INSERT
--    Target roles: authenticated
--    USING expression: true
--    WITH CHECK expression: true
--
--    POLÍTICA 2 - Read (público para visualização):
--    Name: Enable read access for all users
--    Policy: SELECT
--    Target roles: public
--    USING expression: true
--
-- ==============================================================================
