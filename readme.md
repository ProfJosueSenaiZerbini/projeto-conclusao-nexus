# SafeZone — Sistema de Registro e Gerenciamento de Denúncias

O **SafeZone** é uma aplicação web desenvolvida como Trabalho de Conclusão de Curso (TCC). O sistema permite que cidadãos registrem e acompanhem denúncias sobre problemas e ocorrências em localidades atendidas por organizações. Fiscais e superusuários gerenciam as demandas de acordo com suas permissões e áreas de atendimento.

## Equipe

- **Scrum Master:** Yuri Cristhian R. dos Anjos
- **Desenvolvedor:** Felipe Costa Nogueira
- **Desenvolvedor:** Rafael Enrique Gentil Veiga
- **Desenvolvedora:** Jullya de Freitas Carvalho

## Funcionalidades

### Cidadão
- Cadastro e autenticação.
- Dashboard com denúncias recentes.
- Registro de denúncias com categoria, título, descrição, data da ocorrência, endereço e visibilidade identificada ou anônima.
- Anexação de imagens e vídeos como evidências.
- Consulta aos detalhes, evidências e histórico de andamento.
- Acompanhamento do status da denúncia.
- Conversa vinculada à denúncia, conforme as permissões de acesso.
- Consulta de notificações e marcação de notificações como lidas.
- Acesso ao feed de denúncias.

### Fiscal
- Acesso ao painel administrativo e às denúncias relacionadas às localidades atribuídas ao fiscal.
- Atribuição de uma denúncia a si mesmo.
- Alteração do status e da prioridade das denúncias sob sua responsabilidade.
- Consulta aos detalhes, evidências e histórico.
- Comunicação com o cidadão por meio da conversa da denúncia.
- Recebimento e consulta de notificações.
- Acesso bloqueado quando o cadastro do fiscal está desativado.

### Superusuário
- Acesso ao painel administrativo da organização.
- Cadastro de fiscais com nome, CPF, e-mail e senha.
- Desativação e reatribuição de fiscais.
- Gerenciamento das localidades atendidas.
- Acompanhamento das denúncias relacionadas às localidades atendidas pela equipe.
- Gerenciamento das operações administrativas permitidas ao perfil.

### Organização e administração
- Cadastro de organização.
- Geração de convite para criação do superusuário.
- Cadastro do superusuário por meio de link de convite.
- Confirmação de e-mail do superusuário por link.
- Associação de categorias de denúncia à organização, conforme a estrutura do banco de dados.
- Convite para transferência da responsabilidade de superusuário, conforme os recursos previstos no banco e nas telas do projeto.

> **Limitação atual:** o fluxo de convite e confirmação disponibiliza links para teste na aplicação. O envio automático de e-mails não está implementado; portanto, o link precisa ser utilizado/copiado pelo fluxo disponível no sistema.

## Tecnologias e dependências

- **Node.js** — ambiente de execução JavaScript.
- **Express 5** — servidor HTTP e roteamento.
- **EJS** — renderização das páginas no servidor.
- **MariaDB** — banco de dados relacional, acessado pelo driver `mariadb`.
- **express-session** — gerenciamento de sessões.
- **bcrypt** — hash de senhas.
- **Multer** — recebimento e armazenamento de arquivos enviados nas denúncias.
- **Morgan** — registro de requisições HTTP.
- **dotenv** — carregamento das variáveis de ambiente.
- **HTML, CSS e JavaScript** — interface e interações no navegador.
- **Nominatim / OpenStreetMap** — serviço utilizado na geocodificação de endereços.

As versões das dependências estão definidas em `package.json` e `package-lock.json`.

## Estrutura do projeto

```text
projeto-conclusao-nexus/
├── controllers/                  # Controladores das funcionalidades
├── db/                           # Pool de conexão e transações com o banco
├── Docs/
│   ├── Banco de dados/           # Modelos e dicionário de dados
│   ├── Diagramas/                # Diagramas do sistema
│   ├── Scripts Banco Dados/      # Script SQL de criação do banco
│   ├── Testes/                   # Planilhas de casos e testes funcionais
│   └── Wireframes/               # Protótipos das telas
├── middlewares/                  # Autenticação, autorização e upload
├── models/                       # Consultas e operações no banco
├── public/
│   ├── css/                      # Folhas de estilo
│   ├── img/                      # Imagens da interface
│   ├── js/                       # Scripts do navegador
│   └── uploads/                  # Arquivos enviados nas denúncias
├── routes/                       # Definição das rotas
├── scripts/                      # Scripts auxiliares
├── services/                     # Serviços reutilizáveis
├── views/                        # Páginas e parciais EJS
├── .env.example                  # Modelo das variáveis de ambiente
├── package.json
├── package-lock.json
├── readme.md
└── server.js                     # Configuração e inicialização do servidor
```

