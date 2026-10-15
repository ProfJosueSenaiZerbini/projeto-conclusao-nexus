
const express = require("express");

const router = express.Router();

const denunciaAdmController = require(
    "../controllers/denunciaAdmController"
);

// Página administrativa
router.get("/", denunciaAdmController.listar);

// Alterar status de uma denúncia
router.post(
    "/:id/status",
    denunciaAdmController.alterarStatus
);

// Alterar prioridade de uma denúncia
router.post(
    "/:id/prioridade",
    denunciaAdmController.alterarPrioridade
);

module.exports = router;
