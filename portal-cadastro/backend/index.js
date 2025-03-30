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

// 🔹 Middleware de autenticação
function authMiddleware(roles = []) {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Acesso negado" });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

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

// 🔹 Criar o usuário admin se não existir
async function criarAdmin() {
    const senhaHash = await hashSenhaAdmin();

    const query = "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'admin'";

    db.query(query, (err, result) => {
        if (err) {
            console.error("Erro ao verificar admin:", err);
            return;
        }

        if (result[0].total === 0) {
            // Criar usuário admin se não existir
            const insertQuery = `
            INSERT INTO usuarios (id, nome, email, senha, role, empresa_id, aprovado) 
            VALUES (UUID(), 'Admin', 'admin@gmail.com', ?, 'admin', ?, 1)
            `;
        
            db.query(insertQuery, [senhaHash, 'id_da_empresa'], (err, result) => {
                if (err) {
                    console.error("Erro ao criar admin:", err);
                } else {
                    console.log("✅ Usuário admin criado.");
                }
            });        
        } else {
            console.log("🔹 Usuário admin já existe.");
        }
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

// 🔹 Rota protegida: apenas administradores podem ver todos os usuários
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

app.listen(process.env.PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${process.env.PORT}`);
    await criarAdmin();
});
