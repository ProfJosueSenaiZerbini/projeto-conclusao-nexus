
const denunciaAdmModel = require("../models/denunciaAdmModel");

const {
    executarQuery,
    executarTransacao
} = require("../db/dbConnect");

const {
    criarNotificacao
} = require("../services/notificacaoService");

// =====================================================
// FUNÇÕES AUXILIARES DE NOTIFICAÇÃO
// =====================================================

// Busca o cidadão responsável pela denúncia.
async function buscarDadosDenuncia(idDenuncia) {
    const resultado = await executarQuery(
        `SELECT idDenuncia, idUsuario, titulo
         FROM DENUNCIA
         WHERE idDenuncia = ?`,
        [idDenuncia]
    );

    return resultado.length > 0 ? resultado[0] : null;
}

// Notifica o cidadão.
async function notificarCidadao(
    denuncia,
    titulo,
    tipo,
    conteudo
) {
    if (!denuncia) return;

    await executarTransacao(async conn => {
        await criarNotificacao(conn, {
            idDenuncia: Number(denuncia.idDenuncia),
            idUsuario: Number(denuncia.idUsuario),
            titulo,
            tipo,
            conteudo
        });
    });
}

// Notifica o fiscal.
async function notificarFiscal(
    idDenuncia,
    idFiscal,
    titulo,
    tipo,
    conteudo
) {
    await executarTransacao(async conn => {
        await criarNotificacao(conn, {
            idDenuncia,
            idFiscal,
            titulo,
            tipo,
            conteudo
        });
    });
}

// =====================================================
// LISTAR DENÚNCIAS
// =====================================================

async function listar(req, res) {
    try {
        const usuario = req.session.usuario;
        let denuncias;

        if (usuario.tipo === "fiscal") {
            denuncias = await denunciaAdmModel.listarDenunciasPorFiscal(
                Number(usuario.id)
            );

        } else if (usuario.tipo === "superusuario") {
            const idSuperusuario = Number(usuario.id);

            if (!Number.isInteger(idSuperusuario) || idSuperusuario <= 0) {
                return res.status(403).send("Superusuário inválido.");
            }

            denuncias = await denunciaAdmModel.listarDenunciasPorSuperusuario(
                idSuperusuario
            );

        } else {
            return res.status(403).send("Acesso negado.");
        }

        return res.render("denunciaAdm", {
            denuncias,
            usuarioLogado: usuario
        });

    } catch (erro) {
        console.error("Erro ao buscar denúncias:", erro);
        return res.status(500).send("Erro ao carregar as denúncias.");
    }
}

// =====================================================
// FISCAL ASSUME UMA DENÚNCIA
// =====================================================

async function atribuirASiMesmo(req, res) {
    try {
        const idDenuncia = Number(req.params.id);
        const usuario = req.session.usuario;

        if (usuario.tipo !== "fiscal") {
            return res.status(403).send(
                "Somente fiscais podem atribuir denúncias a si mesmos."
            );
        }

        const idFiscal = Number(usuario.id);

        if (
            !Number.isInteger(idDenuncia) || idDenuncia <= 0 ||
            !Number.isInteger(idFiscal) || idFiscal <= 0
        ) {
            return res.status(400).send("Dados inválidos.");
        }

        const resultado = await denunciaAdmModel.atribuirFiscalPorLocalidade(
            idDenuncia,
            idFiscal
        );

        if (!resultado || resultado.affectedRows !== 1) {
            return res.status(409).send(
                "Não foi possível assumir esta denúncia. Ela pode já ter sido atribuída ou não pertencer às suas localidades."
            );
        }

        // Registra no histórico.
        await denunciaAdmModel.registrarHistoricoPorFiscal(
            idDenuncia,
            idFiscal,
            `Denúncia atribuída ao fiscal ${usuario.nome}.`,
            usuario.nome,
            "fiscal"
        );

        const denuncia = await buscarDadosDenuncia(idDenuncia);

        if (denuncia) {

            // Notifica o fiscal que assumiu a denúncia.
            await notificarFiscal(
                idDenuncia,
                idFiscal,
                "Denúncia atribuída a você",
                "atribuicao",
                `Você assumiu a responsabilidade pela denúncia "${denuncia.titulo}".`
            );

            // Avisa o cidadão que um fiscal assumiu.
            await notificarCidadao(
                denuncia,
                "Fiscal responsável definido",
                "atribuicao",
                `Um fiscal assumiu a responsabilidade pela sua denúncia "${denuncia.titulo}".`
            );
        }

        return res.redirect("/denunciaAdm");

    } catch (erro) {
        console.error("Erro ao atribuir denúncia:", erro);
        return res.status(500).send("Erro ao atribuir a denúncia.");
    }
}

