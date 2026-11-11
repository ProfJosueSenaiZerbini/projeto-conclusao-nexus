
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

// Exibe a página de cadastro.
router.get("/", verificarUsuario, (req, res) => {
    res.render("denunciaUsuario");
});

// Cadastra uma nova denúncia.
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
            cidade,
            estado,
            data
        } = req.body;

        const idUsuario = req.session.usuario.id;
        const arquivos = req.files || [];

        // Validação dos campos obrigatórios.
        if (
            !categoria?.trim() ||
            !titulo?.trim() ||
            !descricao?.trim() ||
            !local?.trim() ||
            !cidade?.trim() ||
            !estado?.trim()

        ) {
            await removerArquivos(arquivos);

            return res.status(400).send(
                "Preencha todos os campos obrigatórios da denúncia."
            );
        }

        try {

            const idDenuncia = await executarTransacao(async conn => {

                // 1. Busca a organização responsável pela cidade e estado.
                const resultadoOrganizacao = await conn.query(
                    `SELECT
        o.idOrganizacao,
        o.status,
        o.statusContrato
     FROM ORGANIZACAO_LOCALIDADE ol
     INNER JOIN ORGANIZACAO o
        ON o.idOrganizacao = ol.idOrganizacao
     WHERE UPPER(TRIM(ol.cidade)) = UPPER(TRIM(?))
       AND UPPER(TRIM(ol.estado)) = UPPER(TRIM(?))
     LIMIT 1`,
                    [
                        cidade.trim(),
                        estado.trim()
                    ]
                );

                // Verifica se existe organização responsável pela localidade.
                if (resultadoOrganizacao.length === 0) {
                    const erro = new Error(
                        "Não existe uma organização atendendo esta cidade e estado."
                    );
                    erro.codigo = "ORGANIZACAO_NAO_ENCONTRADA";
                    throw erro;
                }

                const organizacao = resultadoOrganizacao[0];

                // Verifica se a organização pode receber denúncias.
                if (
                    organizacao.status !== "ativa" ||
                    organizacao.statusContrato !== "ativo"
                ) {
                    const erro = new Error(
                        "A organização responsável não está disponível."
                    );
                    erro.codigo = "ORGANIZACAO_INATIVA";
                    throw erro;
                }

                const idOrganizacao = Number(organizacao.idOrganizacao);

                // 2. Cadastra a localização na mesma transação.
                const resultadoLocalizacao = await conn.query(
                    `INSERT INTO LOCALIZACAO
        (tipo, endereco, cidade, estado)
     VALUES (?, ?, ?, ?)`,
                    [
                        "Manual",
                        local.trim(),
                        cidade.trim(),
                        estado.trim().toUpperCase()
                    ]
                );

                const idLocalizacao = Number(
                    resultadoLocalizacao.insertId
                );

                // 3. Montar a descrição completa.
                const descricaoCompleta = [
                    `Título: ${titulo.trim()}`,
                    `Visibilidade: ${visibilidade === "anonimo"
                        ? "Anônima"
                        : "Identificada"
                    }`,
                    data ? `Data da ocorrência: ${data}` : null,
                    "",
                    descricao.trim()
                ]
                    .filter(Boolean)
                    .join("\n");

                // 4. Cadastra a denúncia com o id da organização.
                const resultadoDenuncia = await conn.query(
                    `INSERT INTO DENUNCIA
                        (
                            idUsuario,
                            idOrganizacao,
                            tipo,
                            descricao,
                            status,
                            prioridade,
                            idLocalizacao
                        )
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        idUsuario,
                        idOrganizacao,
                        categoria.trim(),
                        descricaoCompleta,
                        "Pendente",
                        "Média",
                        idLocalizacao
                    ]
                );

                const novoIdDenuncia = Number(
                    resultadoDenuncia.insertId
                );

                // 5. Registra o histórico inicial.
                await conn.query(
                    `INSERT INTO HISTORICO_DENUNCIA
                        (idDenuncia, titulo)
                     VALUES (?, ?)`,
                    [
                        novoIdDenuncia,
                        "Denúncia registrada"
                    ]
                );

                // 6. Cria uma notificação para o usuário.
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

                // 7. Registra todas as evidências.
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

                // Retorna o ID para finalizar a transação.
                return novoIdDenuncia;
            });

            // 8. Redireciona para os detalhes da denúncia.
            return res.redirect(
                `/denunciaDetalhe/${idDenuncia}`
            );

        } catch (erro) {

            console.error(
                "Erro ao cadastrar denúncia:",
                erro
            );

            // Remove os arquivos caso a transação falhe.
            await removerArquivos(arquivos);

            // Erros de encaminhamento da organização.
            if (
                erro.codigo === "ORGANIZACAO_NAO_ENCONTRADA" ||
                erro.codigo === "ORGANIZACAO_INATIVA"
            ) {
                return res.status(400).send(erro.message);
            }

            return res.status(500).send(
                "Erro ao cadastrar denúncia."
            );
        }
    }
);

module.exports = router;