## Requisitos

Antes de executar o projeto, tenha instalado:

- [Node.js](https://nodejs.org/) (com npm).
- [MariaDB](https://mariadb.org/).
- [Git](https://git-scm.com/), caso vá clonar o repositório.

## Instalação e configuração

### 1. Obter o projeto

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-nexus.git
cd projeto-conclusao-nexus
```

Se você já possui os arquivos do projeto, abra o terminal na pasta que contém o `package.json`.

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar o banco de dados

1. Inicie o serviço do MariaDB.
2. Abra o gerenciador de banco de dados de sua preferência, como HeidiSQL, DBeaver ou MySQL Workbench.
3. Abra o arquivo `Docs/Scripts Banco Dados/sistemaDenuncia.sql`.
4. Execute o script para criar o banco `sistema_denuncia` e suas tabelas.
5. Confirme se a criação foi concluída sem erros.

O script SQL do projeto é a referência para a estrutura do banco. Se já existir um banco com informações, faça um backup antes de executar scripts que possam alterar sua estrutura ou seus dados.

### 4. Configurar as variáveis de ambiente

Na raiz do projeto, crie um arquivo chamado `.env` e preencha as variáveis abaixo com os dados do seu ambiente:

```env
PORTA=coloque_sua_porta
DBHOST=coloque_seu_host
DBUSER=coloque_seu_user
DBNAME=coloque_o_nome_do_seu_banco
DBPASS=sua_senha_do_banco
SESSION_SECRET=gere_uma_chave_secreta_forte
```

- `PORTA`: porta utilizada pelo servidor. Deve ser um número inteiro entre 1 e 65535.
- `DBHOST`: endereço do servidor MariaDB.
- `DBUSER`: usuário do banco de dados.
- `DBNAME`: nome do banco; no script do projeto, `sistema_denuncia`.
- `DBPASS`: senha do usuário do banco.
- `SESSION_SECRET`: chave utilizada para assinar a sessão.

O servidor valida `PORTA` e `SESSION_SECRET` durante a inicialização. As configurações de conexão com o banco são utilizadas pelo pool do driver `mariadb`.

**Segurança:** não compartilhe o `.env` nem envie credenciais reais ao repositório. O arquivo `.env.example` é apenas um modelo.

### 5. Iniciar a aplicação

Modo de desenvolvimento:

```bash
npm run dev
```

Inicialização pelo script padrão:

```bash
npm start
```

Os dois scripts executam `node server.js`. Após a inicialização, acesse:

```text
http://localhost:3000/login
```

Se você definiu outra porta em `PORTA`, substitua `3000` pela porta configurada.

## Principais rotas

As rotas abaixo são registradas em `server.js`. Algumas exigem sessão autenticada e perfil autorizado.

| Caminho | Método(s) | Finalidade |
|---|---|---|
| `/` | GET | Redireciona para o login |
| `/login` | GET, POST | Exibe a tela e processa a autenticação |
| `/login/logout` | POST | Encerra a sessão |
| `/cadastro` | GET, POST | Cadastro de cidadão |
| `/dashboardUsuario` | GET | Dashboard do cidadão |
| `/denunciaUsuario` | GET, POST | Formulário e registro de denúncia |
| `/denunciaAdm` | GET | Listagem administrativa de denúncias |
| `/denunciaAdm/:id/atribuir` | POST | Fiscal atribui a denúncia a si mesmo |
| `/denunciaAdm/:id/status` | POST | Atualiza o status de uma denúncia |
| `/denunciaAdm/:id/prioridade` | POST | Atualiza a prioridade de uma denúncia |
| `/denunciaDetalhe/:id` | GET | Exibe os detalhes da denúncia |
| `/denunciaDetalhe/:id/mensagem` | POST | Envia mensagem na conversa da denúncia |
| `/notificacoes` | GET | Lista notificações |
| `/notificacoes/:id/marcar-lida` | POST | Marca uma notificação como lida |
| `/notificacoes/marcar-todas-lidas` | POST | Marca todas as notificações como lidas |
| `/notificacoes/nao-lidas` | GET | Consulta notificações não lidas |
| `/feedDenuncia` | GET | Exibe o feed de denúncias |
| `/dashboardAdmin` | GET | Painel administrativo |
| `/gerenciarFiscais` | GET | Lista e gerencia fiscais |
| `/gerenciarFiscais/cadastro` | POST | Cadastra fiscal |
| `/gerenciarFiscais/:id/desativar` | POST | Desativa fiscal |
| `/gerenciarFiscais/:id/reatribuir` | POST | Reatribui fiscal |
| `/organizacao/cadastro` | GET, POST | Cadastro de organização |
| `/organizacao/convite/:token` | GET, POST | Cadastro do superusuário por convite |
| `/organizacao/confirmar-email/:token` | GET | Confirma e-mail do superusuário |
| `/organizacao/localidades` | GET, POST | Lista e cadastra localidades |
| `/organizacao/localidades/:id/remover` | POST | Remove uma localidade, se não houver vínculos que impeçam a operação |

O endereço `/denuncias` também é aceito como redirecionamento para `/denunciaAdm`.

## Banco de dados

O banco utilizado é `sistema_denuncia`. O script de criação está em `Docs/Scripts Banco Dados/sistemaDenuncia.sql`.

Principais tabelas:

| Tabela | Finalidade |
|---|---|
| `ORGANIZACAO` | Cadastro das organizações |
| `ORGANIZACAO_LOCALIDADE` | Relação entre organizações e localidades |
| `LOCALIDADE` | Bairros, cidades e estados atendidos |
| `ORGANIZACAO_TIPO_DENUNCIA` | Categorias de denúncia associadas às organizações |
| `SUPERUSUARIO` | Responsáveis administrativos das organizações |
| `CONVITE_SUPERUSUARIO` | Convites para cadastro de superusuário |
| `CONVITE_TRANSFERENCIA_SUPERUSUARIO` | Convites de transferência de responsabilidade |
| `USUARIO` | Cadastro dos cidadãos |
| `FISCAL` | Cadastro e situação dos fiscais |
| `FISCAL_LOCALIDADE` | Relação entre fiscais e localidades atendidas |
| `LOCALIZACAO` | Endereço e coordenadas da ocorrência |
| `DENUNCIA` | Denúncias registradas e seus dados de acompanhamento |
| `EVIDENCIA` | Evidências anexadas às denúncias |
| `HISTORICO_DENUNCIA` | Histórico das alterações das denúncias |
| `MENSAGEM_DENUNCIA` | Mensagens vinculadas às denúncias |
| `NOTIFICACAO` | Notificações destinadas aos perfis do sistema |

A estrutura completa, incluindo colunas, relacionamentos, índices e restrições, deve ser consultada diretamente no script SQL.

## Upload de evidências

O envio de arquivos nas denúncias utiliza Multer. O middleware `middlewares/uploadDenuncia.js`:

- aceita arquivos de imagem e vídeo;
- permite até 10 arquivos por envio;
- limita cada arquivo a 20 MB;
- armazena os arquivos em `public/uploads/`.

Garanta que o processo do Node.js tenha permissão de escrita nessa pasta. Os arquivos enviados ficam armazenados no diretório público da aplicação.

## Geocodificação de localidades

O projeto possui o script `scripts/geocodificarLocalizacoes.js`, que utiliza o serviço Nominatim do OpenStreetMap para buscar coordenadas de registros de localização que ainda não possuem latitude ou longitude.

Para executar manualmente, a partir da raiz do projeto:

```bash
node scripts/geocodificarLocalizacoes.js
```

A execução depende de conexão com a internet e de uma configuração válida de acesso ao banco no `.env`. O cadastro de denúncia também aciona a geocodificação da localização em segundo plano.

## Testes

O repositório contém materiais de apoio aos testes em `Docs/Testes/`, incluindo planilhas de casos de teste e testes funcionais.

**Atenção:** no `package.json`, o comando `npm test` ainda é provisório e termina com erro (`Error: no test specified`). Portanto, ele não executa uma suíte automatizada. Consulte as planilhas em `Docs/Testes/` para os procedimentos de teste disponíveis e registre os resultados da execução.

## Solução de problemas

### O servidor não inicia
- Confira se o arquivo `.env` está na raiz do projeto.
- Verifique se `PORTA` contém um número válido.
- Confirme se `SESSION_SECRET` está preenchida.
- Consulte a mensagem apresentada no terminal.

### Erro de conexão com o banco
- Confirme se o serviço MariaDB está iniciado.
- Verifique `DBHOST`, `DBUSER`, `DBPASS` e `DBNAME`.
- Confirme se o banco `sistema_denuncia` foi criado.
- Verifique se o usuário configurado possui permissão de acesso.

### Erro ao enviar evidências
- Confira se a pasta `public/uploads/` existe e permite gravação.
- Envie apenas imagens ou vídeos.
- Respeite o limite de 10 arquivos e 20 MB por arquivo.

### Página não encontrada ou acesso negado
- Confira o endereço acessado.
- Verifique se a rota está registrada em `server.js`.
- Confirme se você está autenticado com o perfil correto.
- Verifique se o fiscal está ativo e se possui a localidade necessária para acessar a denúncia.

## Projeto acadêmico

O SafeZone foi desenvolvido como Trabalho de Conclusão de Curso (TCC), com o propósito de aplicar conhecimentos de desenvolvimento web, banco de dados, arquitetura de aplicações, controle de acesso e gerenciamento de demandas.
