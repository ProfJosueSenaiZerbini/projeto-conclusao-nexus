const express = require('express');
const router = express.Router();

/* Rota para exibir os detalhes da denúncia */
router.get("/", (req, res) => {

    // Passando os dados que o template EJS precisa para renderizar a tela
    res.render("denunciaDetalhe", {
        denuncia: {
            id: '001',
            titulo: 'Poste sem iluminação',
            tipo: 'Iluminação pública',
            denunciante: 'João Pedro Silva',
            dataRegistro: '10/09/2026',
            localizacao: 'Rua das Flores, 120',
            descricao: 'Poste localizado na rua está sem iluminação durante a noite, deixando o local escuro e dificultando a circulação dos moradores.',
            status: 'Em análise',
            prioridade: 'Alta',
            responsavel: 'Fiscal Carlos Santos',
            evidencias: ['/img/exemplo1.jpg', '/img/exemplo2.jpg']
        },
        historico: [
            { titulo: 'Denúncia recebida', dataHora: '10/09/2026 às 08:42', ativo: true },
            { titulo: 'Denúncia encaminhada para análise', dataHora: '10/09/2026 às 09:15', ativo: true },
            { titulo: 'Aguardando providências', dataHora: 'Status atual', ativo: false }
        ],
        mensagens: [
            {
                autor: 'Fiscal Carlos Santos',
                cargo: 'Órgão Responsável',
                tipoAutor: 'fiscal',
                dataHora: '11/09/2026 às 14:30',
                texto: 'Vistoria agendada para o local no dia 12/09 no período da manhã.'
            },
            {
                autor: 'João Pedro Silva',
                cargo: 'Denunciante',
                tipoAutor: 'cidadao',
                dataHora: '11/09/2026 às 15:10',
                texto: 'Obrigado pelo retorno! O poste fica bem em frente ao número 120.'
            }
        ]
    });
});

/* Rota para processar as ações dos botões */
router.post("/", (req, res) => {
    const { acao } = req.body;

    console.log("Ação realizada:", acao);

    if (acao === "aprovar") {
        console.log("Denúncia aprovada.");
    } else if (acao === "encaminhar") {
        console.log("Denúncia encaminhada.");
    } else if (acao === "alterar_status") {
        console.log("Status da denúncia será alterado.");
    } else if (acao === "arquivar") {
        console.log("Denúncia arquivada.");
    } else {
        console.log("Ação desconhecida.");
    }

    res.redirect("/denunciaDetalhe");
});

module.exports = router;