
const express = require("express");
const router = express.Router();

const denunciaAdmController = require(
    "../controllers/denunciaAdmController"
);

const {
    verificarAdmin
} = require("../middlewares/autenticacao");

// Todas as rotas abaixo exigem acesso administrativo.
router.get("/", verificarAdmin, denunciaAdmController.listar);

router.post(
    "/:id/status",
    verificarAdmin,
    denunciaAdmController.alterarStatus
);

router.post(
    "/:id/prioridade",
    verificarAdmin,
    denunciaAdmController.alterarPrioridade
);

module.exports = router;
