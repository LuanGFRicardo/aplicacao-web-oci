# Portal de Cadastro - Backend e Frontend

Este projeto é uma aplicação de portal de cadastro com autenticação e controle de acesso baseado em funções (RBAC). Ele contém um backend em **Node.js** com **MySQL** e um frontend em **React**.

## Requisitos

- **Node.js** (versão 14 ou superior)
- **MySQL** (ou container Docker com MySQL)
- **React** (para o frontend)
- **Docker** (opcional, caso queira rodar MySQL via container)

## Rodando o Projeto

### Configuração do Ambiente

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/usuário/repositório.git
   cd repositório
   ```

2. **Configure as variáveis de ambiente**  
   Crie um arquivo `.env` na raiz do projeto e defina as variáveis conforme necessário, abaixo está configurado para o container Docker:

   ```env
   DB_USER=test
   DB_PASSWORD=test
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=test

   JWT_SECRET=test
   PORT=3001
   ```

   - **DB_HOST**: Nome do host do banco de dados (se estiver usando o MySQL via Docker, use `db`).
   - **DB_USER** e **DB_PASSWORD**: Credenciais para o banco de dados.
   - **DB_NAME**: Nome do banco de dados que será usado (ex: `test`).
   - **JWT_SECRET**: Chave secreta para o JWT.
   - **PORT**: Porta que o backend irá rodar.

### Rodando o Backend

1. **Instale as dependências do backend:**

   ```bash
   cd backend
   npm install
   ```

2. **Crie o banco de dados no MySQL** (se não estiver usando Docker, configure seu banco manualmente):

   **Banco de dados MySQL:**
   - Certifique-se de que o MySQL está rodando e o banco de dados está configurado corretamente.
   - Caso use o Docker, você pode rodar o comando abaixo para levantar o container:

   ```bash
   docker-compose up -d
   ```
   - Utilize os comandos de aplicacao-web-oci/script.db em sua MySQL local ou após gerar o container.

3. **Rodar o Backend:**

   Dentro da pasta do backend, execute:

   ```bash
   node index.js
   ```

   Isso irá iniciar o servidor na porta 3001 (ou qualquer outra porta definida no arquivo `.env`).

   - A API estará acessível em: `http://localhost:3001`.

### Rodando o Frontend

1. **Instale as dependências do frontend:**

   No diretório do frontend, execute:

   ```bash
   cd frontend
   npm install
   ```

2. **Rodar o Frontend:**

   Após instalar as dependências, execute o comando abaixo para iniciar o servidor de desenvolvimento:

   ```bash
   npm start
   ```

   O frontend será acessível em: `http://localhost:3000`.

### Testando as APIs

Após rodar o backend, você pode testar as rotas de login, registro, e outras diretamente no frontend ou usando uma ferramenta como o **Postman**.

**Exemplo de login:**
- URL: `http://localhost:3001/login`
- Método: `POST`
- Corpo da requisição (JSON):

   ```json
   {
     "email": "admin@gmail.com",
     "senha": "senha_do_admin"
   }
   ```

Se as credenciais estiverem corretas, o servidor retornará um **token JWT**. Guarde este token para usá-lo em futuras requisições autenticadas.

### Como Funciona

1. **Autenticação:**  
   O backend usa **JWT** para autenticar os usuários. Ao fazer login, o servidor gera um token e o retorna ao frontend. O frontend deve salvar esse token no **localStorage** e usá-lo para fazer requisições autenticadas.

2. **Controle de Acesso:**  
   O backend tem rotas protegidas com base no papel (role) do usuário. As funções podem ser:
   - **admin**: Acesso total, pode aprovar usuários.
   - **gerente**: Acesso parcial, pode gerenciar usuários dentro de sua empresa.
   - **operador**: Acesso restrito, pode apenas fazer requisições.

3. **Fluxo de Cadastro de Usuário:**  
   - Usuários podem se cadastrar no sistema, mas precisam ser aprovados por um administrador.
   - O administrador pode aprovar os usuários via API (`/aprovar/:id`).

4. **Estrutura do Banco de Dados (MySQL):**  
   - Tabelas essenciais: **usuarios**, **empresas**, etc.
   - O sistema verifica se já existe um administrador, caso contrário, cria um.

---

Esse é um guia direto e conciso de como configurar e rodar o projeto localmente, incluindo as variáveis de ambiente necessárias, o procedimento para rodar o backend e frontend, e o fluxo básico de como o sistema funciona.
