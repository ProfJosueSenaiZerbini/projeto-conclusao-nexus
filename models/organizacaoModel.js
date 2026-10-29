const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { executarQuery, executarTransacao } = require('../db/dbConnect');

function gerarToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function formatarCpf(cpf) {
    const numeros = String(cpf || '').replace(/\D/g, '');
    if (numeros.length !== 11) return null;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Só deve ser chamada após a aprovação da contratação pela equipe/fluxo autorizado.
// Retorna o token para futura integração de envio por e-mail; não envia e-mail.
async function criarOrganizacaoEConvite({ nome, cnpj, emailContato, emailResponsavel }) {
    const token = gerarToken();
    const tokenHash = hashToken(token);
    const resultado = await executarTransacao(async (conn) => {
        const organizacao = await conn.query(
            `INSERT INTO ORGANIZACAO
                (nome, cnpj, emailContato, status, statusContrato, inicioContrato)
             VALUES (?, ?, ?, 'ativa', 'ativo', CURRENT_TIMESTAMP)`,
            [nome.trim(), cnpj.trim(), emailContato.trim().toLowerCase()]
        );
        const idOrganizacao = Number(organizacao.insertId);
        await conn.query(
            `INSERT INTO CONVITE_SUPERUSUARIO
                (idOrganizacao, emailResponsavel, tokenHash, expiraEm)
             VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR))`,
            [idOrganizacao, emailResponsavel.trim().toLowerCase(), tokenHash]
        );
        return { idOrganizacao };
    });
    return { ...resultado, token };
}

async function buscarConviteValido(token) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return [];
    return executarQuery(
        `SELECT c.idConvite, c.idOrganizacao, c.emailResponsavel, c.expiraEm,
                o.nome AS nomeOrganizacao
         FROM CONVITE_SUPERUSUARIO c
         INNER JOIN ORGANIZACAO o ON o.idOrganizacao = c.idOrganizacao
         WHERE c.tokenHash = ? AND c.usadoEm IS NULL AND c.revogado = FALSE
           AND c.expiraEm > CURRENT_TIMESTAMP
           AND o.status = 'ativa' AND o.statusContrato = 'ativo'`,
        [hashToken(token)]
    );
}

