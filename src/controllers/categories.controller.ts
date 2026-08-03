import { FastifyReply, FastifyRequest } from "fastify";
import { getCategories, getCategoryById } from "../services/categories.service";
import { CategoryFilters } from "../types";
import { categoryFilterSchema } from "../utils/validators";

export const listCategories = async (
    request: FastifyRequest <{ Querystring: CategoryFilters }>,
    reply: FastifyReply,
) => {
    const filters = categoryFilterSchema.parse(request.query);
    const categories = await getCategories(filters as CategoryFilters);
    reply.status(200).send(categories);
};

export const getCategory = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
) => {
    const category = await getCategoryById(request.params.id);
    reply.status(200).send(category);
};
