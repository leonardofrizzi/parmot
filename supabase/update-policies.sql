-- Adicionar política de UPDATE para clientes
CREATE POLICY "Allow public update" ON clientes FOR UPDATE USING (true) WITH CHECK (true);

-- Adicionar política de UPDATE para profissionais
CREATE POLICY "Allow public update" ON profissionais FOR UPDATE USING (true) WITH CHECK (true);
