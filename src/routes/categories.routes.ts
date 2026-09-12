import { FastifyInstance } from "fastify";
import {
    createNewCategory,
    deleteExistingCategory,
    getCategory,
    listCategories,
    updateExistingCategory,
} from "../controllers/categories.controller.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { CategoryFilters, CreateCategory, UpdateCategory } from "../types/index.js";

export default async function categoryRoutes(fastify: FastifyInstance) {

    fastify.get<{ Querystring: CategoryFilters }>(
        "/",
        {
            schema: {
                tags: ["Categories"],
                description: "Rota que lista categorias com filtros opcionais",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        page: {
                            type: "number",
                            description:
                                "Número da página para paginação (opcional)",
                        },
                        limit: {
                            type: "number",
                            description:
                                "Limite de resultados por página (opcional)",
                        },
                        search: {
                            type: "string",
                            description: "Termo de busca (opcional)",
                        },
                    },
                },
                response: {
                    200: {
                        description:
                            "Lista de categorias retornada com sucesso",
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "number" },
                                        name: { type: "string" },
                                        slug: { type: "string" },
                                        description: { type: "string" },
                                        active: { type: "boolean" },
                                    },
                                },
                            },
                            total: { type: "number" },
                            page: { type: "number" },
                            limit: { type: "number" },
                            totalPages: { type: "number" },
                        },
                    },
                    401: {
                        description: "Não autorizado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        listCategories,
    );

    fastify.get<{ Params: { id: string } }>(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Rota que retorna uma categoria pelo ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Categoria encontrada com sucesso",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            slug: { type: "string" },
                            description: { type: "string" },
                            active: { type: "boolean" },
                        },
                    },
                    400: {
                        description: "Requisição inválida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        getCategory,
    );

    fastify.post<{ Body: CreateCategory }>(
        "/",
        {
            onRequest: [requireAdmin], // Adiciona o middleware requireAdmin para verificar se o usuário é admin
            schema: {
                tags: ["Categories"],
                description: "Rota que cria uma nova categoria",
                security: [{ bearerAuth: [] }],
                body: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        active: { type: "boolean" },
                    },
                    required: ["name"],
                },
                response: {
                    201: {
                        description: "Categoria criada com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            category: {
                                type: "object",
                                properties: {
                                    id: { type: "number" },
                                    name: { type: "string" },
                                    slug: { type: "string" },
                                    description: { type: "string" },
                                    active: { type: "boolean" },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Requisição inválida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    409: {
                        description: "Categoria já existe",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        createNewCategory,
    );

    fastify.put<{ Params: { id: string }, Body: UpdateCategory }>(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Rota que atualiza uma categoria existente",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                    },
                    required: ["id"],
                },
                body: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        active: { type: "boolean" },
                    },
                },
                response: {
                    200: {
                        description: "Categoria atualizada com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            category: {
                                type: "object",
                                properties: {
                                    id: { type: "number" },
                                    name: { type: "string" },
                                    slug: { type: "string" },
                                    description: { type: "string" },
                                    active: { type: "boolean" },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Requisição inválida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    404: {
                        description: "Categoria não encontrada",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    409: {
                        description: "Categoria já existe",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        updateExistingCategory,
    );

    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Rota que remove uma categoria por soft delete",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Categoria removida com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    400: {
                        description: "Requisição inválida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    404: {
                        description: "Categoria não encontrada",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        deleteExistingCategory,
    );
}
