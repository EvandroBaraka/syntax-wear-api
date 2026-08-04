import { FastifyReply, FastifyRequest } from "fastify";
import {
    createCategory as createCategoryService,
    getCategories,
    getCategoryById,
} from "../services/categories.service";
import { CategoryFilters, CreateCategory } from "../types";
import {
    categoryFilterSchema,
    createCategorySchema,
} from "../utils/validators";
import slugify from "slugify";

export const listCategories = async (
    request: FastifyRequest<{ Querystring: CategoryFilters }>,
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

export const createCategory = async (
    request: FastifyRequest<{ Body: CreateCategory }>,
    reply: FastifyReply,
) => {
    const body = request.body;
    body.slug = slugify(body.name, { lower: true, strict: true, locale: "pt" });

    const validate = createCategorySchema.parse(body);

    const category = await createCategoryService(validate);

    reply.status(201).send({
        message: "Categoria criada com sucesso",
        category,
    });
};
