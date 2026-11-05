const express = require("express");
const router = express.Router();

const denunciaAdmController = require(
    "../controllers/denunciaAdmController"
);

const {
    verificarEquipeConfirmada
} = require("../middlewares/autenticacao");

// Todas as rotas exigem fiscal ou superusuário com e-mail confirmado.
router.get(
    "/",
    verificarEquipeConfirmada,
    denunciaAdmController.listar
);

router.post(
    "/:id/atribuir",
    verificarEquipeConfirmada,
    denunciaAdmController.atribuirASiMesmo
);

router.post(
    "/:id/status",
    verificarEquipeConfirmada,
    denunciaAdmController.alterarStatus
);

router.post(
    "/:id/prioridade",
    verificarEquipeConfirmada,
    denunciaAdmController.alterarPrioridade
);

module.exports = router;