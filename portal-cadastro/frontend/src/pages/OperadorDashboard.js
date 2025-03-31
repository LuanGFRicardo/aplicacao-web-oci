import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Named import

const OperadorDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated || role !== "operador") {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <h1>Painel do Operador</h1>
            <p>Bem-vindo ao painel do operador. Aqui você pode enviar requisições JSON.</p>
        </div>
    );
};

export default OperadorDashboard;
