import { prisma } from "../utils/prisma";
import { CategoryFilters, CreateCategory, UpdateCategory } from "../types";
import slugify from "slugify";

export const getCategories = async (filters: CategoryFilters) => {
    const { search, page = 1, limit = 10 } = filters;

    const where: any = { active: true };

    if (search && search.trim()) {
        where.name = { contains: search, mode: "insensitive" };
    }

    // Paginação
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    try {
        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take,
                orderBy: { name: "asc" },
            }),
            prisma.category.count({ where }),
        ]);
        return {
            data: categories,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        throw error;
    }
};

export const getCategoryById = async (id: number) => {
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new Error("Categoria não encontrada");
    }

    return category;
};

export const createCategory = async (data: CreateCategory) => {
    const slug =
        data.slug ??
        slugify(data.name, { lower: true, strict: true, locale: "pt" });

    const existingCategory = await prisma.category.findFirst({
        where: {
            OR: [
                { slug },
                { name: { equals: data.name, mode: "insensitive" } },
            ],
        },
    });

    if (existingCategory) {
        throw new Error(
            "Slug da categoria já existe. Escolha outro slug ou nome.",
        );
    }

    return prisma.category.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
            active: data.active ?? true,
        },
    });
};

export const updateCategory = async (id: number, data: UpdateCategory) => {
    const existingCategory = await prisma.category.findUnique({
        where: { id },
    });

    if (!existingCategory) {
        throw new Error("Categoria não encontrada");
    }

    if (data.slug) {
        const slugExists = await prisma.category.findUnique({
            where: { slug: data.slug },
        });

        if (slugExists && slugExists.id !== id) {
            throw new Error(
                "Slug da categoria já existe. Escolha outro nome para a categoria.",
            );
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data,
    });

    return updatedCategory;
};

export const deleteCategory = async (id: number) => {
    const existingCategory = await prisma.category.findUnique({
        where: { id },
    });

    if (!existingCategory) {
        throw new Error("Categoria não encontrada");
    }

    await prisma.category.update({
        where: { id },
        data: { active: false },
    });
};
