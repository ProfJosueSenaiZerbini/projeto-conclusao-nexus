const express = require('express');
const path = require('path');
const morgan = require("morgan");
require('dotenv').config(); /* Puxa os dados escritos no arquivo .env */

/* Importa as rotas */
const loginRoutes = require('./routes/loginRoutes');
const cadastroRoutes = require('./routes/cadastroRoutes');
const dashboardUsuarioRoutes = require('./routes/dashboardUsuarioRoutes');
const denunciaUsuarioRoutes = require('./routes/denunciaUsuarioRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');
const denunciaAdmRoutes = require('./routes/denunciaAdm.routes');

const app = express();
const PORTA = Number(process.env.PORTA);

//configura o EJS como motor de templates
app.use(morgan("dev")); /* Vai mostrar os status e requisições do servidor no terminal */
app.set("views", "./views"); /* Diz que as páginas estão na pasta views */
app.set('view engine', 'ejs'); /* Usa o ejs para rederizar as páginas */
app.use(express.static(path.join(__dirname, 'public'))); /* Puxa os dados atribuidos à pasta public */


//middlewares para processar dados enviados por formulario html
app.use(express.urlencoded({ extended: true })); /* Permite ler dados enviados por formulários em html */
app.use(express.json()); /* Transforma os dados em JSON em um objeto JavaScript permitindo que o express entenda */


/* Registra a rota */
app.get("/", (req, res) => {
  res.render("index", { erro: null })
})

app.get("/denuncias", (req, res) => {
  res.render("denunciaAdm", { erro: null });
})

app.use('/login', loginRoutes);
app.use('/cadastro', cadastroRoutes);
app.use('/dashboardUsuario', dashboardUsuarioRoutes);
app.use('/denunciaUsuario', denunciaUsuarioRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use('/denunciaAdm', denunciaAdmRoutes);

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}/login`);
});

