const {
    buscarDenunciasRecentes
} = require("../models/dashboardUsuarioModel");

async function carregarDashboard(req, res) {
    try {
        const idUsuario = req.session.usuario.id;

        const denunciasRecentes =
            await buscarDenunciasRecentes(idUsuario);

        res.render("dashboardUsuario", {
            denunciasRecentes
        });

    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);

        res.status(500).send(
            "Erro ao carregar dashboard."
        );
    }
}

module.exports = {
    carregarDashboard
};
