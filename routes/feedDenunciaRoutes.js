const express = require("express");
const router = express.Router();
const { executarQuery } = require("../db/dbConnect");

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
    
    /* divide o texto em linhas. Isso permite identificar informações que podem estar armazenadas juntas na descrição, como título e visibilidade */
    const linhas = descricaoOriginal.split(/\r?\n/); 

    const extrair = (rotulo) => {
        const linha = linhas.find((item) => item.toLowerCase().startsWith(`${rotulo.toLowerCase()}:`));
        return linha ? linha.slice(linha.indexOf(":") + 1).trim() : "";
    };
    const indiceDescricao = linhas.findIndex((item) => item.trim() === "");
    const descricao = indiceDescricao >= 0
        ? linhas.slice(indiceDescricao + 1).join("\n").trim()
        : descricaoOriginal;
    const visibilidade = extrair("Visibilidade");
    const categoria = categorias.find((item) => item.valor === registro.tipo);

    return {
        ...registro,
        titulo: extrair("Título") || (categoria ? categoria.nome : registro.tipo),
        descricao: descricao || descricaoOriginal,
        anonima: visibilidade.toLowerCase() === "anônima" || visibilidade.toLowerCase() === "anonima",
        categoriaNome: categoria ? categoria.nome : registro.tipo,
        dataFormatada: registro.dataAbertura
            ? new Date(registro.dataAbertura).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
            : "Data não disponível"
    };
}

router.get("/", async (req, res) => {
    const filtro = String(req.query.categoria || "").trim().toLowerCase();
    const categoriasValidas = categorias.map((categoria) => categoria.valor);
    const categoriaSelecionada = categoriasValidas.includes(filtro) ? filtro : "";

    try {
        let sql = `
            SELECT d.idDenuncia, d.tipo, d.descricao, d.status, d.prioridade,
                   d.dataAbertura, l.endereco, u.nome AS nomeUsuario
            FROM DENUNCIA d
            INNER JOIN LOCALIZACAO l ON l.idLocalizacao = d.idLocalizacao
            INNER JOIN USUARIO u ON u.id = d.idUsuario
            WHERE 1 = 1`;
        const parametros = [];

        if (categoriaSelecionada) {
            sql += " AND LOWER(d.tipo) = ?";
            parametros.push(categoriaSelecionada);
        }

        sql += " ORDER BY d.dataAbertura DESC, d.idDenuncia DESC";
        const registros = await executarQuery(sql, parametros);

        const denuncias = await Promise.all(registros.map(async (registro) => {
            const evidencias = await executarQuery(
                `SELECT tipoEvidencia, dadosEvidencia FROM EVIDENCIA
                 WHERE idDenuncia = ? ORDER BY idEvidencia ASC`,
                [registro.idDenuncia]
            );
            return { ...montarCartao(registro), evidencias };
        }));

        return res.render("feedDenuncia", {
            denuncias,
            categorias,
            categoriaSelecionada
        });
    } catch (erro) {
        console.error("Erro ao carregar o feed de denúncias:", erro);
        return res.status(500).send("Erro ao carregar o feed de denúncias.");
    }
});

module.exports = router;
