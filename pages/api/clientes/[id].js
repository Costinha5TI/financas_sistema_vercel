import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Obter ID do cliente da URL
  const { id } = req.query;

  // Processar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      if (id) {
        // Obter um cliente específico
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(data);
      } else {
        // Listar todos os clientes
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('nome');

        if (error) {
          return res.status(500).json({ error: 'Erro ao buscar clientes' });
        }

        return res.status(200).json(data);
      }

    case 'POST':
      // Criar um novo cliente
      const novoCliente = {
        ...req.body,
        user_id: session.user.id
      };

      const { data: clienteCriado, error: errorCriacao } = await supabase
        .from('clientes')
        .insert([novoCliente])
        .select();

      if (errorCriacao) {
        return res.status(500).json({ error: 'Erro ao criar cliente', details: errorCriacao });
      }

      return res.status(201).json(clienteCriado[0]);

    case 'PUT':
      // Atualizar um cliente existente
      if (!id) {
        return res.status(400).json({ error: 'ID do cliente não fornecido' });
      }

      const { data: clienteAtualizado, error: errorAtualizacao } = await supabase
        .from('clientes')
        .update(req.body)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select();

      if (errorAtualizacao) {
        return res.status(500).json({ error: 'Erro ao atualizar cliente', details: errorAtualizacao });
      }

      if (!clienteAtualizado || clienteAtualizado.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado ou não pertence ao usuário' });
      }

      return res.status(200).json(clienteAtualizado[0]);

    case 'DELETE':
      // Excluir um cliente
      if (!id) {
        return res.status(400).json({ error: 'ID do cliente não fornecido' });
      }

      const { error: errorExclusao } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (errorExclusao) {
        return res.status(500).json({ error: 'Erro ao excluir cliente', details: errorExclusao });
      }

      return res.status(200).json({ message: 'Cliente excluído com sucesso' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
