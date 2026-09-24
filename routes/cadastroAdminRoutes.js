
const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');

// Exibe a tela de cadastro
router.get('/', (req, res) => {
    res.render('cadastroAdmin', {
        mensagemErro: null
    });
});

// Recebe os dados do formulário
router.post('/', async (req, res) => {

    const { nome, email, cpf, senha } = req.body;

    try {

        // Verifica se o e-mail já existe
        const emailExistente = await executarQuery(
            'SELECT * FROM FISCAL WHERE email = ?',
            [email]
        );

        if (emailExistente.length > 0) {
            return res.render('cadastroAdmin', {
                mensagemErro: 'Este e-mail já está cadastrado.'
            });
        }

        // Verifica se o CPF já existe
        const cpfExistente = await executarQuery(
            'SELECT * FROM FISCAL WHERE cpf = ?',
            [cpf]
        );

        if (cpfExistente.length > 0) {
            return res.render('cadastroAdmin', {
                mensagemErro: 'Este CPF já está cadastrado.'
            });
        }

        // Cadastra o fiscal no banco
        await executarQuery(
            `INSERT INTO FISCAL
            (nome, email, cpf, senha)
            VALUES (?, ?, ?, ?)`,
            [nome, email, cpf, senha]
        );

        // Depois do cadastro, vai para o login
        res.redirect('/login');

    } catch (erro) {

        console.error('Erro ao cadastrar fiscal:', erro);

        res.render('cadastroAdmin', {
            mensagemErro: 'Erro ao realizar o cadastro.'
        });
    }
});

module.exports = router;

