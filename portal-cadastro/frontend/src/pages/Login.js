import { useState } from "react";
import { loginUser } from "../api";

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await loginUser({ email, senha });
        localStorage.setItem("token", response.data.token);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <button type="submit">Entrar</button>
        </form>
    );
};

export default Login;
