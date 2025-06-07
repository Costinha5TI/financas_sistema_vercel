import React from 'react';
import styles from '../styles/Home.module.css';

const Navbar = ({ user }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        Sistema de Gestão Financeira
      </div>
      
      <div className={styles.navLinks}>
        <a href="/dashboard">Dashboard</a>
        <a href="/transacoes">Transações</a>
        <a href="/estatisticas">Estatísticas</a>
      </div>
      
      <div className={styles.userMenu}>
        <span>{user?.name || 'Utilizador'}</span>
        <div className={styles.userMenuDropdown}>
          <a href="/perfil">Perfil</a>
          <a href="/configuracoes">Configurações</a>
          <a href="/api/auth/signout">Sair</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
