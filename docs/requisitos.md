# Requisitos Funcionais e Melhorias para Ambiente Serverless (Vercel + Supabase)

## 1. Arquitetura Geral

### Situação Atual:
- Aplicação Flask monolítica
- SQLAlchemy para ORM
- Armazenamento local de ficheiros
- Sessões baseadas em servidor

### Nova Arquitetura:
- Frontend Next.js hospedado no Vercel (serverless)
- API Routes do Next.js para backend serverless
- Supabase para base de dados PostgreSQL
- Supabase Storage para armazenamento de ficheiros
- Autenticação via Supabase Auth (JWT)

## 2. Requisitos Funcionais

### 2.1 Autenticação e Autorização
- Implementar autenticação via Supabase Auth
- Utilizar tokens JWT para autorização
- Proteger rotas API com middleware de autenticação
- Manter funcionalidades de registo e login de utilizadores

### 2.2 Gestão de Empresas
- Manter CRUD completo para empresas
- Adaptar para utilizar Supabase PostgreSQL
- Implementar validações no cliente e servidor

### 2.3 Gestão de Clientes/Fornecedores
- Manter CRUD completo para clientes
- Adaptar para utilizar Supabase PostgreSQL
- Implementar validações no cliente e servidor

### 2.4 Gestão de Transações
- Manter CRUD completo para transações
- Adaptar para utilizar Supabase PostgreSQL
- Implementar upload de faturas para Supabase Storage
- Manter campos para valores oficiais (contribuinte) e não oficiais (bolso)

### 2.5 Estatísticas e Relatórios
- Implementar funções RPC no Supabase para cálculos complexos
- Manter visualizações por empresa, cliente, período
- Adaptar exportação para CSV via API serverless

### 2.6 Exportação/Importação
- Implementar exportação CSV via API serverless
- Implementar importação CSV via API serverless
- Utilizar Supabase Storage para armazenar ficheiros temporários

## 3. Melhorias Técnicas

### 3.1 Performance
- Implementar SSR (Server-Side Rendering) para páginas críticas
- Utilizar SWR ou React Query para cache e revalidação de dados
- Implementar paginação eficiente para listas grandes

### 3.2 Segurança
- Utilizar Row Level Security (RLS) no Supabase
- Implementar validação de dados em todas as API routes
- Sanitizar inputs para prevenir SQL injection e XSS

### 3.3 UX/UI
- Manter interface responsiva para mobile e desktop
- Implementar feedback visual para operações assíncronas
- Melhorar formulários com validação em tempo real

### 3.4 Offline Capabilities
- Implementar PWA (Progressive Web App) para uso offline básico
- Armazenar dados críticos em localStorage para acesso offline

## 4. Limitações e Considerações

### 4.1 Limitações do Vercel
- Funções serverless com timeout de 10s (plano hobby)
- Sem estado persistente entre chamadas
- Necessidade de otimizar para cold starts

### 4.2 Limitações do Supabase
- Limites de armazenamento no plano gratuito
- Limites de Row Level Security complexa
- Necessidade de otimizar queries para evitar timeouts

### 4.3 Mitigações
- Implementar paginação para todas as listas
- Otimizar queries com índices apropriados
- Utilizar cache para reduzir chamadas à API
- Implementar retry logic para operações críticas
