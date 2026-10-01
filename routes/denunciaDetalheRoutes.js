<<<<<<< HEAD
const express = require("express");

const router = express.Router();

const { executarQuery } = require("../db/dbConnect");


// ========================================
// MOSTRAR DETALHES DA DENÚNCIA
// ========================================
=======

const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');


// ========================================
// MOSTRAR DETALHES DE UMA DENÚNCIA
// ========================================
router.get("/:id", async (req, res) => {

    const idDenuncia = req.params.id;


    try {

        const resultado = await executarQuery(
            `SELECT
                d.idDenuncia,
                d.tipo,
                d.descricao,
                d.status,
                d.prioridade,
                d.dataAbertura,
                l.endereco,
                u.nome AS nomeUsuario

            FROM DENUNCIA d

            INNER JOIN LOCALIZACAO l
                ON d.idLocalizacao = l.idLocalizacao

            INNER JOIN USUARIO u
                ON d.idUsuario = u.id

            WHERE d.idDenuncia = ?`,
            [idDenuncia]
        );


        // Verifica se encontrou a denúncia
        if (resultado.length === 0) {

            return res.status(404).send("Denúncia não encontrada.");

        }


        const dados = resultado[0];


        // Monta o objeto que será enviado para o EJS
        const denuncia = {

            id: dados.idDenuncia,

            titulo: dados.tipo,

            tipo: dados.tipo,

            denunciante: dados.nomeUsuario,

            dataRegistro: dados.dataAbertura,

            localizacao: dados.endereco,

            descricao: dados.descricao,

            status: dados.status,

            prioridade: dados.prioridade,

            responsavel: "Aguardando fiscal",

            evidencias: []

        };


        res.render("denunciaDetalhe", {

            denuncia: denuncia,

            historico: [],

            mensagens: []

        });


    } catch (erro) {

        console.error("Erro ao buscar denúncia:", erro);

        res.status(500).send("Erro ao buscar denúncia.");

    }

});


// ========================================
// AÇÕES DOS BOTÕES
// ========================================
router.post("/:id", (req, res) => {

    const { acao } = req.body;
    const idDenuncia = req.params.id;
>>>>>>> a285639def4cc197bc03539761926819b8452411

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

<<<<<<< HEAD
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
=======
    res.redirect(`/denunciaDetalhe/${idDenuncia}`);

});


module.exports = router;

>>>>>>> a285639def4cc197bc03539761926819b8452411
