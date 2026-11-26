# SafeZone — Sistema de Registro e Gerenciamento de Denúncias

Sistema web desenvolvido como Trabalho de Conclusão de Curso (TCC) para o registro, acompanhamento e gerenciamento de denúncias relacionadas a problemas e ocorrências em locais públicos.

A plataforma organiza o atendimento das denúncias por organização e localidade, permitindo que cidadãos acompanhem seus registros e que fiscais e superusuários autorizados realizem o gerenciamento das demandas.

---

## Equipe

- **Scrum Master:** Yuri Cristhian R. dos Anjos
- **Desenvolvedor:** Felipe Costa Nogueira
- **Desenvolvedor:** Rafael Enrique Gentil Veiga
- **Desenvolvedora:** Jullya de Freitas Carvalho

## Funcionalidades do sistema

### Cidadão
- Cadastro e autenticação de usuários.
- Acesso ao dashboard com denúncias recentes.
- Visualização dos detalhes de uma denúncia.
- Acompanhamento do status e do histórico de andamento.
- Consulta de notificações e controle de notificações lidas.
- Envio e consulta de mensagens na conversa vinculada à denúncia, respeitando as permissões de acesso.
- Visualização de evidências associadas à denúncia.
- Suporte à identificação ou anonimato do cidadão na visualização da denúncia.

### Fiscal
- Acesso às denúncias dentro das localidades atendidas.
- Atribuição de uma denúncia ao próprio fiscal.
- Alteração do status e da prioridade das denúncias autorizadas.
- Consulta aos detalhes, evidências e histórico.
- Comunicação com o cidadão pelo chat da denúncia.
- Recebimento e gerenciamento de notificações.

### Superusuário da organização
- Gerenciamento das localidades atendidas pela organização.
- Cadastro, desativação e reatribuição de fiscais.
- Acompanhamento das denúncias relacionadas à sua equipe.
- Acesso às funcionalidades administrativas conforme as permissões da conta.

### Organização
- Cadastro de organização e criação de convite para o superusuário.
- Cadastro do superusuário por convite.
- Confirmação de e-mail por link de confirmação.
- Associação de categorias de denúncia às organizações por meio da tabela `ORGANIZACAO_TIPO_DENUNCIA`.

> **Observação:** no código atual, o fluxo de convite e confirmação gera links de teste no ambiente diferente de produção. O envio automático de e-mails ainda não está implementado.

## Tecnologias utilizadas

- **Node.js** — ambiente de execução JavaScript.
- **Express** — servidor e gerenciamento de rotas.
- **EJS** — renderização das páginas.
- **MariaDB** — banco de dados relacional.
- **express-session** — gerenciamento de sessões.
- **bcrypt** — recursos de hash de senhas.
- **Multer** — middleware disponível no projeto para recebimento de arquivos.
- **Morgan** — registro de requisições HTTP.
- **dotenv** — leitura das variáveis de ambiente.
- **HTML, CSS e JavaScript** — estrutura, aparência e interações das páginas.

## Estrutura do projeto

```text
projeto-conclusao-nexus/
├── controllers/       # Regras de controle das funcionalidades
├── db/                # Conexão e transações com o banco de dados
├── Docs/              # Documentação, diagramas, wireframes e SQL
│   └── Scripts Banco Dados/
│       └── sistemaDenuncia.sql
├── middlewares/       # Autenticação e controle de acesso
├── models/            # Consultas e operações no banco de dados
├── public/            # Arquivos estáticos: CSS, JavaScript e uploads
├── routes/            # Rotas da aplicação
├── scripts/           # Scripts auxiliares
├── services/          # Serviços reutilizáveis
├── views/             # Páginas e componentes EJS
├── .env.example       # Modelo das variáveis de ambiente
├── package.json
├── readme.md
└── server.js          # Inicialização do servidor
```

## Requisitos para executar

Antes de iniciar, instale:

