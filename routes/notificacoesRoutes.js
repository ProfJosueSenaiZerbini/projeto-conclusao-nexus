
const express = require("express");
const router = express.Router();

const {
    verificarAutenticado
} = require("../middlewares/autenticacao");

const notificacaoController = require(
    "../controllers/notificacaoController"
);

router.get(
    "/",
    verificarAutenticado,
    notificacaoController.listar
);

router.post(
    "/:id/marcar-lida",
    verificarAutenticado,
    notificacaoController.marcarComoLida
);

router.post(
    "/marcar-todas-lidas",
    verificarAutenticado,
    notificacaoController.marcarTodasComoLidas
);

module.exports = router;
