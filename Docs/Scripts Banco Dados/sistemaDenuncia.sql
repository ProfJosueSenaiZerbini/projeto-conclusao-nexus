CREATE DATABASE IF NOT EXISTS sistema_denuncia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_denuncia;

-- 1. ORGANIZACAO 
CREATE TABLE ORGANIZACAO (
    idOrganizacao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    emailContato VARCHAR(255) NOT NULL,

    status ENUM(
        'pendente',
        'ativa',
        'em_transicao',
        'bloqueada',
        'inativa'
    ) NOT NULL DEFAULT 'pendente',

    statusContrato ENUM(
        'pendente',
        'ativo',
        'cancelado',
        'encerrado'
    ) NOT NULL DEFAULT 'pendente',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inicioContrato DATETIME NULL,
    fimContrato DATETIME NULL,
    fimPeriodoTransicao DATETIME NULL
);

-- 1.1 ORGANIZACAO_LOCALIDADE 
CREATE TABLE ORGANIZACAO_LOCALIDADE (
    id INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_org_localidade_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_org_localidade_cidade_estado
        UNIQUE (cidade, estado),

    INDEX idx_org_localidade_organizacao (idOrganizacao)
);

-- 1.2 LOCALIDADE
-- Cadastro independente de organização.
CREATE TABLE LOCALIDADE (
    idLocalidade INT PRIMARY KEY AUTO_INCREMENT,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_localidade_cidade_estado
        UNIQUE (cidade, estado),

    INDEX idx_localidade_cidade_estado (cidade, estado)
);

-- 2. ORGANIZACAO_TIPO_DENUNCIA
CREATE TABLE ORGANIZACAO_TIPO_DENUNCIA (
    tipoDenuncia VARCHAR(100) PRIMARY KEY,
    idOrganizacao INT NOT NULL,

    CONSTRAINT fk_tipo_denuncia_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_tipo_organizacao (idOrganizacao)
);

-- 3. SUPERUSUARIO
CREATE TABLE SUPERUSUARIO (
    idSuperusuario INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    emailConfirmado BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM(
        'pendente',
        'ativo',
        'desativado'
    ) NOT NULL DEFAULT 'pendente',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataConfirmacaoEmail DATETIME NULL,
    tokenConfirmacaoHash CHAR(64) NULL UNIQUE,
    tokenConfirmacaoExpiraEm DATETIME NULL,

    CONSTRAINT fk_superusuario_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT
);

-- 4. CONVITE_SUPERUSUARIO
CREATE TABLE CONVITE_SUPERUSUARIO (
    idConvite INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    emailResponsavel VARCHAR(255) NOT NULL,
    tokenHash CHAR(64) NOT NULL UNIQUE,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiraEm DATETIME NOT NULL,
    usadoEm DATETIME NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_convite_superusuario_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_convite_email (emailResponsavel),
    INDEX idx_convite_validade (expiraEm, usadoEm, revogado)
);

-- 5. CONVITE_TRANSFERENCIA_SUPERUSUARIO
CREATE TABLE CONVITE_TRANSFERENCIA_SUPERUSUARIO (
    idTransferencia INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    nomeResponsavel VARCHAR(255) NOT NULL,
    emailResponsavel VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    tokenHash CHAR(64) NOT NULL UNIQUE,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiraEm DATETIME NOT NULL,
    usadoEm DATETIME NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_transferencia_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_transferencia_validade (expiraEm, usadoEm, revogado)
);

-- 6. USUARIO
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- 7. FISCAL
CREATE TABLE FISCAL (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(18) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    idOrganizacao INT NULL,

    status ENUM(
        'ativo',
        'desativado'
    ) NOT NULL DEFAULT 'ativo',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataDesativacao DATETIME NULL,

    CONSTRAINT fk_fiscal_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_fiscal_organizacao (idOrganizacao),
    INDEX idx_fiscal_status (status)
);

