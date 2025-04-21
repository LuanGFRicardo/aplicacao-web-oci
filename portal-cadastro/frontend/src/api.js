import axios from "axios";

// Criação da instância do Axios com base URL configurada
const API = axios.create({ baseURL: "http://localhost:3001" });

// Interceptor para adicionar o token JWT nas requisições
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// AUTENTICAÇÃO
// Registra um novo usuário
export const registerUser = (userData) => API.post("/register", userData);

// Faz login de um usuário
export const loginUser = (credentials) => API.post("/login", credentials);

// CONSULTA GERAL
// Retorna a lista de usuários de uma empresa específica
export const getUsuarios = (empresaId) => API.get(`/usuarios?empresaId=${empresaId}`);

// EMPRESA
// Retorna a lista de empresas
export const getEmpresas = () => API.get("/empresas");

// Cria uma nova empresa
export const createEmpresa = (data) => API.post("/empresas", data);

// ADMIN
// Retorna usuários pendentes de aprovação no admin
export const getUsuariosPendentes = () => API.get("/pendentes");

// Aprova um usuário específico
export const aprovarUsuario = (id, empresaId) => API.post(`/aprovar/${id}`, { empresaId });

// Rejeita e remove um usuário
export const rejeitarUsuario = (id) => API.delete(`/remover/${id}`);

// Busca as roles disponíveis
export const buscarRoles = () => API.get('/buscar-roles');

// Envia uma requisição OCI com o tipo e formato especificados
export const enviarRequisicaoOCI = (tipo, formato) => API.post('/enviar-oci', { tipo, formato });

// Atualiza as informações de um usuário específico
export const atualizarUsuario = (id, data) => API.post(`/usuarios/${id}`, data);
