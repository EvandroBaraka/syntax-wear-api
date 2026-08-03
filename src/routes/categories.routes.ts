import { FastifyInstance } from "fastify";
import {
    getCategory,
    listCategories,
} from "../controllers/categories.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default function categoryRoutes(fastify: FastifyInstance) {
    // fastify.addHook("onRequest", authenticate);

    fastify.get(
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
                            totalPages: { type: "number" 
                            },
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

    fastify.get(
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
}