async function cadastrarSuperusuarioPorConvite({ idConvite, idOrganizacao, nome, email, cpf, senha }) {
    const emailNormalizado = email.trim().toLowerCase();
    const cpfFormatado = formatarCpf(cpf);
    if (!cpfFormatado) return { status: 'cpf_invalido' };
    if (String(senha).length < 8) return { status: 'senha_fraca' };

    const senhaHash = await bcrypt.hash(senha, 12);
    const tokenConfirmacao = gerarToken();
    const tokenConfirmacaoHash = hashToken(tokenConfirmacao);

    const resultado = await executarTransacao(async (conn) => {
        const convites = await conn.query(
            `SELECT idConvite, idOrganizacao, emailResponsavel
             FROM CONVITE_SUPERUSUARIO
             WHERE idConvite = ? AND idOrganizacao = ? AND usadoEm IS NULL
               AND revogado = FALSE AND expiraEm > CURRENT_TIMESTAMP
             FOR UPDATE`,
            [idConvite, idOrganizacao]
        );
        if (convites.length === 0) return { status: 'convite_invalido' };
        if (convites[0].emailResponsavel.toLowerCase() !== emailNormalizado) {
            return { status: 'email_diferente' };
        }

        const existentes = await conn.query(
            `SELECT email FROM USUARIO WHERE LOWER(email) = ?
             UNION SELECT email FROM FISCAL WHERE LOWER(email) = ?
             UNION SELECT email FROM SUPERUSUARIO WHERE LOWER(email) = ? OR idOrganizacao = ?
             UNION SELECT cpf FROM USUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM FISCAL WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM SUPERUSUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
            [emailNormalizado, emailNormalizado, emailNormalizado, idOrganizacao,
             cpfFormatado.replace(/\D/g, ''), cpfFormatado.replace(/\D/g, ''), cpfFormatado.replace(/\D/g, '')]
        );
        if (existentes.length > 0) return { status: 'dados_existentes' };

        await conn.query(
            `INSERT INTO SUPERUSUARIO
                (idOrganizacao, nome, email, cpf, senha, emailConfirmado, status,
                 tokenConfirmacaoHash, tokenConfirmacaoExpiraEm)
             VALUES (?, ?, ?, ?, ?, FALSE, 'pendente', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR))`,
            [idOrganizacao, nome.trim(), emailNormalizado, cpfFormatado, senhaHash, tokenConfirmacaoHash]
        );
        await conn.query(
            `UPDATE CONVITE_SUPERUSUARIO SET usadoEm = CURRENT_TIMESTAMP
             WHERE idConvite = ? AND usadoEm IS NULL`,
            [idConvite]
        );
        return { status: 'sucesso' };
    });

    return resultado.status === 'sucesso'
        ? { ...resultado, tokenConfirmacao }
        : resultado;
}

async function buscarSuperusuarioPorEmail(email) {
    return executarQuery(
        `SELECT idSuperusuario, idOrganizacao, nome, email, senha,
                emailConfirmado, status
         FROM SUPERUSUARIO WHERE email = ? LIMIT 1`,
        [email.trim().toLowerCase()]
    );
}

async function confirmarEmailSuperusuario(token) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
    const resultado = await executarQuery(
        `UPDATE SUPERUSUARIO s
         INNER JOIN ORGANIZACAO o ON o.idOrganizacao = s.idOrganizacao
         SET s.emailConfirmado = TRUE, s.status = 'ativo',
             s.dataConfirmacaoEmail = CURRENT_TIMESTAMP,
             s.tokenConfirmacaoHash = NULL, s.tokenConfirmacaoExpiraEm = NULL
         WHERE s.tokenConfirmacaoHash = ?
           AND s.tokenConfirmacaoExpiraEm > CURRENT_TIMESTAMP
           AND s.status = 'pendente'
           AND o.status = 'ativa' AND o.statusContrato = 'ativo'`,
        [hashToken(token)]
    );
    return resultado.affectedRows === 1;
}

async function revogarConvitesPendentes(idOrganizacao) {
    return executarQuery(
        `UPDATE CONVITE_SUPERUSUARIO SET revogado = TRUE
         WHERE idOrganizacao = ? AND usadoEm IS NULL AND revogado = FALSE`,
        [idOrganizacao]
    );
}


// Gera um novo convite para o mesmo e-mail após expiração; não envia e-mail.
async function gerarNovoConvite(idOrganizacao, emailResponsavel) {
    const token = gerarToken();
    const tokenHash = hashToken(token);
    const resultado = await executarTransacao(async (conn) => {
        const organizacoes = await conn.query(
            `SELECT idOrganizacao FROM ORGANIZACAO
             WHERE idOrganizacao = ? AND status = 'ativa' AND statusContrato = 'ativo'
             FOR UPDATE`,
            [idOrganizacao]
        );
        if (!organizacoes.length) return { status: 'organizacao_inativa' };
        const superusuarios = await conn.query(
            'SELECT idSuperusuario FROM SUPERUSUARIO WHERE idOrganizacao = ?',
            [idOrganizacao]
        );
        if (superusuarios.length) return { status: 'superusuario_existente' };
        const convitesAnteriores = await conn.query(
            `SELECT emailResponsavel FROM CONVITE_SUPERUSUARIO
             WHERE idOrganizacao = ? ORDER BY criadoEm DESC LIMIT 1 FOR UPDATE`,
            [idOrganizacao]
        );
        if (!convitesAnteriores.length) return { status: 'convite_anterior_inexistente' };
        if (convitesAnteriores[0].emailResponsavel.toLowerCase() !== emailResponsavel.trim().toLowerCase()) {
            return { status: 'email_diferente' };
        }
        await conn.query(
            `UPDATE CONVITE_SUPERUSUARIO SET revogado = TRUE
             WHERE idOrganizacao = ? AND usadoEm IS NULL AND revogado = FALSE`,
            [idOrganizacao]
        );
        await conn.query(
            `INSERT INTO CONVITE_SUPERUSUARIO
                (idOrganizacao, emailResponsavel, tokenHash, expiraEm)
             VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR))`,
            [idOrganizacao, emailResponsavel.trim().toLowerCase(), tokenHash]
        );
        return { status: 'sucesso' };
    });
    return resultado.status === 'sucesso' ? { ...resultado, token } : resultado;
}

async function cancelarContrato(idOrganizacao) {
    return executarQuery(
        `UPDATE ORGANIZACAO
         SET status = 'em_transicao', statusContrato = 'cancelado',
             fimContrato = CURRENT_TIMESTAMP,
             fimPeriodoTransicao = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 DAY)
         WHERE idOrganizacao = ? AND status = 'ativa' AND statusContrato = 'ativo'`,
        [idOrganizacao]
    );
}

async function reativarOrganizacao(idOrganizacao) {
    return executarQuery(
        `UPDATE ORGANIZACAO
         SET status = 'ativa', statusContrato = 'ativo',
             inicioContrato = CURRENT_TIMESTAMP, fimContrato = NULL,
             fimPeriodoTransicao = NULL
         WHERE idOrganizacao = ?
           AND (status IN ('em_transicao', 'bloqueada', 'inativa')
                OR statusContrato IN ('cancelado', 'encerrado'))`,
        [idOrganizacao]
    );
}

async function bloquearTransicaoExpirada(idOrganizacao) {
    return executarQuery(
        `UPDATE ORGANIZACAO
         SET status = 'bloqueada'
         WHERE idOrganizacao = ? AND status = 'em_transicao'
           AND fimPeriodoTransicao IS NOT NULL
           AND fimPeriodoTransicao <= CURRENT_TIMESTAMP`,
        [idOrganizacao]
    );
}


async function criarConviteTransferenciaSuperusuario({ idOrganizacao, nome, email, cpf }) {
    const emailNormalizado = email.trim().toLowerCase();
    const cpfFormatado = formatarCpf(cpf);
    if (!cpfFormatado) return { status: 'cpf_invalido' };
    const token = gerarToken();
    const tokenHash = hashToken(token);

    const resultado = await executarTransacao(async (conn) => {
        const organizacoes = await conn.query(
            `SELECT idOrganizacao FROM ORGANIZACAO
             WHERE idOrganizacao = ? AND status = 'ativa' AND statusContrato = 'ativo'
             FOR UPDATE`,
            [idOrganizacao]
        );
        if (!organizacoes.length) return { status: 'organizacao_inativa' };
        const atuais = await conn.query(
            'SELECT idSuperusuario FROM SUPERUSUARIO WHERE idOrganizacao = ? AND status = \'ativo\'',
            [idOrganizacao]
        );
        if (!atuais.length) return { status: 'superusuario_inexistente' };
        const idAtual = atuais[0].idSuperusuario;
        const duplicados = await conn.query(
            `SELECT email FROM USUARIO WHERE LOWER(email) = ?
             UNION SELECT email FROM FISCAL WHERE LOWER(email) = ?
             UNION SELECT email FROM SUPERUSUARIO WHERE LOWER(email) = ? AND idSuperusuario <> ?
             UNION SELECT cpf FROM USUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM FISCAL WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM SUPERUSUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ? AND idSuperusuario <> ?`,
            [emailNormalizado, emailNormalizado, emailNormalizado, idAtual,
             cpfFormatado.replace(/\D/g, ''), cpfFormatado.replace(/\D/g, ''), cpfFormatado.replace(/\D/g, ''), idAtual]
        );
        if (duplicados.length) return { status: 'dados_existentes' };

        await conn.query(
            `UPDATE CONVITE_TRANSFERENCIA_SUPERUSUARIO
             SET revogado = TRUE
             WHERE idOrganizacao = ? AND usadoEm IS NULL AND revogado = FALSE`,
            [idOrganizacao]
        );
        await conn.query(
            `INSERT INTO CONVITE_TRANSFERENCIA_SUPERUSUARIO
                (idOrganizacao, nomeResponsavel, emailResponsavel, cpf, tokenHash, expiraEm)
             VALUES (?, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR))`,
            [idOrganizacao, nome.trim(), emailNormalizado, cpfFormatado, tokenHash]
        );
        return { status: 'sucesso' };
    });
    return resultado.status === 'sucesso' ? { ...resultado, token } : resultado;
}

async function buscarConviteTransferenciaValido(token) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return [];
    return executarQuery(
        `SELECT t.idTransferencia, t.idOrganizacao, t.nomeResponsavel,
                t.emailResponsavel, t.cpf, o.nome AS nomeOrganizacao
         FROM CONVITE_TRANSFERENCIA_SUPERUSUARIO t
         INNER JOIN ORGANIZACAO o ON o.idOrganizacao = t.idOrganizacao
         WHERE t.tokenHash = ? AND t.usadoEm IS NULL AND t.revogado = FALSE
           AND t.expiraEm > CURRENT_TIMESTAMP
           AND o.status = 'ativa' AND o.statusContrato = 'ativo'`,
        [hashToken(token)]
    );
}

async function concluirTransferenciaSuperusuario({ token, senha }) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return { status: 'convite_invalido' };
    if (String(senha || '').length < 8) return { status: 'senha_fraca' };
    const senhaHash = await bcrypt.hash(senha, 12);
    return executarTransacao(async (conn) => {
        const convites = await conn.query(
            `SELECT t.idTransferencia, t.idOrganizacao, t.nomeResponsavel,
                    t.emailResponsavel, t.cpf
             FROM CONVITE_TRANSFERENCIA_SUPERUSUARIO t
             INNER JOIN ORGANIZACAO o ON o.idOrganizacao = t.idOrganizacao
             WHERE t.tokenHash = ? AND t.usadoEm IS NULL AND t.revogado = FALSE
               AND t.expiraEm > CURRENT_TIMESTAMP
               AND o.status = 'ativa' AND o.statusContrato = 'ativo'
             FOR UPDATE`,
            [hashToken(token)]
        );
        if (!convites.length) return { status: 'convite_invalido' };
        const convite = convites[0];
        const duplicados = await conn.query(
            `SELECT email FROM USUARIO WHERE LOWER(email) = ?
             UNION SELECT email FROM FISCAL WHERE LOWER(email) = ?
             UNION SELECT email FROM SUPERUSUARIO WHERE LOWER(email) = ? AND idOrganizacao <> ?
             UNION SELECT cpf FROM USUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM FISCAL WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?
             UNION SELECT cpf FROM SUPERUSUARIO WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ? AND idOrganizacao <> ?`,
            [convite.emailResponsavel, convite.emailResponsavel, convite.emailResponsavel, convite.idOrganizacao,
             convite.cpf.replace(/\D/g, ''), convite.cpf.replace(/\D/g, ''), convite.cpf.replace(/\D/g, ''), convite.idOrganizacao]
        );
        if (duplicados.length) return { status: 'dados_existentes' };
        const atualizados = await conn.query(
            `UPDATE SUPERUSUARIO
             SET nome = ?, email = ?, cpf = ?, senha = ?,
                 emailConfirmado = TRUE, status = 'ativo',
                 dataConfirmacaoEmail = CURRENT_TIMESTAMP,
                 tokenConfirmacaoHash = NULL, tokenConfirmacaoExpiraEm = NULL
             WHERE idOrganizacao = ?`,
            [convite.nomeResponsavel, convite.emailResponsavel, convite.cpf, senhaHash, convite.idOrganizacao]
        );
        if (atualizados.affectedRows !== 1) return { status: 'superusuario_inexistente' };
        await conn.query(
            `UPDATE CONVITE_TRANSFERENCIA_SUPERUSUARIO SET usadoEm = CURRENT_TIMESTAMP
             WHERE idTransferencia = ?`,
            [convite.idTransferencia]
        );
        await conn.query(
            `UPDATE CONVITE_TRANSFERENCIA_SUPERUSUARIO SET revogado = TRUE
             WHERE idOrganizacao = ? AND idTransferencia <> ? AND usadoEm IS NULL`,
            [convite.idOrganizacao, convite.idTransferencia]
        );
        return { status: 'sucesso' };
    });
}

module.exports = {
    criarOrganizacaoEConvite,
    buscarConviteValido,
    cadastrarSuperusuarioPorConvite,
    buscarSuperusuarioPorEmail,
    confirmarEmailSuperusuario,
    revogarConvitesPendentes,
    gerarNovoConvite,
    cancelarContrato,
    reativarOrganizacao,
    bloquearTransicaoExpirada,
    criarConviteTransferenciaSuperusuario,
    buscarConviteTransferenciaValido,
    concluirTransferenciaSuperusuario
};
