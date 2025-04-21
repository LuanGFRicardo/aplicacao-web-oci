import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
    getUsuariosPendentes,
    aprovarUsuario,
    rejeitarUsuario,
    getEmpresas,
    createEmpresa,
} from "../api"; // Centralização das chamadas de API

const AdminDashboard = () => {
    // Autenticação e controle de estado
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dados dos usuários e empresas
    const [usuariosPendentes, setUsuariosPendentes] = useState([]);
    const [empresas, setEmpresas] = useState([]);

    // Campos para criação de nova empresa
    const [novaEmpresa, setNovaEmpresa] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [endereco, setEndereco] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");

    // Verifica o token JWT no carregamento inicial
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setRole(decoded.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Erro ao decodificar o token:", error);
            }
        }
        setLoading(false);
    }, []);

    // Após autenticação e verificação de permissão, carrega dados
    useEffect(() => {
        if (isAuthenticated && role === "admin") {
            fetchUsuarios();
            fetchEmpresasList();
        }
    }, [isAuthenticated, role]);

    // Carrega usuários pendentes
    const fetchUsuarios = async () => {
        try {
            const response = await getUsuariosPendentes();
            setUsuariosPendentes(response.data?.data || []);
        } catch (err) {
            console.error("Erro ao buscar usuários pendentes:", err);
        }
    };

    // Carrega empresas cadastradas
    const fetchEmpresasList = async () => {
        try {
            const response = await getEmpresas();
            setEmpresas(response.data?.data || []);
        } catch (err) {
            console.error("Erro ao buscar empresas:", err);
        }
    };

    // Aprova usuário com empresa associada
    const handleAprovar = async (id, empresaId) => {
        try {
            await aprovarUsuario(id, empresaId);
            fetchUsuarios(); // Atualiza a lista após aprovação
        } catch (err) {
            console.error("Erro ao aprovar usuário:", err);
        }
    };

    // Rejeita usuário
    const handleRejeitar = async (id) => {
        try {
            await rejeitarUsuario(id);
            fetchUsuarios(); // Atualiza a lista após rejeição
        } catch (err) {
            console.error("Erro ao rejeitar usuário:", err);
        }
    };

    // Cria nova empresa
    const handleCriarEmpresa = async () => {
        if (!novaEmpresa.trim() || !cnpj.trim() || !endereco.trim() || !telefone.trim() || !email.trim()) {
            console.log('Preencha todos os campos!');
            return;
        }

        // Debug simples de campos preenchidos
        console.log(novaEmpresa.trim());
        console.log(cnpj.trim());
        console.log(endereco.trim());
        console.log(telefone.trim());
        console.log(email.trim());

        try {
            await createEmpresa({
                nome: novaEmpresa.trim(),
                cnpj: cnpj.trim(),
                endereco: endereco.trim(),
                telefone: telefone.trim(),
                email: email.trim(),
            });

            // Limpa os campos após cadastro
            setNovaEmpresa("");
            setCnpj("");
            setEndereco("");
            setTelefone("");
            setEmail("");

            fetchEmpresasList(); // Atualiza lista de empresas
        } catch (err) {
            console.error("Erro ao criar empresa:", err);
        }
    };

    // Enquanto carrega ou não autenticado, redireciona ou mostra carregando
    if (loading) return <div>Carregando...</div>;
    if (!isAuthenticated || role !== "admin") return <Navigate to="/login" />;

    return (
        <div className="admin-container">
            <h1>Painel de Admin</h1>

            {/* Seção de aprovação de usuários */}
            <section>
                <h2>Usuários Pendentes</h2>
                {usuariosPendentes.length === 0 ? (
                    <p>Nenhum usuário pendente.</p>
                ) : (
                    usuariosPendentes.map((user) => (
                        <div key={user.id}>
                            <p>
                                {user.nome} ({user.email})
                            </p>
                            <select
                                onChange={(e) => handleAprovar(user.id, e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Selecione a empresa
                                </option>
                                {empresas.map((empresa) => (
                                    <option key={empresa.id} value={empresa.id}>
                                        {empresa.nome}
                                    </option>
                                ))}
                            </select>
                            <button onClick={() => handleRejeitar(user.id)}>Rejeitar</button>
                        </div>
                    ))
                )}
            </section>

            {/* Seção de criação de empresas */}
            <section>
                <h2>Empresas</h2>
                <input
                    type="text"
                    placeholder="Nome da empresa"
                    value={novaEmpresa}
                    onChange={(e) => setNovaEmpresa(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="CNPJ da empresa"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Endereço da empresa"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Telefone da empresa"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="E-mail da empresa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleCriarEmpresa}>Criar</button>

                {/* Lista de empresas existentes */}
                <ul>
                    {empresas.map((empresa) => (
                        <li key={empresa.id}>{empresa.nome}</li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default AdminDashboard;
