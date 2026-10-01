const express = require("express");

const router = express.Router();

const { executarQuery } = require("../db/dbConnect");


// ========================================
// MOSTRAR DETALHES DA DENÚNCIA
// ========================================

router.get("/:id", async (req, res) => {

    try {

        const idDenuncia = Number(req.params.id);


        if (!idDenuncia) {

            return res.status(400).send(
                "ID da denúncia inválido."
            );

        }


        // ========================================
        // BUSCAR DENÚNCIA
        // ========================================

        const resultado = await executarQuery(

            `SELECT
                d.idDenuncia,
                d.titulo,
                d.tipo,
                d.descricao,
                d.dataOcorrencia,
                d.visibilidade,
                d.status,
                d.prioridade,
                d.dataAbertura,

                l.endereco,

                u.nome AS nomeUsuario,

                f.nome AS nomeFiscal

            FROM DENUNCIA d

            INNER JOIN LOCALIZACAO l
                ON d.idLocalizacao = l.idLocalizacao

            INNER JOIN USUARIO u
                ON d.idUsuario = u.id

            LEFT JOIN FISCAL f
                ON d.fiscal_id = f.id

            WHERE d.idDenuncia = ?`,

            [idDenuncia]

        );


        if (resultado.length === 0) {

            return res.status(404).send(
                "Denúncia não encontrada."
            );

        }


        const denunciaBanco = resultado[0];


        // ========================================
        // BUSCAR EVIDÊNCIAS
        // ========================================

        const evidencias = await executarQuery(

            `SELECT
                idEvidencia,
                tipoEvidencia,
                dadosEvidencia

            FROM EVIDENCIA

            WHERE idDenuncia = ?`,

            [idDenuncia]

        );

         // ========================================
        // BUSCAR HISTÓRICO
        // ========================================

        const historico = await executarQuery(

            `SELECT
                idHistorico,
                titulo,
                dataHora

            FROM HISTORICO_DENUNCIA

            WHERE idDenuncia = ?

            ORDER BY dataHora ASC`,

            [idDenuncia]

        );

        // ========================================
        // BUSCAR MENSAGENS
        // ========================================

        const mensagens = await executarQuery(

            `SELECT
                m.idMensagem,
                m.texto,
                m.dataHora,

                u.nome AS autor

            FROM MENSAGEM_DENUNCIA m

            INNER JOIN USUARIO u
                ON m.idUsuario = u.id

            WHERE m.idDenuncia = ?

            ORDER BY m.dataHora ASC`,

            [idDenuncia]

        );


        // ========================================
        // ENVIAR PARA O EJS
        // ========================================

        res.render("denunciaDetalhe", {

            denuncia: denunciaBanco,

            evidencias: evidencias,

            historico: historico,

            mensagens: mensagens

        });


    } catch (erro) {

        console.error(
            "Erro ao buscar denúncia:",
            erro
        );

        res.status(500).send(
            "Erro ao carregar os detalhes da denúncia."
        );

    }

});

// ========================================
// ENVIAR NOVA MENSAGEM
// ========================================

router.post("/:id/mensagem", async (req, res) => {

    try {

        const idDenuncia = Number(req.params.id);

        const texto = req.body.texto;

        // Temporariamente usamos o usuário 1
        const idUsuario = 1;


        if (!texto || texto.trim() === "") {

            return res.status(400).send(
                "A mensagem não pode estar vazia."
            );

        }


        await executarQuery(

            `INSERT INTO MENSAGEM_DENUNCIA
            (
                idDenuncia,
                idUsuario,
                texto
            )
            VALUES (?, ?, ?)`,

            [
                idDenuncia,
                idUsuario,
                texto.trim()
            ]

        );


        res.redirect(`/denunciaDetalhe/${idDenuncia}`);


    } catch (erro) {

        console.error(
            "Erro ao enviar mensagem:",
            erro
        );

        res.status(500).send(
            "Erro ao enviar mensagem."
        );

    }

});


module.exports = router;