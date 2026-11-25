const { executarQuery } = require("../db/dbConnect");

async function listarNotificacoes(coluna, id) {
    return await executarQuery(
        `SELECT
            n.idNotificacao,
            n.idDenuncia AS denuncia_id,
            n.titulo,
            n.tipo,
            n.conteudo AS mensagem,
            n.lida,
            DATE_FORMAT(n.dataHora, '%H:%i') AS horario,
            DATE_FORMAT(n.dataHora, '%d/%m/%Y') AS data
         FROM NOTIFICACAO n
         WHERE n.${coluna} = ?
         ORDER BY n.dataHora DESC, n.idNotificacao DESC`,
        [id]
    );
}

async function marcarComoLida(idNotificacao, coluna, id) {
    return await executarQuery(
        `UPDATE NOTIFICACAO
         SET lida = 1
         WHERE idNotificacao = ?
           AND ${coluna} = ?`,
        [idNotificacao, id]
    );
}

async function marcarTodasComoLidas(coluna, id) {
    return await executarQuery(
        `UPDATE NOTIFICACAO
         SET lida = 1
         WHERE ${coluna} = ?
           AND lida = 0`,
        [id]
    );
}

async function contarNaoLidas(coluna, id) {
    return await executarQuery(
        `SELECT COUNT(*) AS total
        FROM NOTIFICACAO
        WHERE ${coluna} = ?
        AND lida = 0`,
        [id]
    );
    
}

module.exports = {
    listarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    contarNaoLidas
};
