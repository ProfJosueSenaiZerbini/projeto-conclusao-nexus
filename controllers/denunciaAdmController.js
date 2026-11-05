
const denunciaAdmModel = require("../models/denunciaAdmModel");

// EXIBIR PÁGINA ADMINISTRATIVA
async function listar(req, res) {
    try {
        const idOrganizacao = Number(
            req.session.usuario.idOrganizacao
        );

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

        const denuncias = await denunciaAdmModel.listarDenuncias(
            idOrganizacao
        );
        
        return res.render("denunciaAdm", {
            denuncias,
            usuarioLogado: req.session.usuario
        });

    } catch (erro) {
        console.error("Erro ao buscar denúncias:", erro);

        return res.status(500).send(
            "Erro ao carregar as denúncias."
        );
    }
}


// ========================================
// FISCAL ATRIBUI A DENÚNCIA A SI MESMO
// ========================================

async function atribuirASiMesmo(req, res) {
    try {
        const idDenuncia = Number(req.params.id);
        const usuario = req.session.usuario;

        if (!Number.isInteger(idDenuncia) || idDenuncia <= 0) {
            return res.status(400).send("ID da denúncia inválido.");
        }

        // Superusuários administram o painel, mas a atribuição é
        // uma ação exclusiva de fiscais.
        if (usuario.tipo !== "fiscal") {
            return res.status(403).send(
                "Somente fiscais podem atribuir denúncias a si mesmos."
            );
        }

        const idFiscal = Number(usuario.id);
        if (!Number.isInteger(idFiscal) || idFiscal <= 0) {
            return res.status(401).send("Sessão de fiscal inválida. Faça login novamente.");
        }

        const resultado = await denunciaAdmModel.atribuirFiscal(
            idDenuncia,
            idFiscal
        );

        // UPDATE condicional é atômico: se outro fiscal já assumiu,
        // affectedRows será zero e a atribuição não será sobrescrita.
        if (!resultado || resultado.affectedRows !== 1) {
            const existe = await denunciaAdmModel.buscarStatus(idDenuncia);
            if (existe.length === 0) {
                return res.status(404).send("Denúncia não encontrada.");
            }
            return res.status(409).send(
                "Esta denúncia já foi atribuída a outro fiscal e não pode ser assumida."
            );
        }

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            `Denúncia atribuída ao fiscal ${usuario.nome}.`
        );

        return res.redirect("/denunciaAdm");
    } catch (erro) {
        console.error("Erro ao atribuir denúncia:", erro);
        return res.status(500).send("Erro ao atribuir a denúncia.");
    }
}

// ========================================
// ALTERAR STATUS
async function alterarStatus(req, res) {
    try {
        const idDenuncia = Number(req.params.idDenuncia);
        const { novoStatus } = req.body;

        const idOrganizacao = Number(
            req.session.usuario.idOrganizacao
        );

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

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

        const resultado = await denunciaAdmModel.buscarStatus(
            idDenuncia,
            idOrganizacao
        );

        if (resultado.length === 0) {
            return res.status(404).send("Denúncia não encontrada.");
        }

        const statusAtual = resultado[0].status;

        if (statusAtual === novoStatus) {
            return res.redirect("/denunciaAdm");
        }

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

// ALTERAR PRIORIDADE
async function alterarPrioridade(req, res) {
    try {
        const idDenuncia = Number(req.params.idDenuncia);
        const { novaPrioridade } = req.body;

        const idOrganizacao = Number(
            req.session.usuario.idOrganizacao
        );

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

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
            idDenuncia,
            idOrganizacao
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
            idOrganizacao,
            novaPrioridade
        );

        await denunciaAdmModel.registrarHistorico(
            idDenuncia,
            idOrganizacao,
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
    atribuirASiMesmo,
    alterarStatus,
    alterarPrioridade
};
