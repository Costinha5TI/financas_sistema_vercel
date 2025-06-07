# Plano de Testes para Sistema de Gestão Financeira (Vercel + Supabase)

## 1. Testes de Autenticação

### 1.1 Registo de Utilizador
- Verificar se o registo de novos utilizadores funciona corretamente
- Testar validações de formulário (email, senha, campos obrigatórios)
- Confirmar que as empresas e categorias padrão são criadas automaticamente

### 1.2 Login/Logout
- Verificar se o login funciona com credenciais válidas
- Testar redirecionamento após login bem-sucedido
- Confirmar que o logout funciona e limpa a sessão corretamente
- Testar proteção de rotas (acesso a páginas sem autenticação)

## 2. Testes de Empresas

### 2.1 Listagem de Empresas
- Verificar se todas as empresas do utilizador são exibidas
- Testar filtros e ordenação
- Confirmar que apenas empresas do utilizador atual são mostradas

### 2.2 CRUD de Empresas
- Criar nova empresa e verificar se aparece na listagem
- Editar empresa existente e confirmar alterações
- Excluir empresa e verificar se foi removida
- Testar validações de formulário

## 3. Testes de Clientes/Fornecedores

### 3.1 Listagem de Clientes
- Verificar se todos os clientes do utilizador são exibidos
- Testar filtros e ordenação
- Confirmar que apenas clientes do utilizador atual são mostrados

### 3.2 CRUD de Clientes
- Criar novo cliente e verificar se aparece na listagem
- Editar cliente existente e confirmar alterações
- Excluir cliente e verificar se foi removido
- Testar validações de formulário

## 4. Testes de Transações

### 4.1 Listagem de Transações
- Verificar se todas as transações do utilizador são exibidas
- Testar filtros (empresa, cliente, tipo, data)
- Testar paginação
- Confirmar que apenas transações do utilizador atual são mostradas

### 4.2 CRUD de Transações
- Criar nova transação (receita e despesa) e verificar se aparece na listagem
- Editar transação existente e confirmar alterações
- Excluir transação e verificar se foi removida
- Testar validações de formulário

### 4.3 Upload de Faturas
- Fazer upload de imagem de fatura e verificar se é salva corretamente
- Testar diferentes formatos de imagem (JPG, PNG, etc.)
- Verificar se a imagem é exibida corretamente após upload
- Testar limites de tamanho de arquivo

### 4.4 Download de Faturas
- Verificar se o download de faturas funciona corretamente
- Testar se a URL de download é válida e segura

## 5. Testes de Estatísticas

### 5.1 Resumo Financeiro
- Verificar se os valores de receitas, despesas e saldo estão corretos
- Testar filtros (empresa, período)
- Confirmar que os valores oficiais e não oficiais são calculados corretamente

### 5.2 Estatísticas por Empresa
- Verificar se os dados são exibidos corretamente para cada empresa
- Testar filtros de período
- Confirmar cálculos de totais

### 5.3 Estatísticas por Cliente
- Verificar se os dados são exibidos corretamente para cada cliente
- Testar filtros de empresa e período
- Confirmar cálculos de totais

### 5.4 Evolução Mensal
- Verificar se os dados mensais são exibidos corretamente
- Testar filtros de ano e empresa
- Confirmar cálculos de totais por mês

## 6. Testes de Exportação/Importação

### 6.1 Exportação CSV
- Verificar se a exportação de transações para CSV funciona
- Testar filtros na exportação
- Confirmar que o arquivo gerado contém todos os dados esperados

### 6.2 Importação CSV
- Testar importação de arquivo CSV válido
- Verificar tratamento de erros para arquivos inválidos
- Confirmar que os dados importados são salvos corretamente

## 7. Testes de Responsividade

### 7.1 Desktop
- Testar em diferentes resoluções de tela (1920x1080, 1366x768, etc.)
- Verificar em diferentes navegadores (Chrome, Firefox, Safari, Edge)
- Confirmar que todos os elementos são exibidos corretamente

### 7.2 Tablet
- Testar em resoluções de tablet (iPad, Galaxy Tab, etc.)
- Verificar adaptação do layout
- Confirmar que todos os elementos são utilizáveis

### 7.3 Mobile
- Testar em resoluções de smartphone (iPhone, Android, etc.)
- Verificar adaptação do menu e navegação
- Confirmar que formulários e tabelas são utilizáveis em tela pequena

## 8. Testes de Performance

### 8.1 Carregamento Inicial
- Medir tempo de carregamento inicial da aplicação
- Verificar otimização de recursos (JS, CSS, imagens)
- Testar em conexões lentas

### 8.2 Operações CRUD
- Medir tempo de resposta para operações de criação, leitura, atualização e exclusão
- Verificar comportamento com grande volume de dados
- Testar paginação com muitos registros

### 8.3 Upload/Download
- Medir tempo de upload de arquivos de diferentes tamanhos
- Verificar tempo de download de faturas
- Testar em conexões lentas

## 9. Testes de Segurança

### 9.1 Autenticação
- Verificar proteção contra força bruta
- Testar expiração de sessão
- Confirmar que tokens JWT são válidos e seguros

### 9.2 Autorização
- Verificar que usuários só podem acessar seus próprios dados
- Testar Row Level Security do Supabase
- Confirmar que não é possível acessar dados de outros usuários via API

### 9.3 Validação de Dados
- Testar validação de entrada em todos os formulários
- Verificar proteção contra injeção SQL
- Testar manipulação de parâmetros de URL

## 10. Testes de Integração Vercel + Supabase

### 10.1 Configuração de Ambiente
- Verificar variáveis de ambiente no Vercel
- Confirmar conexão com Supabase
- Testar limites de recursos (serverless functions, storage)

### 10.2 Deploy
- Verificar processo de deploy no Vercel
- Testar atualizações e rollbacks
- Confirmar que todas as funcionalidades funcionam após deploy

### 10.3 Backup e Recuperação
- Testar exportação completa de dados
- Verificar processo de backup do Supabase
- Confirmar que é possível recuperar dados em caso de falha
