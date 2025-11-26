# Parmot V2 - Mudanças Solicitadas

**Data:** 25/11/2024
**Branch:** develop
**Cliente:** Parmot Serviços (foco em Educação)
**Status:** Em desenvolvimento

---

## Resumo Executivo

A cliente decidiu **pivotar o Parmot para focar inicialmente em Educação** (aulas particulares), garantindo que ela mesma possa cobrir a demanda caso não haja profissionais suficientes. A estratégia é começar nichado para validar o modelo de negócio.

---

## 1. Mudanças no Cadastro

### 1.1 Telefone Opcional para Clientes
- [x] Telefone **opcional** para clientes
- [x] Telefone **obrigatório** para profissionais
- [x] Adicionar **estrela vermelha (*)** nos campos obrigatórios

### 1.2 Perfil Único (Cliente + Profissional)
- [x] **Um único perfil por CPF** que pode ser cliente E profissional ao mesmo tempo
- [x] Similar ao Cronoshare: mesma pessoa pode solicitar serviços e oferecer os seus
- [x] Implementado com linking entre tabelas (cliente_id em profissionais, profissional_id em clientes)

### 1.3 Upload de Documentos para Profissionais
- [x] Campo para upload de **RG/Identidade** (já existia)
- [x] Campo para upload de **Diplomas/Certificações** (já existia)
- [x] Armazenar no Supabase Storage (já existe estrutura)

### 1.4 Termos de Uso / Contrato de Adesão
- [x] Checkbox obrigatório: "Li e concordo com os termos de uso"
- [x] Texto: intermediários não se responsabilizam por problemas entre as partes
- [x] Link para página com termos completos (`/termos`)

---

## 2. Foco em Educação (MVP v2)

### 2.1 Categorias Iniciais
Começar **apenas** com:

| Categoria | Subcategorias |
|-----------|---------------|
| **Aulas de Música** | Piano, Violão, Guitarra, Canto, etc. |
| **Reforço Escolar** | Matemática, Português, Física, Química, etc. |
| **Idiomas** | Inglês, Espanhol, Francês, etc. |

**Status:** SQL de migração criado (`supabase/migrations/v2_educacao.sql`) - Aguardando execução no Supabase

### 2.2 Justificativa
- Cliente tem formação em educação e pode cobrir demanda inicial
- Evita decepcionar clientes por falta de profissionais
- Construir reputação antes de expandir

---

## 3. Novas Funcionalidades nas Solicitações

### 3.1 Modalidade de Atendimento
- [x] Cliente escolhe: **Presencial**, **Online** ou **Ambos**
- [x] Campo na criação da solicitação
- [x] API atualizada para salvar modalidade

### 3.2 Mapa de Localização (Como Cronoshare)
- [x] Mostrar mapa com localização aproximada do cliente
- [x] Profissional visualiza se o serviço está perto da região dele
- [x] Usando OpenStreetMap (gratuito) via react-leaflet

---

## 4. Sistema de Moedas - UX Melhorada

### 4.1 Saldo Visível em Toda Plataforma
- [x] Mostrar saldo de moedas na **sidebar** (clicável, leva para página de compras)
- [x] Visual destacado com cores de moeda (amarelo/dourado)
- [x] Transmitir sensação de **propriedade** das moedas pelo profissional

---

## 5. Painel de Administração

### 5.1 Cadastro de Admin
- [x] Criar página para a cliente cadastrar seu próprio admin (`/admin/configurar`)
- [x] Definir email e senha do administrador
- [x] Fluxo de primeiro acesso / configuração inicial
- [x] API de verificação se admin já existe

---

## 6. Sistema de E-mails (Confirmação)

### 6.1 E-mails Obrigatórios
- [ ] **Confirmação de cadastro** (verificar e-mail)
- [ ] **Conta aprovada** (após admin aprovar)
- [ ] **Nova solicitação** (notificar profissionais da região)
- [ ] **Profissional interessado** (notificar cliente)

### 6.2 Serviço Sugerido
- **Resend** (100 emails/dia grátis) - pendente configuração

