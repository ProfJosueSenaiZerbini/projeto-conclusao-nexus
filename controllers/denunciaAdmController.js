
const denunciaAdmModel = require("../models/denunciaAdmModel");

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
            idFiscal,
            `Denúncia atribuída ao fiscal ${usuario.nome}.`,
            usuario.nome,
            "fiscal"
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
            await denunciaAdmModel.atualizarStatusPorFiscal(
                idDenuncia,
                idFiscal,
                novoStatus
            );

            await denunciaAdmModel.registrarHistoricoPorFiscal(
                idDenuncia,
                idFiscal,
                `Status alterado para: ${novoStatus}`,
                usuario.nome,
                "fiscal"
            );
        }

        return res.redirect("/denunciaAdm");

    } catch (erro) {
        console.error("Erro ao alterar status:", erro);
        return res.status(500).send("Erro ao alterar status.");
    }
}


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

        const prioridadesValidas = ["Baixa", "Média", "Alta"];

        if (!prioridadesValidas.includes(novaPrioridade)) {
            return res.status(400).send("Prioridade inválida.");
        }

        const resultado = await denunciaAdmModel.buscarPrioridadePorFiscal(
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
            await denunciaAdmModel.atualizarPrioridadePorFiscal(
                idDenuncia,
                idFiscal,
                novaPrioridade
            );

            await denunciaAdmModel.registrarHistoricoPorFiscal(
                idDenuncia,
                idFiscal,
                `Prioridade alterada para: ${novaPrioridade}`,
                usuario.nome,
                "fiscal"
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


module.exports = {
    listar,
    atribuirASiMesmo,
    alterarStatus,
    alterarPrioridade
};
