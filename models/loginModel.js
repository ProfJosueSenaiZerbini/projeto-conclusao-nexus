const { executarQuery } = require('../db/dbConnect');

async function buscarUsuarioPorEmail(email) {

    return await executarQuery(
        'SELECT * FROM USUARIO WHERE email = ?',
        [email]
    );
}

async function buscarFiscalPorEmail(email) {

    return await executarQuery(
        'SELECT * FROM FISCAL WHERE email = ?',
        [email]
    );
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarFiscalPorEmail
};