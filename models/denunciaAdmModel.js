
const { executarQuery } = require("../db/dbConnect");

// ========================================
// LISTAR DENÚNCIAS
// ========================================

async function listarDenuncias() {
    return await executarQuery(
        `SELECT
            d.idDenuncia,
            d.tipo,
            d.descricao,
            d.dataAbertura,
            d.status,
            d.prioridade,
            l.endereco,
            u.nome AS nomeUsuario
        FROM DENUNCIA d
        INNER JOIN LOCALIZACAO l
            ON d.idLocalizacao = l.idLocalizacao
        INNER JOIN USUARIO u
            ON d.idUsuario = u.id
        ORDER BY d.dataAbertura DESC`
    );
}

// ========================================
// BUSCAR STATUS ATUAL
// ========================================

async function buscarStatus(idDenuncia) {
    return await executarQuery(
        `SELECT status
         FROM DENUNCIA
         WHERE idDenuncia = ?`,
        [idDenuncia]
    );
}

// ========================================
// ATUALIZAR STATUS
// ========================================

async function atualizarStatus(idDenuncia, status) {
    return await executarQuery(
        `UPDATE DENUNCIA
         SET status = ?
         WHERE idDenuncia = ?`,
        [status, idDenuncia]
    );
}

// ========================================
// BUSCAR PRIORIDADE ATUAL
// ========================================

async function buscarPrioridade(idDenuncia) {
    return await executarQuery(
        `SELECT prioridade
         FROM DENUNCIA
         WHERE idDenuncia = ?`,
        [idDenuncia]
    );
}

// ========================================
// ATUALIZAR PRIORIDADE
// ========================================

async function atualizarPrioridade(idDenuncia, prioridade) {
    return await executarQuery(
        `UPDATE DENUNCIA
         SET prioridade = ?
         WHERE idDenuncia = ?`,
        [prioridade, idDenuncia]
    );
}

// ========================================
// REGISTRAR HISTÓRICO
// ========================================

async function registrarHistorico(idDenuncia, titulo) {
    return await executarQuery(
        `INSERT INTO HISTORICO_DENUNCIA
            (idDenuncia, titulo)
         VALUES (?, ?)`,
        [idDenuncia, titulo]
    );
}

module.exports = {
    listarDenuncias,
    buscarStatus,
    atualizarStatus,
    buscarPrioridade,
    atualizarPrioridade,
    registrarHistorico
};
