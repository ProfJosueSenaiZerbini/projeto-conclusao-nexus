
const express = require("express");
const router = express.Router();

const { executarQuery } = require("../db/dbConnect");
const { verificarAutenticado } = require("../middlewares/autenticacao");

// Define qual coluna identifica o destinatário.
// Os nomes das colunas são fixos, nunca vêm da requisição.
function obterDestinatario(usuario) {
    const tipos = {
        usuario: "idUsuario",
        fiscal: "idFiscal",
        superusuario: "idSuperusuario"
    };

    const coluna = tipos[usuario.tipo];
    const id = Number(usuario.id);

    if (!coluna || !Number.isInteger(id) || id <= 0) {
        throw new Error("Destinatário inválido.");
    }

    return { coluna, id };
}

// =====================================================
// LISTAR NOTIFICAÇÕES
// =====================================================

router.get("/", verificarAutenticado, async (req, res) => {
    try {
        const { coluna, id } = obterDestinatario(
            req.session.usuario
        );

        const notificacoes = await executarQuery(
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

        const totalNaoLidas = notificacoes.filter(
            notificacao => Number(notificacao.lida) === 0
        ).length;

        return res.render("notificacoes", {
            notificacoes,
            totalNaoLidas
        });

    } catch (erro) {
        console.error("Erro ao carregar notificações:", erro);

        return res.status(500).send(
            "Erro ao carregar as notificações."
        );
    }
});

// =====================================================
// MARCAR UMA NOTIFICAÇÃO COMO LIDA
// =====================================================

router.post(
    "/:id/marcar-lida",
    verificarAutenticado,
    async (req, res) => {
        try {
            const { coluna, id } = obterDestinatario(
                req.session.usuario
            );

            const idNotificacao = Number(req.params.id);

            if (
                !Number.isInteger(idNotificacao) ||
                idNotificacao <= 0
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Notificação inválida."
                });
            }

            const resultado = await executarQuery(
                `UPDATE NOTIFICACAO
                 SET lida = 1
                 WHERE idNotificacao = ?
                   AND ${coluna} = ?`,
                [idNotificacao, id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Notificação não encontrada."
                });
            }

            return res.json({
                sucesso: true,
                mensagem: "Notificação marcada como lida."
            });

        } catch (erro) {
            console.error(
                "Erro ao marcar notificação como lida:",
                erro
            );

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao atualizar notificação."
            });
        }
    }
);

// =====================================================
// MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
// =====================================================

router.post(
    "/marcar-todas-lidas",
    verificarAutenticado,
    async (req, res) => {
        try {
            const { coluna, id } = obterDestinatario(
                req.session.usuario
            );

            await executarQuery(
                `UPDATE NOTIFICACAO
                 SET lida = 1
                 WHERE ${coluna} = ?
                   AND lida = 0`,
                [id]
            );

            return res.redirect("/notificacoes");

        } catch (erro) {
            console.error(
                "Erro ao marcar todas como lidas:",
                erro
            );

            return res.status(500).send(
                "Erro ao atualizar as notificações."
            );
        }
    }
);

module.exports = router;
