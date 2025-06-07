import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const UltimasTransacoes = ({ transacoes }) => {
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

  return (
    <div className={styles.tableContainer}>
      {transacoes && transacoes.length > 0 ? (
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.emptyState}>
          <p>Nenhuma transação encontrada.</p>
        </div>
      )}
    </div>
  );
};

export default UltimasTransacoes;
