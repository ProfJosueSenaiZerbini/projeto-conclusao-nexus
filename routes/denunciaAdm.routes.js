const express = require("express");

const router = express.Router();

const { executarQuery } = require("../db/dbConnect");

// ========================================
// PÁGINA DE DENÚNCIAS DO ADMINISTRADOR
// ========================================

router.get("/", async (req, res) => {

    try {

        const denuncias = await executarQuery(
            `SELECT
                d.idDenuncia,
                d.titulo,
                d.tipo,
                d.descricao,
                d.dataOcorrencia,
                d.dataAbertura,
                d.status,
                d.prioridade,

                l.endereco,

                u.nome AS nomeUsuario

            FROM DENUNCIA d

            INNER JOIN LOCALIZACAO l
                ON d.idLocalizacao = l.idLocalizacao

            INNER JOIN USUARIO u
                ON d.idUsuario = u.id

            ORDER BY d.dataAbertura DESC`
        );

        res.render("denunciaAdm", {
            denuncias: denuncias
        });

    } catch (erro) {

        console.error(
            "Erro ao buscar denúncias:",
            erro
        );

        res.status(500).send(
            "Erro ao carregar as denúncias."
        );

    }

});


// ========================================
// ALTERAR STATUS DA DENÚNCIA
// ========================================

router.post("/:id/status", async (req, res) => {

    try {

        const idDenuncia = Number(req.params.id);

        const novoStatus = req.body.status;

        // --------------------------------
        // VALIDAR ID
        // --------------------------------

        if (!idDenuncia) {

            return res.status(400).send(
                "ID da denúncia inválido."
            );

        }

        // --------------------------------
        // STATUS PERMITIDOS
        // --------------------------------

        const statusPermitidos = [
            "Pendente",
            "Em análise",
            "Resolvida",
            "Arquivada"
        ];

        if (!statusPermitidos.includes(novoStatus)) {

            return res.status(400).send(
                "Status inválido."
            );

        }

        // --------------------------------
        // BUSCAR STATUS ATUAL
        // --------------------------------

        const resultadoAtual = await executarQuery(
            `SELECT status
             FROM DENUNCIA
             WHERE idDenuncia = ?`,
            [idDenuncia]
        );

        if (resultadoAtual.length === 0) {

            return res.status(404).send(
                "Denúncia não encontrada."
            );

        }

        const statusAtual = resultadoAtual[0].status;

        // --------------------------------
        // VERIFICAR SE REALMENTE MUDOU
        // --------------------------------

        if (statusAtual === novoStatus) {

            return res.redirect("/denunciaAdm");

        }

        // --------------------------------
        // ALTERAR STATUS
        // --------------------------------

        await executarQuery(
            `UPDATE DENUNCIA
             SET status = ?
             WHERE idDenuncia = ?`,
            [
                novoStatus,
                idDenuncia
            ]
        );

        // --------------------------------
        // REGISTRAR NO HISTÓRICO
        // --------------------------------

        await executarQuery(
            `INSERT INTO HISTORICO_DENUNCIA
            (
                idDenuncia,
                titulo
            )
            VALUES (?, ?)`,
            [
                idDenuncia,
                `Status alterado para: ${novoStatus}`
            ]
        );

        console.log(
            `Denúncia ${idDenuncia}: ${statusAtual} → ${novoStatus}`
        );

        // --------------------------------
        // VOLTAR PARA A LISTA
        // --------------------------------

        res.redirect("/denunciaAdm");

    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );

        res.status(500).send(
            "Erro ao alterar o status da denúncia."
        );

    }

});


module.exports = router;