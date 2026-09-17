const express = require('express');
const router = express.Router();

// 1. Criamos a lista FORA da rota para ela manter o estado atualizado enquanto o servidor rodar
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

// Rota GET - Exibe a tela com os dados atuais
router.get('/', (req, res) => {
    res.render('notificacoes', { notificacoes: bancoFicticioNotificacoes });
});

// Rota POST - Marca todas como lidas
router.post('/marcar-todas-lidas', (req, res) => {
    // Altera o estado de TODAS as notificações para true
    bancoFicticioNotificacoes = bancoFicticioNotificacoes.map(n => ({
        ...n,
        lida: true
    }));

    // Redireciona de volta para recarregar a tela atualizada
    res.redirect('/notificacoes');
});

module.exports = router;