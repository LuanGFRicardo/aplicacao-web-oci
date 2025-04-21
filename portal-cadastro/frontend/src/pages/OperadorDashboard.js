import React, { useState, useEffect } from 'react';
import { buscarRoles, enviarRequisicaoOCI } from '../api';

const OperadorDashboard = () => {
  const [tipo, setTipo] = useState('usuario');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    compartmentId: '',
    name: '',
    description: '',
    statements: [''],
  });
  const [jsonPreview, setJsonPreview] = useState('');

  // Carrega as roles disponíveis ao montar o componente
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await buscarRoles();
        setRoles(response.data.data);
      } catch (error) {
        console.error('Erro ao carregar as roles:', error);
      }
    };
    fetchRoles();
  }, []);

  // Atualiza campos do formulário
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Atualiza uma statement específica pelo índice
  const handleStatementChange = (index, value) => {
    const updated = [...form.statements];
    updated[index] = value;
    setForm({ ...form, statements: updated });
  };

  // Adiciona nova linha de statement
  const addStatement = () => {
    setForm({ ...form, statements: [...form.statements, ''] });
  };

  // Gera objeto JSON com base no formulário preenchido
  const buildJson = () => {
    const base = {
      compartmentId: form.compartmentId,
      name: form.name,
      description: form.description,
    };
    if (tipo === 'politica') {
      base.statements = form.statements.filter((s) => s.trim() !== '');
    }
    const json = JSON.stringify(base, null, 2);
    setJsonPreview(json);
    return base;
  };

  // Envia o JSON gerado para a API (integração com OCI)
  const enviarJsonParaApi = async () => {
    const payload = buildJson();
    try {
      await enviarRequisicaoOCI(tipo, payload);
      alert('Requisição enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar JSON:', error);
      alert('Erro ao enviar JSON para o backend/OCI');
    }
  };

  return (
    <div className="operador-container">
      <h1>Operador: Criar Requisição OCI</h1>

      <section>
        <label>Tipo de Requisição</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {roles.map((role) => (
            <option key={role.id} value={role.tipo}>
              {role.nome}
            </option>
          ))}
        </select>
      </section>

      <section>
        <label>Compartment ID</label>
        <input
          type="text"
          name="compartmentId"
          value={form.compartmentId}
          onChange={handleChange}
        />
      </section>

      <section>
        <label>Nome</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
      </section>

      <section>
        <label>Descrição</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </section>

      {tipo === 'politica' && (
        <section>
          <label>Statements</label>
          {form.statements.map((stmt, index) => (
            <input
              key={index}
              type="text"
              value={stmt}
              onChange={(e) => handleStatementChange(index, e.target.value)}
            />
          ))}
          <button type="button" onClick={addStatement}>
            + Adicionar Statement
          </button>
        </section>
      )}

      <button onClick={enviarJsonParaApi}>Enviar JSON para OCI</button>

      <div className="json-box">
        <h2>Pré-visualização</h2>
        <pre>{jsonPreview || 'Nenhum JSON gerado ainda.'}</pre>
      </div>
    </div>
  );
};

export default OperadorDashboard;
