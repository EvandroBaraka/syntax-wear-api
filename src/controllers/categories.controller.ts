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
import { generateSlug } from "../utils/slug";

export const listCategories = async (
    request: FastifyRequest<{ Querystring: CategoryFilters }>,
    reply: FastifyReply,
) => {
    const filters = categoryFilterSchema.parse(request.query);
    const categories = await getCategories(filters as CategoryFilters);
    reply.status(200).send(categories);
};

export const getCategory = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
) => {
    const category = await getCategoryById(Number(request.params.id));
    reply.status(200).send(category);
};

export const createNewCategory = async (
    request: FastifyRequest<{ Body: CreateCategory }>,
    reply: FastifyReply,
) => {
    const body = request.body;
    body.slug = generateSlug(body.name);

    const validate = createCategorySchema.parse(body);

    const category = await createCategoryService(validate);

    reply.status(201).send({
        message: "Categoria criada com sucesso",
        category,
    });
};

export const updateExistingCategory = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategory }>,
    reply: FastifyReply,
) => {
    const validate = updateCategorySchema.parse(request.body);

    if (validate.name) {
        validate.slug = generateSlug(validate.name);
    }

    const category = await updateCategoryService(Number(request.params.id), validate);

    reply.status(200).send({
        message: "Categoria atualizada com sucesso",
        category,
    });
};

export const deleteExistingCategory = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
) => {
    await deleteCategoryService(Number(request.params.id));

    reply.status(204).send();
};
