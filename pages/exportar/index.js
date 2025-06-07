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

export default function ExportarImportar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    tipo: '',
    data_inicio: '',
    data_fim: ''
  });
  const [arquivo, setArquivo] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchEmpresas();
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

  // Atualizar filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  // Manipular seleção de arquivo para importação
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivo(file);
    }
  };

  // Exportar dados
  const exportarDados = async (e) => {
    e.preventDefault();
    setExportLoading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      if (filtros.empresa_id) params.append('empresa_id', filtros.empresa_id);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

      const response = await fetch(`/api/exportar/csv?${params.toString()}`);
      
      if (response.ok) {
        // Criar link para download do arquivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Obter nome do arquivo do cabeçalho ou usar padrão
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'transacoes.csv';
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMensagem({ tipo: 'sucesso', texto: 'Exportação concluída com sucesso!' });
      } else {
        const errorData = await response.json();
        setMensagem({ tipo: 'erro', texto: errorData.error || 'Erro ao exportar dados' });
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao processar requisição de exportação' });
    } finally {
      setExportLoading(false);
    }
  };

  // Importar dados
  const importarDados = async (e) => {
    e.preventDefault();
    
    if (!arquivo) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um arquivo para importar' });
      return;
    }
    
    setImportLoading(true);
    setMensagem({ tipo: '', texto: '' });
    
    try {
      const formData = new FormData();
      formData.append('file', arquivo);
      
      if (filtros.empresa_id) {
        formData.append('empresa_id', filtros.empresa_id);
      }
      
      const response = await fetch('/api/importar/csv', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setMensagem({ 
          tipo: 'sucesso', 
          texto: `Importação concluída! ${data.importados} transações importadas.` 
        });
        setArquivo(null);
        // Limpar input de arquivo
        document.getElementById('arquivo_importacao').value = '';
      } else {
        const errorData = await response.json();
        setMensagem({ tipo: 'erro', texto: errorData.error || 'Erro ao importar dados' });
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao processar requisição de importação' });
    } finally {
      setImportLoading(false);
    }
  };

  if (status === 'loading') {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Exportar/Importar | Sistema de Gestão Financeira</title>
        <meta name="description" content="Exportar e importar dados financeiros" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Navbar user={session?.user} />
      
      <div className={styles.content}>
        <Sidebar />
        
        <main className={styles.main}>
          <h1 className={styles.title}>Exportar/Importar Dados</h1>
          
          {mensagem.texto && (
            <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
              {mensagem.texto}
            </div>
          )}
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Exportar Dados</h2>
            <p className={styles.sectionDescription}>
              Exporte suas transações para um arquivo CSV que pode ser aberto no Excel ou outros programas de planilha.
            </p>
            
            <form onSubmit={exportarDados}>
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
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    className={styles.select}
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todos</option>
                    <option value="receita">Receitas</option>
                    <option value="despesa">Despesas</option>
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
              
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exportando...' : 'Exportar para CSV'}
                </button>
              </div>
            </form>
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Importar Dados</h2>
            <p className={styles.sectionDescription}>
              Importe transações a partir de um arquivo CSV. O arquivo deve seguir o formato correto.
              <Link href="/modelo-importacao.csv" className={styles.downloadLink}>
                Baixar modelo de importação
              </Link>
            </p>
            
            <form onSubmit={importarDados}>
              <div className={styles.formGroup}>
                <label htmlFor="empresa_id_importacao">Empresa (opcional)</label>
                <select
                  id="empresa_id_importacao"
                  name="empresa_id"
                  className={styles.select}
                  value={filtros.empresa_id}
                  onChange={handleFiltroChange}
                >
                  <option value="">Usar empresa do arquivo</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                  ))}
                </select>
                <small className={styles.formHelp}>
                  Se selecionada, todas as transações serão atribuídas a esta empresa, ignorando a coluna de empresa no arquivo.
                </small>
              </div>
              
              <div className={styles.formGroup}>
                <label>Arquivo CSV</label>
                <div 
                  className={styles.fileUpload}
                  onClick={() => document.getElementById('arquivo_importacao').click()}
                >
                  {arquivo ? (
                    <>
                      <p className={styles.fileName}>{arquivo.name}</p>
                      <p>Clique para alterar</p>
                    </>
                  ) : (
                    <p>Clique para selecionar um arquivo CSV</p>
                  )}
                  <input
                    type="file"
                    id="arquivo_importacao"
                    name="arquivo_importacao"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={importLoading || !arquivo}
                >
                  {importLoading ? 'Importando...' : 'Importar Dados'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
