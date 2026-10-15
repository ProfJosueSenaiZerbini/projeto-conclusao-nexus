const codigoAtivacaoModel = require('../models/codigoAtivacaoModel');

async function exibirAtivacao(req, res) {
    try {
        const concluida =
            await codigoAtivacaoModel.verificarAtivacaoConcluida();

        if (concluida) {
            return res.redirect('/login');
        }

        return res.render('ativacao', {
            mensagemErro: null
        });
    } catch (erro) {
        console.error('Erro ao verificar ativação:', erro);

        return res.status(500).send(
            'Não foi possível verificar a ativação do sistema.'
        );
    }
}

async function validarCodigo(req, res) {
    const codigo = req.body.codigo?.trim();

    if (!codigo) {
        return res.status(400).render('ativacao', {
            mensagemErro: 'Digite o código de ativação.'
        });
    }

    try {
        const concluida =
            await codigoAtivacaoModel.verificarAtivacaoConcluida();

        if (concluida) {
            return res.redirect('/login');
        }

        const codigoValido =
            await codigoAtivacaoModel.buscarCodigo(codigo);

        if (codigoValido.length === 0) {
            return res.status(400).render('ativacao', {
                mensagemErro:
                    'Código de ativação inválido ou já utilizado.'
            });
        }

        return res.render('cadastroFiscal', {
            codigo,
            mensagemErro: null
        });
    } catch (erro) {
        console.error('Erro ao validar código:', erro);

        return res.status(500).render('ativacao', {
            mensagemErro: 'Erro ao validar o código de ativação.'
        });
    }
}

async function cadastrarFiscal(req, res) {
    const nome = req.body.nome?.trim();
    const email = req.body.email?.trim();
    const cpf = req.body.cpf?.replace(/\D/g, '');
    const senha = req.body.senha;
    const codigo = req.body.codigo?.trim();

    if (!nome || !email || !cpf || !senha || !codigo) {
        return res.status(400).render('cadastroFiscal', {
            codigo: codigo || '',
            mensagemErro: 'Preencha todos os campos.'
        });
    }

    try {
        const resultado =
            await codigoAtivacaoModel.concluirAtivacaoFiscal({
                nome,
                email,
                cpf,
                senha,
                codigo
            });

        if (resultado.status === 'concluida') {
            return res.redirect('/login');
        }

        if (resultado.status === 'codigo_invalido') {
            return res.status(400).render('ativacao', {
                mensagemErro:
                    'Código de ativação inválido ou já utilizado.'
            });
        }

        if (resultado.status === 'dados_existentes') {
            return res.status(400).render('cadastroFiscal', {
                codigo,
                mensagemErro:
                    'Este e-mail ou CPF já está cadastrado.'
            });
        }

        return res.redirect('/login');
    } catch (erro) {
        console.error('Erro ao cadastrar fiscal:', erro);

        return res.status(500).render('cadastroFiscal', {
            codigo: codigo || '',
            mensagemErro:
                'Não foi possível concluir o cadastro. Tente novamente.'
        });
    }
}

module.exports = {
    exibirAtivacao,
    validarCodigo,
    cadastrarFiscal
};