const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');

// =================================
// TELA DE NOVA DENÚNCIA
// =================================
router.get("/", (req, res) => {

    res.render("denunciaUsuario");

});


// =================================
// RECEBER NOVA DENÚNCIA
// =================================
router.post("/", async (req, res) => {

    console.log("=================================");
    console.log("NOVA DENÚNCIA RECEBIDA");
    console.log("=================================");

    console.log("Dados recebidos:", req.body);


    const {
        categoria,
        titulo,
        descricao,
        local,
        data
    } = req.body;


    try {

        // =================================
        // 1. CADASTRAR LOCALIZAÇÃO
        // =================================

        const resultadoLocalizacao = await executarQuery(
            `
            INSERT INTO LOCALIZACAO
            (tipo, endereco)
            VALUES (?, ?)
            `,
            [
                "Manual",
                local
            ]
        );


        const idLocalizacao = resultadoLocalizacao.insertId;

        console.log(
            "Localização criada:",
            idLocalizacao
        );


        // =================================
        // 2. CADASTRAR DENÚNCIA
        // =================================

        const resultadoDenuncia = await executarQuery(
            `
            INSERT INTO DENUNCIA
            (
                idUsuario,
                tipo,
                descricao,
                status,
                prioridade,
                idLocalizacao
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                1,
                categoria,
                `Título: ${titulo}\n\n${descricao}`,
                "Em análise",
                "Média",
                idLocalizacao
            ]
        );


        // =================================
        // 3. PEGAR ID DA DENÚNCIA
        // =================================

        const idDenuncia = resultadoDenuncia.insertId;

        console.log(
            "Denúncia criada:",
            idDenuncia
        );


        // =================================
        // 4. MANDAR PARA DENUNCIA DETALHE
        // =================================

        res.redirect(
            `/denunciaDetalhe/${idDenuncia}`
        );


    } catch (erro) {

        console.error(
            "Erro ao cadastrar denúncia:",
            erro
        );

        res.status(500).send(
            "Erro ao cadastrar denúncia."
        );

    }

});


router.get("/notificacoes", (req, res) => {

    res.render("notificacoes");

});


module.exports = router;