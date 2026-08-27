const express = require('express');
const router = express.Router();

/* Rota para exibir a tel de cadastro */
router.get("/", (req, res) => {
    res.render('cadastro', {mensagemErro: null});
});

/* POST para processar o formulário enviado */
router.post("/", (req, res) => {
    const { nome, email, cep, cpf, senha } = req.body;

    console.log("Nome:", nome);
    console.log("E-mail:", email);
    console.log("CEP:", cep);
    console.log("CPF:", cpf);
    console.log("Senha:", senha);

    res.send("Cadastro realizado com sucesso!");
});

module.exports = router;