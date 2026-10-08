import Decimal from "decimal.js";
import { OrderStatus, Prisma } from "../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { CreateOrder, OrderFilters, UpdateOrder } from "../types";

export const getOrders = async (
    filters: OrderFilters = {},
    requestingUserId: number,
) => {
    const { page = 1, limit = 10, status, startDate, endDate } = filters;

    const where: any = {};
    where.userId = requestingUserId;

    if (status) {
        where.status = status;
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

    console.log("var where", where);

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true,
                            }
                        }
                    }
                }
            },
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

export const getOrderById = async (
    id: number,
    requestingUserId: number,
    isAdmin: boolean,
) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    cpf: true,
                    phone: true,
                },
            },
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

    // Verificar se o usuário tem permissão para visualizar o pedido
    if (!isAdmin && order.userId !== requestingUserId) {
        throw new Error(
            "Acesso negado. Você não tem permissão para visualizar este pedido.",
        );
    }

    return order;
};

export const createOrder = async (data: CreateOrder) => {
    // 1) Coleta os IDs dos produtos do pedido para buscar as informações necessárias em uma única consulta.
    const productIds = data.items.map((item) => item.productId);
    const existingProducts = await prisma.product.findMany({
        where: {
            id: { in: productIds },
        },
        include: { category: true },
    });

    // 2) Valida se todos os produtos informados realmente existem no banco antes de prosseguir.
    if (existingProducts.length !== productIds.length) {
        const foundIds = existingProducts.map((p) => p.id);
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        throw new Error(
            `Produto(s) com ID ${missingIds.join(", ")} não encontrado(s)`,
        );
    }

    // 3) Calcula o total do pedido.
    let total = new Decimal(0);
    const orderItemsData = data.items.map((item) => {
        const product = existingProducts.find((p) => p.id === item.productId)!;

        if (product?.stock < item.quantity) {
            throw new Error(
                `Estoque insuficiente para o produto ${product.name}. Estoque disponível: ${product.stock}, quantidade solicitada: ${item.quantity}`,
            );
        }

        const itemTotal = new Decimal(product.price).mul(item.quantity);
        total = total.add(itemTotal);

        return {
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
            size: item.size,
        };
    });

    // Adiciona o custo de envio ao total do pedido
    const shippingCost = new Decimal(data.shippingCost || 0);
    total = total.add(shippingCost);

    // 4) Cria o pedido no banco de dados. (transação atômica para garantir que todos os itens sejam criados junto com o pedido)
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId: data.userId,
                total,
                status: OrderStatus.PENDING,
                shippingAddress: JSON.parse(
                    JSON.stringify(data.shippingAddress),
                ),
                shippingCost,
                paymentMethod: data.paymentMethod,
                items: {
                    create: orderItemsData.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        size: item.size,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true,
                            },
                        },
                    },
                },
            },
        });

        for (const item of orderItemsData) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        return newOrder;
    });

    return order;
};

export const updateOrder = async (
    id: number,
    data: UpdateOrder,
    requestingUserId: number,
    isAdmin: boolean,
) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id },
    });

    if (!existingOrder) {
        throw new Error("Pedido não encontrado");
    }

    // Verificar se o usuário pode atualizar o pedido
    if (!isAdmin && existingOrder.userId !== requestingUserId) {
        throw new Error("Você não tem permissão para atualizar este pedido");
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
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    cpf: true,
                    phone: true,
                },
            },
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

export const deleteOrder = async (
    id: number,
    requestingUserId: number,
    isAdmin: boolean,
) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id },
    });

    if (!existingOrder) {
        throw new Error("Pedido não encontrado");
    }

    // Verificar se o usuário pode excluir o pedido
    if (!isAdmin && existingOrder.userId !== requestingUserId) {
        throw new Error("Você não tem permissão para excluir este pedido");
    }

    // Verificar se pedido já foi cancelado
    if (existingOrder.status === "CANCELLED") {
        throw new Error("Pedido já está cancelado");
    }

    // Verificar se pedido já foi entregue
    if (existingOrder.status === "DELIVERED") {
        throw new Error("Não é possível cancelar um pedido já entregue");
    }

    const deletedOrder = await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
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

    return deletedOrder;
};
