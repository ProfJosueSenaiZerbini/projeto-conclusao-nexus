const express = require('express');
const router = express.Router();

const {
    verificarAutenticado
} = require('../middlewares/autenticacao');

// Lista fictícia utilizada durante o desenvolvimento.
let bancoFicticioNotificacoes = [
    {
        denuncia_id: "001",
        titulo: "Status da Denúncia Atualizado",
        mensagem: "Sua denúncia sobre 'Poste sem iluminação' mudou para Em análise.",
        horario: "10:30",
        data: "10/09/2026",
        lida: false
    },
    {
        denuncia_id: "002",
        titulo: "Denúncia Concluída",
        mensagem: "A equipe técnica resolveu a solicitação 'Vazamento de água'.",
        horario: "16:45",
        data: "08/09/2026",
        lida: true
    }
];

// Exibe as notificações.
router.get('/', verificarAutenticado, (req, res) => {
    res.render('notificacoes', {
        notificacoes: bancoFicticioNotificacoes
    });
});

// Marca todas as notificações como lidas.
router.post('/marcar-todas-lidas', verificarAutenticado, (req, res) => {
    bancoFicticioNotificacoes = bancoFicticioNotificacoes.map(n => ({
        ...n,
        lida: true
    }));

    res.redirect('/notificacoes');
});

module.exports = router;