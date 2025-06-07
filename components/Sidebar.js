import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

const Sidebar = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };
  
  return (
    <aside className={styles.sidebar}>
      <ul className={styles.sidebarMenu}>
        <li>
          <Link href="/dashboard" className={`${styles.sidebarMenuItem} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link href="/empresas" className={`${styles.sidebarMenuItem} ${isActive('/empresas') ? styles.active : ''}`}>
            <span>Empresas</span>
          </Link>
        </li>
        <li>
          <Link href="/clientes" className={`${styles.sidebarMenuItem} ${isActive('/clientes') ? styles.active : ''}`}>
            <span>Clientes/Fornecedores</span>
          </Link>
        </li>
        <li>
          <Link href="/transacoes" className={`${styles.sidebarMenuItem} ${isActive('/transacoes') ? styles.active : ''}`}>
            <span>Transações</span>
          </Link>
        </li>
        <li>
          <Link href="/estatisticas" className={`${styles.sidebarMenuItem} ${isActive('/estatisticas') ? styles.active : ''}`}>
            <span>Estatísticas</span>
          </Link>
        </li>
        <li>
          <Link href="/exportar" className={`${styles.sidebarMenuItem} ${isActive('/exportar') ? styles.active : ''}`}>
            <span>Exportar/Importar</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
