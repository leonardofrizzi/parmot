# Parmot Serviços - Setup

Sistema de mediação entre profissionais e clientes (similar ao GetNinjas).

## Domínios
- **app.parmotservicos.com.br** - Aplicação principal (este projeto)
- **admin.parmotservicos.com.br** - Painel administrativo
- **parmotservicos.com.br** - Site institucional

## Stack
- Next.js 15 com TypeScript
- Tailwind CSS
- shadcn/ui (tema azul)
- Supabase (banco de dados)

## Setup Local

### 1. Node.js
O projeto requer Node.js >= 18. Use nvm para gerenciar a versão:
```bash
nvm use
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Supabase

#### Criar projeto no Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Copie a URL e a chave anônima do projeto

#### Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```bash
cp .env.example .env.local
```

Edite o `.env.local` e adicione suas credenciais:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Rodar o projeto
```bash
npm run dev
```

O projeto estará disponível em http://localhost:3000

## Estrutura do Projeto
```
parmot/
├── src/
│   ├── app/              # App Router do Next.js
│   ├── components/       # Componentes React
│   │   └── ui/          # Componentes shadcn/ui
│   ├── lib/             # Utilitários e configurações
│   │   ├── supabase.ts  # Cliente Supabase
│   │   └── utils.ts     # Funções auxiliares
│   └── types/           # Tipos TypeScript
├── public/              # Arquivos estáticos
└── ...
```

## Cores do Tema
- **Principal**: Azul (#3b82f6 - blue-600)
- **Secundária**: Branco
- **Terciária**: Cinza escuro

## Próximos Passos
O projeto está configurado e pronto para desenvolvimento. Aguardando orientações para implementação das funcionalidades.
