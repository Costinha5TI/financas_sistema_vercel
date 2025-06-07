import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

const TransacaoForm = ({ initialData, empresas, clientes, categorias, onSubmit, isLoading }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo: initialData?.tipo || 'despesa',
    valor_contribuinte: initialData?.valor_contribuinte || 0,
    valor_bolso: initialData?.valor_bolso || 0,
    descricao: initialData?.descricao || '',
    data_transacao: initialData?.data_transacao || new Date().toISOString().split('T')[0],
    empresa_id: initialData?.empresa_id || '',
    cliente_id: initialData?.cliente_id || '',
    categoria_id: initialData?.categoria_id || '',
  });
  const [fatura, setFatura] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.foto_fatura_url || null);

  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Manipular upload de fatura
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFatura(file);
      // Criar URL para preview
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Criar FormData para envio com arquivo
    const formDataToSend = new FormData();
    
    // Adicionar todos os campos do formulário
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    
    // Adicionar arquivo se existir
    if (fatura) {
      formDataToSend.append('foto_fatura', fatura);
    }
    
    // Chamar função de envio passada como prop
    onSubmit(formDataToSend);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="tipo">Tipo de Transação</label>
        <select
          id="tipo"
          name="tipo"
          className={styles.select}
          value={formData.tipo}
          onChange={handleChange}
          required
        >
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="valor_contribuinte">Valor Oficial (€)</label>
          <input
            type="number"
            id="valor_contribuinte"
            name="valor_contribuinte"
            className={styles.input}
            value={formData.valor_contribuinte}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="valor_bolso">Valor Não Oficial (€)</label>
          <input
            type="number"
            id="valor_bolso"
            name="valor_bolso"
            className={styles.input}
            value={formData.valor_bolso}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="data_transacao">Data</label>
        <input
          type="date"
          id="data_transacao"
          name="data_transacao"
          className={styles.input}
          value={formData.data_transacao}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="empresa_id">Empresa</label>
        <select
          id="empresa_id"
          name="empresa_id"
          className={styles.select}
          value={formData.empresa_id}
          onChange={handleChange}
          required
        >
          <option value="">Selecione uma empresa</option>
          {empresas && empresas.map(empresa => (
            <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="cliente_id">Cliente/Fornecedor (opcional)</label>
        <select
          id="cliente_id"
          name="cliente_id"
          className={styles.select}
          value={formData.cliente_id}
          onChange={handleChange}
        >
          <option value="">Sem cliente/fornecedor</option>
          {clientes && clientes.map(cliente => (
            <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="categoria_id">Categoria (opcional)</label>
        <select
          id="categoria_id"
          name="categoria_id"
          className={styles.select}
          value={formData.categoria_id}
          onChange={handleChange}
        >
          <option value="">Sem categoria</option>
          {categorias && categorias
            .filter(cat => cat.tipo === formData.tipo)
            .map(categoria => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))
          }
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="descricao">Descrição (opcional)</label>
        <textarea
          id="descricao"
          name="descricao"
          className={styles.textarea}
          value={formData.descricao}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Foto da Fatura (opcional)</label>
        <div 
          className={styles.fileUpload}
          onClick={() => document.getElementById('foto_fatura').click()}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className={styles.filePreview} />
              <p>Clique para alterar</p>
            </>
          ) : (
            <p>Clique para selecionar um arquivo</p>
          )}
          <input
            type="file"
            id="foto_fatura"
            name="foto_fatura"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button 
          type="button" 
          className={`${styles.button} ${styles.buttonOutline}`}
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'A processar...' : initialData ? 'Atualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default TransacaoForm;
