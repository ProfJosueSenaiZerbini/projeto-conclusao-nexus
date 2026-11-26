const { executarQuery } = require('../db/dbConnect');

async function listarLocalidades() {
    return executarQuery(
        `SELECT idLocalidade, bairro, cidade, estado, dataCadastro
         FROM LOCALIDADE
         ORDER BY estado ASC, cidade ASC, bairro ASC`
    );
}

async function cadastrarLocalidade({ bairro, cidade, estado }) {
    return executarQuery(
        `INSERT INTO LOCALIDADE (bairro, cidade, estado)
         VALUES (?, ?, ?)`,
        [bairro, cidade, estado]
    );
}

async function removerLocalidade(idLocalidade) {
    return executarQuery(
        `DELETE FROM LOCALIDADE WHERE idLocalidade = ?`,
        [idLocalidade]
    );
}

module.exports = { listarLocalidades, cadastrarLocalidade, removerLocalidade };
