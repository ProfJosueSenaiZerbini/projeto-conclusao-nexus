const express = require('express');
const path = require('path');
const morgan = require("morgan");
require('dotenv').config();

/* Importa as rotas */
const loginRoutes = require('./routes/loginRoutes');
const cadastroRoutes = require('./routes/cadastroRoutes');
const dashboardUsuarioRoutes = require('./routes/dashboardUsuarioRoutes');
const denunciaUsuarioRoutes = require('./routes/denunciaUsuarioRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');
const denunciaAdmRoutes = require('./routes/denunciaAdm.routes');

const app = express();
const PORT = 3000;

//configura o EJS como motor de templates
app.use(morgan("dev"));
app.set("views", "./views");
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

//middlewares para processar dados enviados por formulario html
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index", { erro: null })
})

app.get("/denuncias", (req, res) => {
  res.render("denunciaAdm", { erro: null });
})

/* Registra a rota */
app.use('/login', loginRoutes);
app.use('/cadastro', cadastroRoutes);
app.use('/dashboardUsuario', dashboardUsuarioRoutes);
app.use('/denunciaUsuario', denunciaUsuarioRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use('/denunciaAdm', denunciaAdmRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/login`);
});

