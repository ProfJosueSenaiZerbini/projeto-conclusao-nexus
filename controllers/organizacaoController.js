const organizacaoModel = require('../models/organizacaoModel');

function renderCadastroOrganizacao(res, status, dados = {}) {
    return res.status(status).render('cadastroOrganizacao', {
        mensagemErro: null,
        mensagemSucesso: null,
        linkConviteTeste: null,
        ...dados
    });
}

// A página pode ser acessada para preparar a interface, mas a criação exige
// uma sessão autorizada da equipe SafeZone e a aprovação da contratação.
async function cadastrarOrganizacao(req, res) {
    try {
        if (req.session?.equipeSafeZone !== true || req.session?.contratacaoAprovada !== true) {
            return renderCadastroOrganizacao(res, 403, {
                mensagemErro: 'Cadastro bloqueado: a contratação precisa ser aprovada e a operação autorizada pela equipe SafeZone.'
            });
        }

        const { nome, cnpj, emailContato, emailResponsavel } = req.body;
        if (!nome?.trim() || !cnpj?.trim() || !emailContato?.trim() || !emailResponsavel?.trim()) {
            return renderCadastroOrganizacao(res, 400, { mensagemErro: 'Preencha todos os campos.' });
        }

        const cnpjNormalizado = cnpj.trim().replace(/\D/g, '');
        if (cnpjNormalizado.length !== 14) {
            return renderCadastroOrganizacao(res, 400, { mensagemErro: 'Informe um CNPJ com 14 números.' });
        }
        const resultado = await organizacaoModel.criarOrganizacaoEConvite({
            nome, cnpj: cnpjNormalizado, emailContato, emailResponsavel
        });

        // A aprovação não pode ser reutilizada para criar outra organização.
        req.session.contratacaoAprovada = false;

        const dados = {
            mensagemSucesso: 'Organização cadastrada após aprovação da contratação. O convite foi criado no banco, mas NÃO foi enviado por e-mail.'
        };
        if (process.env.NODE_ENV !== 'production') {
            dados.linkConviteTeste = `/organizacao/convite/${resultado.token}`;
        }
        return renderCadastroOrganizacao(res, 201, dados);
    } catch (erro) {
        console.error('Erro ao cadastrar organização:', erro);
        if (erro.code === 'ER_DUP_ENTRY') {
            return renderCadastroOrganizacao(res, 409, { mensagemErro: 'Este CNPJ já está cadastrado.' });
        }
        return renderCadastroOrganizacao(res, 500, { mensagemErro: 'Não foi possível cadastrar a organização.' });
    }
}

async function exibirCadastroSuperusuario(req, res) {
    try {
        const convites = await organizacaoModel.buscarConviteValido(req.params.token);
        if (!convites.length) {
            return res.status(400).render('conviteInvalido');
        }
        return res.render('cadastroSuperusuario', {
            convite: convites[0],
            token: req.params.token,
            mensagemErro: null
        });
    } catch (erro) {
        console.error('Erro ao validar convite:', erro);
        return res.status(500).send('Erro ao validar o convite.');
    }
}

async function cadastrarSuperusuario(req, res) {
    try {
        const { nome, email, cpf, senha, confirmarSenha } = req.body;
        const token = req.params.token;
        const convites = await organizacaoModel.buscarConviteValido(token);
        if (!convites.length) return res.status(400).render('conviteInvalido');

        if (!nome?.trim() || !email?.trim() || !cpf?.trim() || !senha) {
            return res.status(400).render('cadastroSuperusuario', {
                convite: convites[0], token, mensagemErro: 'Preencha todos os campos.'
            });
        }
        if (senha !== confirmarSenha) {
            return res.status(400).render('cadastroSuperusuario', {
                convite: convites[0], token, mensagemErro: 'As senhas não coincidem.'
            });
        }

        const resultado = await organizacaoModel.cadastrarSuperusuarioPorConvite({
            idConvite: convites[0].idConvite,
            idOrganizacao: convites[0].idOrganizacao,
            nome, email, cpf, senha
        });

        if (resultado.status !== 'sucesso') {
            const mensagens = {
                convite_invalido: 'Este convite expirou, foi revogado ou já foi utilizado.',
                email_diferente: 'Use o e-mail informado no convite.',
                dados_existentes: 'Já existe um superusuário cadastrado para esta organização ou os dados já estão em uso.',
                cpf_invalido: 'Informe um CPF válido com 11 números.',
                senha_fraca: 'A senha precisa ter pelo menos 8 caracteres.'
            };
            return res.status(400).render('cadastroSuperusuario', {
                convite: convites[0], token, mensagemErro: mensagens[resultado.status] || 'Não foi possível concluir o cadastro.'
            });
        }

        const dados = {
            mensagemSucesso: 'Cadastro criado. A conta continuará pendente até a confirmação do e-mail. Nenhum e-mail foi enviado ainda.',
            linkConfirmacaoTeste: process.env.NODE_ENV !== 'production'
                ? `/organizacao/confirmar-email/${resultado.tokenConfirmacao}`
                : null
        };
        return res.render('cadastroConcluido', dados);
    } catch (erro) {
        console.error('Erro ao cadastrar superusuário:', erro);
        return res.status(500).send('Não foi possível concluir o cadastro do superusuário.');
    }
}

