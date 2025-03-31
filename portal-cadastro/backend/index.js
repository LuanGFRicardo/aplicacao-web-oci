require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");  // Substituindo o oracledb por mysql2
const cors = require("cors");

const app = express();
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:3000', // Frontend está rodando aqui
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

// 🔹 Criar a conexão MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar no MySQL:", err);
    } else {
        console.log("✅ Conectado ao MySQL.");
    }
});

// 🔹 Middleware de autenticação e controle de acesso baseado em função (RBAC)
function authMiddleware(roles = []) {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Acesso negado" });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            // Verifica se o usuário tem a role adequada para acessar
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: "Permissão insuficiente" });
            }

            next();
        } catch (err) {
            res.status(401).json({ error: "Token inválido" });
        }
    };
}

// 🔹 Hash da senha inicial do admin
async function hashSenhaAdmin() {
    return await bcrypt.hash("admin", 10);
}

// 🔹 Hash da senha inicial padrão
async function hashSenhaPadrao() {
    return await bcrypt.hash("123456", 10);
}

// 🔹 Criar usuários iniciais (Admin, Gerente e Operador) se não existirem
async function criarUsuariosIniciais() {
    const senhaHash = await hashSenhaPadrao();

    // Verificar se já existem usuários admin, gerente e operador
    const query = `
        SELECT role FROM usuarios WHERE role IN ('admin', 'gerente', 'operador')
    `;

    db.query(query, async (err, result) => {
        if (err) {
            console.error("Erro ao verificar usuários iniciais:", err);
            return;
        }

        const rolesExistentes = result.map(user => user.role);
        
        const usuariosParaCriar = [
            { nome: "Admin", email: "admin@gmail.com", role: "admin", empresa_id: "id_da_empresa" },
            { nome: "Gerente", email: "gerente@gmail.com", role: "gerente", empresa_id: "id_da_empresa" },
            { nome: "Operador", email: "operador@gmail.com", role: "operador", empresa_id: "id_da_empresa" }
        ];

        usuariosParaCriar.forEach(usuario => {
            if (!rolesExistentes.includes(usuario.role)) {
                const insertQuery = `
                    INSERT INTO usuarios (id, nome, email, senha, role, empresa_id, aprovado) 
                    VALUES (UUID(), ?, ?, ?, ?, ?, 1)
                `;

                db.query(insertQuery, [usuario.nome, usuario.email, senhaHash, usuario.role, usuario.empresa_id], (err) => {
                    if (err) {
                        console.error(`Erro ao criar usuário ${usuario.role}:`, err);
                    } else {
                        console.log(`✅ Usuário ${usuario.role} criado.`);
                    }
                });
            } else {
                console.log(`🔹 Usuário ${usuario.role} já existe.`);
            }
        });
    });
}

// 🔹 Endpoint: Registro de Usuário (pendente aprovação)
app.post("/register", async (req, res) => {
    const { nome, email, senha, role, empresa_id } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);

    const insertQuery = `
        INSERT INTO usuarios (id, nome, email, senha, role, empresa_id, aprovado) 
        VALUES (UUID(), ?, ?, ?, ?, ?, 0)
    `;

    db.query(insertQuery, [nome, email, hashedPassword, role, empresa_id], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao registrar usuário" });
        } else {
            res.json({ message: "Usuário registrado. Aguardando aprovação do administrador." });
        }
    });
});

// 🔹 Endpoint: Aprovar Usuário (admin)
app.post("/aprovar/:id", authMiddleware(["admin"]), (req, res) => {
    const id = req.params.id;
    const query = "UPDATE usuarios SET aprovado = 1 WHERE id = ?";

    db.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao aprovar usuário" });
        } else {
            res.json({ message: "Usuário aprovado!" });
        }
    });
});

// 🔹 Endpoint: Login
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    const query = "SELECT id, senha, role, aprovado FROM usuarios WHERE email = ?";

    db.query(query, [email], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = result[0];
        if (user.aprovado === 0) return res.status(403).json({ error: "Usuário ainda não aprovado" });

        const validPassword = await bcrypt.compare(senha, user.senha);
        if (!validPassword) return res.status(401).json({ error: "Credenciais inválidas" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    });
});

// 🔹 Endpoint: Lista de Usuários (admin)
app.get("/usuarios", authMiddleware(["admin"]), (req, res) => {
    const query = "SELECT id, nome, email, role, aprovado FROM usuarios";

    db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao buscar usuários" });
        } else {
            res.json(result);
        }
    });
});

// 🔹 Inicia o servidor e cria os usuários iniciais
app.listen(process.env.PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${process.env.PORT}`);
    await criarUsuariosIniciais();
});