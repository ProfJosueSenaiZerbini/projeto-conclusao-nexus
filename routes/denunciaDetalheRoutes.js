const express = require("express");
const router = express.Router();
const { executarQuery } = require("../db/dbConnect");
const { verificarUsuario } = require("../middlewares/autenticacao");

function verificarAcesso(req, res, next) {
    if (!req.session.usuario) return res.redirect("/login");
    if (!["usuario", "admin"].includes(req.session.usuario.tipo)) {
        return res.status(403).send("Acesso negado.");
    }
    next();
}

function idValido(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get("/:id", verificarAcesso, async (req, res) => {
    const idDenuncia = idValido(req.params.id);
    if (!idDenuncia) return res.status(400).send("ID da denúncia inválido.");

    try {
        const resultado = await executarQuery(
            `SELECT
                d.idDenuncia,
                d.idUsuario,
                d.titulo,
                d.tipo,
                d.visibilidade,
                DATE_FORMAT(d.dataOcorrencia, '%d/%m/%Y') AS dataOcorrenciaFormatada,
                d.descricao,
                d.status,
                d.prioridade,
                DATE_FORMAT(d.dataAbertura, '%d/%m/%Y às %H:%i') AS dataAberturaFormatada,
                l.endereco,
                u.nome AS nomeUsuario,
                f.nome AS nomeFiscal
             FROM DENUNCIA d
             INNER JOIN LOCALIZACAO l ON d.idLocalizacao = l.idLocalizacao
             INNER JOIN USUARIO u ON d.idUsuario = u.id
             LEFT JOIN FISCAL f ON d.fiscal_id = f.id
             WHERE d.idDenuncia = ?
             LIMIT 1`,
            [idDenuncia]
        );

        if (!resultado.length) return res.status(404).send("Denúncia não encontrada.");

        const denuncia = resultado[0];
        // A identidade do denunciante só é exibida quando a denúncia é identificada.
        denuncia.nomeExibicao = String(denuncia.visibilidade || "anonimo").toLowerCase() === "identificado"
            ? denuncia.nomeUsuario
            : "Anônimo";

        const evidencias = await executarQuery(
            `SELECT idEvidencia, tipoEvidencia, dadosEvidencia
             FROM EVIDENCIA
             WHERE idDenuncia = ?
             ORDER BY idEvidencia ASC`,
            [idDenuncia]
        );

        const historico = await executarQuery(
            `SELECT idHistorico, titulo,
                    DATE_FORMAT(dataRegistro, '%d/%m/%Y às %H:%i') AS dataRegistroFormatada
             FROM HISTORICO_DENUNCIA
             WHERE idDenuncia = ?
             ORDER BY dataRegistro ASC, idHistorico ASC`,
            [idDenuncia]
        );

        const mensagens = await executarQuery(
            `SELECT m.idMensagem, m.texto,
                    DATE_FORMAT(m.dataHora, '%d/%m/%Y às %H:%i') AS dataHoraFormatada,
                    u.nome AS autor
             FROM MENSAGEM_DENUNCIA m
             INNER JOIN USUARIO u ON m.idUsuario = u.id
             WHERE m.idDenuncia = ?
             ORDER BY m.dataHora ASC, m.idMensagem ASC`,
            [idDenuncia]
        );

        return res.render("denunciaDetalhe", {
            denuncia,
            evidencias,
            historico,
            mensagens,
            podeEnviarMensagem: req.session.usuario.tipo === "usuario" &&
                Number(req.session.usuario.id) === Number(denuncia.idUsuario)
        });
    } catch (erro) {
        console.error("Erro ao buscar denúncia:", erro);
        return res.status(500).send("Erro ao carregar os detalhes da denúncia.");
    }
});

router.post("/:id/mensagem", verificarUsuario, async (req, res) => {
    const idDenuncia = idValido(req.params.id);
    const texto = String(req.body.texto || "").trim();
    const idUsuario = idValido(req.session.usuario && req.session.usuario.id);

    if (!idDenuncia) return res.status(400).send("ID da denúncia inválido.");
    if (!idUsuario) return res.status(401).send("Sessão inválida. Entre novamente.");
    if (!texto || texto.length > 2000) {
        return res.status(400).send("A mensagem deve ter entre 1 e 2000 caracteres.");
    }

    try {
        const denuncia = await executarQuery(
            "SELECT idUsuario FROM DENUNCIA WHERE idDenuncia = ? LIMIT 1",
            [idDenuncia]
        );
        if (!denuncia.length) return res.status(404).send("Denúncia não encontrada.");
        if (Number(denuncia[0].idUsuario) !== idUsuario) {
            return res.status(403).send("Somente o autor da denúncia pode enviar mensagens neste espaço.");
        }

        await executarQuery(
            `INSERT INTO MENSAGEM_DENUNCIA (idDenuncia, idUsuario, texto)
             VALUES (?, ?, ?)`,
            [idDenuncia, idUsuario, texto]
        );
        return res.redirect(`/denunciaDetalhe/${idDenuncia}`);
    } catch (erro) {
        console.error("Erro ao enviar mensagem:", erro);
        return res.status(500).send("Erro ao enviar mensagem.");
    }
});

module.exports = router;
