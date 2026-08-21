import { FastifyReply, FastifyRequest } from "fastify";
import { CreateOrder, OrderFilters } from "../types";
import {
    createOrder,
    getOrderById,
    getOrders,
} from "../services/orders.service";
import { createOrderSchema, orderFiltersSchema } from "../utils/validators";

export const listOrders = async (
    request: FastifyRequest<{ Querystring: OrderFilters }>,
    reply: FastifyReply,
) => {
    const filters = orderFiltersSchema.parse(request.query);
    const result = await getOrders(filters as OrderFilters);
    reply.status(200).send(result);
};

export const getOrder = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
) => {
    const order = await getOrderById(request.params.id);
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
