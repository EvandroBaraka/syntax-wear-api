import { FastifyReply, FastifyRequest } from "fastify";
import {
    createCategory as createCategoryService,
    deleteCategory as deleteCategoryService,
    getCategories,
    getCategoryById,
    updateCategory as updateCategoryService,
} from "../services/categories.service";
import { CategoryFilters, CreateCategory, UpdateCategory } from "../types";
import {
    categoryFilterSchema,
    createCategorySchema,
    updateCategorySchema,
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

export const updateCategory = async (
    request: FastifyRequest<{ Params: { id: number }; Body: UpdateCategory }>,
    reply: FastifyReply,
) => {
    const validate = updateCategorySchema.parse(request.body);

    if (validate.name) {
        validate.slug = slugify(validate.name, {
            lower: true,
            strict: true,
            locale: "pt",
        });
    }

    const category = await updateCategoryService(request.params.id, validate);

    reply.status(200).send({
        message: "Categoria atualizada com sucesso",
        category,
    });
};

export const deleteCategory = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
) => {
    await deleteCategoryService(request.params.id);

    reply.status(200).send({
        message: "Categoria removida com sucesso (soft delete)",
    });
};
