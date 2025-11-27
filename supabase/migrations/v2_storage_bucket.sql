-- Criar bucket para documentos dos profissionais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais-documentos',
  'profissionais-documentos',
  true,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket
-- Permitir upload para usuários autenticados (ou todos, se não usar auth)
CREATE POLICY "Permitir upload de documentos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profissionais-documentos');

-- Permitir leitura pública dos documentos
CREATE POLICY "Permitir leitura pública" ON storage.objects
FOR SELECT USING (bucket_id = 'profissionais-documentos');

-- Permitir atualização/deleção
CREATE POLICY "Permitir update de documentos" ON storage.objects
FOR UPDATE USING (bucket_id = 'profissionais-documentos');

CREATE POLICY "Permitir delete de documentos" ON storage.objects
FOR DELETE USING (bucket_id = 'profissionais-documentos');
