import { prisma } from "../utils/prisma";
import { ProductFilters } from "../types";

export const getProducts = async (filters: ProductFilters) => {
    const {
        page = 1,
        limit = 10,
        minPrice,
        maxPrice,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = filters;

    const where: any = {};

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
            where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
            where.price.lte = maxPrice;
        }
    }

    if (search && search.trim()) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const orderBy: any = {};
    if (sortBy) {
        orderBy[sortBy] = sortOrder || "asc";
    }

    try {
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
                skip,
                take,
            }),
            prisma.product.count({ where }),
        ]);

        return {
            data: products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};
