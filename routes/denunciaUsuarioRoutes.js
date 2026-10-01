const express = require('express');
const router = express.Router();
const multer = require("multer");

<<<<<<< HEAD
const path = require("path");

const {executarQuery} = require("../db/dbConnect");

//================================
// CONFIGURAÇÃO DO MULTER
//================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/uploads");

    },

    filename: function (req, file, cb) {
        const nomeArquivo =
        Date.now() + "-" + file.originalname;

        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
});

//=================================
//TELA DE NOVA DENÚNCIA
//=================================

router.get("/", (req, res) => {
    res.render("denunciaUsuario");
});

//=========================
//RECEBER NOVA DENÚNCIA
//=========================

router.post("/", upload.array("arquivo"), async (req, res) => {

    try {

        console.log("=================================");
        console.log("NOVA DENÚNCIA");
        console.log(req.body);
        console.log("=================================");


        // ================================
        // DADOS DO FORMULÁRIO
        // ================================

        const {
            visibilidade,
            categoria,
            titulo,
            descricao,
            local,
            data
        } = req.body;


        // ================================
        // USUÁRIO
        // ================================

        // Temporariamente estamos usando
        // o usuário de ID 1.

        const idUsuario = 1;


        // ================================
        // LOCALIZAÇÃO
        // ================================

        const resultadoLocalizacao = await executarQuery(

            `INSERT INTO LOCALIZACAO
            (tipo, endereco)
            VALUES (?, ?)`,

=======
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
>>>>>>> a285639def4cc197bc03539761926819b8452411
            [
                "Manual",
                local
            ]
<<<<<<< HEAD

        );


        const idLocalizacao =
            Number(resultadoLocalizacao.insertId);


        // ================================
        // DENÚNCIA
        // ================================

        const resultadoDenuncia = await executarQuery(

            `INSERT INTO DENUNCIA
            (
                idUsuario,
                titulo,
                tipo,
                descricao,
                dataOcorrencia,
                visibilidade,
=======
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
>>>>>>> a285639def4cc197bc03539761926819b8452411
                status,
                prioridade,
                idLocalizacao
            )
<<<<<<< HEAD
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [
                idUsuario,
                titulo,
                categoria,
                descricao,
                data || null,
                visibilidade,
                "Pendente",
                "Média",
                idLocalizacao
            ]

        );


        const idDenuncia =
            Number(resultadoDenuncia.insertId);

            // ================================
// CRIAR PRIMEIRO REGISTRO DO HISTÓRICO
// ================================

await executarQuery(

    `INSERT INTO HISTORICO_DENUNCIA
    (
        idDenuncia,
        titulo
    )
    VALUES (?, ?)`,

    [
        idDenuncia,
        "Denúncia registrada"
    ]

);

        // ================================
        // EVIDÊNCIAS
        // ================================

        if (req.files && req.files.length > 0) {

            for (const arquivo of req.files) {

                let tipoEvidencia = "arquivo";

                if (arquivo.mimetype.startsWith("image/")) {

                    tipoEvidencia = "imagem";

                } else if (arquivo.mimetype.startsWith("video/")) {

                    tipoEvidencia = "video";

                }


                await executarQuery(

                    `INSERT INTO EVIDENCIA
                    (
                        idDenuncia,
                        tipoEvidencia,
                        fotoVideoAudio,
                        dadosEvidencia
                    )
                    VALUES (?, ?, ?, ?)`,

                    [
                        idDenuncia,
                        tipoEvidencia,
                        null,
                        `/uploads/${arquivo.filename}`
                    ]

                );

            }

        }


        // ================================
        // REDIRECIONAR
        // ================================

        res.redirect(`/denunciaDetalhe/${idDenuncia}`);
=======
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

>>>>>>> a285639def4cc197bc03539761926819b8452411

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