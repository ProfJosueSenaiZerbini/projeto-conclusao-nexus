
async function criarNotificacao(conn, {
    idDenuncia,
    idUsuario = null,
    idFiscal = null,
    idSuperusuario = null,
    titulo,
    tipo,
    conteudo
}) {
    const destinatarios = [
        idUsuario,
        idFiscal,
        idSuperusuario
    ].filter(id => id !== null && id !== undefined);

    if (destinatarios.length !== 1) {
        throw new Error(
            "A notificação deve possuir exatamente um destinatário."
        );
    }

    await conn.query(
        `INSERT INTO NOTIFICACAO (
            idDenuncia,
            idUsuario,
            idFiscal,
            idSuperusuario,
            titulo,
            tipo,
            conteudo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            idDenuncia,
            idUsuario,
            idFiscal,
            idSuperusuario,
            titulo,
            tipo,
            conteudo
        ]
    );
}

module.exports = {
    criarNotificacao
};
