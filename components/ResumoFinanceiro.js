import React from 'react';
import styles from '../styles/Home.module.css';

const ResumoFinanceiro = ({ resumo }) => {
  // Formatar valores monetários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Resumo Financeiro</h2>
      </div>
      
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
  );
};

export default ResumoFinanceiro;
