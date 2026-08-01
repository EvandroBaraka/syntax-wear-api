# Plano de Implementação: CRUD de Categorias

Este documento descreve o planejamento para criar o CRUD de categorias e vincular categorias aos produtos existentes.

A implementação seguirá o padrão atual do CRUD de produtos, o documento `docs/PRD-backend.md.md` e as diretrizes de `.github/copilot-instructions.md`.

## Decisões de Domínio

- A relação será 1:N: cada produto pertencerá a uma categoria.
- `Product.categoryId` será obrigatório desde a primeira migration.
- Os produtos existentes serão preservados.
- Uma categoria padrão, como `Sem categoria`, será criada durante a migration para receber os produtos existentes.
- Categorias terão soft delete por meio do campo `active`.
- Ao desativar uma categoria, os produtos vinculados também serão desativados logicamente.
- Todas as rotas continuarão exigindo autenticação via token.
- A autorização específica por `Role.ADMIN` e o namespace `/admin/*` ficam fora desta entrega.
- Não haverá exclusão física de categorias pelo service.

## Etapas

### 1. Schema Prisma, migration e atualização do banco

- Criar o model `Category` em `prisma/schema.prisma` com:
    - `id`;
    - `name`;
    - `slug` único;
    - `description` opcional;
    - `active` para soft delete.
- Adicionar em `Product`:
    - `categoryId Int`;
    - relação obrigatória com `Category`.
- Definir a foreign key e o índice da relação.
- Criar uma migration Prisma que:
    1. crie a tabela `Category`;
    2. crie a categoria padrão `Sem categoria`;
    3. associe os produtos existentes à categoria padrão;
    4. adicione a foreign key;
    5. torne `categoryId` obrigatório.
- Não deletar os dados atuais dos produtos.
- Atualizar `prisma/seed.ts` para criar categorias e produtos já vinculados, de forma idempotente.
- Executar:
    - `npm run prisma:migrate`;
    - `npm run prisma:generate`.
- Não editar manualmente arquivos em `src/generated/prisma`.

### 2. Services e contratos de domínio

- Criar `src/services/categories.service.ts` com operações para:
    - listar categorias ativas;
    - buscar categoria por ID;
    - criar categoria;
    - atualizar categoria;
    - desativar categoria.
- Validar unicidade de slug e existência da categoria.
- Usar uma transação Prisma na desativação para:
    - marcar a categoria como `active: false`;
    - marcar os produtos relacionados como `active: false`.
- Evitar categorias inativas nas listagens padrão.
- Definir buscas por categorias inativas como não encontradas, caso essa seja a regra adotada pelo service.
- Atualizar `src/services/products.service.ts` para:
    - aceitar `categoryId` na criação e alteração;
    - rejeitar categoria inexistente ou inativa;
    - filtrar produtos por `categoryId`;
    - incluir os dados da categoria nas consultas quando fizerem parte do contrato da resposta.
- Atualizar `src/types/index.ts` com:
    - tipos de categoria;
    - `categoryId` em `ProductFilters`;
    - `categoryId` em `CreateProduct`;
    - `categoryId` em `UpdateProduct`.
- Atualizar `src/utils/validators.ts` com schemas Zod para:
    - criação e atualização de categoria;
    - IDs de categoria;
    - filtro `categoryId`.

### 3. Controllers

- Criar `src/controllers/categories.controller.ts` com handlers para:
    - listar categorias;
    - consultar categoria por ID;
    - criar categoria;
    - atualizar categoria;
    - desativar categoria.
- Seguir o padrão de `src/controllers/products.controller.ts` usando:
    - `FastifyRequest`;
    - `FastifyReply`;
    - parse dos validators;
    - `slugify` com `lower`, `strict` e locale `pt`;
    - mensagens novas da API em português.
- Atualizar `src/controllers/products.controller.ts` para:
    - aceitar `categoryId` na criação;
    - aceitar `categoryId` na atualização;
    - validar a associação antes de persistir;
    - preservar a geração automática de slug.
- Encaminhar erros de validação, conflito de slug, categoria inexistente e produto inexistente ao middleware de erro existente.

### 4. Rotas, integração e validação

- Criar `src/routes/categories.routes.ts` com:
    - `GET /categories`;
    - `GET /categories/:id`;
    - `POST /categories`;
    - `PUT /categories/:id`;
    - `DELETE /categories/:id`.
- Registrar as rotas em `src/app.ts` usando o prefixo `/categories`.
- Manter autenticação via token em todas as rotas de categoria e nas rotas de produtos.
- Não introduzir namespace `/admin` nem guard específico de role nesta entrega.
- Atualizar `src/routes/products.routes.ts` para documentar:
    - `categoryId` nos querystrings;
    - `categoryId` nos bodies de criação e atualização;
    - categoria nas respostas;
    - códigos de erro relacionados.
- Adicionar schemas Fastify/OpenAPI às rotas de categoria para:
    - parâmetros;
    - querystrings;
    - bodies;
    - respostas de sucesso;
    - erros 401, 404 e de validação/conflito.
- Validar com:
    - `npm run prisma:generate`;
    - `npm run prisma:migrate`;
    - `npm run build`;
    - `git diff --check`.

## Arquivos Previstos

- `prisma/schema.prisma`
- `prisma/migrations/<nova-migration>/migration.sql`
- `prisma/seed.ts`
- `src/services/categories.service.ts`
- `src/services/products.service.ts`
- `src/controllers/categories.controller.ts`
- `src/controllers/products.controller.ts`
- `src/routes/categories.routes.ts`
- `src/routes/products.routes.ts`
- `src/app.ts`
- `src/types/index.ts`
- `src/utils/validators.ts`

## Cenários de Validação

- Criar, consultar, atualizar e desativar categorias.
- Rejeitar slug duplicado.
- Criar e atualizar produtos com categoria válida.
- Rejeitar categoria inexistente ou inativa.
- Filtrar produtos por `categoryId`.
- Confirmar que os produtos são desativados quando sua categoria é desativada.
- Confirmar resposta `401` para requisições sem token.
- Confirmar que os schemas OpenAPI correspondem aos payloads e respostas reais.
- Confirmar que o seed não cria duplicações nem produtos sem categoria.
- Confirmar que a migration mantém os produtos existentes e aplica `categoryId` como não nulo.

## Fora do Escopo

- Pedidos e checkout.
- Cálculo de frete.
- Newsletter.
- Uploads no Supabase Storage.
- Pagamentos.
- Campo `sku`.
- Autorização por `Role.ADMIN`.
- Reorganização das rotas para `/admin/*`.
- Refatoração geral das inconsistências existentes na API que não forem necessárias para categorias.