async function confirmarEmailSuperusuario(req, res) {
    try {
        const confirmado = await organizacaoModel.confirmarEmailSuperusuario(req.params.token);
        if (!confirmado) {
            return res.status(400).render('conviteInvalido', {
                mensagem: 'O link de confirmação é inválido ou expirou.'
            });
        }
        return res.render('emailConfirmado');
    } catch (erro) {
        console.error('Erro ao confirmar e-mail do superusuário:', erro);
        return res.status(500).send('Não foi possível confirmar o e-mail.');
    }
}




async function exibirTransferenciaSuperusuario(req, res) {
    return res.render('transferirResponsavel', { mensagemErro: null });
}

async function iniciarTransferenciaSuperusuario(req, res, idOrganizacao) {
    try {
        const { nome, email, cpf } = req.body;
        if (!nome?.trim() || !email?.trim() || !cpf?.trim()) {
            return res.status(400).render('transferirResponsavel', { mensagemErro: 'Preencha nome, e-mail e CPF do novo responsável.' });
        }
        const resultado = await organizacaoModel.criarConviteTransferenciaSuperusuario({
            idOrganizacao, nome, email, cpf
        });
        if (resultado.status !== 'sucesso') {
            const mensagens = {
                cpf_invalido: 'Informe um CPF com 11 números.',
                organizacao_inativa: 'A transferência exige uma organização com contrato ativo.',
                superusuario_inexistente: 'Não há superusuário ativo para transferir.',
                dados_existentes: 'O e-mail ou CPF do novo responsável já está cadastrado.'
            };
            return res.status(400).render('transferirResponsavel', {
                mensagemErro: mensagens[resultado.status] || 'Não foi possível iniciar a transferência.'
            });
        }
        const linkTransferencia = `/organizacao/transferencia/${resultado.token}`;
        if (process.env.NODE_ENV !== 'production') {
            return res.render('cadastroConcluido', {
                mensagemSucesso: 'Convite de transferência criado. O superusuário atual continua ativo até o novo responsável aceitar. O convite NÃO foi enviado por e-mail.',
                linkConfirmacaoTeste: linkTransferencia,
                linkLabel: 'Abrir convite de transferência (teste local)'
            });
        }
        return res.status(201).send('Convite de transferência criado, mas ainda não foi enviado por e-mail. O superusuário atual continua ativo.');
    } catch (erro) {
        console.error('Erro ao iniciar transferência de superusuário:', erro);
        return res.status(500).send('Não foi possível iniciar a transferência.');
    }
}

async function iniciarTransferenciaPeloSuperusuario(req, res) {
    return iniciarTransferenciaSuperusuario(req, res, req.session.usuario.idOrganizacao);
}

async function iniciarTransferenciaPelaEquipe(req, res) {
    const idOrganizacao = Number(req.params.id);
    if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) return res.status(400).send('ID de organização inválido.');
    return iniciarTransferenciaSuperusuario(req, res, idOrganizacao);
}

async function exibirConviteTransferencia(req, res) {
    try {
        const convites = await organizacaoModel.buscarConviteTransferenciaValido(req.params.token);
        if (!convites.length) return res.status(400).render('conviteInvalido');
        return res.render('aceitarTransferenciaSuperusuario', {
            convite: convites[0], token: req.params.token, mensagemErro: null
        });
    } catch (erro) {
        console.error('Erro ao validar convite de transferência:', erro);
        return res.status(500).send('Não foi possível validar o convite de transferência.');
    }
}

async function concluirTransferencia(req, res) {
    try {
        const { senha, confirmarSenha } = req.body;
        if (!senha || senha !== confirmarSenha) {
            const convites = await organizacaoModel.buscarConviteTransferenciaValido(req.params.token);
            if (!convites.length) return res.status(400).render('conviteInvalido');
            return res.status(400).render('aceitarTransferenciaSuperusuario', {
                convite: convites[0], token: req.params.token,
                mensagemErro: !senha ? 'Informe uma senha.' : 'As senhas não coincidem.'
            });
        }
        const resultado = await organizacaoModel.concluirTransferenciaSuperusuario({
            token: req.params.token, senha
        });
        if (resultado.status !== 'sucesso') {
            const mensagens = {
                convite_invalido: 'O convite de transferência é inválido, expirou ou foi revogado.',
                senha_fraca: 'A senha precisa ter pelo menos 8 caracteres.',
                dados_existentes: 'O e-mail ou CPF foi cadastrado por outra conta enquanto o convite estava pendente.',
                superusuario_inexistente: 'Não existe superusuário para transferir.'
            };
            return res.status(400).send(mensagens[resultado.status] || 'Não foi possível concluir a transferência.');
        }
        return res.render('cadastroConcluido', {
            mensagemSucesso: 'Transferência concluída. O novo responsável foi ativado e as sessões antigas do superusuário deixam de ser válidas.',
            linkConfirmacaoTeste: null
        });
    } catch (erro) {
        console.error('Erro ao concluir transferência:', erro);
        return res.status(500).send('Não foi possível concluir a transferência.');
    }
}

