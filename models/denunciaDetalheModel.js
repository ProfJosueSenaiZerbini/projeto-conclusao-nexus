
const express = require("express");
const router = express.Router();

const {
    verificarFiscalAtivo
} = require("../middlewares/autenticacao");

const denunciaDetalheController = require(
    "../controllers/denunciaDetalheController"
);

function verificarAcesso(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/login");
    }

    const { tipo } = req.session.usuario;

    if (!["usuario", "fiscal", "superusuario"].includes(tipo)) {
        return res.status(403).send("Acesso negado.");
    }

    return verificarFiscalAtivo(req, res, next);
}

// DETALHES DA DENÚNCIA
router.get(
    "/:id",
    verificarAcesso,
    denunciaDetalheController.carregarDetalhes
);

// ENVIO DE MENSAGENS
router.post(
    "/:id/mensagem",
    verificarAcesso,
    denunciaDetalheController.enviarMensagem
);

module.exports = router;
