
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

    console.log("Ação realizada:", acao);

    res.redirect(`/denunciaDetalhe/${idDenuncia}`);

});


module.exports = router;

