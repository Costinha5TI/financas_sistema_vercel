import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';

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

  // Obter ID da transação da URL
  const { id } = req.query;

  // Processar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      if (id) {
        // Obter uma transação específica
        const { data, error } = await supabase
          .from('transacoes')
          .select(`
            *,
            empresas (id, nome),
            clientes (id, nome),
            categorias (id, nome, tipo)
          `)
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Transação não encontrada' });
        }

        // Se houver foto de fatura, gerar URL pública
        if (data.foto_fatura) {
          const { data: urlData } = await supabase.storage
            .from('faturas')
            .getPublicUrl(`${session.user.id}/${data.foto_fatura}`);
          
          data.foto_fatura_url = urlData.publicUrl;
        }

        return res.status(200).json(data);
      } else {
        // Listar transações com filtros
        const { 
          empresa_id, 
          cliente_id, 
          categoria_id,
          tipo, 
          data_inicio, 
          data_fim,
          page = 1,
          per_page = 20
        } = req.query;

        let query = supabase
          .from('transacoes')
          .select(`
            *,
            empresas (id, nome),
            clientes (id, nome),
            categorias (id, nome, tipo)
          `, { count: 'exact' })
          .eq('user_id', session.user.id)
          .order('data_transacao', { ascending: false });

        // Aplicar filtros
        if (empresa_id) query = query.eq('empresa_id', empresa_id);
        if (cliente_id) query = query.eq('cliente_id', cliente_id);
        if (categoria_id) query = query.eq('categoria_id', categoria_id);
        if (tipo) query = query.eq('tipo', tipo);
        if (data_inicio) query = query.gte('data_transacao', data_inicio);
        if (data_fim) query = query.lte('data_transacao', data_fim);

        // Aplicar paginação
        const from = (page - 1) * per_page;
        const to = from + per_page - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          return res.status(500).json({ error: 'Erro ao buscar transações', details: error });
        }

        // Gerar URLs para fotos de faturas
        for (const transacao of data) {
          if (transacao.foto_fatura) {
            const { data: urlData } = await supabase.storage
              .from('faturas')
              .getPublicUrl(`${session.user.id}/${transacao.foto_fatura}`);
            
            transacao.foto_fatura_url = urlData.publicUrl;
          }
        }

        return res.status(200).json({
          data,
          pagination: {
            total: count,
            page: parseInt(page),
            per_page: parseInt(per_page),
            total_pages: Math.ceil(count / per_page)
          }
        });
      }

    case 'POST':
      try {
        // Processar form-data para upload de arquivo
        const { fields, files } = await parseForm(req);
        
        // Preparar dados da transação
        const novaTransacao = {
          tipo: fields.tipo,
          valor_contribuinte: parseFloat(fields.valor_contribuinte || 0),
          valor_bolso: parseFloat(fields.valor_bolso || 0),
          descricao: fields.descricao,
          data_transacao: fields.data_transacao || new Date().toISOString().split('T')[0],
          empresa_id: parseInt(fields.empresa_id),
          cliente_id: fields.cliente_id ? parseInt(fields.cliente_id) : null,
          categoria_id: fields.categoria_id ? parseInt(fields.categoria_id) : null,
          user_id: session.user.id
        };

        // Upload da foto da fatura, se existir
        if (files.foto_fatura && files.foto_fatura.size > 0) {
          const file = files.foto_fatura;
          const fileExt = file.originalFilename.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          // Ler o arquivo
          const fileBuffer = fs.readFileSync(file.filepath);
          
          // Upload para o Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('faturas')
            .upload(filePath, fileBuffer, {
              contentType: file.mimetype,
              cacheControl: '3600'
            });

          if (uploadError) {
            return res.status(500).json({ error: 'Erro ao fazer upload da fatura', details: uploadError });
          }

          // Adicionar caminho do arquivo à transação
          novaTransacao.foto_fatura = fileName;
        }

        // Inserir transação no banco de dados
        const { data: transacaoCriada, error: errorCriacao } = await supabase
          .from('transacoes')
          .insert([novaTransacao])
          .select();

        if (errorCriacao) {
          return res.status(500).json({ error: 'Erro ao criar transação', details: errorCriacao });
        }

        return res.status(201).json(transacaoCriada[0]);
      } catch (error) {
        return res.status(500).json({ error: 'Erro ao processar requisição', details: error.message });
      }

    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'ID da transação não fornecido' });
      }

      try {
        // Processar form-data para upload de arquivo
        const { fields, files } = await parseForm(req);
        
        // Buscar transação existente
        const { data: transacaoExistente, error: errorBusca } = await supabase
          .from('transacoes')
          .select('*')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (errorBusca || !transacaoExistente) {
          return res.status(404).json({ error: 'Transação não encontrada ou não pertence ao usuário' });
        }

        // Preparar dados da transação
        const transacaoAtualizada = {
          tipo: fields.tipo,
          valor_contribuinte: parseFloat(fields.valor_contribuinte || 0),
          valor_bolso: parseFloat(fields.valor_bolso || 0),
          descricao: fields.descricao,
          data_transacao: fields.data_transacao,
          empresa_id: parseInt(fields.empresa_id),
          cliente_id: fields.cliente_id ? parseInt(fields.cliente_id) : null,
          categoria_id: fields.categoria_id ? parseInt(fields.categoria_id) : null
        };

        // Upload da nova foto da fatura, se existir
        if (files.foto_fatura && files.foto_fatura.size > 0) {
          const file = files.foto_fatura;
          const fileExt = file.originalFilename.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          // Ler o arquivo
          const fileBuffer = fs.readFileSync(file.filepath);
          
          // Upload para o Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('faturas')
            .upload(filePath, fileBuffer, {
              contentType: file.mimetype,
              cacheControl: '3600'
            });

          if (uploadError) {
            return res.status(500).json({ error: 'Erro ao fazer upload da fatura', details: uploadError });
          }

          // Excluir foto antiga se existir
          if (transacaoExistente.foto_fatura) {
            await supabase.storage
              .from('faturas')
              .remove([`${session.user.id}/${transacaoExistente.foto_fatura}`]);
          }

          // Adicionar caminho do arquivo à transação
          transacaoAtualizada.foto_fatura = fileName;
        }

        // Atualizar transação no banco de dados
        const { data: transacaoAtualizadaResult, error: errorAtualizacao } = await supabase
          .from('transacoes')
          .update(transacaoAtualizada)
          .eq('id', id)
          .eq('user_id', session.user.id)
          .select();

        if (errorAtualizacao) {
          return res.status(500).json({ error: 'Erro ao atualizar transação', details: errorAtualizacao });
        }

        return res.status(200).json(transacaoAtualizadaResult[0]);
      } catch (error) {
        return res.status(500).json({ error: 'Erro ao processar requisição', details: error.message });
      }

    case 'DELETE':
      // Excluir uma transação
      if (!id) {
        return res.status(400).json({ error: 'ID da transação não fornecido' });
      }

      // Buscar transação para obter foto da fatura
      const { data: transacaoParaExcluir } = await supabase
        .from('transacoes')
        .select('foto_fatura')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      // Excluir foto da fatura se existir
      if (transacaoParaExcluir?.foto_fatura) {
        await supabase.storage
          .from('faturas')
          .remove([`${session.user.id}/${transacaoParaExcluir.foto_fatura}`]);
      }

      // Excluir transação
      const { error: errorExclusao } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (errorExclusao) {
        return res.status(500).json({ error: 'Erro ao excluir transação', details: errorExclusao });
      }

      return res.status(200).json({ message: 'Transação excluída com sucesso' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
