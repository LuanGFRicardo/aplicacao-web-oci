import axios from "axios";

// Configuração do Axios
const API = axios.create({ baseURL: "http://localhost:3001" });

// Adicionando o token ao cabeçalho de todas as requisições
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const registerUser = (userData) => API.post("/register", userData);
export const loginUser = (credentials) => API.post("/login", credentials);
