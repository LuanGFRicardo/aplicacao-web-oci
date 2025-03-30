import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000" });

export const registerUser = (userData) => API.post("/register", userData);
export const loginUser = (credentials) => API.post("/login", credentials);
