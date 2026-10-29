
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");

require("dotenv").config();

// Verifica as configurações obrigatórias.
const obrigatorias = [
    "PORTA",
    "SESSION_SECRET"
];

for (const chave of obrigatorias) {
    if (!process.env[chave]) {
        throw new Error(
            `A variável ${chave} não está definida no .env`
        );
    }
}

const PORTA = Number(process.env.PORTA);

if (!Number.isInteger(PORTA) || PORTA < 1 || PORTA > 65535) {
    throw new Error("A porta configurada é inválida.");
}

// Importa as rotas.
const loginRoutes = require("./routes/loginRoutes");
const cadastroRoutes = require("./routes/cadastroRoutes");
const dashboardUsuarioRoutes = require("./routes/dashboardUsuarioRoutes");
const denunciaUsuarioRoutes = require("./routes/denunciaUsuarioRoutes");
const notificacoesRoutes = require("./routes/notificacoesRoutes");
const denunciaAdmRoutes = require("./routes/denunciaAdm.routes");
const feedRoutes = require("./routes/feedDenunciaRoutes");
const denunciaDetalheRoutes = require("./routes/denunciaDetalheRoutes");
const dashboardAdminRoutes = require("./routes/dashboardAdminRoutes");
const codigoAtivacaoRoutes = require("./routes/codigoAtivacaoRoutes");
const gerenciarFiscaisRoutes = require("./routes/gerenciarFiscaisRoutes");
const organizacaoRoutes = require('./routes/organizacaoRoutes');

const app = express();

// Configuração do EJS.
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middlewares gerais.
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da sessão.
app.use(session({
    name: "nexus.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60
    }
}));

// Disponibiliza o usuário autenticado para as views.
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Página inicial: encaminha para o login.
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Mantém o endereço antigo, encaminhando para as rotas administrativas.
// A proteção de acesso deve estar configurada no router de administração.
app.get("/denuncias", (req, res) => {
    res.redirect("/denunciaAdm");
});

// Registra as rotas.
app.use("/login", loginRoutes);
app.use("/cadastro", cadastroRoutes);
app.use("/dashboardUsuario", dashboardUsuarioRoutes);
app.use("/denunciaUsuario", denunciaUsuarioRoutes);
app.use("/notificacoes", notificacoesRoutes);
app.use("/denunciaAdm", denunciaAdmRoutes);
app.use("/feedDenuncia", feedRoutes);
app.use("/denunciaDetalhe", denunciaDetalheRoutes);
app.use("/dashboardAdmin", dashboardAdminRoutes);
app.use("/ativacao", codigoAtivacaoRoutes);
app.use("/gerenciarFiscais", gerenciarFiscaisRoutes);
app.use('/organizacao', organizacaoRoutes);

// Tratamento de páginas não encontradas.
app.use((req, res) => {
    res.status(404).send("Página não encontrada.");
});

// Tratamento geral de erros.
app.use((err, req, res, next) => {
    console.error("Erro no servidor:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).send("Ocorreu um erro interno no servidor.");
});

// Inicia o servidor.
app.listen(PORTA, () => {
    console.log(
        `Servidor rodando em http://localhost:${PORTA}/login`
    );
});
