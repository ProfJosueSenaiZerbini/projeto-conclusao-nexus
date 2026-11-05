
const express = require("express");
const router = express.Router();

const { executarQuery } = require("../db/dbConnect");
const { verificarUsuario } = require("../middlewares/autenticacao");

router.get("/", verificarUsuario, async (req, res) => {
    try {
        // Identifica o usuário conectado.
        const idUsuario = req.session.usuario.id;

        // Busca todas as denúncias do usuário.
        const denunciasRecentes = await executarQuery(
            `SELECT
                idDenuncia,
                tipo,
                status,
                dataAbertura,
                TRIM(
                    REPLACE(
                        SUBSTRING_INDEX(descricao, '\n', 1),
                        'Título: ',
                        ''
                    )
                ) AS titulo
             FROM DENUNCIA
             WHERE idUsuario = ?
             ORDER BY dataAbertura DESC`,
            [idUsuario]
        );

        // Envia as denúncias para a página.
        res.render("dashboardUsuario", {
            denunciasRecentes
        });

    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);

        res.status(500).send(
            "Erro ao carregar dashboard."
        );
    }
});

module.exports = router;
