const notificacaoModel = require("../models/notificacaoModel");

// Define qual coluna identifica o destinatário.
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

// LISTAR NOTIFICAÇÕES
async function listar(req, res) {
    try {
        const { coluna, id } = obterDestinatario(
            req.session.usuario
        );

        const notificacoes =
            await notificacaoModel.listarNotificacoes(coluna, id);

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
}

// MARCAR UMA NOTIFICAÇÃO COMO LIDA
async function marcarComoLida(req, res) {
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

        const resultado =
            await notificacaoModel.marcarComoLida(
                idNotificacao,
                coluna,
                id
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

// MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
async function marcarTodasComoLidas(req, res) {
    try {
        const { coluna, id } = obterDestinatario(
            req.session.usuario
        );

        await notificacaoModel.marcarTodasComoLidas(
            coluna,
            id
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

async function consultarNaoLidas(req, res) {
    try {
        const { coluna, id } = obterDestinatario(
            req.session.usuario
        );

        const resultado = await notificacaoModel.contarNaoLidas(
            coluna,
            id
        );

        return res.json({
            sucesso:true,
            totalNaoLidas: Number(resultado[0].total)
        });

    } catch (erro) {
        console.error("Erro ao consultar notificações:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao consultar notificações."
        });
    }
    
}

module.exports = {
    listar,
    marcarComoLida,
    marcarTodasComoLidas,
    consultarNaoLidas
};
