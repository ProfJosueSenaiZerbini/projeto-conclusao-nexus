const express = require("express");
const router = express.Router();

const { executarQuery } = require("../db/dbConnect");

const {
    verificarUsuario
} = require("../middlewares/autenticacao");

function verificarAcesso(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }

    const { tipo } = req.session.usuario;

    if (!["usuario", "fiscal", "superusuario"].includes(tipo)) {
        return res.status(403).send("Acesso negado.");
    }

    next();
}

function idValido(valor) {
    const id = Number(valor);

    return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}

// DETALHES DA DENÚNCIA
router.get("/:id", verificarAcesso, async (req, res) => {
    const idDenuncia = idValido(req.params.id);

    if (!idDenuncia) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    try {
        const tipoUsuario = req.session.usuario.tipo;

        let filtroAcesso = "";
        const parametros = [idDenuncia];

        if (tipoUsuario === "fiscal") {
            const idFiscal = idValido(req.session.usuario.id);

            if (!idFiscal) {
                return res.status(403).send("Fiscal inválido.");
            }

            filtroAcesso = `
                AND EXISTS (
                    SELECT 1
                    FROM FISCAL_LOCALIDADE fl
                    WHERE fl.idFiscal = ?
                      AND fl.idLocalidade = d.idLocalidade
                )
            `;

            parametros.push(idFiscal);
        }

        if (tipoUsuario === "superusuario") {
            const idSuperusuario = idValido(
                req.session.usuario.id
            );

            if (!idSuperusuario) {
                return res.status(403).send(
                    "Superusuário inválido."
                );
            }

            filtroAcesso = `
                AND EXISTS (
                    SELECT 1
                    FROM FISCAL fiscal
                    INNER JOIN FISCAL_LOCALIDADE fl
                        ON fl.idFiscal = fiscal.id
                    WHERE fiscal.idSuperusuario = ?
                      AND fl.idLocalidade = d.idLocalidade
                )
            `;

            parametros.push(idSuperusuario);
        }

        const resultado = await executarQuery(
            `SELECT
                d.idDenuncia,
                d.idUsuario,
                d.titulo,
                d.tipo,
                d.visibilidade,
                DATE_FORMAT(
                    d.dataOcorrencia,
                    '%d/%m/%Y'
                ) AS dataOcorrenciaFormatada,
                d.descricao,
                d.status,
                d.prioridade,
                d.fiscal_id AS idFiscalResponsavel,
                DATE_FORMAT(
                    d.dataAbertura,
                    '%d/%m/%Y às %H:%i'
                ) AS dataAberturaFormatada,
                l.endereco,
                u.nome AS nomeUsuario,
                f.nome AS nomeFiscal
            FROM DENUNCIA d
            INNER JOIN LOCALIZACAO l
                ON d.idLocalizacao = l.idLocalizacao
            LEFT JOIN USUARIO u
                ON d.idUsuario = u.id
            LEFT JOIN FISCAL f
                ON d.fiscal_id = f.id
            WHERE d.idDenuncia = ?
            ${filtroAcesso}
            LIMIT 1`,
            parametros
        );

        if (!resultado.length) {
            return res.status(404).send(
                "Denúncia não encontrada."
            );
        }

        const denuncia = resultado[0];

        //* Compatibilidade com denúncias antigas.
        const descricaoOriginal = String(denuncia.descricao || "");
        const linhasDescricao = descricaoOriginal.split(/\r?\n/);

        const extrairCampoAntigo = (rotulo) => {
            const linha = linhasDescricao.find(item =>
                item.trim().toLowerCase().startsWith(
                    `${rotulo.toLowerCase()}:`
                )
            );

            return linha
                ? linha.slice(linha.indexOf(":") + 1).trim()
                : "";
        };

        const possuiDadosAntigos = linhasDescricao.some(linha =>
            /^(título|visibilidade|data da ocorrência):/i.test(
                linha.trim()
            )
        );

        if (!denuncia.titulo) {
            denuncia.titulo = extrairCampoAntigo("Título");
        }

        if (possuiDadosAntigos) {
            const visibilidadeAntiga =
                extrairCampoAntigo("Visibilidade");

            if (visibilidadeAntiga) {
                denuncia.visibilidade =
                    /identificad/i.test(visibilidadeAntiga)
                        ? "identificado"
                        : "anonimo";
            }

            const dataAntiga =
                extrairCampoAntigo("Data da ocorrência");

            if (!denuncia.dataOcorrenciaFormatada && dataAntiga) {
                const partesData = dataAntiga.match(
                    /^(\d{4})-(\d{2})-(\d{2})$/
                );

                denuncia.dataOcorrenciaFormatada = partesData
                    ? `${partesData[3]}/${partesData[2]}/${partesData[1]}`
                    : dataAntiga;
            }

            const indiceSeparador = linhasDescricao.findIndex(
                (linha, indice) =>
                    indice > 0 && linha.trim() === ""
            );

            if (indiceSeparador >= 0) {
                denuncia.descricao = linhasDescricao
                    .slice(indiceSeparador + 1)
                    .join("\n")
                    .trim();
            } else {
                denuncia.descricao = linhasDescricao
                    .filter(linha =>
                        !/^(título|visibilidade|data da ocorrência):/i.test(
                            linha.trim()
                        )
                    )
                    .join("\n")
                    .trim();
            }
        }

        const tipoVisualizador = req.session.usuario.tipo;

        const equipePodeVerIdentidade =
            ["fiscal", "superusuario"].includes(tipoVisualizador);

        const visibilidadeNormalizada = String(
            denuncia.visibilidade || "anonimo"
        )
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const denunciaAnonima =
            visibilidadeNormalizada === "anonimo";

        //* A identidade de uma denúncia anônima só é exibida à equipe.
        denuncia.nomeExibicao =
            !denunciaAnonima || equipePodeVerIdentidade
                ? denuncia.nomeUsuario
                : "Anônimo";

        const evidencias = await executarQuery(
            `SELECT
                idEvidencia,
                tipoEvidencia,
                dadosEvidencia
             FROM EVIDENCIA
             WHERE idDenuncia = ?
             ORDER BY idEvidencia ASC`,
            [idDenuncia]
        );

        const historico = await executarQuery(
            `SELECT
                idHistorico,
                titulo,
                autorNome,
                tipoAutor,
                DATE_FORMAT(
                    dataRegistro,
                    '%d/%m/%Y às %H:%i'
                ) AS dataRegistroFormatada
             FROM HISTORICO_DENUNCIA
             WHERE idDenuncia = ?
             ORDER BY dataRegistro ASC, idHistorico ASC`,
            [idDenuncia]
        );

        const mensagens = await executarQuery(
            `SELECT
                m.idMensagem,
                m.texto,
                DATE_FORMAT(
                    m.dataHora,
                    '%d/%m/%Y às %H:%i'
                ) AS dataHoraFormatada,
                CASE
                    WHEN m.idUsuario = d.idUsuario
                        AND LOWER(COALESCE(d.visibilidade, 'anonimo')) = 'anonimo'
                        AND ? = 0
                    THEN 'Anônimo'
                    ELSE COALESCE(u.nome, f.nome, 'Remetente')
                END AS autor,
                CASE
                    WHEN m.idFiscal IS NOT NULL THEN 'Fiscal'
                    ELSE 'Cidadão'
                END AS tipoRemetente
            FROM MENSAGEM_DENUNCIA m
            INNER JOIN DENUNCIA d
                ON m.idDenuncia = d.idDenuncia
            LEFT JOIN USUARIO u
                ON m.idUsuario = u.id
            LEFT JOIN FISCAL f
                ON m.idFiscal = f.id
            WHERE m.idDenuncia = ?
            ORDER BY m.dataHora ASC, m.idMensagem ASC`,
            [
                ["fiscal", "superusuario"].includes(
                    req.session.usuario.tipo
                ) ? 1 : 0,
                idDenuncia
            ]
        );

        return res.render("denunciaDetalhe", {
            denuncia,
            evidencias,
            historico,
            mensagens,

            podeEnviarMensagem:
                req.session.usuario.tipo === "usuario" &&
                Number(req.session.usuario.id) ===
                Number(denuncia.idUsuario),

            podeEnviarMensagemFiscal:
                req.session.usuario.tipo === "fiscal" &&
                Number(req.session.usuario.id) ===
                Number(denuncia.idFiscalResponsavel)
        });

    } catch (erro) {
        console.error("Erro ao buscar denúncia:", erro);

        return res.status(500).send(
            "Erro ao carregar os detalhes da denúncia."
        );
    }
});


