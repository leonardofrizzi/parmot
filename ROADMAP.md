# 🗺️ Parmot Serviços - Roadmap & Backlog

## 📋 Status Atual do MVP
✅ Sistema de cadastro (Cliente e Profissional)
✅ Sistema de solicitações de serviço
✅ Sistema de moedas e pagamentos (Mercado Pago)
✅ Sistema de respostas e liberação de contatos
✅ Sistema de avaliações
✅ Sistema de reembolsos
✅ Painel Admin (aprovação de profissionais e solicitações)
✅ Upload de documentos profissionais (Supabase Storage)
✅ Dashboard Cliente e Profissional
✅ Verificação de email no cadastro (código de 6 dígitos)

---

## ⚠️ PENDENTE - Configurações Necessárias

### 📧 Verificação de Email (FAZER ANTES DE TESTAR)
**Status:** Código pronto, falta configurar

**1. Executar migration no Supabase:**
```sql
-- Rodar o arquivo: supabase/migrations/v2_verificacao_email.sql
```

**2. Configurar Resend no .env:**
```
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Parmot Serviços <noreply@seudominio.com.br>
```

**3. Criar conta no Resend:**
- Acessar https://resend.com
- Criar API key
- Verificar domínio (ou usar domínio de teste)

---

## 🚀 Próximas Funcionalidades (Backlog)

### 📧 Sistema de Notificações e E-mails
**Prioridade:** Alta
**Status:** Planejado

**Descrição:**
Implementar sistema completo de notificações por email usando **Resend** e notificações in-app com sininho na sidebar.

**Funcionalidades:**
- [ ] Setup do Resend (API key + domínio verificado)
- [ ] Criar tabela `notificacoes` no Supabase
- [ ] Templates de email em React para cada evento
- [ ] Componente de sininho na sidebar com badge de contagem
- [ ] Sistema real-time com Supabase Subscriptions

**Eventos de Email:**

**Para Profissionais:**
- [ ] Conta aprovada pelo admin ✅
- [ ] Nova solicitação disponível na sua área 🔔
- [ ] Cliente liberou seu contato 💰
- [ ] Reembolso aprovado/negado 💵
- [ ] Nova avaliação recebida ⭐

**Para Clientes:**
- [ ] Profissional demonstrou interesse 👷
- [ ] Solicitação aprovada pelo admin ✅
- [ ] Profissional liberou contato exclusivo 👤
- [ ] Serviço marcado como finalizado (pedir avaliação) ⭐

**Estimativa:** 2-3 dias
**Custo:** Grátis até 3.000 emails/mês (Resend)

---

### 🎨 Melhoria da Landing Page
**Prioridade:** Média
**Status:** Planejado

**Descrição:**
Melhorar a LP atual (`/`) com design mais profissional e conversão otimizada.

**Itens:**
- [ ] Hero section mais impactante
- [ ] Seção "Como Funciona" (passo a passo)
- [ ] Depoimentos/Avaliações em destaque
- [ ] CTA clara para profissionais e clientes
- [ ] Seção de categorias populares
- [ ] FAQ
- [ ] Footer completo (sobre, contato, termos, privacidade)
- [ ] Otimizar SEO (meta tags, open graph)
- [ ] Versão mobile otimizada

**Estimativa:** 1-2 dias

---

### 📁 Sistema de Bucket de Documentos (Migração)
**Prioridade:** Baixa
**Status:** Planejado

**Descrição:**
Atualmente os documentos estão no Supabase Storage. Avaliar se vale migrar para bucket dedicado ou manter como está.

**Opções:**
- [ ] Manter Supabase Storage (atual - funciona bem)
- [ ] Migrar para AWS S3 (se escalar muito)
- [ ] Migrar para Cloudflare R2 (alternativa barata)

**Decisão:** Avaliar conforme crescimento da base de usuários

---

## 📝 Sugestões da Cliente (Aguardando Feedback)

*Adicionar aqui conforme a cliente for pedindo alterações*

---

## 🐛 Bugs Conhecidos

*Nenhum bug crítico identificado no momento*

---

## 🔮 Ideias Futuras (Icebox)

- [ ] App mobile (React Native)
- [ ] Chat em tempo real entre cliente e profissional
- [ ] Sistema de agendamento/calendário
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de cupons/promoções
- [ ] Programa de indicação (referral)
- [ ] Dashboard de analytics para profissionais
- [ ] Sistema de assinatura premium para profissionais
- [ ] Geolocalização e mapa de profissionais
- [ ] Video chamadas integradas

---

## 📊 Métricas de Sucesso (KPIs)

- [ ] Definir métricas principais
- [ ] Implementar analytics (Google Analytics / Posthog)
- [ ] Dashboard de métricas para admin

---

**Última atualização:** 10/11/2025
**Versão atual:** MVP 1.0
**Status geral:** ✅ MVP completo - Aguardando feedback da cliente
