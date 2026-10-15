
const denunciaAdmModel = require("../models/denunciaAdmModel");

// ========================================
// EXIBIR PÁGINA ADMINISTRATIVA
// ========================================

async function listar(req, res) {
    try {
        const denuncias = await denunciaAdmModel.listarDenuncias();

        return res.render("denunciaAdm", {
            denuncias
        });

    } catch (erro) {
        console.error("Erro ao buscar denúncias:", erro);

        return res.status(500).send(
            "Erro ao carregar as denúncias."
        );
    }
}

// ========================================
// ALTERAR STATUS
// ========================================

async function alterarStatus(req, res) {
    try {
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

        const resultado = await denunciaAdmModel.buscarStatus(idDenuncia);

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const statusAtual = resultado[0].status;

        if (statusAtual === novoStatus) {
            return res.redirect("/denunciaAdm");
        }

        await denunciaAdmModel.atualizarStatus(
            idDenuncia,
            novoStatus
        );

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            `Status alterado para: ${novoStatus}`
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

// ========================================
// ALTERAR PRIORIDADE
// ========================================

async function alterarPrioridade(req, res) {
    try {
        const idDenuncia = Number(req.params.id);
        const novaPrioridade = req.body.prioridade;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID da denúncia inválido.");
        }

        const prioridadesValidas = [
            "Baixa",
            "Média",
            "Alta"
        ];

        if (!prioridadesValidas.includes(novaPrioridade)) {
            return res.status(400).send("Prioridade inválida.");
        }

        const resultado = await denunciaAdmModel.buscarPrioridade(
            idDenuncia
        );

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const prioridadeAtual = resultado[0].prioridade;

        if (prioridadeAtual === novaPrioridade) {
            return res.redirect("/denunciaAdm");
        }

        await denunciaAdmModel.atualizarPrioridade(
            idDenuncia,
            novaPrioridade
        );

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            `Prioridade alterada para: ${novaPrioridade}`
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
    alterarStatus,
    alterarPrioridade
};
