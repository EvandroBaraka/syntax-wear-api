import { Prisma } from "../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { CreateOrder, OrderFilters, UpdateOrder } from "../types";

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

export const createOrder = async (data: CreateOrder) => {
    const productIds = data.items.map((item) => item.productId);
    const existingProducts = await prisma.product.findMany({
        where: {
            id: { in: productIds },
        },
    });

    const productMap = new Map(
        existingProducts.map((product) => [product.id, product]),
    );

    for (const item of data.items) {
        const product = productMap.get(item.productId);

        if (!product) {
            throw new Error(`Produto com ID ${item.productId} não encontrado`);
        }

        if (!product.active) {
            throw new Error(`Produto ${product.name} está inativo`);
        }

        const availableSizes = Array.isArray(product.sizes)
            ? product.sizes.filter(
                  (size): size is string => typeof size === "string",
              )
            : [];

        if (availableSizes.length > 0 && !item.size) {
            throw new Error(
                `Produto ${product.name} requer seleção de tamanho`,
            );
        }

        if (item.size && !availableSizes.includes(item.size)) {
            throw new Error(
                `Tamanho ${item.size} não disponível para ${product.name}`,
            );
        }

        if (product.stock < item.quantity) {
            throw new Error(
                `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, solicitado: ${item.quantity}`,
            );
        }
    }

    const orderItems = data.items.map((item) => {
        const product = productMap.get(item.productId)!;

        return {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size ?? null,
            price: new Prisma.Decimal(product.price.toString()),
        };
    });

    const calculatedTotal = orderItems.reduce(
        (sum, item) => sum.plus(item.price.mul(item.quantity)),
        new Prisma.Decimal(0),
    );

    return prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
            data: {
                userId: data.userId ?? null,
                total: calculatedTotal,
                status: "PENDING",
                shippingAddress:
                    data.shippingAddress as unknown as Prisma.InputJsonValue,
                paymentMethod: data.paymentMethod,
            },
        });

        await Promise.all(
            orderItems.map(async (item) => {
                await tx.orderItem.create({
                    data: {
                        orderId: createdOrder.id,
                        productId: item.productId,
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size,
                    },
                });

                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });
            }),
        );

        return createdOrder;
    });
};

export const updateOrder = async (id: number, data: UpdateOrder) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id },
    });

    if (!existingOrder) {
        throw new Error("Pedido não encontrado");
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            ...(data.status ? { status: data.status } : {}),
            ...(data.shippingAddress
                ? {
                      shippingAddress:
                          data.shippingAddress as unknown as Prisma.InputJsonValue,
                  }
                : {}),
        },
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

    return updatedOrder;
};

export const deleteOrder = async (id: number) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id },
    });

    if (!existingOrder) {
        throw new Error("Pedido não encontrado");
    }

    await prisma.order.update({
        where: { id },
        data: {
            status: "CANCELLED",
        },
    });
};
