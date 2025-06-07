import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: 'Nome do arquivo não fornecido' });
  }

  try {
    // Construir o caminho do arquivo
    const filePath = `${session.user.id}/${fileName}`;

    // Verificar se o arquivo existe
    const { data: fileExists, error: existsError } = await supabase.storage
      .from('faturas')
      .list(session.user.id, {
        search: fileName
      });

    if (existsError || !fileExists || fileExists.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Gerar URL pública temporária para download
    const { data, error } = await supabase.storage
      .from('faturas')
      .createSignedUrl(filePath, 60); // URL válida por 60 segundos

    if (error) {
      return res.status(500).json({ error: 'Erro ao gerar URL para download', details: error });
    }

    return res.status(200).json({
      success: true,
      downloadUrl: data.signedUrl
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar requisição', details: error.message });
  }
}
