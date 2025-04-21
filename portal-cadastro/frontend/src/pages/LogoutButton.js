import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
    const navigate = useNavigate();

    const logout = () => {
        // Remove o token do localStorage e redireciona para a tela de login
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <button onClick={logout}>Sair</button>
    );
};

export default LogoutButton;
