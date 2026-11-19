
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { executarTransacao } = require("../db/dbConnect");
const { verificarUsuario } = require("../middlewares/autenticacao");
const { criarNotificacao } = require("../services/notificacaoService");

// =====================================================
// CONFIGURAÇÃO DOS UPLOADS
// =====================================================

const pastaUploads = path.join(__dirname, "..", "public", "uploads");

fs.mkdirSync(pastaUploads, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, pastaUploads);
    },

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

// =====================================================
// REMOVER ARQUIVOS CASO O CADASTRO FALHE
// =====================================================

async function removerArquivos(files = []) {
    await Promise.allSettled(
        files.map(arquivo => fs.promises.unlink(arquivo.path))
    );
}

// =====================================================
// EXIBIR PÁGINA DE CADASTRO
// =====================================================

router.get("/", verificarUsuario, (req, res) => {
    res.render("denunciaUsuario");
});

// =====================================================
// CADASTRAR NOVA DENÚNCIA
// =====================================================

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

        // 1. Validação dos campos obrigatórios.

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

                // =================================================
                // 2. BUSCAR LOCALIDADE
                // =================================================

                const resultadoLocalidade = await conn.query(
                    `SELECT idLocalidade
                     FROM LOCALIDADE
                     WHERE UPPER(TRIM(cidade)) = UPPER(TRIM(?))
                       AND UPPER(TRIM(estado)) = UPPER(TRIM(?))
                     LIMIT 1`,
                    [
                        cidade.trim(),
                        estado.trim()
                    ]
                );

                if (resultadoLocalidade.length === 0) {
                    const erro = new Error(
                        "A cidade e o estado informados não estão cadastrados."
                    );

                    erro.codigo = "LOCALIDADE_NAO_ENCONTRADA";
                    throw erro;
                }

                const idLocalidade = Number(
                    resultadoLocalidade[0].idLocalidade
                );

                
// =================================================
// 3. IDENTIFICAR ORGANIZAÇÃO PELA LOCALIDADE
// =================================================

const organizacoesResponsaveis = await conn.query(
    `SELECT DISTINCT f.idOrganizacao
     FROM FISCAL f
     INNER JOIN FISCAL_LOCALIDADE fl
        ON fl.idFiscal = f.id
     WHERE fl.idLocalidade = ?
       AND f.status = 'ativo'
       AND f.idOrganizacao IS NOT NULL`,
    [idLocalidade]
);

if (organizacoesResponsaveis.length === 0) {
    const erro = new Error(
        "Não existe fiscal ativo responsável por essa localidade."
    );

    erro.codigo = "FISCAL_NAO_ENCONTRADO";
    throw erro;
}

if (organizacoesResponsaveis.length > 1) {
    const erro = new Error(
        "Existem várias organizações responsáveis por essa localidade."
    );

    erro.codigo = "VARIAS_ORGANIZACOES";
    throw erro;
}

const idOrganizacao = Number(
    organizacoesResponsaveis[0].idOrganizacao
);


                // =================================================
                // 4. CADASTRAR LOCALIZAÇÃO
                // =================================================

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

                // =================================================
                // 5. CADASTRAR DENÚNCIA
                // =================================================

                const resultadoDenuncia = await conn.query(
                    `INSERT INTO DENUNCIA
                    (
                        idUsuario,
                        idOrganizacao,
                        idLocalidade,
                        titulo,
                        tipo,
                        descricao,
                        dataOcorrencia,
                        visibilidade,
                        status,
                        prioridade,
                        idLocalizacao
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        idUsuario,
                        idOrganizacao,
                        idLocalidade,
                        titulo.trim(),
                        categoria.trim(),
                        descricao.trim(),
                        data || null,
                        visibilidade === "identificado"
                            ? "identificado"
                            : "anonimo",
                        "Pendente",
                        "Média",
                        idLocalizacao
                    ]
                );

                const novoIdDenuncia = Number(
                    resultadoDenuncia.insertId
                );

                // =================================================
                // 6. BUSCAR FISCAIS RESPONSÁVEIS
                // =================================================

                const fiscaisResponsaveis = await conn.query(
                    `SELECT DISTINCT f.id
                     FROM FISCAL f
                     INNER JOIN FISCAL_LOCALIDADE fl
                        ON fl.idFiscal = f.id
                     WHERE f.idOrganizacao = ?
                       AND fl.idLocalidade = ?
                       AND f.status = 'ativo'`,
                    [
                        idOrganizacao,
                        idLocalidade
                    ]
                );

                // =================================================
                // 7. NOTIFICAR O CIDADÃO
                // =================================================

                await criarNotificacao(conn, {
                    idDenuncia: novoIdDenuncia,
                    idUsuario,

                    titulo: "Denúncia registrada",
                    tipo: "nova_denuncia",

                    conteudo: `Sua denúncia "${titulo.trim()}" foi registrada com sucesso.`
                });

                // =================================================
                // 8. NOTIFICAR OS FISCAIS RESPONSÁVEIS
                // =================================================

                for (const fiscal of fiscaisResponsaveis) {

                    await criarNotificacao(conn, {
                        idDenuncia: novoIdDenuncia,
                        idFiscal: Number(fiscal.id),

                        titulo: "Nova denúncia recebida",
                        tipo: "nova_denuncia",

                        conteudo: `Uma nova denúncia da categoria "${categoria}" foi registrada na sua localidade de atendimento.`
                    });
                }

                // =================================================
                // 9. BUSCAR SUPERUSUÁRIO DA ORGANIZAÇÃO
                // =================================================

                const superusuarios = await conn.query(
                    `SELECT idSuperusuario
                     FROM SUPERUSUARIO
                     WHERE idOrganizacao = ?
                     LIMIT 1`,
                    [idOrganizacao]
                );

                // =================================================
                // 10. NOTIFICAR SUPERUSUÁRIO
                // =================================================

                if (superusuarios.length > 0) {

                    await criarNotificacao(conn, {
                        idDenuncia: novoIdDenuncia,

                        idSuperusuario: Number(
                            superusuarios[0].idSuperusuario
                        ),

                        titulo: "Nova denúncia na organização",
                        tipo: "nova_denuncia",

                        conteudo: `Uma nova denúncia da categoria "${categoria}" foi recebida pela organização.`
                    });
                }

                // =================================================
                // 11. CADASTRAR EVIDÊNCIAS
                // =================================================

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

                // =================================================
                // 12. FINALIZAR TRANSAÇÃO
                // =================================================

                return novoIdDenuncia;

            });

            // =====================================================
            // 13. REDIRECIONAR PARA DETALHES
            // =====================================================

            return res.redirect(
                `/denunciaDetalhe/${idDenuncia}`
            );

        } catch (erro) {

            console.error(
                "Erro ao cadastrar denúncia:",
                erro
            );

            await removerArquivos(arquivos);

    if (erro.codigo === "LOCALIDADE_NAO_ENCONTRADA") {
        return res.status(400).send(erro.message);
    }

    if (erro.codigo === "FISCAL_NAO_ENCONTRADO") {
        return res.status(400).send(erro.message);
    }

    if (erro.codigo === "VARIAS_ORGANIZACOES") {
        return res.status(400).send(erro.message);
    }

    return res.status(500).send(
        "Erro ao cadastrar denúncia."
    );
}
        }
);

module.exports = router;
