
const fiscalModel = require('../models/fiscalModel');

async function exibirGerenciarFiscais(req, res) {
    try {
        const fiscais = await fiscalModel.listarFiscais();

        return res.render('gerenciarFiscais', {
            fiscais,
            mensagemErro: null,
            mensagemSucesso: req.query.sucesso === '1'
                ? 'Fiscal cadastrado com sucesso!'
                : null
        });
    } catch (erro) {
        console.error('Erro ao listar fiscais:', erro);

        return res.status(500).send(
            'Não foi possível carregar os fiscais.'
        );
    }
}

async function cadastrarFiscal(req, res) {
    const nome = req.body.nome?.trim();
    const email = req.body.email?.trim();
    const cpf = req.body.cpf?.trim();
    const senha = req.body.senha;

    try {
        if (!nome || !email || !cpf || !senha) {
            return exibirComErro(
                res,
                'Preencha todos os campos do cadastro.'
            );
        }

        const emailExistente =
            await fiscalModel.buscarEmailExistente(email);

        if (emailExistente.length > 0) {
            return exibirComErro(
                res,
                'Este e-mail já está cadastrado.'
            );
        }

        const cpfExistente =
            await fiscalModel.buscarCpfExistente(cpf);

        if (cpfExistente.length > 0) {
            return exibirComErro(
                res,
                'Este CPF já está cadastrado.'
            );
        }

        await fiscalModel.cadastrarFiscal(
            nome,
            email,
            cpf,
            senha
        );

        return res.redirect('/gerenciarFiscais?sucesso=1');

    } catch (erro) {
        console.error('Erro ao cadastrar fiscal:', erro);

        return exibirComErro(
            res,
            'Não foi possível cadastrar o fiscal. Tente novamente.'
        );
    }
}

async function exibirComErro(res, mensagemErro) {
    try {
        const fiscais = await fiscalModel.listarFiscais();

        return res.status(400).render('gerenciarFiscais', {
            fiscais,
            mensagemErro,
            mensagemSucesso: null
        });
    } catch (erro) {
        console.error('Erro ao carregar a página:', erro);

        return res.status(500).send(
            'Não foi possível carregar a página de gerenciamento.'
        );
    }
}

module.exports = {
    exibirGerenciarFiscais,
    cadastrarFiscal
};
