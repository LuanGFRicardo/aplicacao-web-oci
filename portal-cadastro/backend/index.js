require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());

// Configuração de CORS para permitir requisições do frontend
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
};
app.use(cors(corsOptions));

// Conexão com banco de dados MySQL
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

// Middleware de autenticação e controle de acesso (RBAC)
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

// Verifica e cria as tabelas utilizadas
const checkAndCreateTables = () => {
    const createUsuariosTable = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id CHAR(36) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            senha VARCHAR(255) NOT NULL,
            role ENUM('admin', 'gerente', 'operador') NOT NULL,
            empresa_id CHAR(36) NOT NULL,
            aprovado BOOLEAN DEFAULT 0
        );
    `;

    const createPermissaoTable = `
        CREATE TABLE IF NOT EXISTS permissao (
            id CHAR(36) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT
        );
    `;

    const createRoleTable = `
        CREATE TABLE IF NOT EXISTS role (
            id CHAR(36) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL UNIQUE,
            descricao TEXT,
            tipo ENUM('usuario', 'grupo', 'politica') NOT NULL DEFAULT 'usuario',
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;

    const createEmpresaTable = `
        CREATE TABLE IF NOT EXISTS empresa (
            id CHAR(36) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(18) NOT NULL UNIQUE,
            endereco TEXT,
            telefone VARCHAR(15),
            email VARCHAR(255)
        );
    `;

    const createJsonFormatTable = `
        CREATE TABLE IF NOT EXISTS json_format (
            id CHAR(36) PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            formato JSON
        );
    `;

    // Executar a criação das tabelas se elas não existirem
    db.query(createUsuariosTable, (err) => {
        if (err) console.error("Erro ao criar tabela 'usuarios':", err);
        else console.log("✅ Tabela 'usuarios' verificada/criada.");
    });

    db.query(createPermissaoTable, (err) => {
        if (err) console.error("Erro ao criar tabela 'permissao':", err);
        else console.log("✅ Tabela 'permissao' verificada/criada.");
    });

    db.query(createRoleTable, (err) => {
        if (err) console.error("Erro ao criar tabela 'role':", err);
        else console.log("✅ Tabela 'role' verificada/criada.");
    });

    db.query(createEmpresaTable, (err) => {
        if (err) console.error("Erro ao criar tabela 'empresa':", err);
        else console.log("✅ Tabela 'empresa' verificada/criada.");
    });

    db.query(createJsonFormatTable, (err) => {
        if (err) console.error("Erro ao criar tabela 'json_format':", err);
        else console.log("✅ Tabela 'json_format' verificada/criada.");
    });
};

// Geração do hash da senha padrão "admin"
async function hashSenhaAdmin() {
    return await bcrypt.hash("admin", 10);
}

