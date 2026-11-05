
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { executarTransacao } = require("../db/dbConnect");
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
    limits: {
        files: 10,
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/")
        ) {
            return cb(null, true);
        }

        cb(new Error("Apenas imagens e vídeos são permitidos."));
    }
});

// Remove arquivos enviados caso o cadastro não seja concluído.
async function removerArquivos(files = []) {
    await Promise.allSettled(
        files.map(arquivo => fs.promises.unlink(arquivo.path))
    );
}

router.get("/", verificarUsuario, (req, res) => {
        res.render("denunciaUsuario");
});

router.post(
    "/",
    verificarUsuario,
    upload.array("arquivo"),
    async (req, res) => {
        const {
            visibilidade,
            categoria,
            titulo,
            descricao,
            local,
            data
        } = req.body;

        const idUsuario = req.session.usuario.id;
        const arquivos = req.files || [];

        if (
            !categoria?.trim() ||
            !titulo?.trim() ||
            !descricao?.trim() ||
            !local?.trim()
        ) {
            await removerArquivos(arquivos);

            return res.status(400).send(
                "Preencha todos os campos obrigatórios da denúncia."
            );
        }

        try {
            const idDenuncia = await executarTransacao(async conn => {
                // 1. Cadastra a localização na mesma transação.
                const resultadoLocalizacao = await conn.query(
                    `INSERT INTO LOCALIZACAO (tipo, endereco)
                     VALUES (?, ?)`,
                    ["Manual", local.trim()]
                );

                const idLocalizacao = Number(
                    resultadoLocalizacao.insertId
                );

                // 2. Cadastra cada informação em sua própria coluna.
                // Assim, título, visibilidade e data não ficam misturados
                // com o texto da descrição.
                const visibilidadeValida =
                    visibilidade === "identificado" ? "identificado" : "anonimo";

                const resultadoDenuncia = await conn.query(
                    `INSERT INTO DENUNCIA
                        (
                            idUsuario,
                            titulo,
                            tipo,
                            descricao,
                            dataOcorrencia,
                            visibilidade,
                            status,
                            prioridade,
                            idLocalizacao
                        )
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        idUsuario,
                        titulo.trim(),
                        categoria,
                        descricao.trim(),
                        data?.trim() || null,
                        visibilidadeValida,
                        "Pendente",
                        "Média",
                        idLocalizacao
                    ]
                );

                const novoIdDenuncia = Number(
                    resultadoDenuncia.insertId
                );

                // 3. Registra o histórico inicial.
                await conn.query(
                    `INSERT INTO HISTORICO_DENUNCIA
                        (idDenuncia, titulo)
                     VALUES (?, ?)`,
                    [
                        novoIdDenuncia,
                        "Denúncia registrada"
                    ]
                );

                // 4. Cria uma notificação para o usuário.
                await conn.query(
                    `INSERT INTO NOTIFICACAO
                        (idDenuncia, idUsuario, conteudo)
                     VALUES (?, ?, ?)`,
                    [
                        novoIdDenuncia,
                        idUsuario,
                        `Sua denúncia "${titulo.trim()}" foi registrada com sucesso.`
                    ]
                );

                // 5. Registra todas as evidências.
                for (const arquivo of arquivos) {
                    const tipoEvidencia =
                        arquivo.mimetype.startsWith("image/")
                            ? "imagem"
                            : "video";

                    await conn.query(
                        `INSERT INTO EVIDENCIA
                            (
                                idDenuncia,
                                tipoEvidencia,
                                fotoVideoAudio,
                                dadosEvidencia
                            )
                         VALUES (?, ?, ?, ?)`,
                        [
                            novoIdDenuncia,
                            tipoEvidencia,
                            null,
                            `/uploads/${arquivo.filename}`
                        ]
                    );
                }

                // O helper executará COMMIT após este retorno.
                return novoIdDenuncia;
            });

            return res.redirect(
                `/denunciaDetalhe/${idDenuncia}`
            );
        } catch (erro) {
            console.error("Erro ao cadastrar denúncia:", erro);

            // O helper executa ROLLBACK em caso de erro SQL.
            // Também removemos os arquivos salvos pelo Multer.
            await removerArquivos(arquivos);

            return res.status(500).send(
                "Erro ao cadastrar denúncia."
            );
        }
    }
);

module.exports = router;
