const feedDenunciaModel = require("../models/feedDenunciaModel");

const categorias = [
    { valor: "pichacao", nome: "Pichação" },
    { valor: "vandalismo", nome: "Vandalismo" },
    { valor: "iluminacao", nome: "Iluminação pública" },
    { valor: "lixo", nome: "Descarte irregular de lixo" },
    { valor: "via", nome: "Problemas em vias públicas" },
    { valor: "perturbacao", nome: "Perturbação" },
    { valor: "outros", nome: "Outros" }
];

function montarCartao(registro) {
    const descricaoOriginal = String(registro.descricao || "");
    const linhas = descricaoOriginal.split(/\r?\n/);

    const extrair = (rotulo) => {
        const linha = linhas.find((item) =>
            item.toLowerCase().startsWith(`${rotulo.toLowerCase()}:`)
        );

        return linha
            ? linha.slice(linha.indexOf(":") + 1).trim()
            : "";
    };

    const indiceDescricao = linhas.findIndex(
        (item) => item.trim() === ""
    );

    const descricao = indiceDescricao >= 0
        ? linhas.slice(indiceDescricao + 1).join("\n").trim()
        : descricaoOriginal;

    const visibilidade = extrair("Visibilidade");

    const categoria = categorias.find(
        (item) => item.valor === registro.tipo
    );

    return {
        ...registro,

        titulo: registro.titulo ||
            extrair("Título") ||
            (categoria ? categoria.nome : registro.tipo),

        descricao: descricao || descricaoOriginal,

        anonima:
            String(registro.visibilidade || visibilidade || "anonimo")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase() === "anonimo",

        categoriaNome: categoria
            ? categoria.nome
            : registro.tipo,

        dataFormatada: registro.dataAbertura
            ? new Date(registro.dataAbertura).toLocaleString(
                "pt-BR",
                {
                    dateStyle: "short",
                    timeStyle: "short"
                }
            )
            : "Data não disponível"
    };
}

async function carregarFeed(req, res) {
    try {
        const usuario = req.session.usuario;
        const tipoUsuario = usuario.tipo;

        let idUsuario;

        if (tipoUsuario === "fiscal") {
            idUsuario = Number(usuario.id);

            if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
                return res.status(401).send(
                    "Sessão de fiscal inválida. Faça login novamente."
                );
            }

        } else if (tipoUsuario === "superusuario") {
            idUsuario = Number(usuario.id);

            if (
                !Number.isInteger(idUsuario) ||
                idUsuario <= 0
            ) {
                return res.status(403).send(
                    "Superusuário inválido."
                );
            }
        }

        const registros = await feedDenunciaModel.listarDenuncias(
            tipoUsuario,
            idUsuario
        );

        const denuncias = await Promise.all(
            registros.map(async (registro) => {
                const evidencias =
                    await feedDenunciaModel.buscarEvidencias(
                        registro.idDenuncia
                    );

                return {
                    ...montarCartao(registro),
                    evidencias
                };
            })
        );

        return res.render("feedDenuncia", {
            denuncias
        });

    } catch (erro) {
        console.error("Erro ao carregar o feed de denúncias:", erro);

        return res.status(500).send(
            "Erro ao carregar o feed de denúncias."
        );
    }
}

module.exports = {
    carregarFeed
};
