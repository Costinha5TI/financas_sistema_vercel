import React, { useState } from 'react';
import styles from '../styles/Home.module.css';

const Loading = () => {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default Loading;