// ENVIO DE MENSAGENS
router.post("/:id/mensagem", verificarAcesso, async (req, res) => {
    const idDenuncia = idValido(req.params.id);
    const usuarioSessao = req.session.usuario;
    const texto = String(req.body.texto || "").trim();

    if (!idDenuncia) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    if (!texto || texto.length > 2000) {
        return res.status(400).send(
            "A mensagem deve ter entre 1 e 2000 caracteres."
        );
    }

    try {
        const resultado = await executarQuery(
            `SELECT
                idUsuario,
                fiscal_id,
                idLocalidade
             FROM DENUNCIA
             WHERE idDenuncia = ?
             LIMIT 1`,
            [idDenuncia]
        );

        if (!resultado.length) {
            return res.status(404).send(
                "Denúncia não encontrada."
            );
        }

        const denuncia = resultado[0];

        let idUsuario = null;
        let idFiscal = null;

        if (usuarioSessao.tipo === "usuario") {
            const idSessao = idValido(usuarioSessao.id);

            if (
                !idSessao ||
                Number(denuncia.idUsuario) !== idSessao
            ) {
                return res.status(403).send(
                    "Somente o autor da denúncia pode enviar mensagens."
                );
            }

            idUsuario = idSessao;

        } else if (usuarioSessao.tipo === "fiscal") {
            const idSessao = idValido(usuarioSessao.id);

            if (
                !idSessao ||
                Number(denuncia.fiscal_id) !== idSessao
            ) {
                return res.status(403).send(
                    "Somente o fiscal responsável pode responder."
                );
            }

            const fiscalAtendeLocalidade = await executarQuery(
                `SELECT 1
                 FROM FISCAL_LOCALIDADE
                 WHERE idFiscal = ?
                   AND idLocalidade = ?
                 LIMIT 1`,
                [idSessao, denuncia.idLocalidade]
            );

            if (!fiscalAtendeLocalidade.length) {
                return res.status(403).send(
                    "Você não tem permissão para responder nesta localidade."
                );
            }

            idFiscal = idSessao;

        } else {
            return res.status(403).send(
                "Seu tipo de conta não pode enviar mensagens."
            );
        }

        await executarQuery(
            `INSERT INTO MENSAGEM_DENUNCIA
                (idDenuncia, idUsuario, idFiscal, texto)
             VALUES (?, ?, ?, ?)`,
            [idDenuncia, idUsuario, idFiscal, texto]
        );

        return res.redirect(
            `/denunciaDetalhe/${idDenuncia}`
        );

    } catch (erro) {
        console.error("Erro ao enviar mensagem:", erro);

        return res.status(500).send(
            "Erro ao enviar a mensagem."
        );
    }
});

module.exports = router;
