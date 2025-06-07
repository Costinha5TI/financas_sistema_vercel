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

export default function Transacoes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    cliente_id: '',
    tipo: '',
    data_inicio: '',
    data_fim: ''
  });
  
  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchEmpresas();
      fetchClientes();
      fetchTransacoes();
    }
  }, [status]);
  
  // Buscar transações com filtros e paginação
  const fetchTransacoes = async (page = 1) => {
    setLoading(true);
    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams({
        page: page,
        per_page: pagination.per_page
      });
      
      // Adicionar filtros se existirem
      if (filtros.empresa_id) params.append('empresa_id', filtros.empresa_id);
      if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      
      const response = await fetch(`/api/transacoes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransacoes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar empresas para filtro
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
  
  // Buscar clientes para filtro
  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };
  
  // Atualizar filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };
  
  // Aplicar filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    fetchTransacoes(1); // Voltar para a primeira página ao filtrar
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      empresa_id: '',
      cliente_id: '',
      tipo: '',
      data_inicio: '',
      data_fim: ''
    });
    fetchTransacoes(1);
  };
  
  // Mudar página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= pagination.total_pages) {
      fetchTransacoes(novaPagina);
    }
  };
  
  // Excluir transação
  const excluirTransacao = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const response = await fetch(`/api/transacoes/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Atualizar lista após exclusão
          fetchTransacoes(pagination.page);
        } else {
          alert('Erro ao excluir transação');
        }
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao processar requisição');
      }
    }
  };
  
  // Formatar valores monetários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
  };
  
  // Formatar data
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-PT');
  };
  
  if (status === 'loading' || loading) {
    return <Loading />;
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Transações | Sistema de Gestão Financeira</title>
        <meta name="description" content="Gestão de transações financeiras" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Navbar user={session?.user} />
      
      <div className={styles.content}>
        <Sidebar />
        
        <main className={styles.main}>
          <div className={styles.flexBetween}>
            <h1 className={styles.title}>Transações</h1>
            <Link href="/transacoes/nova" className={styles.button}>
              Nova Transação
            </Link>
          </div>
          
          {/* Filtros */}
          <div className={styles.filters}>
            <form onSubmit={aplicarFiltros}>
              <div className={styles.filterGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="empresa_id">Empresa</label>
                  <select
                    id="empresa_id"
                    name="empresa_id"
                    className={styles.select}
                    value={filtros.empresa_id}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todas</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="cliente_id">Cliente/Fornecedor</label>
                  <select
                    id="cliente_id"
                    name="cliente_id"
                    className={styles.select}
                    value={filtros.cliente_id}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todos</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    className={styles.select}
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todos</option>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="data_inicio">Data Início</label>
                  <input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    className={styles.input}
                    value={filtros.data_inicio}
                    onChange={handleFiltroChange}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="data_fim">Data Fim</label>
                  <input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    className={styles.input}
                    value={filtros.data_fim}
                    onChange={handleFiltroChange}
                  />
                </div>
              </div>
              
              <div className={styles.filterActions}>
                <button 
                  type="button" 
                  className={`${styles.button} ${styles.buttonOutline}`}
                  onClick={limparFiltros}
                >
                  Limpar
                </button>
                <button 
                  type="submit" 
                  className={styles.button}
                >
                  Filtrar
                </button>
              </div>
            </form>
          </div>
          
          {/* Lista de Transações */}
          <div className={styles.section}>
            {transacoes && transacoes.length > 0 ? (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Empresa</th>
                        <th>Cliente/Fornecedor</th>
                        <th>Valor Oficial</th>
                        <th>Valor Não Oficial</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.map((transacao) => (
                        <tr key={transacao.id}>
                          <td>{formatarData(transacao.data_transacao)}</td>
                          <td>
                            <span className={`${styles.badge} ${transacao.tipo === 'receita' ? styles.badgeSuccess : styles.badgeDanger}`}>
                              {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td>{transacao.empresas?.nome || '-'}</td>
                          <td>{transacao.clientes?.nome || '-'}</td>
                          <td>{formatarMoeda(transacao.valor_contribuinte)}</td>
                          <td>{formatarMoeda(transacao.valor_bolso)}</td>
                          <td>
                            <div className={styles.tableActions}>
                              <Link href={`/transacoes/${transacao.id}`} className={styles.buttonOutline}>
                                Ver
                              </Link>
                              <Link href={`/transacoes/editar/${transacao.id}`} className={styles.buttonOutline}>
                                Editar
                              </Link>
                              <button 
                                className={`${styles.buttonOutline} ${styles.buttonDanger}`}
                                onClick={() => excluirTransacao(transacao.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                <div className={styles.pagination}>
                  <button 
                    onClick={() => mudarPagina(1)} 
                    disabled={pagination.page === 1}
                    className={styles.paginationButton}
                  >
                    &laquo;
                  </button>
                  <button 
                    onClick={() => mudarPagina(pagination.page - 1)} 
                    disabled={pagination.page === 1}
                    className={styles.paginationButton}
                  >
                    &lt;
                  </button>
                  
                  <span className={styles.paginationInfo}>
                    Página {pagination.page} de {pagination.total_pages}
                  </span>
                  
                  <button 
                    onClick={() => mudarPagina(pagination.page + 1)} 
                    disabled={pagination.page === pagination.total_pages}
                    className={styles.paginationButton}
                  >
                    &gt;
                  </button>
                  <button 
                    onClick={() => mudarPagina(pagination.total_pages)} 
                    disabled={pagination.page === pagination.total_pages}
                    className={styles.paginationButton}
                  >
                    &raquo;
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>Nenhuma transação encontrada.</p>
                <Link href="/transacoes/nova" className={styles.button}>
                  Adicionar Transação
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
