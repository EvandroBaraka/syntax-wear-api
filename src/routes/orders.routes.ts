import { FastifyInstance } from "fastify";
import {
    createNewOrder,
    deleteExistingOrder,
    getOrder,
    listOrders,
    updateExistingOrder,
} from "../controllers/orders.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default async function orderRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);

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
                                        user: {
                                            type: "object",
                                            properties: {
                                                id: { type: "number" },
                                                name: { type: "string" },
                                                email: { type: "string" },
                                            },
                                        },
                                        items: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "number" },
                                                    name: { type: "string" },
                                                    price: { type: "number" },
                                                    quantity: {
                                                        type: "number",
                                                    },
                                                },
                                            },
                                        },
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
                description: "Retorna um pedido específico pelo ID",
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
                            shippingAddress: {
                                type: "object",
                                properties: {
                                    cep: { type: "string" },
                                    street: { type: "string" },
                                    number: { type: "string" },
                                    complement: { type: "string" },
                                    neighborhood: { type: "string" },
                                    city: { type: "string" },
                                    state: { type: "string" },
                                    country: { type: "string" },
                                },
                            },
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

    fastify.post(
        "/",
        {
            schema: {
                tags: ["Orders"],
                description: "Cria um novo pedido",
                security: [{ bearerAuth: [] }],
                body: {
                    type: "object",
                    properties: {
                        userId: { type: "number" },
                        paymentMethod: { type: "string" },
                        shippingAddress: {
                            type: "object",
                            properties: {
                                cep: { type: "string" },
                                street: { type: "string" },
                                number: { type: "string" },
                                complement: { type: "string" },
                                neighborhood: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                country: { type: "string" },
                            },
                            required: [
                                "cep",
                                "street",
                                "number",
                                "neighborhood",
                                "city",
                                "state",
                            ],
                        },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    productId: { type: "number" },
                                    quantity: { type: "number" },
                                    size: { type: "string" },
                                },
                                required: ["productId", "quantity"],
                            },
                        },
                    },
                    required: ["items", "shippingAddress", "paymentMethod"],
                },
                response: {
                    201: {
                        description: "Pedido criado com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            orderId: { type: "number" },
                        },
                    },
                    400: {
                        description: "Dados inválidos",
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
        createNewOrder,
    );

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Orders"],
                description:
                    "Atualiza status e/ou endereço de entrega de um pedido",
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
                        shippingAddress: {
                            type: "object",
                            properties: {
                                cep: { type: "string" },
                                street: { type: "string" },
                                number: { type: "string" },
                                complement: { type: "string" },
                                neighborhood: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                country: { type: "string" },
                            },
                            required: [
                                "cep",
                                "street",
                                "number",
                                "neighborhood",
                                "city",
                                "state",
                            ],
                        },
                    },
                },
                response: {
                    200: {
                        description: "Pedido atualizado com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            order: {
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
                    },
                    400: {
                        description: "Dados inválidos",
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
                        description: "Pedido não encontrado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        updateExistingOrder,
    );

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Orders"],
                description: "Cancela um pedido pelo ID",
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
                        description: "Pedido cancelado com sucesso",
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
                        description: "Pedido não encontrado",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        deleteExistingOrder,
    );
}
