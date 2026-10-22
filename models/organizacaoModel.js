const crypto = require('crypto');
const { promisify } = require('util');
const {
    executarQuery,
    executarTransacao
} = require('../db/dbConnect');

const scryptAsync = promisify(crypto.scrypt);

// Gera um token aleatório para o convite
function gerarTokenConvite() {
    return crypto.randomBytes(32).toString('hex');
}

// Armazena somente o hash do token no banco
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Protege a senha com hash e salt
async function gerarHashSenha(senha) {
    const salt = crypto.randomBytes(16).toString('hex');
    const chave = await scryptAsync(senha, salt, 64);

    return `${salt}:${chave.toString('hex')}`;
}

// Cria a organização e o convite do superusuário
async function criarOrganizacaoEConvite({
    nome,
    cnpj,
    emailContato,
    emailResponsavel
}) {
    const token = gerarTokenConvite();
    const tokenHash = hashToken(token);

    const resultado = await executarTransacao(async (conn) => {
        const organizacao = await conn.query(
            `INSERT INTO ORGANIZACAO
                (nome, cnpj, emailContato, status, statusContrato, inicioContrato)
             VALUES (?, ?, ?, 'ativa', 'ativo', CURRENT_TIMESTAMP)`,
            [nome.trim(), cnpj.trim(), emailContato.trim()]
        );

        const idOrganizacao = Number(organizacao.insertId);

        await conn.query(
            `INSERT INTO CONVITE_SUPERUSUARIO
                (idOrganizacao, emailResponsavel, tokenHash, expiraEm)
             VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR))`,
            [
                idOrganizacao,
                emailResponsavel.trim().toLowerCase(),
                tokenHash
            ]
        );

        return { idOrganizacao };
    });

    // O token original será enviado por e-mail pelo controller
    return { ...resultado, token };
}

// Busca e valida um convite
async function buscarConviteValido(token) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
        return [];
    }

    return executarQuery(
        `SELECT
            c.idConvite,
            c.idOrganizacao,
            c.emailResponsavel,
            c.expiraEm,
            o.nome AS nomeOrganizacao
         FROM CONVITE_SUPERUSUARIO c
         INNER JOIN ORGANIZACAO o
            ON o.idOrganizacao = c.idOrganizacao
         WHERE c.tokenHash = ?
           AND c.usadoEm IS NULL
           AND c.revogado = FALSE
           AND c.expiraEm > CURRENT_TIMESTAMP
           AND o.status IN ('ativa', 'pendente')`,
        [hashToken(token)]
    );
}

// Cadastra o superusuário utilizando o convite
async function cadastrarSuperusuarioPorConvite({
    idConvite,
    idOrganizacao,
    nome,
    email,
    cpf,
    senha
}) {
    const senhaHash = await gerarHashSenha(senha);

    return executarTransacao(async (conn) => {
        const convites = await conn.query(
            `SELECT idConvite, idOrganizacao, emailResponsavel
             FROM CONVITE_SUPERUSUARIO
             WHERE idConvite = ?
               AND idOrganizacao = ?
               AND usadoEm IS NULL
               AND revogado = FALSE
               AND expiraEm > CURRENT_TIMESTAMP
             FOR UPDATE`,
            [idConvite, idOrganizacao]
        );

        if (convites.length === 0) {
            return { status: 'convite_invalido' };
        }

        const convite = convites[0];

        if (
            convite.emailResponsavel.toLowerCase() !==
            email.trim().toLowerCase()
        ) {
            return { status: 'email_diferente' };
        }

        const existentes = await conn.query(
            `SELECT idSuperusuario
             FROM SUPERUSUARIO
             WHERE idOrganizacao = ?
                OR email = ?
                OR cpf = ?`,
            [
                idOrganizacao,
                email.trim().toLowerCase(),
                cpf
            ]
        );

        if (existentes.length > 0) {
            return { status: 'dados_existentes' };
        }

        await conn.query(
            `INSERT INTO SUPERUSUARIO
                (idOrganizacao, nome, email, cpf, senha,
                 emailConfirmado, status)
             VALUES (?, ?, ?, ?, ?, FALSE, 'pendente')`,
            [
                idOrganizacao,
                nome.trim(),
                email.trim().toLowerCase(),
                cpf,
                senhaHash
            ]
        );

        await conn.query(
            `UPDATE CONVITE_SUPERUSUARIO
             SET usadoEm = CURRENT_TIMESTAMP
             WHERE idConvite = ?
               AND usadoEm IS NULL`,
            [idConvite]
        );

        return { status: 'sucesso' };
    });
}

// Confirma o e-mail e ativa a conta
async function confirmarEmailSuperusuario(idSuperusuario) {
    const resultado = await executarQuery(
        `UPDATE SUPERUSUARIO
         SET emailConfirmado = TRUE,
             status = 'ativo',
             dataConfirmacaoEmail = CURRENT_TIMESTAMP
         WHERE idSuperusuario = ?
           AND status = 'pendente'`,
        [idSuperusuario]
    );

    return resultado.affectedRows === 1;
}

// Revoga convites ainda não utilizados
async function revogarConvitesPendentes(idOrganizacao) {
    return executarQuery(
        `UPDATE CONVITE_SUPERUSUARIO
         SET revogado = TRUE
         WHERE idOrganizacao = ?
           AND usadoEm IS NULL
           AND revogado = FALSE`,
        [idOrganizacao]
    );
}

module.exports = {
    criarOrganizacaoEConvite,
    buscarConviteValido,
    cadastrarSuperusuarioPorConvite,
    confirmarEmailSuperusuario,
    revogarConvitesPendentes
};