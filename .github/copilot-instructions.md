# Diretrizes do Projeto

## Stack e Arquitetura

- Use TypeScript com módulos ES (`"type": "module"`) e preserve a separação existente entre `routes`, `controllers`, `services`, `middlewares`, `utils` e `types`.
- Use Fastify para HTTP e mantenha as rotas responsáveis por registro, schemas OpenAPI e encaminhamento para controllers.
- Coloque regras de negócio nos services e acesso ao banco em Prisma por meio do helper existente em `src/utils/prisma.ts`.
- Consulte `docs/PRD-backend.md.md` para contexto de domínio e roadmap, mas trate o código e o schema Prisma atuais como a fonte de verdade da implementação.

## API e Segurança

- Ao criar ou alterar endpoints, atualize o schema Fastify da rota, incluindo parâmetros, corpo, respostas e códigos de erro relevantes.
- Valide entradas com os utilitários e padrões existentes em `src/utils/validators.ts`; não confie apenas na tipagem do TypeScript em runtime.
- Preserve o fluxo de autenticação baseado em JWT e middleware. Não exponha senhas, tokens ou segredos nas respostas e nos logs.
- Para valores monetários, respeite o tipo `Decimal` definido no Prisma e evite conversões silenciosas para ponto flutuante.
- Prefira desativação lógica de produtos e categorias (`active: false`) quando a operação for uma exclusão de catálogo, conforme o service atual.
- Para categorias, siga o padrão já implementado de CRUD com listagem, criação, atualização e soft delete em `src/routes/categories.routes.ts`, `src/controllers/categories.controller.ts` e `src/services/categories.service.ts`.

## Banco de Dados

- Alterações persistentes devem começar em `prisma/schema.prisma` e ser acompanhadas de uma migration Prisma; depois regenere o client quando necessário.
- Não edite manualmente arquivos em `src/generated/prisma`; eles são artefatos gerados.
- Verifique compatibilidade com PostgreSQL e com os dados existentes antes de remover ou renomear campos.

## Estilo e Validação

- Siga o estilo local: quatro espaços de indentação, nomes descritivos e mensagens novas da API em português.
- Faça mudanças pequenas e preserve APIs públicas e comportamento não relacionado à tarefa.
- Antes de concluir, execute `npm run build`. Para mudanças em banco, use também `npm run prisma:generate` e `npm run prisma:migrate` conforme o caso.
- Ao adicionar testes, mantenha-os próximos ao comportamento alterado e atualize os scripts do `package.json` somente quando necessário.
