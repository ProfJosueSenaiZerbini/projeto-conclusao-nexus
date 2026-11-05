
const express = require("express");
const router = express.Router();

const { executarQuery } = require("../db/dbConnect");
const { verificarAutenticado } = require("../middlewares/autenticacao");

// Exibe as notificações do usuário autenticado.
router.get("/", verificarAutenticado, async (req, res) => {
    try {
        let notificacoes = [];

        // As notificações de denúncias são vinculadas ao usuário.
        if (req.session.usuario.tipo === "usuario") {
            notificacoes = await executarQuery(
                `SELECT
                    n.idNotificacao,
                    n.idDenuncia AS denuncia_id,
                    n.conteudo AS mensagem,
                    n.lida,
                    DATE_FORMAT(n.dataHora, '%H:%i') AS horario,
                    DATE_FORMAT(n.dataHora, '%d/%m/%Y') AS data,
                    'Denúncia registrada' AS titulo
                 FROM NOTIFICACAO n
                 WHERE n.idUsuario = ?
                 ORDER BY n.dataHora DESC, n.idNotificacao DESC`,
                [req.session.usuario.id]
            );
        }

        return res.render("notificacoes", {
            notificacoes
        });

    } catch (erro) {
        console.error("Erro ao carregar notificações:", erro);

        return res.status(500).send(
            "Erro ao carregar as notificações."
        );
    }
});

// Marca todas as notificações do usuário como lidas.
router.post(
    "/marcar-todas-lidas",
    verificarAutenticado,
    async (req, res) => {
        try {
            if (req.session.usuario.tipo === "usuario") {
                await executarQuery(
                    `UPDATE NOTIFICACAO
                     SET lida = 1
                     WHERE idUsuario = ?`,
                    [req.session.usuario.id]
                );
            }

            return res.redirect("/notificacoes");

        } catch (erro) {
            console.error("Erro ao marcar notificações:", erro);

            return res.status(500).send(
                "Erro ao atualizar notificações."
            );
        }
    }
);

module.exports = router;
