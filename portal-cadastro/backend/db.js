require("dotenv").config();
const oracledb = require("oracledb");

async function getConnection() {
    return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionString: process.env.DB_CONNECT_STRING,
    });
}

async function criarTabelas() {
    let conn;
    try {
        conn = await getConnection();
        await conn.execute(`
            CREATE TABLE usuarios (
                id VARCHAR2(36) PRIMARY KEY,
                nome VARCHAR2(100),
                email VARCHAR2(100) UNIQUE,
                senha VARCHAR2(255),
                roleId VARCHAR2(36),
                empresaId VARCHAR2(36),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Tabelas criadas com sucesso!");
    } catch (err) {
        console.error("Erro ao criar tabelas:", err);
    } finally {
        if (conn) await conn.close();
    }
}

// Criar tabelas ao rodar o script
criarTabelas();
