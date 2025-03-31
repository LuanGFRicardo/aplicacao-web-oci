import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token"); // Limpa o token
        navigate("/login"); // Redireciona para a página de login
    };

    return (
        <button onClick={logout}>Sair</button>
    );
};

export default LogoutButton;
