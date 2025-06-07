import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Obter ID da empresa da URL
  const { id } = req.query;

  // Processar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      if (id) {
        // Obter uma empresa específica
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        return res.status(200).json(data);
      } else {
        // Listar todas as empresas
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .order('nome');

        if (error) {
          return res.status(500).json({ error: 'Erro ao buscar empresas' });
        }

        return res.status(200).json(data);
      }

    case 'POST':
      // Criar uma nova empresa
      const novaEmpresa = {
        ...req.body,
        user_id: session.user.id
      };

      const { data: empresaCriada, error: errorCriacao } = await supabase
        .from('empresas')
        .insert([novaEmpresa])
        .select();

      if (errorCriacao) {
        return res.status(500).json({ error: 'Erro ao criar empresa', details: errorCriacao });
      }

      return res.status(201).json(empresaCriada[0]);

    case 'PUT':
      // Atualizar uma empresa existente
      if (!id) {
        return res.status(400).json({ error: 'ID da empresa não fornecido' });
      }

      const { data: empresaAtualizada, error: errorAtualizacao } = await supabase
        .from('empresas')
        .update(req.body)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select();

      if (errorAtualizacao) {
        return res.status(500).json({ error: 'Erro ao atualizar empresa', details: errorAtualizacao });
      }

      if (!empresaAtualizada || empresaAtualizada.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada ou não pertence ao usuário' });
      }

      return res.status(200).json(empresaAtualizada[0]);

    case 'DELETE':
      // Excluir uma empresa
      if (!id) {
        return res.status(400).json({ error: 'ID da empresa não fornecido' });
      }

      const { error: errorExclusao } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (errorExclusao) {
        return res.status(500).json({ error: 'Erro ao excluir empresa', details: errorExclusao });
      }

      return res.status(200).json({ message: 'Empresa excluída com sucesso' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
