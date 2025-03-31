import { useState } from "react";
import { loginUser } from "../api";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Mudança para named import

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await loginUser({ email, senha });
            console.log("Resposta da API:", response.data); // Verificar a resposta da API

            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
                console.log("Token armazenado no localStorage:", localStorage.getItem("token"));

                const decodedToken = jwtDecode(response.data.token);
                console.log("Role do usuário:", decodedToken.role);

                // Aguarde um pequeno tempo antes de redirecionar para garantir que o token foi salvo
                setTimeout(() => {
                    if (decodedToken.role === "admin") {
                        console.log("Redirecionando para /admin/dashboard");
                        navigate("/admin/dashboard");
                    } else if (decodedToken.role === "gerente") {
                        console.log("Redirecionando para /gerente/dashboard");
                        navigate("/gerente/dashboard");
                    } else {
                        console.log("Redirecionando para /operador/dashboard");
                        navigate("/operador/dashboard");
                    }
                }, 100); // Pequeno delay para evitar problemas de sincronização
            } else {
                console.error("Token não retornado pela API");
            }
        } catch (error) {
            console.error("Erro ao tentar fazer login:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
            />
            <input 
                type="password" 
                placeholder="Senha" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                required 
            />
            <button type="submit">Entrar</button>
        </form>
    );
};

export default Login;
