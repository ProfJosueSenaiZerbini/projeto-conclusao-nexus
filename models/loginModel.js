const { executarQuery } = require('../db/dbConnect');

async function buscarUsuarioPorEmail(email) {
    return executarQuery('SELECT * FROM USUARIO WHERE email = ?', [email]);
}

async function buscarFiscalPorEmail(email) {
    return executarQuery(
        `SELECT f.* FROM FISCAL f
         INNER JOIN ORGANIZACAO o ON o.idOrganizacao = f.idOrganizacao
         WHERE f.email = ? AND f.status = 'ativo'
           AND ((o.status = 'ativa' AND o.statusContrato = 'ativo')
             OR (o.status = 'em_transicao' AND o.fimPeriodoTransicao > CURRENT_TIMESTAMP))`,
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
