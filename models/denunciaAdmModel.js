const { executarQuery } = require("../db/dbConnect");

// LISTAR DENÚNCIAS POR LOCALIDADE
// Uso: fiscais
async function listarDenunciasPorFiscal(idFiscal) {
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
        WHERE EXISTS (
            SELECT 1
            FROM FISCAL_LOCALIDADE fl
            WHERE fl.idFiscal = ?
              AND fl.idLocalidade = d.idLocalidade
        )
        ORDER BY d.dataAbertura DESC`,
        [idFiscal]
    );
}

// LISTAR DENÚNCIAS PELAS LOCALIDADES DOS FISCAIS DO SUPERUSUÁRIO
async function listarDenunciasPorSuperusuario(idSuperusuario) {
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
            ON f.id = d.fiscal_id
        WHERE EXISTS (
            SELECT 1
            FROM FISCAL fiscal
            INNER JOIN FISCAL_LOCALIDADE fl
                ON fl.idFiscal = fiscal.id
            WHERE fiscal.idSuperusuario = ?
              AND fl.idLocalidade = d.idLocalidade
        )
        ORDER BY d.dataAbertura DESC`,
        [idSuperusuario]
    );
}

// BUSCAR STATUS POR LOCALIDADE
async function buscarStatusPorFiscal(idDenuncia, idFiscal) {
    return executarQuery(
        `SELECT d.status
         FROM DENUNCIA d
         WHERE d.idDenuncia = ?
           AND d.fiscal_id = ?
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [idDenuncia, idFiscal, idFiscal]
    );
}

// ATUALIZAR STATUS POR LOCALIDADE
async function atualizarStatusPorFiscal(idDenuncia, idFiscal, status) {
    return executarQuery(
        `UPDATE DENUNCIA d
         SET d.status = ?
         WHERE d.idDenuncia = ?
           AND d.fiscal_id = ?
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [status, idDenuncia, idFiscal, idFiscal]
    );
}

// BUSCAR PRIORIDADE POR LOCALIDADE
async function buscarPrioridadePorFiscal(idDenuncia, idFiscal) {
    return executarQuery(
        `SELECT d.prioridade
         FROM DENUNCIA d
         WHERE d.idDenuncia = ?
           AND d.fiscal_id = ?
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [idDenuncia, idFiscal, idFiscal]
    );
}

// ATUALIZAR PRIORIDADE POR LOCALIDADE
async function atualizarPrioridadePorFiscal(idDenuncia, idFiscal, prioridade) {
    return executarQuery(
        `UPDATE DENUNCIA d
         SET d.prioridade = ?
         WHERE d.idDenuncia = ?
           AND d.fiscal_id = ?
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [prioridade, idDenuncia, idFiscal, idFiscal]
    );
}

// FISCAL ASSUME UMA DENÚNCIA
async function atribuirFiscalPorLocalidade(
    idDenuncia,
    idFiscal
) {
    return executarQuery(
        `UPDATE DENUNCIA d
         SET d.fiscal_id = ?
         WHERE d.idDenuncia = ?
           AND d.fiscal_id IS NULL
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [idFiscal, idDenuncia, idFiscal]
    );
}

// REGISTRAR HISTÓRICO POR LOCALIDADE
async function registrarHistoricoPorFiscal(
    idDenuncia,
    idFiscal,
    titulo,
    autorNome = null,
    tipoAutor = "fiscal"
) {
    return executarQuery(
        `INSERT INTO HISTORICO_DENUNCIA
            (idDenuncia, titulo, autorNome, tipoAutor)
         SELECT
            d.idDenuncia, ?, ?, ?
         FROM DENUNCIA d
         WHERE d.idDenuncia = ?
           AND d.fiscal_id = ?
           AND EXISTS (
               SELECT 1
               FROM FISCAL_LOCALIDADE fl
               WHERE fl.idFiscal = ?
                 AND fl.idLocalidade = d.idLocalidade
           )`,
        [
            titulo,
            autorNome,
            tipoAutor,
            idDenuncia,
            idFiscal,
            idFiscal
        ]
    );
}

module.exports = {
    listarDenunciasPorFiscal,
    listarDenunciasPorSuperusuario,

    buscarStatusPorFiscal,
    atualizarStatusPorFiscal,

    buscarPrioridadePorFiscal,
    atualizarPrioridadePorFiscal,

    atribuirFiscalPorLocalidade,
    registrarHistoricoPorFiscal
};
