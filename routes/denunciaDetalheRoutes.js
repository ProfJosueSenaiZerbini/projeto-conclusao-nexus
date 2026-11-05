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

    const { tipo, emailConfirmado } = req.session.usuario;

    if (!["usuario", "fiscal", "superusuario"].includes(tipo)) {
        return res.status(403).send("Acesso negado.");
    }

    if (tipo === "superusuario" && !emailConfirmado) {
        return res.status(403).send(
            "Confirme seu e-mail para acessar as denúncias."
        );
    }

    next();
}

function idValido(valor) {
    const id = Number(valor);

    return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}

router.get("/:id", verificarAcesso, async (req, res) => {
    const idDenuncia = idValido(req.params.id);

    if (!idDenuncia) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    try {
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
             INNER JOIN USUARIO u
                ON d.idUsuario = u.id
             LEFT JOIN FISCAL f
                ON d.fiscal_id = f.id
             WHERE d.idDenuncia = ?
             LIMIT 1`,
            [idDenuncia]
        );

        if (!resultado.length) {
            return res.status(404).send(
                "Denúncia não encontrada."
            );
        }

        const denuncia = resultado[0];

        // Compatibilidade com denúncias antigas, nas quais título,
        // visibilidade e data foram gravados dentro do campo descricao.
        const descricaoOriginal = String(denuncia.descricao || "");
        const linhasDescricao = descricaoOriginal.split(/\r?\n/);

        const extrairCampoAntigo = (rotulo) => {
            const linha = linhasDescricao.find(item =>
                item.trim().toLowerCase().startsWith(`${rotulo.toLowerCase()}:`)
            );

            return linha
                ? linha.slice(linha.indexOf(":") + 1).trim()
                : "";
        };

        const possuiDadosAntigos = linhasDescricao.some(linha =>
            /^(título|visibilidade|data da ocorrência):/i.test(linha.trim())
        );

        if (!denuncia.titulo) {
            denuncia.titulo = extrairCampoAntigo("Título");
        }

        if (possuiDadosAntigos) {
            // Nas denúncias antigas, os metadados estavam no texto e
            // podem ser mais confiáveis que os valores padrão da tabela.
            const visibilidadeAntiga = extrairCampoAntigo("Visibilidade");
            if (visibilidadeAntiga) {
                denuncia.visibilidade =
                    /identificad/i.test(visibilidadeAntiga)
                        ? "identificado"
                        : "anonimo";
            }

            const dataAntiga = extrairCampoAntigo("Data da ocorrência");
            if (!denuncia.dataOcorrenciaFormatada && dataAntiga) {
                const partesData = dataAntiga.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                denuncia.dataOcorrenciaFormatada = partesData
                    ? `${partesData[3]}/${partesData[2]}/${partesData[1]}`
                    : dataAntiga;
            }

            const indiceSeparador = linhasDescricao.findIndex(
                (linha, indice) => indice > 0 && linha.trim() === ""
            );

            if (indiceSeparador >= 0) {
                denuncia.descricao = linhasDescricao
                    .slice(indiceSeparador + 1)
                    .join("\n")
                    .trim();
            } else {
                denuncia.descricao = linhasDescricao
                    .filter(linha => !/^(título|visibilidade|data da ocorrência):/i.test(linha.trim()))
                    .join("\n")
                    .trim();
            }
        }

        denuncia.nomeExibicao =
            String(denuncia.visibilidade || "anonimo").toLowerCase() === "identificado"
                ? denuncia.nomeUsuario
                : "Anônimo";

        const evidencias = await executarQuery(
            `SELECT idEvidencia, tipoEvidencia, dadosEvidencia
             FROM EVIDENCIA
             WHERE idDenuncia = ?
             ORDER BY idEvidencia ASC`,
            [idDenuncia]
        );

        const historico = await executarQuery(
            `SELECT
                idHistorico,
                titulo,
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
                u.nome AS autor
             FROM MENSAGEM_DENUNCIA m
             INNER JOIN USUARIO u
                ON m.idUsuario = u.id
             WHERE m.idDenuncia = ?
             ORDER BY m.dataHora ASC, m.idMensagem ASC`,
            [idDenuncia]
        );

        return res.render("denunciaDetalhe", {
            denuncia,
            evidencias,
            historico,
            mensagens,

            podeEnviarMensagem:
                req.session.usuario.tipo === "usuario" &&
                Number(req.session.usuario.id) ===
                Number(denuncia.idUsuario)
        });

    } catch (erro) {
        console.error("Erro ao buscar denúncia:", erro);

        return res.status(500).send(
            "Erro ao carregar os detalhes da denúncia."
        );
    }
});

router.post("/:id/mensagem", verificarUsuario, async (req, res) => {
    const idDenuncia = idValido(req.params.id);

    const texto = String(req.body.texto || "").trim();

    const idUsuario = idValido(
        req.session.usuario && req.session.usuario.id
    );

    if (!idDenuncia) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    if (!idUsuario) {
        return res.status(401).send(
            "Sessão inválida. Entre novamente."
        );
    }

    if (!texto || texto.length > 2000) {
        return res.status(400).send(
            "A mensagem deve ter entre 1 e 2000 caracteres."
        );
    }

    try {
        const denuncia = await executarQuery(
            `SELECT idUsuario
             FROM DENUNCIA
             WHERE idDenuncia = ?
             LIMIT 1`,
            [idDenuncia]
        );

        if (!denuncia.length) {
            return res.status(404).send(
                "Denúncia não encontrada."
            );
        }

        if (Number(denuncia[0].idUsuario) !== idUsuario) {
            return res.status(403).send(
                "Somente o autor da denúncia pode enviar mensagens neste espaço."
            );
        }

        await executarQuery(
            `INSERT INTO MENSAGEM_DENUNCIA
                (idDenuncia, idUsuario, texto)
             VALUES (?, ?, ?)`,
            [idDenuncia, idUsuario, texto]
        );

        return res.redirect(
            `/denunciaDetalhe/${idDenuncia}`
        );

    } catch (erro) {
        console.error("Erro ao enviar mensagem:", erro);

        return res.status(500).send(
            "Erro ao enviar mensagem."
        );
    }
});

module.exports = router;