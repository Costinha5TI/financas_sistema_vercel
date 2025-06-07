import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Obter parâmetros da requisição
  const { 
    empresa_id, 
    periodo = 'mes', 
    data_inicio, 
    data_fim 
  } = req.query;

  try {
    // Chamar função RPC do Supabase para obter estatísticas
    const { data, error } = await supabase.rpc('get_estatisticas_resumo', {
      p_empresa_id: empresa_id ? parseInt(empresa_id) : null,
      p_periodo: periodo,
      p_data_inicio: data_inicio || null,
      p_data_fim: data_fim || null
    });

    if (error) {
      return res.status(500).json({ error: 'Erro ao obter estatísticas', details: error });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar requisição', details: error.message });
  }
}
