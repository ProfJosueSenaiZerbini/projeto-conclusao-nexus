const { executarQuery } = require('../db/dbConnect')

async function buscarUsuarioPorEmail(email){
    return await executarQuery(
        'SELECT * FROM USUARIO WHERE email = ?',
        [email]
    );
}

async function buscarUsuarioPorCpf(cpf){
    return await executarQuery(
        'SELECT * FROM USUARIO WHERE cpf = ?',
        [cpf]
    );
}

async function cadastrarUsuario(nome, email, cpf, senha){
    return await executarQuery(
        `INSERT INTO USUARIO
        (nome, email, cpf, senha)
        VALUES (?, ?, ?, ?)`,
        [nome, email, cpf, senha]
    );
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarUsuarioPorCpf,
    cadastrarUsuario
};