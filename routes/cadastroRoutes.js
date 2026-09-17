const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');

/* Rota GET: exibe a tela de cadastro */
router.get("/", (req, res) => {
    res.render('cadastro', { mensagemErro: null });
});


/* Rota POST: recebe os dados do formulário */
router.post("/", async (req, res) => {

    const { nome, email, cpf, senha } = req.body;

    try {

        // Verifica se o e-mail já está cadastrado
        const usuarioExistente = await executarQuery(
            "SELECT * FROM USUARIO WHERE email = ?",
            [email]
        );

        if (usuarioExistente.length > 0) {

            return res.render('cadastro', {
                mensagemErro: "Este e-mail já está cadastrado."
            });

        }


        // Verifica se o CPF já está cadastrado
        const cpfExistente = await executarQuery(
            "SELECT * FROM USUARIO WHERE cpf = ?",
            [cpf]
        );

        if (cpfExistente.length > 0) {

            return res.render('cadastro', {
                mensagemErro: "Este CPF já está cadastrado."
            });

        }

        // Insere o novo usuário no banco
        await executarQuery(
            `INSERT INTO USUARIO
            (nome, email, cpf, senha)
            VALUES (?, ?, ?, ?)`,
            [nome, email, cpf, senha]
        );

        // Após cadastrar, volta para o login
        res.redirect('/login');

    } catch (erro) {

        console.error("Erro ao cadastrar usuário:", erro);

        res.render('cadastro', {
            mensagemErro: "Erro ao realizar o cadastro."
        });

    }

});

module.exports = router;
