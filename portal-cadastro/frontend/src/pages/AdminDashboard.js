import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Mudança para named import

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); // Para evitar loop de re-renderização

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Token recuperado:", token);

        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log("Usuário autenticado como:", decoded.role);
                setRole(decoded.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Erro ao decodificar o token:", error);
                setIsAuthenticated(false);
            }
        } else {
            console.warn("Nenhum token encontrado, redirecionando...");
            setIsAuthenticated(false);
        }

        setLoading(false);
    }, []);

    // Enquanto estiver carregando, evita redirecionamento prematuro
    if (loading) {
        return <div>Carregando...</div>;
    }

    // Se não estiver autenticado ou o role não for 'admin', redireciona para login
    if (!isAuthenticated || role !== "admin") {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <h1>Painel de Admin</h1>
            <p>Bem-vindo ao painel do administrador. Aqui você pode gerenciar os usuários e empresas.</p>
        </div>
    );
};

export default AdminDashboard;
