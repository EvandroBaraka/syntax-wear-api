import { FastifyInstance } from "fastify";
import {
    createNewProduct,
    deleteExistingProduct,
    getProduct,
    listProducts,
    updateExistingProduct,
} from "../controllers/products.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default function productRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Products"],
                description: "Rota que lista produtos com filtros opcionais",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number" },
                        limit: { type: "number" },
                        minPrice: { type: "number" },
                        maxPrice: { type: "number" },
                        search: { type: "string" },
                        sortBy: {
                            type: "string",
                            enum: ["price", "name", "createdAt"],
                        },
                        sortOrder: {
                            type: "string",
                            enum: ["asc", "desc"],
                        },
                    },
                },
                response: {
                    200: {
                        description: "Lista de produtos retornada com sucesso",
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "number" },
                                name: { type: "string" },
                                price: { type: "number" },
                                description: { type: "string" },
                                stock: { type: "number" },
                                sizes: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                images: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                colors: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                slug: { type: "string" },
                                active: { type: "boolean" },
                                createdAt: {
                                    type: "string",
                                    format: "date-time",
                                },
                                updatedAt: {
                                    type: "string",
                                    format: "date-time",
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
                },
            },
        },
        listProducts,
    );

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Products"],
                description: "Rota que retorna um produto pelo ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Produto encontrado com sucesso",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            price: { type: "number" },
                            createdAt: { type: "string", format: "date-time" },
                            description: { type: "string" },
                            stock: { type: "number" },
                            sizes: {
                                type: "array",
                                items: { type: "string" },
                            },
                            images: {
                                type: "array",
                                items: { type: "string", format: "uri" },
                            },
                            colors: {
                                type: "array",
                                items: { type: "string" },
                            },
                            slug: { type: "string" },
                            active: { type: "boolean" },
                            updatedAt: { type: "string", format: "date-time" },
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
        getProduct,
    );

    fastify.post(
        "/",
        {
            schema: {
                tags: ["Products"],
                description: "Rota que cria um novo produto",
                required: [
                    "name",
                    "description",
                    "price",
                    "slug",
                    "active",
                    "stock",
                ],
                body: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        active: { type: "boolean" },
                        stock: { type: "number" },
                        sizes: {
                            type: "array",
                            items: { type: "string" },
                        },
                        images: {
                            type: "array",
                            items: { type: "string" },
                        },
                        colors: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                },
                response: {
                    201: {
                        description: "Produto criado com sucesso",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            price: { type: "number" },
                            description: { type: "string" },
                            stock: { type: "number" },
                            sizes: {
                                type: "array",
                                items: { type: "string" },
                            },
                            images: {
                                type: "array",
                                items: { type: "string" },
                            },
                            colors: {
                                type: "array",
                                items: { type: "string" },
                            },
                            slug: { type: "string" },
                            active: { type: "boolean" },
                            createdAt: {
                                type: "string",
                                format: "date-time",
                            },
                            updatedAt: {
                                type: "string",
                                format: "date-time",
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
                },
            },
        },
        createNewProduct,
    );

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Products"],
                description: "Rota que atualiza um produto existente",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "ID do produto a ser atualizado",
                        },
                    },
                    required: ["id"],
                },
                body: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        active: { type: "boolean" },
                        stock: { type: "number" },
                        sizes: {
                            type: "array",
                            items: { type: "string" },
                        },
                        images: {
                            type: "array",
                            items: { type: "string" },
                        },
                        colors: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                },
                response: {
                    200: {
                        description: "Produto atualizado com sucesso",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            price: { type: "number" },
                            colors: {
                                type: "array",
                                items: { type: "string" },
                            },
                            stock: { type: "number" },
                            tags: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                    },
                    400: {
                        description: "Requisição inválida",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                            details: {
                                type: "array",
                                nullable: true,
                            },
                        },
                    },
                    401: {
                        description: "Não autenticado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                    404: {
                        description: "Produto não encontrado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
            },
        },
        updateExistingProduct,
    );

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Products"],
                description: "Rota que remove um produto pelo ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Produto deletado com sucesso",
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
                    404: {
                        description: "Produto não encontrado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        deleteExistingProduct,
    );
}