- [Node.js](https://nodejs.org/) e npm.
- [MariaDB](https://mariadb.org/) ou MySQL compatível.
- Git, caso deseje clonar o repositório.

## Instalação e configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-nexus.git
```

### 2. Entrar na pasta do projeto

```bash
cd projeto-conclusao-nexus
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Criar o banco de dados

1. Abra seu gerenciador de banco de dados (por exemplo, HeidiSQL, DBeaver ou MySQL Workbench).
2. Abra o arquivo `Docs/Scripts Banco Dados/sistemaDenuncia.sql`.
3. Execute o script para criar o banco `sistema_denuncia` e suas tabelas.
4. Confira se o banco e as tabelas foram criados corretamente.

O script SQL é a referência da estrutura do banco utilizada pelo projeto. Caso já exista um banco com dados, faça um backup antes de executar novamente qualquer script de criação.

### 5. Configurar as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto, usando o `.env.example` como modelo:

```env
PORTA=coloque_sua_porta
DBHOST=coloque_seu_hospedeiro
DBUSER=coloque_seu_usuario
DBNAME=coloque_o_nome_do_seu_banco
DBPASS=sua_senha_do_banco
SESSION_SECRET=coloque_uma_chave_secreta_forte
```

Ajuste `DBHOST`, `DBUSER` e `DBPASS` conforme a configuração do MariaDB/MySQL instalado na máquina.

**Importante:**
- Não compartilhe o arquivo `.env`.
- Não envie senhas ou chaves secretas para o GitHub.
- O arquivo `.env.example` serve apenas como modelo; as credenciais reais devem ficar no `.env`.
- A aplicação utiliza `PORTA` e `SESSION_SECRET` para iniciar o servidor e configurar as sessões. As variáveis `DBHOST`, `DBUSER`, `DBNAME` e `DBPASS` são utilizadas na conexão com o banco.

### 6. Iniciar o sistema

Para iniciar em ambiente de desenvolvimento:

```bash
npm run dev
```

Para iniciar usando o script de produção definido no projeto:

```bash
npm start
```

Quando o servidor iniciar corretamente, acesse:

```text
http://localhost:3000/login
```

Se você configurar uma porta diferente em `PORTA`, substitua `3000` pela porta escolhida.

## Principais rotas

| Caminho | Finalidade |
|---|---|
| `/` | Redireciona para o login |
| `/login` | Tela e fluxo de autenticação |
| `/cadastro` | Cadastro de cidadão |
| `/dashboardUsuario` | Dashboard do cidadão |
| `/denunciaUsuario` | Área de denúncias do cidadão |
| `/denunciaAdm` | Gerenciamento administrativo de denúncias |
| `/denunciaDetalhe/:id` | Detalhes de uma denúncia |
| `/notificacoes` | Listagem e gerenciamento de notificações |
| `/feedDenuncia` | Feed de denúncias |
| `/dashboardAdmin` | Dashboard administrativo |
| `/gerenciarFiscais` | Gerenciamento de fiscais |
| `/organizacao/cadastro` | Cadastro de organização |
| `/organizacao/localidades` | Gerenciamento de localidades da organização |

Algumas rotas exigem autenticação e perfil autorizado. A disponibilidade de cada operação depende da sessão e das regras de acesso implementadas nos middlewares.

## Banco de dados

O banco utilizado pelo projeto é `sistema_denuncia`.

Entre as principais tabelas definidas no script SQL estão:

| Tabela | Responsabilidade |
|---|---|
| `ORGANIZACAO` | Dados das organizações |
| `ORGANIZACAO_LOCALIDADE` | Localidades associadas às organizações |
| `ORGANIZACAO_TIPO_DENUNCIA` | Categorias de denúncia associadas às organizações |
| `LOCALIDADE` | Cidades e estados atendidos |
| `USUARIO` | Cadastro dos cidadãos |
| `SUPERUSUARIO` | Responsáveis pelas organizações |
| `FISCAL` | Cadastro e situação dos fiscais |
| `FISCAL_LOCALIDADE` | Relação entre fiscais e localidades atendidas |
| `LOCALIZACAO` | Endereço e coordenadas da ocorrência |
| `DENUNCIA` | Registro e situação das denúncias |
| `EVIDENCIA` | Arquivos e dados de evidências |
| `HISTORICO_DENUNCIA` | Registro das atualizações da denúncia |
| `MENSAGEM_DENUNCIA` | Mensagens entre cidadão e fiscal |
| `NOTIFICACAO` | Notificações destinadas aos usuários do sistema |
| `CONVITE_SUPERUSUARIO` | Convites para cadastro de superusuários |
| `CONVITE_TRANSFERENCIA_SUPERUSUARIO` | Convites de transferência de responsabilidade |

A estrutura completa, incluindo chaves estrangeiras, índices e restrições, está em `Docs/Scripts Banco Dados/sistemaDenuncia.sql`.

## Script auxiliar de geocodificação

O projeto possui o script `scripts/geocodificarLocalizacoes.js`, que consulta o serviço Nominatim do OpenStreetMap para buscar coordenadas de registros da tabela `LOCALIZACAO` que ainda não possuem latitude ou longitude.

Execute-o a partir da raiz do projeto:

```bash
node scripts/geocodificarLocalizacoes.js
```

Esse procedimento depende de conexão com a internet e de acesso ao banco de dados configurado no `.env`. O script aguarda entre as consultas para respeitar o serviço utilizado.

## Testes funcionais

Os testes funcionais devem verificar os fluxos de cadastro, autenticação, denúncias, permissões, gerenciamento administrativo, histórico, chat e notificações.

Registre para cada caso:
- Pré-condições e dados utilizados.
- Passos executados.
- Resultado esperado e resultado observado.
- Data e responsável pela execução.
- Status: `PASSOU`, `FALHOU`, `BLOQUEADO` ou `NÃO EXECUTADO`.

**Atenção:** o script `npm test` do `package.json` ainda é apenas um comando provisório e não executa uma suíte automatizada. Os testes funcionais precisam ser executados e registrados separadamente até que uma ferramenta de testes automatizados seja configurada.

## Solução de problemas

### Erro de conexão com o banco
- Confira se o serviço MariaDB/MySQL está iniciado.
- Confira `DBHOST`, `DBUSER`, `DBPASS` e `DBNAME` no `.env`.
- Confirme se o banco `sistema_denuncia` foi criado.
- Verifique se o usuário do banco possui permissão de acesso.

### Erro informando que uma variável não está definida
- Confirme se o arquivo `.env` está na raiz do projeto.
- Confira se `PORTA` e `SESSION_SECRET` estão preenchidas.
- Reinicie o servidor após alterar o arquivo.

### Página não encontrada
- Confira o caminho digitado.
- Verifique se a rota está registrada em `server.js`.
- Confira se o perfil conectado possui permissão para acessar a funcionalidade.

## Projeto de TCC

Projeto acadêmico desenvolvido como Trabalho de Conclusão de Curso (TCC), com o objetivo de aplicar conhecimentos de desenvolvimento web, banco de dados, organização de software e gerenciamento de demandas.
