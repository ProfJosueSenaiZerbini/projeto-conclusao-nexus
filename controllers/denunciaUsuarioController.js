const fs = require("fs");

const denunciaUsuarioModel = require(
    "../models/denunciaUsuarioModel"
);

const {
    criarNotificacao
} = require("../services/notificacaoService");

const {
    geocodificarLocalizacao
} = require("../services/geocodificacaoService");

// REMOVER ARQUIVOS CASO O CADASTRO FALHE
async function removerArquivos(files = []) {
    await Promise.allSettled(
        files.map(arquivo => fs.promises.unlink(arquivo.path))
    );
}

// EXIBIR PÁGINA DE CADASTRO
function exibirFormulario(req, res) {
    return res.render("denunciaUsuario");
}

// CADASTRAR NOVA DENÚNCIA
async function cadastrar(req, res) {
    const {
        visibilidade,
        categoria,
        titulo,
        descricao,
        local,
        bairro,
        cidade,
        estado,
        data
    } = req.body;

    const idUsuario = req.session.usuario.id;
    const arquivos = req.files || [];

    // VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS
    if (
        !categoria?.trim() ||
        !titulo?.trim() ||
        !descricao?.trim() ||
        !local?.trim() ||
        !bairro?.trim() ||
        !cidade?.trim() ||
        !estado?.trim()
    ) {
        await removerArquivos(arquivos);

        return res.status(400).send(
            "Preencha todos os campos obrigatórios da denúncia."
        );
    }

    try {
        const resultadoCadastro =
            await denunciaUsuarioModel.cadastrarDenuncia(
                {
                    idUsuario,
                    visibilidade,
                    categoria: categoria.trim(),
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    local: local.trim(),
                    bairro: bairro.trim(),
                    cidade: cidade.trim(),
                    estado: estado.trim(),
                    data
                },
                arquivos,

                async (conn, dados) => {
                    // NOTIFICAR O CIDADÃO
                    await criarNotificacao(conn, {
                        idDenuncia: dados.idDenuncia,
                        idUsuario: dados.idUsuario,
                        titulo: "Denúncia registrada",
                        tipo: "nova_denuncia",
                        conteudo: `Sua denúncia "${dados.titulo}" foi registrada com sucesso.`
                    });

                    // NOTIFICAR OS FISCAIS RESPONSÁVEIS
                    for (const fiscal of dados.fiscaisResponsaveis) {
                        await criarNotificacao(conn, {
                            idDenuncia: dados.idDenuncia,
                            idFiscal: Number(fiscal.id),
                            titulo: "Nova denúncia recebida",
                            tipo: "nova_denuncia",
                            conteudo: `Uma nova denúncia da categoria "${dados.categoria}" foi registrada na sua localidade de atendimento.`
                        });
                    }

                    // NOTIFICAR OS SUPERUSUÁRIOS DOS FISCAIS
                    const idsSuperusuarios = [
                        ...new Set(
                            dados.fiscaisResponsaveis
                                .map(fiscal => Number(fiscal.idSuperusuario))
                                .filter(id =>
                                    Number.isInteger(id) && id > 0
                                )
                        )
                    ];

                    for (const idSuperusuario of idsSuperusuarios) {
                        await criarNotificacao(conn, {
                            idDenuncia: dados.idDenuncia,
                            idSuperusuario,
                            titulo: "Nova denúncia na sua localidade",
                            tipo: "nova_denuncia",
                            conteudo: `Uma nova denúncia da categoria "${dados.categoria}" foi registrada em uma localidade atendida por um dos seus fiscais.`
                        });
                    }
                }
            );

        // GEOCODIFICAR A LOCALIZAÇÃO EM SEGUNDO PLANO
        const { idDenuncia, idLocalizacao } = resultadoCadastro;

        geocodificarLocalizacao(idLocalizacao).catch(erro => {
            console.error(
                "Erro na geocodificação:",
                erro.message
            );
        });

        // REDIRECIONAR PARA DETALHES
        return res.redirect(`/denunciaDetalhe/${idDenuncia}`);

    } catch (erro) {
        console.error("Erro ao cadastrar denúncia:", erro);

        await removerArquivos(arquivos);

        if (
            erro.codigo === "LOCALIDADE_NAO_ENCONTRADA" ||
            erro.codigo === "FISCAL_NAO_ENCONTRADO"
        ) {
            return res.status(400).send(erro.message);
        }

        return res.status(500).send(
            "Erro ao cadastrar denúncia."
        );
    }
}

module.exports = {
    exibirFormulario,
    cadastrar
};
