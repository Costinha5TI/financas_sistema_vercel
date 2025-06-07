import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

// Componentes
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';

export default function Estatisticas() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [estatisticasEmpresas, setEstatisticasEmpresas] = useState([]);
  const [estatisticasClientes, setEstatisticasClientes] = useState([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState([]);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    periodo: 'mes',
    data_inicio: '',
    data_fim: '',
    ano: new Date().getFullYear()
  });
  
  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchEmpresas();
      fetchEstatisticas();
    }
  }, [status]);
  
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
  
  // Buscar estatísticas com filtros
  const fetchEstatisticas = async () => {
    setLoading(true);
    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams({
        periodo: filtros.periodo
      });
      
      if (filtros.empresa_id) params.append('empresa_id', filtros.empresa_id);
      if (filtros.periodo === 'personalizado') {
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      }
      
      // Buscar resumo financeiro
      const resumoResponse = await fetch(`/api/estatisticas/resumo?${params.toString()}`);
      if (resumoResponse.ok) {
        const resumoData = await resumoResponse.json();
        setResumo(resumoData);
      }
      
      // Buscar estatísticas por empresa
      const empresasResponse = await fetch(`/api/estatisticas/por-empresa?${params.toString()}`);
      if (empresasResponse.ok) {
        const empresasData = await empresasResponse.json();
        setEstatisticasEmpresas(empresasData.empresas || []);
      }
      
      // Buscar estatísticas por cliente
      const clientesResponse = await fetch(`/api/estatisticas/por-cliente?${params.toString()}`);
      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        setEstatisticasClientes(clientesData.clientes || []);
      }
      
      // Buscar evolução mensal
      const evolucaoParams = new URLSearchParams({
        ano: filtros.ano
      });
      
      if (filtros.empresa_id) evolucaoParams.append('empresa_id', filtros.empresa_id);
      
      const evolucaoResponse = await fetch(`/api/estatisticas/evolucao-mensal?${evolucaoParams.toString()}`);
      if (evolucaoResponse.ok) {
        const evolucaoData = await evolucaoResponse.json();
        setEvolucaoMensal(evolucaoData.evolucao_mensal || []);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
    
    // Se mudar o período para personalizado, resetar datas
    if (name === 'periodo' && value !== 'personalizado') {
      setFiltros(prev => ({
        ...prev,
        [name]: value,
        data_inicio: '',
        data_fim: ''
      }));
    }
  };
  
  // Aplicar filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    fetchEstatisticas();
  };
  
  // Formatar valores monetários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
  };
  
  if (status === 'loading' || loading) {
    return <Loading />;
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Estatísticas | Sistema de Gestão Financeira</title>
        <meta name="description" content="Estatísticas financeiras" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Navbar user={session?.user} />
      
      <div className={styles.content}>
        <Sidebar />
        
        <main className={styles.main}>
          <h1 className={styles.title}>Estatísticas</h1>
          
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
                  <label htmlFor="periodo">Período</label>
                  <select
                    id="periodo"
                    name="periodo"
                    className={styles.select}
                    value={filtros.periodo}
                    onChange={handleFiltroChange}
                  >
                    <option value="dia">Hoje</option>
                    <option value="mes">Mês Atual</option>
                    <option value="ano">Ano Atual</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                
                {filtros.periodo === 'personalizado' && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="data_inicio">Data Início</label>
                      <input
                        type="date"
                        id="data_inicio"
                        name="data_inicio"
                        className={styles.input}
                        value={filtros.data_inicio}
                        onChange={handleFiltroChange}
                        required={filtros.periodo === 'personalizado'}
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
                        required={filtros.periodo === 'personalizado'}
                      />
                    </div>
                  </>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="ano">Ano (Evolução Mensal)</label>
                  <select
                    id="ano"
                    name="ano"
                    className={styles.select}
                    value={filtros.ano}
                    onChange={handleFiltroChange}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.filterActions}>
                <button 
                  type="submit" 
                  className={styles.button}
                >
                  Atualizar Estatísticas
                </button>
              </div>
            </form>
          </div>
          
          {/* Resumo Financeiro */}
          {resumo && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Resumo Financeiro</h2>
              
              <div className={styles.cardGrid}>
                {/* Card de Receitas */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Receitas</span>
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Entrada</span>
                  </div>
                  <div className={styles.cardValue}>
                    {formatarMoeda(resumo.receitas.total)}
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <div>Oficial: {formatarMoeda(resumo.receitas.contribuinte)}</div>
                      <div>Não oficial: {formatarMoeda(resumo.receitas.bolso)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Card de Despesas */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Despesas</span>
                    <span className={`${styles.badge} ${styles.badgeDanger}`}>Saída</span>
                  </div>
                  <div className={styles.cardValue}>
                    {formatarMoeda(resumo.despesas.total)}
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <div>Oficial: {formatarMoeda(resumo.despesas.contribuinte)}</div>
                      <div>Não oficial: {formatarMoeda(resumo.despesas.bolso)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Card de Saldo */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Saldo</span>
                    <span className={`${styles.badge} ${resumo.saldo.total >= 0 ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {resumo.saldo.total >= 0 ? 'Positivo' : 'Negativo'}
                    </span>
                  </div>
                  <div className={`${styles.cardValue} ${resumo.saldo.total >= 0 ? styles.statPositive : styles.statNegative}`}>
                    {formatarMoeda(resumo.saldo.total)}
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <div>Oficial: {formatarMoeda(resumo.saldo.contribuinte)}</div>
                      <div>Não oficial: {formatarMoeda(resumo.saldo.bolso)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Estatísticas por Empresa */}
          {estatisticasEmpresas && estatisticasEmpresas.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Estatísticas por Empresa</h2>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Receitas</th>
                      <th>Despesas</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticasEmpresas.map((empresa) => (
                      <tr key={empresa.id}>
                        <td>{empresa.nome}</td>
                        <td>
                          <div>{formatarMoeda(empresa.receitas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(empresa.receitas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(empresa.receitas.bolso)}</span>
                          </div>
                        </td>
                        <td>
                          <div>{formatarMoeda(empresa.despesas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(empresa.despesas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(empresa.despesas.bolso)}</span>
                          </div>
                        </td>
                        <td className={empresa.saldo.total >= 0 ? styles.statPositive : styles.statNegative}>
                          <div>{formatarMoeda(empresa.saldo.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(empresa.saldo.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(empresa.saldo.bolso)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Estatísticas por Cliente */}
          {estatisticasClientes && estatisticasClientes.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Estatísticas por Cliente/Fornecedor</h2>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente/Fornecedor</th>
                      <th>Receitas</th>
                      <th>Despesas</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticasClientes.map((cliente, index) => (
                      <tr key={cliente.id || `sem-cliente-${index}`}>
                        <td>{cliente.nome || 'Sem Cliente/Fornecedor'}</td>
                        <td>
                          <div>{formatarMoeda(cliente.receitas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(cliente.receitas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(cliente.receitas.bolso)}</span>
                          </div>
                        </td>
                        <td>
                          <div>{formatarMoeda(cliente.despesas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(cliente.despesas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(cliente.despesas.bolso)}</span>
                          </div>
                        </td>
                        <td className={cliente.saldo.total >= 0 ? styles.statPositive : styles.statNegative}>
                          <div>{formatarMoeda(cliente.saldo.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(cliente.saldo.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(cliente.saldo.bolso)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Evolução Mensal */}
          {evolucaoMensal && evolucaoMensal.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Evolução Mensal - {filtros.ano}</h2>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Receitas</th>
                      <th>Despesas</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolucaoMensal.map((mes) => (
                      <tr key={mes.mes}>
                        <td>{mes.nome_mes}</td>
                        <td>
                          <div>{formatarMoeda(mes.receitas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(mes.receitas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(mes.receitas.bolso)}</span>
                          </div>
                        </td>
                        <td>
                          <div>{formatarMoeda(mes.despesas.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(mes.despesas.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(mes.despesas.bolso)}</span>
                          </div>
                        </td>
                        <td className={mes.saldo.total >= 0 ? styles.statPositive : styles.statNegative}>
                          <div>{formatarMoeda(mes.saldo.total)}</div>
                          <div className={styles.smallText}>
                            <span>Oficial: {formatarMoeda(mes.saldo.contribuinte)}</span>
                            <br />
                            <span>Não oficial: {formatarMoeda(mes.saldo.bolso)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
