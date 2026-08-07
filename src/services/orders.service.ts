import { prisma } from "../utils/prisma";
import { OrderFilters } from "../types";

export const getOrders = async (filters: OrderFilters) => {
    const {
        page = 1,
        limit = 10,
        status,
        userId,
        startDate,
        endDate,
    } = filters;

    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (userId !== undefined) {
        where.userId = userId;
    }

    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getOrderById = async (id: number) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: true,
            items: {
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        throw new Error("Pedido não encontrado");
    }

    return order;
};
