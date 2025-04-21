import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getUsuarios, atualizarUsuario } from "../api";

const GerenteDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usuarios, setUsuarios] = useState([]);
    const [empresaId, setEmpresaId] = useState(null);

    const [editandoUsuario, setEditandoUsuario] = useState(null);
    const [form, setForm] = useState({ nome: "", email: "", status: 1 });

    // Inicia a edição de um usuário, preenchendo o formulário com os dados atuais
    const handleEditarClick = (usuario) => {
        setEditandoUsuario(usuario.id);
        setForm({
            nome: usuario.nome,
            email: usuario.email,
            status: usuario.status,
        });
    };

    // Salva as alterações feitas no usuário em edição
    const handleSalvarEdicao = async () => {
        try {
            await atualizarUsuario(editandoUsuario, form);
            alert("Usuário atualizado com sucesso!");
            setEditandoUsuario(null);
            fetchUsuarios(); // Atualiza a lista após a edição
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            alert("Erro ao atualizar usuário.");
        }
    };

    // Marca o usuário como não aprovado (simula exclusão lógica)
    const handleExcluirUsuario = async (usuario) => {
        const confirmacao = window.confirm("Tem certeza que deseja excluir este usuário?");
        if (!confirmacao) return;

        try {
            await atualizarUsuario(usuario.id, {
                nome: usuario.nome,
                email: usuario.email,
                aprovado: 0
            });
            alert("Usuário excluído com sucesso!");
            fetchUsuarios();
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            alert("Erro ao excluir usuário.");
        }
    };

    // Busca os usuários vinculados à empresa do gerente
    const fetchUsuarios = useCallback(async () => {
        try {
            const response = await getUsuarios(empresaId);
            if (response && response.data) {
                setUsuarios(response.data);
            } else {
                console.error("Erro na resposta ao buscar usuários:", response);
                alert("Erro ao carregar usuários.");
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            alert("Erro ao carregar usuários.");
        }
    }, [empresaId]);

    // Verifica o token e define autenticação e empresa vinculada
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const decoded = jwtDecode(token);
                setRole(decoded.role);
                setIsAuthenticated(true);
                setEmpresaId(decoded.empresaId);
            } catch (error) {
                console.error("Erro ao decodificar o token:", error);
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }

        setLoading(false);
    }, []);

    // Carrega os usuários quando empresaId estiver disponível
    useEffect(() => {
        if (empresaId) {
            fetchUsuarios();
        }
    }, [empresaId, fetchUsuarios]);

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated || role !== "gerente") {
        return <Navigate to="/login" />;
    }

    return (
        <div className="gerente-container">
            <h1>Painel do Gerente</h1>
            <p>Bem-vindo ao painel do gerente. Aqui você pode gerenciar usuários da sua empresa.</p>

            <div className="empresa-box">
                <h2>Gerenciar Usuários</h2>
                <button onClick={fetchUsuarios}>Atualizar Lista</button>

                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.length > 0 ? (
                            usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    {editandoUsuario === usuario.id ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={form.nome}
                                                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <button onClick={handleSalvarEdicao}>Salvar</button>
                                                <button onClick={() => setEditandoUsuario(null)}>Cancelar</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{usuario.nome}</td>
                                            <td>{usuario.email}</td>
                                            <td>
                                                <button onClick={() => handleEditarClick(usuario)}>Editar</button>
                                                <button onClick={() => handleExcluirUsuario(usuario)}>Excluir</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">Nenhum usuário encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GerenteDashboard;
