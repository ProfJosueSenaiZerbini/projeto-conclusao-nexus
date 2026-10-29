const bcrypt = require('bcrypt');
const { executarQuery } = require('../db/dbConnect');

async function listarFiscais(idOrganizacao) {
    return executarQuery(
        `SELECT id, nome, email, cpf, status, dataCadastro, dataDesativacao
         FROM FISCAL WHERE idOrganizacao = ? ORDER BY nome ASC`,
        [idOrganizacao]
    );
}

async function buscarEmailExistente(email) {
    return executarQuery(
        `SELECT email FROM USUARIO WHERE LOWER(email) = ?
         UNION SELECT email FROM FISCAL WHERE LOWER(email) = ?
         UNION SELECT email FROM SUPERUSUARIO WHERE LOWER(email) = ?`,
        [email, email, email]
    );
}

async function buscarCpfExistente(cpfNumeros) {
    return executarQuery(
        `SELECT cpf FROM USUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
         UNION SELECT cpf FROM FISCAL WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
         UNION SELECT cpf FROM SUPERUSUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
        [cpfNumeros, cpfNumeros, cpfNumeros]
    );
}

async function cadastrarFiscal({ idOrganizacao, nome, email, cpf, senha }) {
    const senhaHash = await bcrypt.hash(senha, 12);
    return executarQuery(
        `INSERT INTO FISCAL (idOrganizacao, nome, email, cpf, senha, status)
         VALUES (?, ?, ?, ?, ?, 'ativo')`,
        [idOrganizacao, nome, email, cpf, senhaHash]
    );
}

async function desativarFiscal(idFiscal, idOrganizacao) {
    return executarQuery(
        `UPDATE FISCAL SET status = 'desativado', dataDesativacao = CURRENT_TIMESTAMP
         WHERE id = ? AND idOrganizacao = ? AND status = 'ativo'`,
        [idFiscal, idOrganizacao]
    );
}

module.exports = {
    listarFiscais,
    buscarEmailExistente,
    buscarCpfExistente,
    cadastrarFiscal,
    desativarFiscal
};
