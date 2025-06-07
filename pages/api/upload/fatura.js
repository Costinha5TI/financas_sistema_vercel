import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Desativar o bodyParser padrão do Next.js para lidar com form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para processar o upload de arquivos
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    // Processar form-data para upload de arquivo
    const { fields, files } = await parseForm(req);
    
    if (!files.file || files.file.size === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const file = files.file;
    const fileExt = file.originalFilename.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('faturas')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (error) {
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo', details: error });
    }

    // Gerar URL pública
    const { data: urlData } = await supabase.storage
      .from('faturas')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      fileName: fileName,
      filePath: filePath,
      publicUrl: urlData.publicUrl
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar requisição', details: error.message });
  }
}
