import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, getEmpresas } from "../api";

const Cadastro = () => {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [empresaId, setEmpresaId] = useState("");
    const [empresas, setEmpresas] = useState([]);
    const navigate = useNavigate();

    // Carrega a lista de empresas disponíveis no backend ao montar o componente
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const lista = await getEmpresas();
                if (Array.isArray(lista.data.data)) {
                    setEmpresas(lista.data.data);
                } else {
                    console.error("Formato inesperado da resposta:", lista);
                    alert("Erro ao carregar empresas.");
                }
            } catch (error) {
                console.error("Erro ao buscar empresas:", error);
                alert("Erro ao carregar a lista de empresas.");
            }
        };

        fetchEmpresas();
    }, []);

    // Realiza o envio do formulário de cadastro
    const handleSubmit = async (e) => {
        e.preventDefault();

        const novoUsuario = {
            nome,
            email,
            senha,
            empresa_id: empresaId,
            role: "operador", // Role padrão definida para novos cadastros
            aprovado: 0,      // Usuário começa não aprovado (aguardando admin)
        };

        try {
            const response = await registerUser(novoUsuario);
            if (response.status === 201 || response.status === 200) {
                alert("Cadastro realizado com sucesso! Aguarde a aprovação do administrador.");
                navigate("/");
            } else {
                alert("Erro ao cadastrar usuário.");
            }
        } catch (error) {
            console.error("Erro no cadastro:", error);
            alert("Falha ao cadastrar usuário. Verifique os dados.");
        }
    };

    return (
        <div className="cadastro-container">
            <form className="cadastro-form" onSubmit={handleSubmit}>
                <h2>Cadastro de Usuário</h2>

                {/* Campo de nome */}
                <input
                    type="text"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />

                {/* Campo de email */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                {/* Campo de senha */}
                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />

                {/* Seleção de empresa associada */}
                <select
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    required
                >
                    <option value="">Selecione uma empresa</option>
                    {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                        </option>
                    ))}
                </select>

                <button type="submit">Cadastrar</button>
            </form>
        </div>
    );
};

export default Cadastro;
