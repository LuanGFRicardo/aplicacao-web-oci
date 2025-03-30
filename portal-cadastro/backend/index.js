require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const oracledb = require("oracledb");

const app = express();
app.use(express.json());

async function getConnection() {
    return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionString: process.env.DB_CONNECT_STRING,
    });
}

app.post("/register", async (req, res) => {
    const { nome, email, senha, roleId } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);

    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            "INSERT INTO usuarios (id, nome, email, senha, roleId) VALUES (SYS_GUID(), :nome, :email, :senha, :roleId)",
            { nome, email, senha: hashedPassword, roleId },
            { autoCommit: true }
        );
        res.json({ message: "Usuário registrado com sucesso" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao registrar usuário" });
    } finally {
        if (conn) await conn.close();
    }
});

app.listen(5000, () => console.log("Servidor rodando na porta 5000"));
