const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');


/*
    Função responsável por decidir
    em qual tabela o cadastro será criado
*/
async function cadastrarPorTipo(tipo, nome, email, cpf, senha) {

    if (tipo === "usuario") {

        return await executarQuery(
            `INSERT INTO USUARIO
            (nome, email, cpf, senha)
            VALUES (?, ?, ?, ?)`,
            [nome, email, cpf, senha]
        );

    }

    if (tipo === "admin") {

        return await executarQuery(
            `INSERT INTO FISCAL
            (nome, email, cpf, senha)
            VALUES (?, ?, ?, ?)`,
            [nome, email, cpf, senha]
        );

    }

    throw new Error("Tipo de cadastro inválido.");
}


/* Rota GET: exibe a tela de cadastro */
router.get("/", (req, res) => {

    res.render('cadastro', {
        mensagemErro: null
    });

});


/* Rota POST: recebe os dados do formulário */
router.post("/", async (req, res) => {

    const {
        tipo,
        nome,
        email,
        cpf,
        senha
    } = req.body;

    try {

        // Verifica se o tipo foi enviado corretamente
        if (tipo !== "usuario" && tipo !== "admin") {

            return res.render('cadastro', {
                mensagemErro: "Selecione um tipo de cadastro."
            });

        }


        /*
            Escolhe a tabela de acordo com o tipo
            e verifica se o e-mail já existe
        */
        const tabela = tipo === "admin"
            ? "FISCAL"
            : "USUARIO";


        const usuarioExistente = await executarQuery(
            `SELECT * FROM ${tabela} WHERE email = ?`,
            [email]
        );


        if (usuarioExistente.length > 0) {

            return res.render('cadastro', {
                mensagemErro: "Este e-mail já está cadastrado."
            });

        }


        // Verifica se o CPF já existe na tabela escolhida
        const cpfExistente = await executarQuery(
            `SELECT * FROM ${tabela} WHERE cpf = ?`,
            [cpf]
        );


        if (cpfExistente.length > 0) {

            return res.render('cadastro', {
                mensagemErro: "Este CPF já está cadastrado."
            });

        }


        /*
            A função decide se o cadastro
            será colocado em USUARIO ou FISCAL
        */
        await cadastrarPorTipo(
            tipo,
            nome,
            email,
            cpf,
            senha
        );


        // Após cadastrar, volta para o login
        res.redirect('/login');


    } catch (erro) {

        console.error("Erro ao cadastrar:", erro);

        res.render('cadastro', {
            mensagemErro: "Erro ao realizar o cadastro."
        });

    }

});


module.exports = router;