import { useState } from "react";
import { loginUser } from "../api";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../index.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await loginUser({ email, senha });

            // Verifica se o token foi retornado pela API
            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
                const decodedToken = jwtDecode(response.data.token);

                // Redireciona de acordo com o papel (role) do usuário
                setTimeout(() => {
                    switch (decodedToken.role) {
                        case "admin":
                            navigate("/admin/dashboard");
                            break;
                        case "gerente":
                            navigate("/gerente/dashboard");
                            break;
                        default:
                            navigate("/operador/dashboard");
                    }
                }, 100);
            } else {
                console.error("Token não retornado pela API");
            }
        } catch (error) {
            console.error("Erro ao tentar fazer login:", error);
        }
    };

    const redirecionarParaCadastro = () => {
        navigate("/cadastro");
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Login</h1>
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
                <button type="button" onClick={redirecionarParaCadastro}>
                    Cadastre-se aqui!
                </button>
            </form>
        </div>
    );
};

export default Login;
