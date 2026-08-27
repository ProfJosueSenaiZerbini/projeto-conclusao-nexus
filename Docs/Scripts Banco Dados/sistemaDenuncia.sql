CREATE DATABASE sistema_denuncia;
USE sistema_denuncia;

----- TABELA USUARIO -----
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

----- TABELA FISCAL -----
CREATE TABLE FISCAL (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    registroProfissional VARCHAR(100) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL
);

----- TABELA LOCALIZACAO -----
CREATE TABLE LOCALIZACAO (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL, -- Ex: 'Manual' ou 'Auto'
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

----- TABELA DENUNCIA -----
CREATE TABLE DENUNCIA (
    idDenuncia INT PRIMARY KEY AUTO_INCREMENT,
    idUsuario INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    dataAbertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    idLocalizacao INT NOT NULL UNIQUE, 
    fiscal_id INT NULL, -- Pode ser NULL até que um fiscal seja atribuído

    CONSTRAINT fk_denuncia_usuario 
        FOREIGN KEY (idUsuario) REFERENCES USUARIO(id),
        
    CONSTRAINT fk_denuncia_localizacao 
        FOREIGN KEY (idLocalizacao) REFERENCES LOCALIZACAO(idLocalizacao),
        
    CONSTRAINT fk_denuncia_fiscal 
        FOREIGN KEY (fiscal_id) REFERENCES FISCAL(id)
        ON DELETE SET NULL
);

----- TABELA EVIDENCIA -----
CREATE TABLE EVIDENCIA (
    idEvidencia INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    tipoEvidencia VARCHAR(50) NOT NULL,
    fotoVideoAudio LONGBLOB, -- Ou VARCHAR(255) se for armazenar o caminho/URL do arquivo
    dadosEvidencia TEXT,

    CONSTRAINT fk_evidencia_denuncia 
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE
);

----- TABELA NOTIFICACAO -----
CREATE TABLE NOTIFICACAO (
    idNotificacao INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    conteudo TEXT NOT NULL,
    dataHora DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_denuncia 
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_notificacao_usuario 
        FOREIGN KEY (idUsuario) REFERENCES USUARIO(id)
        ON DELETE CASCADE
);