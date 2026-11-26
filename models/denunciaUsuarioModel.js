const { executarTransacao } = require("../db/dbConnect");

async function cadastrarDenuncia(dados, arquivos, registrarNotificacoes) {
    return await executarTransacao(async conn => {

        // 1. BUSCAR LOCALIDADE
        const resultadoLocalidade = await conn.query(
            `SELECT idLocalidade
             FROM LOCALIDADE
             WHERE UPPER(TRIM(bairro)) = UPPER(TRIM(?))
               AND UPPER(TRIM(cidade)) = UPPER(TRIM(?))
               AND UPPER(TRIM(estado)) = UPPER(TRIM(?))
             LIMIT 1`,
            [
                dados.bairro,
                dados.cidade,
                dados.estado
            ]
        );

        if (resultadoLocalidade.length === 0) {
            const erro = new Error(
                "O bairro, a cidade e o estado informados não correspondem a uma localidade cadastrada."
            );

            erro.codigo = "LOCALIDADE_NAO_ENCONTRADA";
            throw erro;
        }

        const idLocalidade = Number(
            resultadoLocalidade[0].idLocalidade
        );

        // 2. IDENTIFICAR FISCAIS PELA LOCALIDADE
        const fiscaisResponsaveis = await conn.query(
            `SELECT DISTINCT
                f.id,
                f.idSuperusuario
             FROM FISCAL f
             INNER JOIN FISCAL_LOCALIDADE fl
                ON fl.idFiscal = f.id
             WHERE fl.idLocalidade = ?
               AND f.status = 'ativo'`,
            [idLocalidade]
        );

        if (fiscaisResponsaveis.length === 0) {
            const erro = new Error(
                "Não existe fiscal ativo responsável por essa localidade."
            );

            erro.codigo = "FISCAL_NAO_ENCONTRADO";
            throw erro;
        }

        // 3. CADASTRAR LOCALIZAÇÃO
        const resultadoLocalizacao = await conn.query(
            `INSERT INTO LOCALIZACAO
             (tipo, endereco, bairro, cidade, estado)
             VALUES (?, ?, ?, ?, ?)`,
            [
                "Manual",
                dados.local,
                dados.bairro,
                dados.cidade,
                dados.estado.toUpperCase()
            ]
        );

        const idLocalizacao = Number(
            resultadoLocalizacao.insertId
        );

        // 4. CADASTRAR DENÚNCIA
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
                dados.idUsuario,
                null,
                idLocalidade,
                dados.titulo,
                dados.categoria,
                dados.descricao,
                dados.data || null,
                dados.visibilidade === "identificado"
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

        // 5. REGISTRAR NOTIFICAÇÕES NA MESMA TRANSAÇÃO
        await registrarNotificacoes(conn, {
            idDenuncia: novoIdDenuncia,
            idUsuario: dados.idUsuario,
            titulo: dados.titulo,
            categoria: dados.categoria,
            fiscaisResponsaveis
        });

        // 6. CADASTRAR EVIDÊNCIAS
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

        return {
            idDenuncia: novoIdDenuncia,
            idLocalizacao
        };
    });
}

module.exports = {
    cadastrarDenuncia
};
