const { executarQuery } = require('../db/dbConnect');

async function buscarCodigo(codigo) {
    return await executarQuery(
        `SELECT * FROM CODIGO_ATIVACAO
        WHERE codigo = ?
        AND usado = FALSE`,
        [codigo]
    );
}

async function verificarFiscalExistente() {
    return await executarQuery(
        'SELECT id FROM FISCAL LIMIT 1'
    );
}

async function marcarCodigoComoUsado(codigo) {
    return await executarQuery(
        `UPDATE CODIGO_ATIVACAO
        SET usado = TRUE
        WHERE codigo = ?`,
        [codigo]
    );
}

async function cadastrarFiscal(nome, email, cpf, senha) {
    return await executarQuery(
        `INSERT INTO FISCAL
        (nome, email, cpf, senha)
        VALUES (?, ?, ?, ?)`,
        [nome, email, cpf, senha]
    );
}


module.exports = {
    buscarCodigo,
    verificarFiscalExistente,
    marcarCodigoComoUsado, 
    cadastrarFiscal
};