-- 7.1 FISCAL_LOCALIDADE
-- Define em quais localidades cada fiscal trabalha.
CREATE TABLE FISCAL_LOCALIDADE (
    idFiscal INT NOT NULL,
    idLocalidade INT NOT NULL,
    dataAtribuicao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (idFiscal, idLocalidade),

    CONSTRAINT fk_fl_fiscal
        FOREIGN KEY (idFiscal)
        REFERENCES FISCAL(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_fl_localidade
        FOREIGN KEY (idLocalidade)
        REFERENCES LOCALIDADE(idLocalidade)
        ON DELETE CASCADE,

    INDEX idx_fl_localidade (idLocalidade)
);

-- 8. LOCALIZACAO
CREATE TABLE LOCALIZACAO (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,

    INDEX idx_localizacao_cidade_estado (cidade, estado)
);

-- 9. DENUNCIA
-- A organização é vinculada automaticamente pela categoria.
CREATE TABLE DENUNCIA (
    idDenuncia INT PRIMARY KEY AUTO_INCREMENT,
    idUsuario INT NOT NULL,

    titulo VARCHAR(100) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    dataOcorrencia DATE NULL,

    visibilidade VARCHAR(20) NOT NULL DEFAULT 'anonimo',

    status VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,

    dataAbertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    idLocalizacao INT NOT NULL UNIQUE,
    idLocalidade INT NULL,
    fiscal_id INT NULL,
    idOrganizacao INT NULL,

    CONSTRAINT fk_denuncia_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    CONSTRAINT fk_denuncia_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id),

    CONSTRAINT fk_denuncia_localizacao
        FOREIGN KEY (idLocalizacao)
        REFERENCES LOCALIZACAO(idLocalizacao),

    CONSTRAINT fk_denuncia_localidade
        FOREIGN KEY (idLocalidade)
        REFERENCES LOCALIDADE(idLocalidade)
        ON DELETE RESTRICT,

    CONSTRAINT fk_denuncia_fiscal
        FOREIGN KEY (fiscal_id)
        REFERENCES FISCAL(id)
        ON DELETE SET NULL,

    INDEX idx_denuncia_organizacao (idOrganizacao),
    INDEX idx_denuncia_localidade (idLocalidade),
    INDEX idx_denuncia_fiscal (fiscal_id),
    INDEX idx_denuncia_usuario (idUsuario),
    INDEX idx_denuncia_status (status),
    INDEX idx_denuncia_tipo (tipo),
    INDEX idx_denuncia_data (dataAbertura)
);

-- 10. EVIDENCIA
CREATE TABLE EVIDENCIA (
    idEvidencia INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    tipoEvidencia VARCHAR(50) NOT NULL,
    fotoVideoAudio LONGBLOB NULL,
    dadosEvidencia TEXT NULL,

    CONSTRAINT fk_evidencia_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    INDEX idx_evidencia_denuncia (idDenuncia)
);

-- 11. NOTIFICACAO
-- Inclui controle de notificações lidas e não lidas.
CREATE TABLE NOTIFICACAO (
    idNotificacao INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    conteudo TEXT NOT NULL,

    lida TINYINT(1) NOT NULL DEFAULT 0,

    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id)
        ON DELETE CASCADE,

    INDEX idx_notificacao_usuario (idUsuario),
    INDEX idx_notificacao_lida (lida),
    INDEX idx_notificacao_data (dataHora)
);

-- 12. HISTORICO_DENUNCIA
CREATE TABLE HISTORICO_DENUNCIA (
    idHistorico INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    dataRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historico_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    INDEX idx_historico_denuncia (idDenuncia),
    INDEX idx_historico_data (dataRegistro)
);

-- 13. MENSAGEM_DENUNCIA
CREATE TABLE MENSAGEM_DENUNCIA (
    idMensagem INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    texto TEXT NOT NULL,
    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensagem_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensagem_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id)
        ON DELETE CASCADE,

    INDEX idx_mensagem_denuncia (idDenuncia),
    INDEX idx_mensagem_usuario (idUsuario)
);