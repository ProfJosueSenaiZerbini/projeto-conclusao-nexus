const { executarQuery } = require('../db/dbConnect');

// Lista todas as localidades cadastradas no sistema.
async function listarLocalidades() {
    return executarQuery(
        `SELECT idLocalidade, cidade, estado, dataCadastro
         FROM LOCALIDADE
         ORDER BY estado ASC, cidade ASC`
    );
}

// Cadastra uma nova localidade independente de organização.
async function cadastrarLocalidade({ cidade, estado }) {
    return executarQuery(
        `INSERT INTO LOCALIDADE (cidade, estado)
         VALUES (?, ?)`,
        [cidade, estado]
    );
}

// Remove uma localidade que ainda não esteja sendo utilizada.
async function removerLocalidade(idLocalidade) {
    return executarQuery(
        `DELETE FROM LOCALIDADE
         WHERE idLocalidade = ?`,
        [idLocalidade]
    );
}

module.exports = {
    listarLocalidades,
    cadastrarLocalidade,
    removerLocalidade
};
