import { FastifyReply, FastifyRequest } from "fastify";
import { OrderFilters } from "../types";
import { getOrderById, getOrders } from "../services/orders.service";
import { orderFiltersSchema } from "../utils/validators";

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