async function gerarNovoConvite(req, res) {
    try {
        const idOrganizacao = Number(req.params.id);
        const emailResponsavel = String(req.body.emailResponsavel || '').trim().toLowerCase();
        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0 || !emailResponsavel) {
            return res.status(400).send('Informe uma organização e um e-mail válidos.');
        }
        const resultado = await organizacaoModel.gerarNovoConvite(idOrganizacao, emailResponsavel);
        if (resultado.status !== 'sucesso') {
            const mensagens = {
                superusuario_existente: 'A organização já possui um superusuário cadastrado.',
                organizacao_inativa: 'A organização não está ativa para receber um convite.',
                convite_anterior_inexistente: 'Não existe convite anterior para reenviar.',
                email_diferente: 'O novo convite precisa ser enviado ao mesmo e-mail do convite anterior.'
            };
            return res.status(400).send(mensagens[resultado.status] || 'Não foi possível gerar o convite.');
        }
        if (process.env.NODE_ENV !== 'production') {
            return res.status(201).send(`Novo convite criado para teste local. Não foi enviado por e-mail: /organizacao/convite/${resultado.token}`);
        }
        return res.status(201).send('Novo convite registrado, mas o envio por e-mail ainda não está integrado.');
    } catch (erro) {
        console.error('Erro ao gerar novo convite:', erro);
        return res.status(500).send('Não foi possível gerar o convite.');
    }
}

async function cancelarContrato(req, res) {
    try {
        const idOrganizacao = Number(req.params.id);
        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) return res.status(400).send('ID de organização inválido.');
        const resultado = await organizacaoModel.cancelarContrato(idOrganizacao);
        if (resultado.affectedRows !== 1) return res.status(404).send('Organização não encontrada ou contrato não está ativo.');
        return res.status(200).send('Contrato cancelado. A organização permanece em transição por 15 dias.');
    } catch (erro) {
        console.error('Erro ao cancelar contrato:', erro);
        return res.status(500).send('Não foi possível cancelar o contrato.');
    }
}

async function reativarOrganizacao(req, res) {
    try {
        const idOrganizacao = Number(req.params.id);
        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) return res.status(400).send('ID de organização inválido.');
        const resultado = await organizacaoModel.reativarOrganizacao(idOrganizacao);
        if (resultado.affectedRows !== 1) return res.status(404).send('Organização não encontrada ou não está elegível para reativação.');
        return res.status(200).send('Organização reativada após confirmação da nova contratação.');
    } catch (erro) {
        console.error('Erro ao reativar organização:', erro);
        return res.status(500).send('Não foi possível reativar a organização.');
    }
}

function exibirSimulacaoContratacao(req, res) {
    if (process.env.NODE_ENV === 'production' || !process.env.CHAVE_TESTE_CONTRATACAO) {
        return res.status(404).send('Página não encontrada.');
    }
    return res.render('simularContratacao', { mensagemErro: null });
}

function aprovarContratacaoTeste(req, res) {
    const chaveConfigurada = process.env.CHAVE_TESTE_CONTRATACAO;
    const chaveRecebida = String(req.body.chave || '');
    if (process.env.NODE_ENV === 'production' || !chaveConfigurada) {
        return res.status(404).send('Página não encontrada.');
    }
    const a = Buffer.from(chaveConfigurada);
    const b = Buffer.from(chaveRecebida);
    if (a.length !== b.length || !require('crypto').timingSafeEqual(a, b)) {
        return res.status(403).render('simularContratacao', {
            mensagemErro: 'Chave de teste inválida.'
        });
    }
    // Simulação explícita apenas em ambiente local; remover quando o chatbot estiver integrado.
    req.session.equipeSafeZone = true;
    req.session.contratacaoAprovada = true;
    return res.redirect('/organizacao/cadastro');
}

module.exports = {
    cadastrarOrganizacao,
    exibirCadastroSuperusuario,
    cadastrarSuperusuario,
    confirmarEmailSuperusuario,
    exibirSimulacaoContratacao,
    aprovarContratacaoTeste,
    gerarNovoConvite,
    cancelarContrato,
    reativarOrganizacao,
    exibirTransferenciaSuperusuario,
    iniciarTransferenciaPeloSuperusuario,
    iniciarTransferenciaPelaEquipe,
    exibirConviteTransferencia,
    concluirTransferencia
};
