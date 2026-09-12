import { FastifyReply, FastifyRequest } from "fastify";
import { CreateOrder, OrderFilters, UpdateOrder } from "../types";
import {
    createOrder,
    deleteOrder,
    getOrderById,
    getOrders,
    updateOrder,
} from "../services/orders.service";
import {
    createOrderSchema,
    orderFiltersSchema,
    updateOrderSchema,
} from "../utils/validators";

export const listOrders = async (
    request: FastifyRequest<{ Querystring: OrderFilters }>,
    reply: FastifyReply,
) => {
    const filters = orderFiltersSchema.parse(request.query);

    // Extrair userId e role do token JWT
    const user = request.user as any;
    const requestingUserId = user.userId;
    const isAdmin = user.role === "ADMIN";

    const result = await getOrders(
        filters as OrderFilters,
        requestingUserId,
        isAdmin,
    );
    reply.status(200).send(result);
};

export const getOrder = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
) => {
    const id = parseInt(request.params.id, 10);

    // Extrair userId e role do token JWT
    const user = request.user as any;
    const requestingUserId = user.userId;
    const isAdmin = user.role === "ADMIN";

    const order = await getOrderById(id, requestingUserId, isAdmin);
    reply.status(200).send(order);
};

export const createNewOrder = async (
    request: FastifyRequest<{ Body: CreateOrder }>,
    reply: FastifyReply,
) => {
    const body = createOrderSchema.parse(request.body);
    const order = await createOrder(body);

    reply.status(201).send({
        message: "Pedido criado com sucesso",
        orderId: order.id,
    });
};

export const updateExistingOrder = async (
    request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateOrder;
    }>,
    reply: FastifyReply,
) => {
    const id = parseInt(request.params.id, 10);
    const body = updateOrderSchema.parse(request.body);

    // Extrair userId e role do token JWT
    const user = request.user as any;
    const requestingUserId = user.userId;
    const isAdmin = user.role === "ADMIN";

    const order = await updateOrder(id, body, requestingUserId, isAdmin);

    reply.status(200).send({
        message: "Pedido atualizado com sucesso",
        order,
    });
};

export const deleteExistingOrder = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
) => {
    const id = parseInt(request.params.id, 10);

    // Extrair userId e role do token JWT
    const user = request.user as any;
    const requestingUserId = user.userId;
    const isAdmin = user.role === "ADMIN";

    await deleteOrder(id, requestingUserId, isAdmin);

    reply.status(200).send({
        message: "Pedido cancelado com sucesso",
    });
};
