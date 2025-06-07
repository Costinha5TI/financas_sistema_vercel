import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

// Componentes
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import TransacaoForm from '../components/TransacaoForm';

export default function NovaTransacao() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState(null);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Buscar dados necessários para o formulário
  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar empresas
      const empresasResponse = await fetch('/api/empresas');
      if (empresasResponse.ok) {
        const empresasData = await empresasResponse.json();
        setEmpresas(empresasData);
      }

      // Buscar clientes
      const clientesResponse = await fetch('/api/clientes');
      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        setClientes(clientesData);
      }

      // Buscar categorias
      const categoriasResponse = await fetch('/api/categorias');
      if (categoriasResponse.ok) {
        const categoriasData = await categoriasResponse.json();
        setCategorias(categoriasData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar dados necessários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar formulário
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/transacoes', {
        method: 'POST',
        body: formData, // FormData já está pronto para envio com arquivo
      });

      if (response.ok) {
        // Redirecionar para a lista de transações após sucesso
        router.push('/transacoes');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao criar transação');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setError('Erro ao processar requisição. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Nova Transação | Sistema de Gestão Financeira</title>
        <meta name="description" content="Adicionar nova transação no sistema de gestão financeira" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Navbar user={session?.user} />
      
      <div className={styles.content}>
        <Sidebar />
        
        <main className={styles.main}>
          <h1 className={styles.title}>Nova Transação</h1>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div className={styles.section}>
            <TransacaoForm 
              empresas={empresas}
              clientes={clientes}
              categorias={categorias}
              onSubmit={handleSubmit}
              isLoading={submitting}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
