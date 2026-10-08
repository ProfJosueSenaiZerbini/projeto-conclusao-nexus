const { executarQuery } = require('../db/dbConnect');

async function listarFiscais() {
    return await executarQuery(
        `SELECT id, nome, email, cpf
        FROM FISCAL 
        ORDER BY nome ASC`
    );
}

async function buscarEmailExistente(email) {
    return await executarQuery(
        `SELECT email FROM USUARIO WHERE email = ?
        UNION
        SELECT email FROM FISCAL WHERE email = ?`,
        [email, email]
    );
}

async function buscarCpfExistente(cpf) {
    return await executarQuery(
        `SELECT cpf FROM USUARIO WHERE cpf = ?
        UNION
        SELECT cpf FROM FISCAL WHERE cpf = ?`,
        [cpf, cpf]
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
    listarFiscais,
    buscarEmailExistente,
    buscarCpfExistente,
    cadastrarFiscal
};