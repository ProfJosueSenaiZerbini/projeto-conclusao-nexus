const { executarQuery } = require('../db/dbConnect');

async function buscarUsuarioPorEmail(email) {
    return executarQuery('SELECT * FROM USUARIO WHERE email = ?', [email]);
}

async function buscarFiscalPorEmail(email) {
    return executarQuery(
        `SELECT *
         FROM FISCAL
         WHERE LOWER(email) = LOWER(?)
           AND status = 'ativo'
         LIMIT 1`,
        [email]
    );
}

async function buscarSuperusuarioPorEmail(email) {
    return executarQuery(
        `SELECT s.*, o.status AS statusOrganizacao, o.statusContrato, o.fimPeriodoTransicao
         FROM SUPERUSUARIO s
         INNER JOIN ORGANIZACAO o ON o.idOrganizacao = s.idOrganizacao
         WHERE s.email = ? LIMIT 1`,
        [email]
    );
}

module.exports = { buscarUsuarioPorEmail, buscarFiscalPorEmail, buscarSuperusuarioPorEmail };
