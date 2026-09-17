const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect')

/* Rota para exibir a tela de cadastro */
router.get("/", (req, res) => {
    res.render('cadastro', {mensagemErro: null});
});

/* POST para processar o formulário enviado */
router.post("/", async (req, res) => {
    const { nome, email, cep, cpf, senha } = req.body;

    try {
        //Verifica se o e-mail já está cadastrado
        const usuarioExistente = await executarQuery(
            "SELECT * FROM USUARIO WHERE email = ?",
            [email]
        );

        if (usuarioExistente.length > 0){
            return res.render('cadastro', {
                mensagemErro: "Este e-mail já está cadastrado."
            });
        }

        // Cadastra o novo usuário
        await executarQuery(
            "INSERT INTO USUARIO (nome, email, senha) VALUES (?, ?, ?)",
            [nome,email,senha]
        );

        //Depois do cadastro, volta para o login
        res.redirect('/login');

    } catch (erro) {

        console.error("Erro ao cadastrar usuário:", erro);

        res.render('cadastro', {
            mensagemErro: "Erro ao realizar o cadastro."
        });
    }
});

module.exports = router;