// =====================================================
// ALTERAR STATUS
// =====================================================

async function alterarStatus(req, res) {
    try {
        const usuario = req.session.usuario;

        if (usuario.tipo !== "fiscal") {
            return res.status(403).send(
                "Somente fiscais podem alterar o status."
            );
        }

        const idDenuncia = Number(req.params.id);
        const idFiscal = Number(usuario.id);
        const novoStatus = req.body.status;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID inválido.");
        }

        const statusPermitidos = [
            "Pendente",
            "Em análise",
            "Em desenvolvimento",
            "Resolvida"
        ];

        if (!statusPermitidos.includes(novoStatus)) {
            return res.status(400).send("Status inválido.");
        }

        const resultado = await denunciaAdmModel.buscarStatusPorFiscal(
            idDenuncia,
            idFiscal
        );

        if (resultado.length === 0) {
            return res.status(404).send(
                "Denúncia não encontrada ou não atribuída a você."
            );
        }

        const statusAtual = resultado[0].status;

        if (statusAtual !== novoStatus) {

            const atualizacao =
                await denunciaAdmModel.atualizarStatusPorFiscal(
                    idDenuncia,
                    idFiscal,
                    novoStatus
                );

            if (!atualizacao || atualizacao.affectedRows !== 1) {
                return res.status(409).send(
                    "Não foi possível atualizar o status."
                );
            }

            // Registra no histórico.
            await denunciaAdmModel.registrarHistoricoPorFiscal(
                idDenuncia,
                idFiscal,
                `Status alterado para: ${novoStatus}`,
                usuario.nome,
                "fiscal"
            );

            // Busca os dados da denúncia.
            const denuncia = await buscarDadosDenuncia(idDenuncia);

            // Notifica o cidadão.
            await notificarCidadao(
                denuncia,
                "Status da denúncia atualizado",
                "status",
                `O status da sua denúncia "${denuncia.titulo}" foi alterado de "${statusAtual}" para "${novoStatus}".`
            );
        }

        return res.redirect("/denunciaAdm");

    } catch (erro) {
        console.error("Erro ao alterar status:", erro);
        return res.status(500).send("Erro ao alterar status.");
    }
}

// =====================================================
// ALTERAR PRIORIDADE
// =====================================================

async function alterarPrioridade(req, res) {
    try {
        const usuario = req.session.usuario;

        if (usuario.tipo !== "fiscal") {
            return res.status(403).send(
                "Somente fiscais podem alterar a prioridade."
            );
        }

        const idDenuncia = Number(req.params.id);
        const idFiscal = Number(usuario.id);
        const novaPrioridade = req.body.prioridade;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID inválido.");
        }

        const prioridadesValidas = [
            "Baixa",
            "Média",
            "Alta"
        ];

        if (!prioridadesValidas.includes(novaPrioridade)) {
            return res.status(400).send("Prioridade inválida.");
        }

        const resultado =
            await denunciaAdmModel.buscarPrioridadePorFiscal(
                idDenuncia,
                idFiscal
            );

        if (resultado.length === 0) {
            return res.status(404).send(
                "Denúncia não encontrada ou não atribuída a você."
            );
        }

        const prioridadeAtual = resultado[0].prioridade;

        if (prioridadeAtual !== novaPrioridade) {

            const atualizacao =
                await denunciaAdmModel.atualizarPrioridadePorFiscal(
                    idDenuncia,
                    idFiscal,
                    novaPrioridade
                );

            if (!atualizacao || atualizacao.affectedRows !== 1) {
                return res.status(409).send(
                    "Não foi possível atualizar a prioridade."
                );
            }

            // Registra no histórico.
            await denunciaAdmModel.registrarHistoricoPorFiscal(
                idDenuncia,
                idFiscal,
                `Prioridade alterada para: ${novaPrioridade}`,
                usuario.nome,
                "fiscal"
            );

            // Busca os dados da denúncia.
            const denuncia = await buscarDadosDenuncia(idDenuncia);

            // Notifica o cidadão.
            await notificarCidadao(
                denuncia,
                "Prioridade da denúncia atualizada",
                "prioridade",
                `A prioridade da sua denúncia "${denuncia.titulo}" foi alterada de "${prioridadeAtual}" para "${novaPrioridade}".`
            );
        }

        return res.redirect("/denunciaAdm");

    } catch (erro) {
        console.error("Erro ao alterar prioridade:", erro);
        return res.status(500).send(
            "Erro ao alterar prioridade."
        );
    }
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {
    listar,
    atribuirASiMesmo,
    alterarStatus,
    alterarPrioridade
};
