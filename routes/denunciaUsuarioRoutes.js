const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { executarQuery } = require("../db/dbConnect");
const { verificarUsuario } = require("../middlewares/autenticacao");

const pastaUploads = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(pastaUploads, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, pastaUploads),
    filename: (_req, file, cb) => {
        const extensao = path.extname(file.originalname);
        const nomeSeguro = path
            .basename(file.originalname, extensao)
            .replace(/[^a-zA-Z0-9_-]/g, "_");
        cb(null, `${Date.now()}-${nomeSeguro}${extensao}`);
    }
});

const upload = multer({
    storage,
    limits: { files: 10, fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            return cb(null, true);
        }
        cb(new Error("Apenas imagens e vídeos são permitidos."));
    }
});

router.get("/", verificarUsuario, (req, res) => {
    res.render("denunciaUsuario");
});

router.post("/", verificarUsuario, upload.array("arquivo"), async (req, res) => {
    const {
        visibilidade,
        categoria,
        titulo,
        descricao,
        local,
        data
    } = req.body;

    const idUsuario = req.session.usuario.id;

    if (!categoria || !titulo || !descricao || !local) {
        return res.status(400).send("Preencha todos os campos obrigatórios da denúncia.");
    }

    try {
        const resultadoLocalizacao = await executarQuery(
            `INSERT INTO LOCALIZACAO (tipo, endereco) VALUES (?, ?)`,
            ["Manual", local.trim()]
        );

        const idLocalizacao = Number(resultadoLocalizacao.insertId);

        // O banco atual não possui colunas separadas para título, data de ocorrência
        // e visibilidade. Mantemos essas informações no histórico/descrição sem
        // alterar a estrutura existente do banco.
        const descricaoCompleta = [
            `Título: ${titulo.trim()}`,
            `Visibilidade: ${visibilidade === "anonimo" ? "Anônima" : "Identificada"}`,
            data ? `Data da ocorrência: ${data}` : null,
            "",
            descricao.trim()
        ].filter(Boolean).join("\n");

        const resultadoDenuncia = await executarQuery(
            `INSERT INTO DENUNCIA
                (idUsuario, tipo, descricao, status, prioridade, idLocalizacao)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                idUsuario,
                categoria,
                descricaoCompleta,
                "Pendente",
                "Média",
                idLocalizacao
            ]
        );

        const idDenuncia = Number(resultadoDenuncia.insertId);

        await executarQuery(
            `INSERT INTO HISTORICO_DENUNCIA (idDenuncia, titulo)
             VALUES (?, ?)`,
            [idDenuncia, "Denúncia registrada"]
        );

        for (const arquivo of req.files || []) {
            const tipoEvidencia = arquivo.mimetype.startsWith("image/")
                ? "imagem"
                : "video";

            await executarQuery(
                `INSERT INTO EVIDENCIA
                    (idDenuncia, tipoEvidencia, fotoVideoAudio, dadosEvidencia)
                 VALUES (?, ?, ?, ?)`,
                [
                    idDenuncia,
                    tipoEvidencia,
                    null,
                    `/uploads/${arquivo.filename}`
                ]
            );
        }

        return res.redirect(`/denunciaDetalhe/${idDenuncia}`);
    } catch (erro) {
        console.error("Erro ao cadastrar denúncia:", erro);
        return res.status(500).send("Erro ao cadastrar denúncia.");
    }
});

module.exports = router;
