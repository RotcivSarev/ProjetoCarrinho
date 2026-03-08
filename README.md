Como executar o projeto
1. Clonar o repositório:

git clone https://github.com/seu-usuario/seu-repositorio.git

2. Entrar na pasta da API:
cd backend/ShoppingCartApi

3. Restaurar dependências:
dotnet restore

4. Criar o banco de dados:
dotnet ef migrations add InitialCreate

dotnet ef database update

6. Rodar a API:

dotnet run

A API ficará disponível em: http://127.0.0.1:5500/ProjetoCarrinho/frontend/index.html
