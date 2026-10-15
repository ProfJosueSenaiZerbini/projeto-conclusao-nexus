require('dotenv').config();
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    connectionLimit: 5
});

async function executarQuery(query, params = []) {
    let conn;

    try {
        conn = await pool.getConnection();
        return await conn.query(query, params);
    } catch (erro) {
        console.error('Erro ao executar query:', erro);
        throw erro;
    } finally {
        if (conn) conn.release();
    }
}

async function executarTransacao(callback) {
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const resultado = await callback(conn);

        await conn.commit();
        return resultado;
    } catch (erro) {
        if (conn) {
            try {
                await conn.rollback();
            } catch (erroRollback) {
                console.error('Erro no rollback:', erroRollback);
            }
        }

        throw erro;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    executarQuery,
    executarTransacao
};