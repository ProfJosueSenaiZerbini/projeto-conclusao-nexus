const { executarQuery } = require("../db/dbConnect");

// Lista somente as denúncias da organização do fiscal/superusuário.
async function listarDenuncias(idOrganizacao) {
    return executarQuery(
        `SELECT
            d.idDenuncia,
            d.tipo,
            d.descricao,
            d.dataAbertura,
            d.status,
            d.prioridade,
            l.endereco,
            u.nome AS nomeUsuario,
            d.fiscal_id AS idFiscalResponsavel,
            f.nome AS nomeFiscalResponsavel
        FROM DENUNCIA d
        INNER JOIN LOCALIZACAO l
            ON d.idLocalizacao = l.idLocalizacao
        INNER JOIN USUARIO u
            ON d.idUsuario = u.id
        LEFT JOIN FISCAL f
            ON d.fiscal_id = f.id
        WHERE d.idOrganizacao = ?
        ORDER BY d.dataAbertura DESC`,
        [idOrganizacao]
    );
}

async function buscarStatus(idDenuncia, idOrganizacao) {
    return executarQuery(
        `SELECT status
         FROM DENUNCIA
         WHERE idDenuncia = ?
           AND idOrganizacao = ?`,
        [idDenuncia, idOrganizacao]
    );
}

async function atualizarStatus(idDenuncia, idOrganizacao, status) {
    return executarQuery(
        `UPDATE DENUNCIA
         SET status = ?
         WHERE idDenuncia = ?
           AND idOrganizacao = ?`,
        [status, idDenuncia, idOrganizacao]
    );
}

async function buscarPrioridade(idDenuncia, idOrganizacao) {
    return executarQuery(
        `SELECT prioridade
         FROM DENUNCIA
         WHERE idDenuncia = ?
           AND idOrganizacao = ?`,
        [idDenuncia, idOrganizacao]
    );
}

async function atualizarPrioridade(
    idDenuncia,
    idOrganizacao,
    prioridade
) {
    return executarQuery(
        `UPDATE DENUNCIA
         SET prioridade = ?
         WHERE idDenuncia = ?
           AND idOrganizacao = ?`,
        [prioridade, idDenuncia, idOrganizacao]
    );
}


// ========================================
// ATRIBUIR DENÚNCIA A UM FISCAL
// A condição fiscal_id IS NULL garante que apenas
// o primeiro fiscal consiga assumir a denúncia.
// ========================================


async function atribuirFiscal(idDenuncia, idFiscal, idOrganizacao) {
    return executarQuery(
        `UPDATE DENUNCIA
         SET fiscal_id = ?
         WHERE idDenuncia = ?
           AND idOrganizacao = ?
           AND fiscal_id IS NULL`,
        [idFiscal, idDenuncia, idOrganizacao]
    );
}



// ========================================
// REGISTRAR HISTÓRICO
// ========================================

async function registrarHistorico(
    idDenuncia,
    idOrganizacao,
    titulo
) {
    return executarQuery(
        `INSERT INTO HISTORICO_DENUNCIA
            (idDenuncia, titulo)
         SELECT d.idDenuncia, ?
         FROM DENUNCIA d
         WHERE d.idDenuncia = ?
           AND d.idOrganizacao = ?`,
        [titulo, idDenuncia, idOrganizacao]
    );
}

module.exports = {
    listarDenuncias,
    buscarStatus,
    atualizarStatus,
    buscarPrioridade,
    atualizarPrioridade,
    atribuirFiscal,
    registrarHistorico
};
