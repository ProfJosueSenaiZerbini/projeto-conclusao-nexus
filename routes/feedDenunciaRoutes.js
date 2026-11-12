const express = require("express");
const router = express.Router();

const { executarQuery } = require("../db/dbConnect");

const {
    verificarAutenticado
} = require("../middlewares/autenticacao");

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
                .replace(/[\\u0300-\\u036f]/g, "")
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

router.get("/", verificarAutenticado, async (req, res) => {
    try {
        let sql = `
            SELECT
                d.idDenuncia,
                d.tipo,
                d.titulo,
                d.descricao,
                d.status,
                d.prioridade,
                d.visibilidade,
                d.dataAbertura,
                l.endereco,
                u.nome AS nomeUsuario
            FROM DENUNCIA d
            INNER JOIN LOCALIZACAO l
                ON l.idLocalizacao = d.idLocalizacao
            INNER JOIN USUARIO u
                ON u.id = d.idUsuario
            WHERE 1 = 1
        `;

        const parametros = [];
        const tipoUsuario = req.session.usuario.tipo;

        if (
            tipoUsuario === "fiscal" ||
            tipoUsuario === "superusuario"
        ) {

        const idOrganizacao = Number(
            req.session.usuario.idOrganizacao
        );

        if (
            !Number.isInteger(idOrganizacao) ||
            idOrganizacao <= 0
        ) {
            return res.status(403).send(
                "Sua conta não está vinculada a uma organização."
            );
        }

        sql += " AND d.idOrganizacao = ?";
            parametros.push(idOrganizacao);
        }

        sql += `
            ORDER BY d.dataAbertura DESC, d.idDenuncia DESC
        `;

        const registros = await executarQuery(sql, parametros);

        const denuncias = await Promise.all(
            registros.map(async (registro) => {
                const evidencias = await executarQuery(
                    `SELECT tipoEvidencia, dadosEvidencia
                     FROM EVIDENCIA
                     WHERE idDenuncia = ?
                     ORDER BY idEvidencia ASC`,
                    [registro.idDenuncia]
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
});

module.exports = router;