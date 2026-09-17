const express = require('express');
const router = express.Router();

const { executarQuery } = require('../db/dbConnect');

//1. rota GET: renderiza o fromulario de login na tela 
router.get('/',(req , res) => {
    res.render('login', {mensagemErro: null

    });
});

// Rota POST: recebe os dados digitados e processa
router.post('/', async (req, res) => {

  const { tipo, email, senha } = req.body;

  if(!email || !senha) {

    return res.render('login', {
      mensagemErro: "Por favor, preencha e-mail e senha!"
    });

  } 
  try {

    //LOGIN DO USUÁRIO

    //Procura o usuário pelo e-mail e senha
    const usuario = await executarQuery(
      "SELECT * FROM USUARIO WHERE email = ? AND senha = ?",
      [email, senha]
    );

    //Verifica se encontrou algum usuário
    if (usuario.length > 0) {

      //Login realizado com sucesso
      return res.redirect('/dashboardUsuario');

    }
  

  //LOGIN DO ADMINISTRADOR/FISCAL
  if (tipo === 'admin'){

    const fiscal = await executarQuery(
      "SELECT * FROM FISCAL WHERE email = ? AND senha = ?",
      [email, senha]
    );

    if(fiscal.length > 0) {

      return res.redirect('/dashboardAdm');
    }
  }

    //Caso não encontre
    return res.render('login', {
      mensagemErro: "E-mail ou senha inválidos."
    });

  } catch (erro) {

    console.error("Erro ao realizar login:", erro);

    return res.render('login', {
      mensagemErro: "Erro ao realizar login."
    });
  }
});


module.exports = router;