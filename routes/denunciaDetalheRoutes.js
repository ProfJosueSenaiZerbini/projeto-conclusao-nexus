const express = require("express");
const router = express.Router();
const { executarQuery } = require("../db/dbConnect");
const { verificarUsuario, verificarAdmin } = require("../middlewares/autenticacao");

function verificarAcesso(req, res, next) {
    if (!req.session.usuario) return res.redirect("/login");
    if (!["usuario", "admin"].includes(req.session.usuario.tipo)) {
        return res.status(403).send("Acesso negado.");
    }
    next();
}

router.get("/:id", verificarAcesso, async (req, res) => {
    const idDenuncia = Number(req.params.id);

    if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    try {
        const resultado = await executarQuery(
            `SELECT
                d.idDenuncia,
                d.tipo AS titulo,
                d.tipo,
                d.descricao,
                d.status,
                d.prioridade,
                d.dataAbertura,
                l.endereco,
                u.nome AS nomeUsuario,
                f.nome AS nomeFiscal
             FROM DENUNCIA d
             INNER JOIN LOCALIZACAO l ON d.idLocalizacao = l.idLocalizacao
             INNER JOIN USUARIO u ON d.idUsuario = u.id
             LEFT JOIN FISCAL f ON d.fiscal_id = f.id
             WHERE d.idDenuncia = ?`,
            [idDenuncia]
        );

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const denuncia = resultado[0];
        const evidencias = await executarQuery(
            `SELECT idEvidencia, tipoEvidencia, dadosEvidencia
             FROM EVIDENCIA
             WHERE idDenuncia = ?
             ORDER BY idEvidencia ASC`,
            [idDenuncia]
        );

        const historico = await executarQuery(
            `SELECT idHistorico, titulo, dataHora
             FROM HISTORICO_DENUNCIA
             WHERE idDenuncia = ?
             ORDER BY dataHora ASC`,
            [idDenuncia]
        );

        const mensagens = await executarQuery(
            `SELECT m.idMensagem, m.texto, m.dataHora, u.nome AS autor
             FROM MENSAGEM_DENUNCIA m
             INNER JOIN USUARIO u ON m.idUsuario = u.id
             WHERE m.idDenuncia = ?
             ORDER BY m.dataHora ASC`,
            [idDenuncia]
        );

        return res.render("denunciaDetalhe", {
            denuncia,
            evidencias,
            historico,
            mensagens
        });
    } catch (erro) {
        console.error("Erro ao buscar denúncia:", erro);
        return res.status(500).send("Erro ao carregar os detalhes da denúncia.");
    }
});

router.post("/:id/mensagem", verificarUsuario, async (req, res) => {
    const idDenuncia = Number(req.params.id);
    const texto = String(req.body.texto || "").trim();
    const idUsuario = req.session.usuario.id;

    if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    if (!texto) {
        return res.status(400).send("A mensagem não pode estar vazia.");
    }

    try {
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
