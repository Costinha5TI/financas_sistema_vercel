import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as variáveis de ambiente
// Estas variáveis serão definidas no Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções auxiliares para operações comuns

// Autenticação
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email, password, userData) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

// Empresas
export async function getEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nome');
  
  return { data, error };
}

export async function getEmpresa(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
}

export async function createEmpresa(empresa) {
  const { data, error } = await supabase
    .from('empresas')
    .insert([empresa])
    .select();
  
  return { data, error };
}

export async function updateEmpresa(id, empresa) {
  const { data, error } = await supabase
    .from('empresas')
    .update(empresa)
    .eq('id', id)
    .select();
  
  return { data, error };
}

export async function deleteEmpresa(id) {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);
  
  return { error };
}

// Clientes
export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome');
  
  return { data, error };
}

export async function getCliente(id) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
}

export async function createCliente(cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select();
  
  return { data, error };
}

export async function updateCliente(id, cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select();
  
  return { data, error };
}

export async function deleteCliente(id) {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);
  
  return { error };
}

// Transações
export async function getTransacoes(filters = {}) {
  let query = supabase
    .from('transacoes')
    .select(`
      *,
      empresas (id, nome),
      clientes (id, nome)
    `)
    .order('data_transacao', { ascending: false });
  
  // Aplicar filtros se existirem
  if (filters.empresa_id) {
    query = query.eq('empresa_id', filters.empresa_id);
  }
  
  if (filters.cliente_id) {
    query = query.eq('cliente_id', filters.cliente_id);
  }
  
  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }
  
  if (filters.data_inicio) {
    query = query.gte('data_transacao', filters.data_inicio);
  }
  
  if (filters.data_fim) {
    query = query.lte('data_transacao', filters.data_fim);
  }
  
  const { data, error } = await query;
  
  return { data, error };
}

export async function getTransacao(id) {
  const { data, error } = await supabase
    .from('transacoes')
    .select(`
      *,
      empresas (id, nome),
      clientes (id, nome)
    `)
    .eq('id', id)
    .single();
  
  return { data, error };
}

export async function createTransacao(transacao) {
  const { data, error } = await supabase
    .from('transacoes')
    .insert([transacao])
    .select();
  
  return { data, error };
}

export async function updateTransacao(id, transacao) {
  const { data, error } = await supabase
    .from('transacoes')
    .update(transacao)
    .eq('id', id)
    .select();
  
  return { data, error };
}

export async function deleteTransacao(id) {
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', id);
  
  return { error };
}

// Upload de arquivos
export async function uploadFile(bucket, filePath, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  return { data, error };
}

export async function getFileUrl(bucket, filePath) {
  const { data } = await supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

export async function deleteFile(bucket, filePath) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  return { error };
}

// Estatísticas
export async function getEstatisticasResumo(filters = {}) {
  // Construir a query SQL para estatísticas
  const { data, error } = await supabase.rpc('get_estatisticas_resumo', filters);
  
  return { data, error };
}

export async function getEstatisticasPorEmpresa(filters = {}) {
  const { data, error } = await supabase.rpc('get_estatisticas_por_empresa', filters);
  
  return { data, error };
}

export async function getEstatisticasPorCliente(filters = {}) {
  const { data, error } = await supabase.rpc('get_estatisticas_por_cliente', filters);
  
  return { data, error };
}

export async function getEvolucaoMensal(ano, empresa_id = null) {
  const { data, error } = await supabase.rpc('get_evolucao_mensal', { 
    p_ano: ano,
    p_empresa_id: empresa_id
  });
  
  return { data, error };
}

// Exportação
export async function exportarTransacoesCSV(filters = {}) {
  const { data, error } = await supabase.rpc('exportar_transacoes_csv', filters);
  
  return { data, error };
}
