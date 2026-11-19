const { executarQuery } = require("../db/dbConnect");

async function listarDenuncias(tipoUsuario, idUsuario) {
    let sql = `
        SELECT
            d.idDenuncia,
            d.tipo,
            d.titulo,
            d.descricao,
            d.status,
            d.prioridade,
            d.visibilidade,
            d.dataAbertura,
            l.endereco,
            u.nome AS nomeUsuario
        FROM DENUNCIA d
        INNER JOIN LOCALIZACAO l
            ON l.idLocalizacao = d.idLocalizacao
        INNER JOIN USUARIO u
            ON u.id = d.idUsuario
        WHERE 1 = 1
    `;

    const parametros = [];

    if (tipoUsuario === "fiscal") {
        sql += `
            AND EXISTS (
                SELECT 1
                FROM FISCAL_LOCALIDADE fl
                WHERE fl.idLocalidade = d.idLocalidade
                  AND fl.idFiscal = ?
            )
        `;

        parametros.push(idUsuario);

    } else if (tipoUsuario === "superusuario") {
        sql += `
            AND EXISTS (
                SELECT 1
                FROM FISCAL fiscal
                INNER JOIN FISCAL_LOCALIDADE fl
                    ON fl.idFiscal = fiscal.id
                WHERE fiscal.idSuperusuario = ?
                  AND fl.idLocalidade = d.idLocalidade
            )
        `;

        parametros.push(idUsuario);
    }

    sql += `
        ORDER BY d.dataAbertura DESC, d.idDenuncia DESC
    `;

    return await executarQuery(sql, parametros);
}

async function buscarEvidencias(idDenuncia) {
    return await executarQuery(
        `SELECT tipoEvidencia, dadosEvidencia
         FROM EVIDENCIA
         WHERE idDenuncia = ?
         ORDER BY idEvidencia ASC`,
        [idDenuncia]
    );
}

module.exports = {
    listarDenuncias,
    buscarEvidencias
};