// Cria usuários iniciais se ainda não existirem
async function criarUsuariosIniciais() {
    const query = `
        SELECT role FROM usuarios WHERE role IN ('admin', 'gerente', 'operador')
    `;

    db.query(query, async (err, result) => {
        if (err) {
            console.error("Erro ao verificar usuários iniciais:", err);
            return;
        }

        const rolesExistentes = result.map(user => user.role);
        
        const senhaHash = await hashSenhaAdmin();

        const usuariosParaCriar = [
            { nome: "Admin", email: "admin@gmail.com", senha: senhaHash, role: "admin", empresa_id: "11111111-1111-1111-1111-111111111111" }
        ];

        usuariosParaCriar.forEach(usuario => {
            if (!rolesExistentes.includes(usuario.role)) {
                const insertQuery = `
                    INSERT INTO usuarios (id, nome, email, senha, role, empresa_id, aprovado) 
                    VALUES (UUID(), ?, ?, ?, ?, ?, 1)
                `;

                db.query(insertQuery, [usuario.nome, usuario.email, usuario.senha, usuario.role, usuario.empresa_id], (err) => {
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

// Cria roles iniciais se ainda não existirem
function criarRolesIniciais() {
    const rolesParaCriar = [
        { nome: "Administrador", descricao: "Acesso total ao sistema", tipo: "usuario" },
        { nome: "Operador de Grupo", descricao: "Gerencia um grupo de usuários", tipo: "grupo" },
        { nome: "Criar Política de Permissão", descricao: "Pode criar políticas de permissão", tipo: "politica" }
    ];

    const nomes = rolesParaCriar.map(r => `'${r.nome}'`).join(", ");
    const queryCheck = `SELECT nome FROM role WHERE nome IN (${nomes})`;

    db.query(queryCheck, (err, result) => {
        if (err) {
            console.error("Erro ao verificar roles iniciais:", err);
            return;
        }

        const existentes = result.map(r => r.nome);

        rolesParaCriar.forEach(role => {
            if (!existentes.includes(role.nome)) {
                const insertQuery = `
                    INSERT INTO role (id, nome, descricao, tipo)
                    VALUES (UUID(), ?, ?, ?)
                `;
                db.query(insertQuery, [role.nome, role.descricao, role.tipo], (err) => {
                    if (err) {
                        console.error(`Erro ao criar role "${role.nome}":`, err);
                    } else {
                        console.log(`✅ Role "${role.nome}" criada com sucesso.`);
                    }
                });
            } else {
                console.log(`🔹 Role "${role.nome}" já existe.`);
            }
        });
    });
}

// Cria empresas iniciais se ainda não existirem
function criarEmpresasIniciais() {
    const empresas = [
        {
            id: "11111111-1111-1111-1111-111111111111",
            nome: "Empresa Exemplo LTDA",
            cnpj: "00.000.000/0001-00",
            endereco: "Rua Exemplo, 123 - Centro - Curitiba/PR",
            telefone: "(41) 99999-0000",
            email: "contato@empresaexemplo.com"
        }
    ];

    const cnpjs = empresas.map(e => e.cnpj);
    const query = `SELECT cnpj FROM empresa WHERE cnpj IN (${cnpjs.map(() => '?').join(', ')})`;

    db.query(query, cnpjs, (err, result) => {
        if (err) {
            console.error("Erro ao verificar empresas iniciais:", err);
            return;
        }

        const cnpjsExistentes = result.map(e => e.cnpj);

        empresas.forEach(empresa => {
            if (!cnpjsExistentes.includes(empresa.cnpj)) {
                const insertQuery = `
                    INSERT INTO empresa (id, nome, cnpj, endereco, telefone, email)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const valores = [empresa.id, empresa.nome, empresa.cnpj, empresa.endereco, empresa.telefone, empresa.email];

                db.query(insertQuery, valores, (err) => {
                    if (err) {
                        console.error(`Erro ao inserir empresa "${empresa.nome}":`, err);
                    } else {
                        console.log(`✅ Empresa "${empresa.nome}" criada.`);
                    }
                });
            } else {
                console.log(`🔹 Empresa "${empresa.nome}" já existe.`);
            }
        });
    });
}

// Registro de usuário - aprovação pendente
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



// Login de usuário
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    const query = "SELECT id, senha, role, empresa_id, aprovado FROM usuarios WHERE email = ?";

    db.query(query, [email], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = result[0];
        if (user.aprovado === 0) return res.status(403).json({ error: "Usuário ainda não aprovado" });

        const validPassword = await bcrypt.compare(senha, user.senha);
        if (!validPassword) return res.status(401).json({ error: "Credenciais inválidas" });

        const token = jwt.sign(
            { id: user.id, role: user.role, empresaId: user.empresa_id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });
    });
});

// Listagem de usuários (visão filtrada por gerente)
app.get("/usuarios", authMiddleware(["admin", "gerente"]), (req, res) => {
    const empresaId = req.query.empresaId;
    let query = "SELECT id, nome, email, role, aprovado, empresa_id FROM usuarios";
    const queryParams = [];
    
    if (req.user.role === "gerente") {
        query += " WHERE empresa_id = ? AND aprovado = 1";
        queryParams.push(empresaId);
    }

    db.query(query, queryParams, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao buscar usuários" });
        } else {
            res.json(result);
        }
    });
});

// Listar usuário pendentes
app.get("/pendentes", authMiddleware(["admin"]), (req, res) => {
    const query = "SELECT * FROM usuarios WHERE aprovado = 0";

    db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao buscar usuários pendentes." });
        } else {
            res.json({
                status: "success",
                message: "Usuários pendentes listados com sucesso",
                data: result,
            });
        }
    });
});

// Rejeitar usuário pendente
app.delete("/remover/:id", authMiddleware(["admin"]), (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM usuarios WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao remover usuário." });
        }

        res.json({ mensagem: "Usuário removido com sucesso." });
    });
});

// Aprovar usuário (requer permissão admin)
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

// Atualização de dados do usuário (por gerente)
app.post("/usuarios/:id", authMiddleware(["gerente"]), (req, res) => {
    const { id } = req.params;
    const { nome, email, aprovado } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const query = "UPDATE usuarios SET nome = ?, email = ?, aprovado = ? WHERE id = ?";

    db.query(query, [nome, email, aprovado, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar usuário:", err.sqlMessage);
            return res.status(500).json({ error: "Erro ao atualizar usuário" });
        }

        res.status(200).json({ message: "Usuário atualizado com sucesso" });
    });
});

// Listar roles/funções
app.get("/buscar-roles", authMiddleware(["operador"]), (req, res) => {
    const query = "SELECT * FROM role";

    db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Erro ao buscar roles." });
        } else {
            res.json({
                status: "success",
                message: "Roles listadas com sucesso",
                data: result,
            });
        }
    });
});

// Listagem de empresas
app.get("/empresas", (req, res) => {
    const query = "SELECT id, nome FROM empresa";

    db.query(query, (err, results) => {
        if (err) {
            console.error("Erro ao buscar empresas:", err);
            return res.status(500).json({ error: "Erro ao buscar empresas" });
        }

        res.status(200).json({
            status: "success",
            message: "Empresas listadas com sucesso",
            data: results
        });
    });
});

// Criar empresas
app.post("/empresas", authMiddleware(["admin"]), async (req, res) => {
    console.log('Requisição recebida para criação de empresa');
    console.log('Dados recebidos:', req.body);

    const { nome, cnpj, endereco, telefone, email } = req.body;

    if (!nome || !cnpj) {
        console.log('Nome ou CNPJ ausentes');
        return res.status(400).json({ erro: "Nome e CNPJ são obrigatórios." });
    }

    const query = `
        INSERT INTO empresa (id, nome, cnpj, endereco, telefone, email)
        VALUES (UUID(), ?, ?, ?, ?, ?)
    `;

    db.query(query, [nome, cnpj, endereco, telefone, email], (err, results) => {
        if (err) {
          console.error("Erro ao criar empresa:", err);
          return res.status(500).json({ erro: "Erro ao criar empresa no banco de dados." });
        }
        console.log("Empresa criada com sucesso.");
        return res.status(201).json({ mensagem: "Empresa criada com sucesso." });
      });      
});

// Enviar json OCI
app.post("/enviar-oci", authMiddleware(["operador"]), async (req, res) => {
    const { tipo, formato } = req.body;

    console.log("Tipo:", tipo);
    console.log("Formato recebido:", JSON.stringify(formato, null, 2));

    const nome = formato.name;
    const descricao = formato.description || null;

    try {
        const query = `
            INSERT INTO json_format (id, nome, descricao, formato) 
            VALUES (UUID(), ?, ?, ?)
        `;
        db.query(query, [nome, descricao, JSON.stringify(formato)]);  // Inserindo os dados na tabela

        return res.status(200).json({
            status: "success",
            message: `Requisição do tipo '${tipo}' enviada para a OCI (mock) e salva no banco.`,
        });
    } catch (error) {
        console.error("Erro ao salvar JSON no banco:", error);
        return res.status(500).json({
            status: "error",
            message: "Erro ao salvar JSON no banco de dados.",
        });
    }
});

// 🔹 Inicia o servidor e cria os usuários iniciais
app.listen(process.env.PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${process.env.PORT}`);
    await checkAndCreateTables();
    await criarUsuariosIniciais();
    await criarEmpresasIniciais();
    await criarRolesIniciais();
});