const denunciaDetalheModel = require("../models/denunciaDetalheModel");

function idValido(valor) {
    const id = Number(valor);

    return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}

// DETALHES DA DENÚNCIA
async function carregarDetalhes(req, res) {
    const idDenuncia = idValido(req.params.id);

    if (!idDenuncia) {
        return res.status(400).send("ID da denúncia inválido.");
    }

    try {
        const tipoUsuario = req.session.usuario.tipo;
        const idUsuario = idValido(req.session.usuario.id);

        if (
            ["fiscal", "superusuario"].includes(tipoUsuario) &&
            !idUsuario
        ) {
            return res.status(403).send(
                tipoUsuario === "fiscal"
                    ? "Fiscal inválido."
                    : "Superusuário inválido."
            );
        }

        const resultado = await denunciaDetalheModel.buscarDenuncia(
            idDenuncia,
            tipoUsuario,
            idUsuario
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

        const evidencias =
            await denunciaDetalheModel.buscarEvidencias(idDenuncia);

        const historico =
            await denunciaDetalheModel.buscarHistorico(idDenuncia);

        const mensagens =
            await denunciaDetalheModel.buscarMensagens(
                idDenuncia,
                equipePodeVerIdentidade
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
}


// ENVIO DE MENSAGENS
async function enviarMensagem(req, res) {
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
        const resultado =
            await denunciaDetalheModel.buscarDadosParaMensagem(
                idDenuncia
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

            const fiscalAtendeLocalidade =
                await denunciaDetalheModel.fiscalAtendeLocalidade(
                    idSessao,
                    denuncia.idLocalidade
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

        await denunciaDetalheModel.inserirMensagem(
            idDenuncia,
            idUsuario,
            idFiscal,
            texto
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
}

module.exports = {
    carregarDetalhes,
    enviarMensagem
};
