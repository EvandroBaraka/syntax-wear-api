import { FastifyInstance } from "fastify";
import { createNewProduct, getProduct, listProducts } from "../controllers/products.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default function productRoutes(fastify: FastifyInstance) {
    // fastify.addHook("onRequest", authenticate);
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

    fastify.post("/", {
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
        },
    }, createNewProduct );
}
