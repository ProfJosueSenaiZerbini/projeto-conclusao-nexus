const express = require('express');
const router = express.Router();

//1. rota GET: renderiza o fromulario de login na tela 
router.get('/',(req , res) => {
    res.render('login', {mensagemErro: null});
});

//Rota GET: mostra o formulario de cadastro
router.get('/cadastro', (req, res) => {
  res.render('cadastro');
})

//2. rota POST: recebe os dados digitados e processa 
router.post('/login', (req , res) => {
  const { tipo, email, senha} = req.body;

  if (!email || !senha) {
    return res.render('login', {
        mensagemErro: "Por favor, preencha e-mail e senha!"
    });
  }

  /* Se der erro de credenciais */
  res.render('login', { 
    mensagemErro: "E-mail ou senha inválidos."
  });


});

module.exports = router;