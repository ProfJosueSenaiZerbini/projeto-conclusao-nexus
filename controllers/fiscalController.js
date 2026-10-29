const fiscalModel = require('../models/fiscalModel');

function formatarCpf(cpf) {
    const numeros = String(cpf || '').replace(/\D/g, '');
    if (numeros.length !== 11) return null;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function renderGerenciar(req, res, status = 200, mensagemErro = null, mensagemSucesso = null) {
    try {
        const fiscais = await fiscalModel.listarFiscais(req.session.usuario.idOrganizacao);
        return res.status(status).render('gerenciarFiscais', { fiscais, mensagemErro, mensagemSucesso });
    } catch (erro) {
        console.error('Erro ao carregar fiscais:', erro);
        return res.status(500).send('Não foi possível carregar os fiscais.');
    }
}

async function exibirGerenciarFiscais(req, res) {
    return renderGerenciar(req, res, 200, null,
        req.query.sucesso === '1' ? 'Fiscal cadastrado com sucesso!' :
        req.query.desativado === '1' ? 'Fiscal desativado. O histórico foi preservado.' : null);
}

async function cadastrarFiscal(req, res) {
    const nome = req.body.nome?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const cpfNumeros = String(req.body.cpf || '').replace(/\D/g, '');
    const cpf = formatarCpf(req.body.cpf);
    const senha = req.body.senha;
    const idOrganizacao = req.session.usuario.idOrganizacao;

    if (!idOrganizacao) return res.status(403).send('Sua conta não está vinculada a uma organização.');
    if (!nome || !email || !cpf || !senha) {
        return renderGerenciar(req, res, 400, 'Preencha todos os campos e informe um CPF com 11 números.');
    }
    if (senha.length < 8) return renderGerenciar(req, res, 400, 'A senha precisa ter pelo menos 8 caracteres.');

    try {
        if ((await fiscalModel.buscarEmailExistente(email)).length) {
            return renderGerenciar(req, res, 409, 'Este e-mail já está cadastrado.');
        }
        if ((await fiscalModel.buscarCpfExistente(cpfNumeros)).length) {
            return renderGerenciar(req, res, 409, 'Este CPF já está cadastrado.');
        }
        await fiscalModel.cadastrarFiscal({ idOrganizacao, nome, email, cpf, senha });
        return res.redirect('/gerenciarFiscais?sucesso=1');
    } catch (erro) {
        console.error('Erro ao cadastrar fiscal:', erro);
        return renderGerenciar(req, res, 500, 'Não foi possível cadastrar o fiscal. Verifique os dados e tente novamente.');
    }
}

async function desativarFiscal(req, res) {
    const idFiscal = Number(req.params.id);
    const idOrganizacao = req.session.usuario.idOrganizacao;
    if (!Number.isInteger(idFiscal) || idFiscal <= 0 || !idOrganizacao) {
        return res.status(400).send('Dados inválidos.');
    }
    try {
        const resultado = await fiscalModel.desativarFiscal(idFiscal, idOrganizacao);
        if (resultado.affectedRows !== 1) {
            return renderGerenciar(req, res, 404, 'Fiscal não encontrado ou já desativado.');
        }
        return res.redirect('/gerenciarFiscais?desativado=1');
    } catch (erro) {
        console.error('Erro ao desativar fiscal:', erro);
        return renderGerenciar(req, res, 500, 'Não foi possível desativar o fiscal.');
    }
}

module.exports = { exibirGerenciarFiscais, cadastrarFiscal, desativarFiscal };
