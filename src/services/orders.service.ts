import { Prisma } from "../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { CreateOrder, OrderFilters, UpdateOrder } from "../types";

export const getOrders = async (
    filters: OrderFilters = {},
    requestingUserId: number,
    isAdmin: boolean,
) => {
    const {
        page = 1,
        limit = 10,
        status,
        userId,
        startDate,
        endDate,
    } = filters;

    const where: any = {};

    // Se não é admin, forçar filtro por userId do usuário autenticado
    if (!isAdmin) {
        where.userId = requestingUserId;
    } else if (userId) {
        // Se é admin e passou userId no filtro, usar o filtro
        where.userId = userId;
    }

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

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
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

    // 3) Cria um mapa para acessar rapidamente cada produto pelo ID durante as validações e cálculos finais.
    const productMap = new Map(
        existingProducts.map((product) => [product.id, product]),
    );

    // 4) Verifica cada item do pedido: produto ativo, tamanho válido, quantidade disponível e estoque suficiente.
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

    // 5) Normaliza os itens do pedido para persistir o preço do produto em Decimal e preservar o valor exato do pedido.
    const orderItems = data.items.map((item) => {
        const product = productMap.get(item.productId)!;

        return {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size ?? null,
            price: new Prisma.Decimal(product.price.toString()),
        };
    });

    // 6) Calcula o total do pedido somando o preço unitário multiplicado pela quantidade de cada item.
    const calculatedTotal = orderItems.reduce(
        (sum, item) => sum.plus(item.price.mul(item.quantity)),
        new Prisma.Decimal(0),
    );

    // 7) Cria o pedido e os itens em uma transação para garantir consistência e rollback em caso de falha.
    return prisma.$transaction(async (tx) => {
        // 7.1) Registra o pedido principal com status inicial pendente e endereço de entrega informado.
        const createdOrder = await tx.order.create({
            data: {
                userId: data.userId,
                total: calculatedTotal,
                status: "PENDING",
                shippingAddress:
                    data.shippingAddress as unknown as Prisma.InputJsonValue,
                paymentMethod: data.paymentMethod,
            },
        });

        // 7.2) Cria cada item do pedido e decrementa o estoque do produto correspondente em paralelo.
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

        // 7.3) Retorna o pedido criado para o controller responder ao cliente.
        return createdOrder;
    });
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
