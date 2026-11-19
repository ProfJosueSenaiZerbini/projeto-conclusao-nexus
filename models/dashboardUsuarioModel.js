const { executarQuery } = require("../db/dbConnect");

async function buscarDenunciasRecentes(idUsuario) {
    return await executarQuery(
        `SELECT
            idDenuncia,
            tipo,
            status,
            dataAbertura,
            TRIM(
                REPLACE(
                    SUBSTRING_INDEX(descricao, '\n', 1),
                    'Título: ',
                    ''
                )
            ) AS titulo
         FROM DENUNCIA
         WHERE idUsuario = ?
         ORDER BY dataAbertura DESC`,
        [idUsuario]
    );
}

module.exports = {
    buscarDenunciasRecentes
};
