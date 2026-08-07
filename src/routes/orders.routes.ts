import { FastifyInstance } from "fastify";
import { getOrder, listOrders } from "../controllers/orders.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default function orderRoutes(fastify: FastifyInstance) {
    // fastify.addHook("onRequest", authenticate);

    fastify.get(
        "/",
        {
            schema: {
                tags: ["Orders"],
                description: "Lista pedidos com filtros opcionais",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number" },
                        limit: { type: "number" },
                        status: {
                            type: "string",
                            enum: [
                                "PENDING",
                                "PAID",
                                "SHIPPED",
                                "DELIVERED",
                                "CANCELLED",
                            ],
                        },
                        userId: { type: "number" },
                        startDate: { type: "string" },
                        endDate: { type: "string" },
                    },
                },
                response: {
                    200: {
                        description: "Lista de pedidos retornada com sucesso",
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "number" },
                                        total: { type: "number" },
                                        status: { type: "string" },
                                        paymentMethod: { type: "string" },
                                        shippingAddress: { type: "object" },
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
        listOrders,
    );

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Orders"],
                description: "Retorna um pedido pelo ID",
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
                        description: "Pedido encontrado com sucesso",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            total: { type: "number" },
                            status: { type: "string" },
                            paymentMethod: { type: "string" },
                            shippingAddress: { type: "object" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
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
                        description: "Pedido não encontrado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        getOrder,
    );
}
