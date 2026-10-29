const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {
    executarQuery,
    executarTransacao
} = require('../db/dbConnect');

function gerarTokenConvite() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Cria a organização e o convite após a contratação ser aprovada
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
                (nome, cnpj, emailContato, status, statusContrato,
                 inicioContrato)
             VALUES (?, ?, ?, 'ativa', 'ativo', CURRENT_TIMESTAMP)`,
            [
                nome.trim(),
                cnpj.trim(),
                emailContato.trim().toLowerCase()
            ]
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

    return { ...resultado, token };
}

// Busca um convite ainda válido
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
           AND o.status = 'ativa'
           AND o.statusContrato = 'ativo'`,
        [hashToken(token)]
    );
}

// Cadastra o superusuário usando um convite válido
async function cadastrarSuperusuarioPorConvite({
    idConvite,
    idOrganizacao,
    nome,
    email,
    cpf,
    senha
}) {
    const emailNormalizado = email.trim().toLowerCase();
    const cpfNormalizado = cpf.replace(/\D/g, '');

    if (cpfNormalizado.length !== 11) {
        return { status: 'cpf_invalido' };
    }

    const senhaHash = await bcrypt.hash(senha, 12);

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

        if (
            convites[0].emailResponsavel.toLowerCase() !==
            emailNormalizado
        ) {
            return { status: 'email_diferente' };
        }

        const existentes = await conn.query(
            `SELECT idSuperusuario
             FROM SUPERUSUARIO
             WHERE idOrganizacao = ?
                OR email = ?
                OR cpf = ?`,
            [idOrganizacao, emailNormalizado, cpfNormalizado]
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
                emailNormalizado,
                cpfNormalizado,
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

// Revoga convites pendentes de uma organização
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
    revogarConvitesPendentes
};