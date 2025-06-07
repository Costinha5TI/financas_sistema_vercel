import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

// Componentes
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import ResumoFinanceiro from '../components/ResumoFinanceiro';
import UltimasTransacoes from '../components/UltimasTransacoes';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [empresas, setEmpresas] = useState([]);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchEmpresas();
      fetchResumo();
      fetchTransacoes();
    }
  }, [status, empresaSelecionada]);

  // Buscar empresas
  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas');
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  // Buscar resumo financeiro
  const fetchResumo = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (empresaSelecionada) {
        params.append('empresa_id', empresaSelecionada);
      }
      
      const response = await fetch(`/api/estatisticas/resumo?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResumo(data);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar últimas transações
  const fetchTransacoes = async () => {
    try {
      const params = new URLSearchParams({
        page: 1,
        per_page: 5
      });
      
      if (empresaSelecionada) {
        params.append('empresa_id', empresaSelecionada);
      }
      
      const response = await fetch(`/api/transacoes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransacoes(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };

  // Alternar empresa selecionada
  const handleChangeEmpresa = (empresaId) => {
    setEmpresaSelecionada(empresaId === 'todas' ? null : empresaId);
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Sistema de Gestão Financeira</title>
        <meta name="description" content="Sistema de gestão financeira para restaurantes e empresas" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Navbar />
      
      <div className={styles.content}>
        <Sidebar />
        
        <main className={styles.main}>
          <h1 className={styles.title}>Dashboard</h1>
          
          <div className={styles.empresaSelector}>
            <label htmlFor="empresa">Empresa:</label>
            <select 
              id="empresa" 
              value={empresaSelecionada || 'todas'} 
              onChange={(e) => handleChangeEmpresa(e.target.value)}
            >
              <option value="todas">Todas as Empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
              ))}
            </select>
          </div>
          
          {resumo && <ResumoFinanceiro resumo={resumo} />}
          
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Últimas Transações</h2>
              <Link href="/transacoes" className={styles.viewAll}>
                Ver todas
              </Link>
            </div>
            
            <UltimasTransacoes transacoes={transacoes} />
            
            <div className={styles.actions}>
              <Link href="/transacoes/nova" className={styles.button}>
                Nova Transação
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
