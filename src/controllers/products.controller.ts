import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilters } from "../types";
import { getProducts } from "../services/products.service";
import { productFilterSchema } from "../utils/validators";

export const listProducts = async (
    request: FastifyRequest<{ Querystring: ProductFilters }>,
    reply: FastifyReply,
) => {
    const filters = productFilterSchema.parse(request.query);
    const result = await getProducts(filters as ProductFilters);
    reply.send(result);
};
