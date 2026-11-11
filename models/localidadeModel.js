
const { executarQuery } = require('../db/dbConnect');

// Lista as localidades cadastradas pela organização.
async function listarLocalidades(idOrganizacao) {
    return executarQuery(
        `SELECT id, cidade, estado, dataCadastro
         FROM ORGANIZACAO_LOCALIDADE
         WHERE idOrganizacao = ?
         ORDER BY cidade ASC`,
        [idOrganizacao]
    );
}

// Cadastra uma nova localidade.
async function cadastrarLocalidade({ idOrganizacao, cidade, estado }) {
    return executarQuery(
        `INSERT INTO ORGANIZACAO_LOCALIDADE
            (idOrganizacao, cidade, estado)
         SELECT idOrganizacao, ?, ?
         FROM ORGANIZACAO
         WHERE idOrganizacao = ?
           AND status = 'ativa'
           AND statusContrato = 'ativo'`,
        [cidade, estado, idOrganizacao]
    );
}

// Remove uma localidade pertencente à organização.
async function removerLocalidade(id, idOrganizacao) {
    return executarQuery(
        `DELETE FROM ORGANIZACAO_LOCALIDADE
         WHERE id = ?
           AND idOrganizacao = ?`,
        [id, idOrganizacao]
    );
}

module.exports = {
    listarLocalidades,
    cadastrarLocalidade,
    removerLocalidade
};
