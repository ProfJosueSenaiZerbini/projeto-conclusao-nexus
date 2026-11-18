
const denunciaAdmModel = require("../models/denunciaAdmModel");

async function listar(req, res) {
    try {
        const usuario = req.session.usuario;
        let denuncias;

        if (usuario.tipo === "fiscal") {
            denuncias = await denunciaAdmModel.listarDenunciasPorFiscal(
                Number(usuario.id)
            );
        } else {
            const idOrganizacao = Number(usuario.idOrganizacao);

            if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
                return res.status(403).send(
                    "Sua conta não está vinculada a uma organização."
                );
            }

            denuncias = await denunciaAdmModel.listarDenuncias(
                idOrganizacao
            );
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

        await denunciaAdmModel.registrarHistoricoPorFiscal(
            idDenuncia,
            idOrganizacao,
            `Denúncia atribuída ao fiscal ${usuario.nome}.`,
            usuario.nome,
            usuario.tipo,
            idFiscal,
            `Denúncia atribuída ao fiscal ${usuario.nome}.`
        );

        return res.redirect("/denunciaAdm");
    } catch (erro) {
        console.error("Erro ao atribuir denúncia:", erro);
        return res.status(500).send("Erro ao atribuir a denúncia.");
    }
}

async function alterarStatus(req, res) {
    try {
        const usuario = req.session.usuario;
        const idDenuncia = Number(req.params.id);
        const novoStatus = req.body.status;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID da denúncia inválido.");
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

        if (usuario.tipo === "fiscal") {
            const idFiscal = Number(usuario.id);

            const resultado = await denunciaAdmModel.buscarStatusPorFiscal(
                idDenuncia,
                idFiscal
            );

            if (resultado.length === 0) {
                return res.status(404).send(
                    "Denúncia não encontrada nas suas localidades."
                );
            }

            const statusAtual = resultado[0].status;

            if (statusAtual !== novoStatus) {
                await denunciaAdmModel.atualizarStatusPorFiscal(
                    idDenuncia,
                    idFiscal,
                    novoStatus
                );

                await denunciaAdmModel.registrarHistoricoPorFiscal(
                    idDenuncia,
                    idFiscal,
                    `Status alterado para: ${novoStatus}`
                );
            }

            return res.redirect("/denunciaAdm");
        }

        const idOrganizacao = Number(usuario.idOrganizacao);

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

        const resultado = await denunciaAdmModel.buscarStatus(
            idDenuncia,
            idOrganizacao
        );

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const statusAtual = resultado[0].status;

        if (statusAtual !== novoStatus) {
            await denunciaAdmModel.atualizarStatus(
                idDenuncia,
                idOrganizacao,
                novoStatus
            );

            await denunciaAdmModel.registrarHistorico(
                idDenuncia,
                idOrganizacao,
                `Status alterado para: ${novoStatus}`
            );
        }

        await denunciaAdmModel.atualizarStatus(
            idDenuncia,
            idOrganizacao,
            novoStatus
        );

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            idOrganizacao,
            `Status alterado para: ${novoStatus}`,
            req.session.usuario.nome,
            req.session.usuario.tipo
        );

        console.log(
            `Denúncia ${idDenuncia}: ${statusAtual} → ${novoStatus}`
        );

        return res.redirect("/denunciaAdm");
    } catch (erro) {
        console.error("Erro ao alterar status:", erro);
        return res.status(500).send(
            "Erro ao alterar o status da denúncia."
        );
    }
}

async function alterarPrioridade(req, res) {
    try {
        const usuario = req.session.usuario;
        const idDenuncia = Number(req.params.id);
        const novaPrioridade = req.body.prioridade;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID da denúncia inválido.");
        }

        const prioridadesValidas = ["Baixa", "Média", "Alta"];

        if (!prioridadesValidas.includes(novaPrioridade)) {
            return res.status(400).send("Prioridade inválida.");
        }

        if (usuario.tipo === "fiscal") {
            const idFiscal = Number(usuario.id);

            const resultado = await denunciaAdmModel.buscarPrioridadePorFiscal(
                idDenuncia,
                idFiscal
            );

            if (resultado.length === 0) {
                return res.status(404).send(
                    "Denúncia não encontrada nas suas localidades."
                );
            }

            const prioridadeAtual = resultado[0].prioridade;

            if (prioridadeAtual !== novaPrioridade) {
                await denunciaAdmModel.atualizarPrioridadePorFiscal(
                    idDenuncia,
                    idFiscal,
                    novaPrioridade
                );

                await denunciaAdmModel.registrarHistoricoPorFiscal(
                    idDenuncia,
                    idFiscal,
                    `Prioridade alterada para: ${novaPrioridade}`
                );
            }

            return res.redirect("/denunciaAdm");
        }

        const idOrganizacao = Number(usuario.idOrganizacao);

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

        const resultado = await denunciaAdmModel.buscarPrioridade(
            idDenuncia,
            idOrganizacao
        );

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const prioridadeAtual = resultado[0].prioridade;

        if (prioridadeAtual !== novaPrioridade) {
            await denunciaAdmModel.atualizarPrioridade(
                idDenuncia,
                idOrganizacao,
                novaPrioridade
            );

            await denunciaAdmModel.registrarHistorico(
                idDenuncia,
                idOrganizacao,
                `Prioridade alterada para: ${novaPrioridade}`
            );
        }

        await denunciaAdmModel.atualizarPrioridade(
            idDenuncia,
            idOrganizacao,
            novaPrioridade
        );

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            idOrganizacao,
            `Prioridade alterada para: ${novaPrioridade}`,
            req.session.usuario.nome,
            req.session.usuario.tipo
        );

        console.log(
            `Denúncia ${idDenuncia}: prioridade ${prioridadeAtual} → ${novaPrioridade}`
        );

        return res.redirect("/denunciaAdm");
    } catch (erro) {
        console.error("Erro ao alterar prioridade:", erro);
        return res.status(500).send(
            "Erro ao alterar a prioridade da denúncia."
        );
    }
}

module.exports = {
    listar,
    atribuirASiMesmo,
    alterarStatus,
    alterarPrioridade
};
