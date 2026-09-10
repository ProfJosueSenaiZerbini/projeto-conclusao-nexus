const express = require('express');
const router = express.Router();

/* Rota para exibir os detalhes da denúncia */
router.get("/", (req, res) => {
    res.render("denunciaDetalhe");
});


/* Rota para processar as ações dos botões */
router.post("/", (req, res) => {

    const { acao } = req.body;

    console.log("Ação realizada:", acao);

    if (acao === "aprovar") {
        console.log("Denúncia aprovada.");
    }

    else if (acao === "encaminhar") {
        console.log("Denúncia encaminhada.");
    }

    else if (acao === "alterar_status") {
        console.log("Status da denúncia será alterado.");
    }

    else if (acao === "arquivar") {
        console.log("Denúncia arquivada.");
    }

    else {
        console.log("Ação desconhecida.");
    }

    res.redirect("/denunciaDetalhe");
});


module.exports = router;