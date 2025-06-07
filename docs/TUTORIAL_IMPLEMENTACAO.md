# Tutorial de Implementação do Sistema de Gestão Financeira (Vercel + Supabase)

Este tutorial detalhado irá guiá-lo através do processo completo de configuração e implementação do Sistema de Gestão Financeira utilizando Vercel para o frontend/backend serverless e Supabase para a base de dados e armazenamento.

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Configuração do Supabase](#2-configuração-do-supabase)
3. [Configuração do Vercel](#3-configuração-do-vercel)
4. [Implementação do Sistema](#4-implementação-do-sistema)
5. [Configuração Pós-Implementação](#5-configuração-pós-implementação)
6. [Utilização do Sistema](#6-utilização-do-sistema)
7. [Resolução de Problemas Comuns](#7-resolução-de-problemas-comuns)

## 1. Pré-requisitos

Antes de começar, certifique-se de que possui:

- Uma conta no [GitHub](https://github.com/)
- Uma conta no [Vercel](https://vercel.com/)
- Uma conta no [Supabase](https://supabase.com/)
- Git instalado no seu computador (opcional para desenvolvimento local)
- Node.js instalado no seu computador (opcional para desenvolvimento local)

## 2. Configuração do Supabase

### 2.1. Criar um Novo Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com/) e faça login
2. Clique em "New Project"
3. Escolha uma organização ou crie uma nova
4. Preencha os detalhes do projeto:
   - Nome: `financas-sistema` (ou outro nome de sua preferência)
   - Base de dados: Escolha uma senha forte para o banco de dados
   - Região: Escolha a região mais próxima de você
5. Clique em "Create new project"
6. Aguarde a criação do projeto (pode levar alguns minutos)

### 2.2. Configurar a Base de Dados

Após a criação do projeto, você precisa configurar as tabelas e funções necessárias:

1. No painel do Supabase, vá para a seção "SQL Editor"
2. Clique em "New query"
3. Cole o seguinte script SQL e execute:

```sql
-- Criar tabela de usuários (complementar à auth.users do Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de empresas
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50),
  descricao TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de clientes/fornecedores
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50),
  contato VARCHAR(100),
  email VARCHAR(100),
  telefone VARCHAR(20),
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de categorias
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor_contribuinte DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_bolso DECIMAL(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT,
  data_transacao DATE NOT NULL,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  foto_fatura VARCHAR(255),
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Criar tabela de backups
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  nome_arquivo VARCHAR(255) NOT NULL,
  data_backup TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tipo VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Criar funções para estatísticas
CREATE OR REPLACE FUNCTION get_estatisticas_resumo(
  p_empresa_id INTEGER DEFAULT NULL,
  p_periodo VARCHAR DEFAULT 'mes',
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_data_inicio DATE;
  v_data_fim DATE;
  v_receitas_contribuinte DECIMAL(10, 2);
  v_receitas_bolso DECIMAL(10, 2);
  v_despesas_contribuinte DECIMAL(10, 2);
  v_despesas_bolso DECIMAL(10, 2);
  v_resultado JSON;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  -- Definir período de datas
  IF p_periodo = 'dia' THEN
    v_data_inicio := CURRENT_DATE;
    v_data_fim := CURRENT_DATE;
  ELSIF p_periodo = 'mes' THEN
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  ELSIF p_periodo = 'ano' THEN
    v_data_inicio := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
  ELSIF p_periodo = 'personalizado' AND p_data_inicio IS NOT NULL AND p_data_fim IS NOT NULL THEN
    v_data_inicio := p_data_inicio;
    v_data_fim := p_data_fim;
  ELSE
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;
  
  -- Calcular receitas
  SELECT 
    COALESCE(SUM(valor_contribuinte), 0),
    COALESCE(SUM(valor_bolso), 0)
  INTO 
    v_receitas_contribuinte,
    v_receitas_bolso
  FROM 
    transacoes
  WHERE 
    user_id = v_user_id
    AND tipo = 'receita'
    AND data_transacao BETWEEN v_data_inicio AND v_data_fim
    AND (p_empresa_id IS NULL OR empresa_id = p_empresa_id);
  
  -- Calcular despesas
  SELECT 
    COALESCE(SUM(valor_contribuinte), 0),
    COALESCE(SUM(valor_bolso), 0)
  INTO 
    v_despesas_contribuinte,
    v_despesas_bolso
  FROM 
    transacoes
  WHERE 
    user_id = v_user_id
    AND tipo = 'despesa'
    AND data_transacao BETWEEN v_data_inicio AND v_data_fim
    AND (p_empresa_id IS NULL OR empresa_id = p_empresa_id);
  
  -- Construir resultado JSON
  v_resultado := json_build_object(
    'periodo', json_build_object(
      'inicio', v_data_inicio,
      'fim', v_data_fim
    ),
    'receitas', json_build_object(
      'contribuinte', v_receitas_contribuinte,
      'bolso', v_receitas_bolso,
      'total', v_receitas_contribuinte + v_receitas_bolso
    ),
    'despesas', json_build_object(
      'contribuinte', v_despesas_contribuinte,
      'bolso', v_despesas_bolso,
      'total', v_despesas_contribuinte + v_despesas_bolso
    ),
    'saldo', json_build_object(
      'contribuinte', v_receitas_contribuinte - v_despesas_contribuinte,
      'bolso', v_receitas_bolso - v_despesas_bolso,
      'total', (v_receitas_contribuinte + v_receitas_bolso) - (v_despesas_contribuinte + v_despesas_bolso)
    )
  );
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas por empresa
CREATE OR REPLACE FUNCTION get_estatisticas_por_empresa(
  p_periodo VARCHAR DEFAULT 'mes',
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_data_inicio DATE;
  v_data_fim DATE;
  v_empresas JSON;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  -- Definir período de datas
  IF p_periodo = 'dia' THEN
    v_data_inicio := CURRENT_DATE;
    v_data_fim := CURRENT_DATE;
  ELSIF p_periodo = 'mes' THEN
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  ELSIF p_periodo = 'ano' THEN
    v_data_inicio := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
  ELSIF p_periodo = 'personalizado' AND p_data_inicio IS NOT NULL AND p_data_fim IS NOT NULL THEN
    v_data_inicio := p_data_inicio;
    v_data_fim := p_data_fim;
  ELSE
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;
  
  -- Obter estatísticas por empresa
  SELECT json_agg(
    json_build_object(
      'id', e.id,
      'nome', e.nome,
      'receitas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      ),
      'despesas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      ),
      'saldo', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      )
    )
  )
  INTO v_empresas
  FROM empresas e
  LEFT JOIN transacoes t ON e.id = t.empresa_id 
    AND t.data_transacao BETWEEN v_data_inicio AND v_data_fim
  WHERE e.user_id = v_user_id
  GROUP BY e.id, e.nome;
  
  RETURN json_build_object(
    'periodo', json_build_object(
      'inicio', v_data_inicio,
      'fim', v_data_fim
    ),
    'empresas', COALESCE(v_empresas, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas por cliente
CREATE OR REPLACE FUNCTION get_estatisticas_por_cliente(
  p_empresa_id INTEGER DEFAULT NULL,
  p_periodo VARCHAR DEFAULT 'mes',
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_data_inicio DATE;
  v_data_fim DATE;
  v_clientes JSON;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  -- Definir período de datas
  IF p_periodo = 'dia' THEN
    v_data_inicio := CURRENT_DATE;
    v_data_fim := CURRENT_DATE;
  ELSIF p_periodo = 'mes' THEN
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  ELSIF p_periodo = 'ano' THEN
    v_data_inicio := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
  ELSIF p_periodo = 'personalizado' AND p_data_inicio IS NOT NULL AND p_data_fim IS NOT NULL THEN
    v_data_inicio := p_data_inicio;
    v_data_fim := p_data_fim;
  ELSE
    v_data_inicio := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_data_fim := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;
  
  -- Obter estatísticas por cliente
  WITH transacoes_periodo AS (
    SELECT 
      t.cliente_id,
      c.nome AS cliente_nome,
      t.tipo,
      t.valor_contribuinte,
      t.valor_bolso
    FROM 
      transacoes t
      LEFT JOIN clientes c ON t.cliente_id = c.id
    WHERE 
      t.user_id = v_user_id
      AND t.data_transacao BETWEEN v_data_inicio AND v_data_fim
      AND (p_empresa_id IS NULL OR t.empresa_id = p_empresa_id)
  )
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'nome', c.nome,
      'receitas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_contribuinte + tp.valor_bolso ELSE 0 END), 0)
      ),
      'despesas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_contribuinte + tp.valor_bolso ELSE 0 END), 0)
      ),
      'saldo', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_contribuinte ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tp.tipo = 'receita' THEN tp.valor_contribuinte + tp.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tp.tipo = 'despesa' THEN tp.valor_contribuinte + tp.valor_bolso ELSE 0 END), 0)
      )
    )
  )
  INTO v_clientes
  FROM clientes c
  LEFT JOIN transacoes_periodo tp ON c.id = tp.cliente_id
  WHERE c.user_id = v_user_id
  GROUP BY c.id, c.nome
  
  UNION
  
  -- Adicionar transações sem cliente
  SELECT json_agg(
    json_build_object(
      'id', NULL,
      'nome', 'Sem Cliente/Fornecedor',
      'receitas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_contribuinte + valor_bolso ELSE 0 END), 0)
      ),
      'despesas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_contribuinte + valor_bolso ELSE 0 END), 0)
      ),
      'saldo', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_contribuinte ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_contribuinte + valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_contribuinte + valor_bolso ELSE 0 END), 0)
      )
    )
  )
  FROM transacoes_periodo
  WHERE cliente_id IS NULL;
  
  RETURN json_build_object(
    'periodo', json_build_object(
      'inicio', v_data_inicio,
      'fim', v_data_fim
    ),
    'clientes', COALESCE(v_clientes, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para evolução mensal
CREATE OR REPLACE FUNCTION get_evolucao_mensal(
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_empresa_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_evolucao JSON;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  -- Obter evolução mensal
  WITH meses AS (
    SELECT generate_series(1, 12) AS mes
  ),
  nomes_meses AS (
    SELECT 
      mes,
      CASE 
        WHEN mes = 1 THEN 'Janeiro'
        WHEN mes = 2 THEN 'Fevereiro'
        WHEN mes = 3 THEN 'Março'
        WHEN mes = 4 THEN 'Abril'
        WHEN mes = 5 THEN 'Maio'
        WHEN mes = 6 THEN 'Junho'
        WHEN mes = 7 THEN 'Julho'
        WHEN mes = 8 THEN 'Agosto'
        WHEN mes = 9 THEN 'Setembro'
        WHEN mes = 10 THEN 'Outubro'
        WHEN mes = 11 THEN 'Novembro'
        WHEN mes = 12 THEN 'Dezembro'
      END AS nome_mes
    FROM meses
  )
  SELECT json_agg(
    json_build_object(
      'mes', m.mes,
      'nome_mes', m.nome_mes,
      'receitas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      ),
      'despesas', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      ),
      'saldo', json_build_object(
        'contribuinte', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte ELSE 0 END), 0),
        'bolso', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_bolso ELSE 0 END), 0),
        'total', COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor_contribuinte + t.valor_bolso ELSE 0 END), 0)
      )
    )
    ORDER BY m.mes
  )
  INTO v_evolucao
  FROM nomes_meses m
  LEFT JOIN transacoes t ON 
    EXTRACT(MONTH FROM t.data_transacao) = m.mes 
    AND EXTRACT(YEAR FROM t.data_transacao) = p_ano
    AND t.user_id = v_user_id
    AND (p_empresa_id IS NULL OR t.empresa_id = p_empresa_id)
  GROUP BY m.mes, m.nome_mes;
  
  RETURN json_build_object(
    'ano', p_ano,
    'evolucao_mensal', COALESCE(v_evolucao, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar políticas de segurança (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Criar políticas para usuários
CREATE POLICY users_policy ON users
  USING (id = auth.uid());

-- Criar políticas para empresas
CREATE POLICY empresas_policy ON empresas
  USING (user_id = auth.uid());

-- Criar políticas para clientes
CREATE POLICY clientes_policy ON clientes
  USING (user_id = auth.uid());

-- Criar políticas para categorias
CREATE POLICY categorias_policy ON categorias
  USING (user_id = auth.uid());

-- Criar políticas para transações
CREATE POLICY transacoes_policy ON transacoes
  USING (user_id = auth.uid());

-- Criar políticas para backups
CREATE POLICY backups_policy ON backups
  USING (user_id = auth.uid());
```

### 2.3. Configurar Autenticação

1. No painel do Supabase, vá para a seção "Authentication" > "Providers"
2. Habilite o provedor "Email"
3. Configure as opções conforme necessário:
   - Confirm email: Ative para maior segurança
   - Secure email change: Ative
   - Custom email templates: Mantenha os padrões ou personalize conforme desejado

### 2.4. Configurar Storage

1. No painel do Supabase, vá para a seção "Storage"
2. Clique em "Create bucket"
3. Crie um bucket chamado "faturas" com acesso público
4. Após criar o bucket, vá para a aba "Policies"
5. Adicione as seguintes políticas:

Para leitura:
```sql
(bucket_id = 'faturas'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```

Para inserção:
```sql
(bucket_id = 'faturas'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```

Para atualização:
```sql
(bucket_id = 'faturas'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```

Para exclusão:
```sql
(bucket_id = 'faturas'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```

### 2.5. Obter Credenciais do Supabase

1. No painel do Supabase, vá para a seção "Settings" > "API"
2. Anote as seguintes informações:
   - Project URL
   - Project API Key (anon, public)
   - JWT Secret (para configuração avançada)

## 3. Configuração do Vercel

### 3.1. Preparar o Repositório

1. Faça fork do repositório do sistema para sua conta GitHub:
   - Acesse o repositório original
   - Clique no botão "Fork" no canto superior direito
   - Selecione sua conta como destino do fork

### 3.2. Conectar o Vercel ao GitHub

1. Acesse [vercel.com](https://vercel.com/) e faça login
2. Clique em "Add New" > "Project"
3. Conecte sua conta GitHub se ainda não estiver conectada
4. Selecione o repositório que você acabou de fazer fork
5. Configure as opções do projeto:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
   - Install Command: `npm install`

### 3.3. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente:

| Nome | Valor | Descrição |
|------|-------|-----------|
| NEXT_PUBLIC_SUPABASE_URL | URL do seu projeto Supabase | URL do projeto Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave anônima do Supabase | Chave pública do projeto Supabase |
| NEXTAUTH_URL | URL do seu site Vercel | URL completa do seu site (ex: https://seu-projeto.vercel.app) |
| NEXTAUTH_SECRET | Gere uma string aleatória | Chave secreta para NextAuth (use um gerador de strings aleatórias) |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase | Encontrada em Settings > API > service_role (mantenha em segredo) |

### 3.4. Implantar o Projeto

1. Clique em "Deploy"
2. Aguarde a conclusão do deploy
3. Após o deploy, você receberá uma URL para acessar seu site (ex: https://seu-projeto.vercel.app)

## 4. Implementação do Sistema

### 4.1. Primeiro Acesso e Configuração

1. Acesse a URL do seu site Vercel
2. Clique em "Registrar" para criar uma nova conta
3. Preencha os dados solicitados e crie sua conta
4. Após o login, você será redirecionado para o dashboard
5. O sistema criará automaticamente as empresas padrão:
   - Nacional
   - Riverside
   - River Vibes
   - Segmento Mutante

### 4.2. Configuração Inicial

1. Acesse a seção "Empresas" para verificar se as empresas padrão foram criadas
2. Acesse a seção "Categorias" para adicionar categorias de receitas e despesas
3. Acesse a seção "Clientes/Fornecedores" para adicionar seus clientes e fornecedores

## 5. Configuração Pós-Implementação

### 5.1. Configurar Backup Automático (Opcional)

Para configurar backups automáticos do Supabase:

1. No painel do Supabase, vá para a seção "Settings" > "Database"
2. Configure a frequência de backups conforme sua necessidade
3. Para backups manuais, você pode usar a função de exportação do sistema

### 5.2. Monitoramento e Logs

1. No Vercel, acesse a seção "Analytics" para monitorar o desempenho do seu site
2. No Supabase, acesse a seção "Database" > "Logs" para monitorar as operações do banco de dados

## 6. Utilização do Sistema

### 6.1. Dashboard

O dashboard apresenta um resumo financeiro com:
- Receitas totais (oficiais e não oficiais)
- Despesas totais (oficiais e não oficiais)
- Saldo atual
- Últimas transações

### 6.2. Gerenciamento de Empresas

Na seção "Empresas", você pode:
- Visualizar todas as empresas
- Adicionar novas empresas
- Editar empresas existentes
- Excluir empresas (cuidado: isso excluirá todas as transações associadas)

### 6.3. Gerenciamento de Clientes/Fornecedores

Na seção "Clientes/Fornecedores", você pode:
- Visualizar todos os clientes e fornecedores
- Adicionar novos clientes/fornecedores
- Editar clientes/fornecedores existentes
- Excluir clientes/fornecedores

### 6.4. Gerenciamento de Transações

Na seção "Transações", você pode:
- Visualizar todas as transações
- Filtrar por empresa, cliente, tipo e data
- Adicionar novas transações (receitas ou despesas)
- Editar transações existentes
- Excluir transações
- Anexar fotos de faturas às transações

#### 6.4.1. Adicionar Nova Transação

Para adicionar uma nova transação:
1. Clique em "Nova Transação"
2. Selecione o tipo (receita ou despesa)
3. Preencha os valores oficiais (contribuinte) e não oficiais (bolso)
4. Selecione a empresa, cliente/fornecedor e categoria
5. Adicione uma descrição (opcional)
6. Anexe uma foto da fatura (opcional)
7. Clique em "Guardar"

### 6.5. Estatísticas

Na seção "Estatísticas", você pode:
- Visualizar resumo financeiro por período
- Visualizar estatísticas por empresa
- Visualizar estatísticas por cliente/fornecedor
- Visualizar evolução mensal
- Filtrar por empresa, período e ano

### 6.6. Exportação/Importação

Na seção "Exportar/Importar", você pode:
- Exportar transações para CSV
- Importar transações de CSV
- Filtrar dados para exportação

## 7. Resolução de Problemas Comuns

### 7.1. Problemas de Autenticação

**Problema**: Não consigo fazer login ou registrar uma conta.

**Solução**:
1. Verifique se as variáveis de ambiente NEXTAUTH_URL e NEXTAUTH_SECRET estão configuradas corretamente no Vercel
2. Verifique se a autenticação por email está habilitada no Supabase
3. Verifique os logs do Vercel para identificar erros específicos

### 7.2. Problemas com Upload de Faturas

**Problema**: Não consigo fazer upload de faturas ou as imagens não são exibidas.

**Solução**:
1. Verifique se o bucket "faturas" foi criado no Supabase Storage
2. Verifique se as políticas de acesso ao bucket estão configuradas corretamente
3. Verifique se o tamanho do arquivo não excede o limite (10MB)
4. Verifique se o formato do arquivo é suportado (JPG, PNG, etc.)

### 7.3. Problemas com Estatísticas

**Problema**: As estatísticas não estão sendo exibidas corretamente.

**Solução**:
1. Verifique se as funções SQL para estatísticas foram criadas corretamente no Supabase
2. Verifique se há transações registradas no período selecionado
3. Limpe o cache do navegador e tente novamente

### 7.4. Problemas de Performance

**Problema**: O sistema está lento ou não responde.

**Solução**:
1. Verifique a quantidade de dados no sistema (muitas transações podem afetar a performance)
2. Considere implementar paginação adicional ou otimizações de consulta
3. Verifique os recursos do seu plano Supabase e Vercel (planos gratuitos têm limitações)

### 7.5. Erros de Implantação no Vercel

**Problema**: O deploy no Vercel falha.

**Solução**:
1. Verifique os logs de build no Vercel para identificar o erro específico
2. Verifique se todas as variáveis de ambiente necessárias estão configuradas
3. Tente fazer um novo deploy após corrigir os problemas identificados

## Conclusão

Parabéns! Você agora tem um Sistema de Gestão Financeira completo rodando no Vercel com Supabase. Este sistema permite gerenciar transações financeiras para múltiplas empresas, com separação entre valores oficiais e não oficiais, upload de faturas, estatísticas detalhadas e muito mais.

Para qualquer dúvida adicional ou suporte, consulte a documentação do Vercel e Supabase ou entre em contato com o desenvolvedor do sistema.

---

**Nota**: Este tutorial assume conhecimento básico de Git, GitHub, e desenvolvimento web. Se você encontrar dificuldades, considere buscar ajuda de um desenvolvedor ou consultor técnico.