---

## 7. Manter Como Está

- [x] **Logo/Escudo azul** - cliente aprovou e gostou
- [x] **Sistema de moedas** - manter funcionamento atual
- [x] **Fluxo de aprovação** - admin aprova profissionais e solicitações

---

## Progresso da Implementação

### Concluído
1. [x] Telefone opcional para clientes + campos obrigatórios com *
2. [x] Checkbox de termos de uso nos cadastros
3. [x] Página de termos de uso (`/termos`)
4. [x] Modalidade presencial/online nas solicitações
5. [x] Página de cadastro de admin (`/admin/configurar`)
6. [x] Saldo de moedas visível na sidebar

### Pendente - Executar SQL
7. [ ] **EXECUTAR** `supabase/migrations/v2_educacao.sql` no Supabase SQL Editor
   - Telefone opcional no banco
   - Modalidade nas solicitações
   - Categorias focadas em Educação
   - Tabela de administradores

### Pendente - Implementar
8. [x] Perfil único (cliente + profissional) - implementado
9. [ ] Sistema de e-mails (Resend)
10. [x] Mapa de localização - implementado com OpenStreetMap

---

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/app/termos/page.tsx` - Página de termos de uso
- `src/app/admin/configurar/page.tsx` - Cadastro de admin
- `src/app/api/admin/check/route.ts` - Verificar se admin existe
- `src/app/api/admin/criar/route.ts` - Criar admin
- `src/app/api/profissional/saldo/route.ts` - Buscar saldo de moedas
- `supabase/migrations/v2_educacao.sql` - Migração do banco

### Arquivos Modificados
- `src/app/cadastro/cliente/page.tsx` - Telefone opcional, termos, asteriscos
- `src/app/cadastro/profissional/page.tsx` - Termos, asteriscos
- `src/app/api/cadastro/cliente/route.ts` - Telefone opcional
- `src/app/dashboard/cliente/solicitar/page.tsx` - Modalidade presencial/online
- `src/app/api/solicitacoes/route.ts` - Salvar modalidade
- `src/components/Sidebar.tsx` - Exibir saldo de moedas
- `src/app/dashboard/cliente/perfil/page.tsx` - Modal "Tornar-se profissional"
- `src/app/dashboard/profissional/perfil/page.tsx` - Modal "Tornar-se cliente"
- `src/app/dashboard/profissional/solicitacoes/[id]/page.tsx` - Mapa de localização

### Novos Arquivos (V2 Perfil Único + Mapa)
- `src/app/api/cliente/tornar-profissional/route.ts` - API para cliente virar profissional
- `src/app/api/profissional/tornar-cliente/route.ts` - API para profissional virar cliente
- `src/components/MapaLocalizacao.tsx` - Componente de mapa com OpenStreetMap
- `supabase/migrations/v2_perfil_unico.sql` - SQL para linking de perfis

---

## Observações da Cliente

> "Em administração de empresas, aprendemos que não devemos decepcionar o cliente em hipótese alguma. Seria desonesto pegar dinheiro vendendo moedas virtuais se eu não tiver trabalhos para oferecer."

> "O marketing sugere que a pessoa perceba as moedas virtuais como de sua propriedade."

> "Por favor, me mantenha atualizada sobre o que está fazendo no projeto."

---

## Próximos Passos

1. [x] ~~Validar este documento com você (Leonardo)~~
2. [x] ~~Aprovar priorização~~
3. [x] ~~Começar implementação pela Fase 1~~
4. [ ] **AGORA:** Executar SQLs de migração no Supabase:
   - `supabase/migrations/v2_educacao.sql` (categorias, modalidade, etc.)
   - `supabase/migrations/v2_perfil_unico.sql` (linking cliente/profissional)
5. [ ] Testar tudo na branch develop
6. [x] ~~Implementar perfil único~~ (concluído)
7. [x] ~~Implementar mapa de localização~~ (concluído)
8. [ ] Configurar Resend para e-mails (fazer com calma depois)
9. [ ] Merge para main quando validado

---

*Documento atualizado em 25/11/2024*
