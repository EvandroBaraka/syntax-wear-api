import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { prisma } from "../src/utils/prisma";

vi.mock("../src/utils/prisma", () => ({
    prisma: {
        order: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
        },
        product: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
        orderItem: {
            create: vi.fn(),
        },
        $transaction: vi.fn(),
        $disconnect: vi.fn(),
    },
}));

describe("Orders", () => {
    let app: FastifyInstance;
    let adminToken: string;
    let userToken: string;

    const userId = 7;
    const otherUserId = 12;
    const shippingAddress = {
        cep: "01310100",
        street: "Avenida Paulista",
        number: "1000",
        complement: "Apto 10",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
    };

    const order = {
        id: 1,
        userId,
        total: 199.98,
        status: "PENDING",
        shippingAddress,
        paymentMethod: "CREDIT_CARD",
        createdAt: new Date("2026-09-01T10:00:00.000Z"),
        updatedAt: new Date("2026-09-01T10:00:00.000Z"),
    };

    beforeAll(async () => {
        app = await buildApp();
        adminToken = app.jwt.sign({ userId: 1, role: "ADMIN" });
        userToken = app.jwt.sign({ userId, role: "USER" });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("GET /orders", () => {
        it("deve exigir autenticação", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/orders",
            });

            expect(response.statusCode).toBe(401);
            expect(prisma.order.findMany).not.toHaveBeenCalled();
            expect(prisma.order.count).not.toHaveBeenCalled();
        });

        it("deve listar pedidos para um admin com paginação", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
                order,
            ] as any);
            vi.mocked(prisma.order.count).mockResolvedValueOnce(11);

            const response = await app.inject({
                method: "GET",
                url: "/orders?page=2&limit=5",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                data: [
                    {
                        id: order.id,
                        total: order.total,
                        status: order.status,
                        paymentMethod: order.paymentMethod,
                    },
                ],
                total: 11,
                page: 2,
                limit: 5,
                totalPages: 3,
            });
            expect(prisma.order.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: "desc" },
                skip: 5,
                take: 5,
            });
            expect(prisma.order.count).toHaveBeenCalledWith({ where: {} });
        });

        it("deve aplicar os filtros de status, usuário e período para admin", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValueOnce([]);
            vi.mocked(prisma.order.count).mockResolvedValueOnce(0);

            const response = await app.inject({
                method: "GET",
                url: "/orders?status=PAID&userId=12&startDate=2026-09-01&endDate=2026-09-10",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(200);
            const expectedEndDate = new Date("2026-09-10");
            expectedEndDate.setHours(23, 59, 59, 999);
            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        userId: otherUserId,
                        status: "PAID",
                        createdAt: {
                            gte: new Date("2026-09-01"),
                            lte: expectedEndDate,
                        },
                    },
                }),
            );
        });

        it("deve restringir a listagem ao usuário autenticado", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
                order,
            ] as any);
            vi.mocked(prisma.order.count).mockResolvedValueOnce(1);

            const response = await app.inject({
                method: "GET",
                url: "/orders?userId=12",
                headers: { authorization: `Bearer ${userToken}` },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId } }),
            );
            expect(prisma.order.count).toHaveBeenCalledWith({
                where: { userId },
            });
        });

        it("deve rejeitar paginação inválida", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/orders?page=0&limit=0",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.order.findMany).not.toHaveBeenCalled();
            expect(prisma.order.count).not.toHaveBeenCalled();
        });

        it("deve rejeitar status inválido", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/orders?status=INVALID",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.order.findMany).not.toHaveBeenCalled();
            expect(prisma.order.count).not.toHaveBeenCalled();
        });
    });

    describe("GET /orders/:id", () => {
        it("deve obter um pedido com seus dados relacionados", async () => {
            const detailedOrder = {
                ...order,
                user: {
                    id: userId,
                    firstName: "Cliente",
                    lastName: "Teste",
                    email: "cliente@example.com",
                    cpf: null,
                    phone: null,
                },
                items: [
                    {
                        id: 10,
                        orderId: order.id,
                        productId: 20,
                        price: 99.99,
                        quantity: 2,
                        size: "M",
                        product: {
                            id: 20,
                            name: "Camiseta Syntax",
                            price: 99.99,
                            category: {
                                id: 3,
                                name: "Camisetas",
                            },
                        },
                    },
                ],
            };
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(
                detailedOrder as any,
            );

            const response = await app.inject({
                method: "GET",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                id: order.id,
                total: order.total,
                status: order.status,
                shippingAddress,
                paymentMethod: order.paymentMethod,
            });
            expect(prisma.order.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: order.id },
                    include: {
                        user: expect.any(Object),
                        items: expect.any(Object),
                    },
                }),
            );
        });

        it("deve permitir que admin consulte pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);

            const response = await app.inject({
                method: "GET",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(200);
        });

        it("deve negar pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);

            const response = await app.inject({
                method: "GET",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain("permissão");
        });

        it("deve retornar erro quando o pedido não existir", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

            const response = await app.inject({
                method: "GET",
                url: "/orders/999999",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain(
                "Pedido não encontrado",
            );
        });

        it("deve rejeitar ID inválido", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/orders/invalid-id",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.order.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("POST /orders", () => {
        const orderData = {
            items: [
                {
                    productId: 20,
                    quantity: 2,
                    size: "M",
                },
            ],
            shippingAddress,
            paymentMethod: "CREDIT_CARD",
        };

        const product = {
            id: 20,
            name: "Camiseta Syntax",
            price: 99.99,
            stock: 10,
            active: true,
            sizes: ["P", "M", "G"],
            category: { id: 3, name: "Camisetas" },
        };

        const createdOrder = {
            id: 50,
            userId,
            total: 199.98,
            status: "PENDING",
            shippingAddress,
            paymentMethod: "CREDIT_CARD",
            createdAt: new Date("2026-09-10T10:00:00.000Z"),
            updatedAt: new Date("2026-09-10T10:00:00.000Z"),
        };

        const mockTransaction = () => {
            const transactionClient = {
                order: {
                    create: vi.fn().mockResolvedValue(createdOrder),
                },
                orderItem: {
                    create: vi.fn().mockResolvedValue({ id: 100 }),
                },
                product: {
                    update: vi.fn().mockResolvedValue({ count: 1 }),
                },
            };

            vi.mocked(prisma.$transaction).mockImplementationOnce(
                async (callback: any) => callback(transactionClient),
            );

            return transactionClient;
        };

        it("deve exigir autenticação", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/orders",
                payload: orderData,
            });

            expect(response.statusCode).toBe(401);
            expect(prisma.product.findMany).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("deve criar um pedido com os campos obrigatórios", async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
                product,
            ] as any);
            const transactionClient = mockTransaction();

            const response = await app.inject({
                method: "POST",
                url: "/orders",
                headers: { authorization: `Bearer ${userToken}` },
                payload: orderData,
            });

            expect(response.statusCode).toBe(201);
            expect(JSON.parse(response.body)).toEqual({
                message: "Pedido criado com sucesso",
                orderId: createdOrder.id,
            });
            expect(prisma.product.findMany).toHaveBeenCalledWith({
                where: { id: { in: [product.id] } },
                include: { category: true },
            });
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(transactionClient.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: undefined,
                        status: "PENDING",
                        paymentMethod: orderData.paymentMethod,
                        shippingAddress: orderData.shippingAddress,
                    }),
                }),
            );
            expect(transactionClient.orderItem.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        orderId: createdOrder.id,
                        productId: product.id,
                        quantity: 2,
                        size: "M",
                    }),
                }),
            );
            expect(transactionClient.product.update).toHaveBeenCalledWith({
                where: { id: product.id },
                data: { stock: { decrement: 2 } },
            });
        });

        it("deve aceitar userId informado no payload", async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
                product,
            ] as any);
            const transactionClient = mockTransaction();

            const response = await app.inject({
                method: "POST",
                url: "/orders",
                headers: { authorization: `Bearer ${adminToken}` },
                payload: { ...orderData, userId: otherUserId },
            });

            expect(response.statusCode).toBe(201);
            expect(transactionClient.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ userId: otherUserId }),
                }),
            );
        });

        it("deve rejeitar pedido sem campos obrigatórios", async () => {
            const requiredFields = [
                "items",
                "shippingAddress",
                "paymentMethod",
            ];

            for (const field of requiredFields) {
                const invalidPayload = { ...orderData } as Record<
                    string,
                    unknown
                >;
                delete invalidPayload[field];

                const response = await app.inject({
                    method: "POST",
                    url: "/orders",
                    headers: { authorization: `Bearer ${userToken}` },
                    payload: invalidPayload,
                });

                expect(response.statusCode).toBe(400);
            }

            expect(prisma.product.findMany).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("deve rejeitar pedido sem item ou com item incompleto", async () => {
            const invalidPayloads = [
                { ...orderData, items: [] },
                { ...orderData, items: [{ quantity: 1 }] },
                { ...orderData, items: [{ productId: 20 }] },
                { ...orderData, items: [{ productId: 0, quantity: 1 }] },
            ];

            for (const payload of invalidPayloads) {
                const response = await app.inject({
                    method: "POST",
                    url: "/orders",
                    headers: { authorization: `Bearer ${userToken}` },
                    payload,
                });

                expect(response.statusCode).toBe(400);
            }

            expect(prisma.product.findMany).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("deve rejeitar endereço de entrega inválido", async () => {
            const invalidPayloads = [
                {
                    ...orderData,
                    shippingAddress: { ...shippingAddress, cep: "123" },
                },
                {
                    ...orderData,
                    shippingAddress: { ...shippingAddress, state: "São Paulo" },
                },
                {
                    ...orderData,
                    shippingAddress: { ...shippingAddress, street: "" },
                },
            ];

            for (const payload of invalidPayloads) {
                const response = await app.inject({
                    method: "POST",
                    url: "/orders",
                    headers: { authorization: `Bearer ${userToken}` },
                    payload,
                });

                expect(response.statusCode).toBe(400);
            }

            expect(prisma.product.findMany).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("deve rejeitar produto inexistente", async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: "POST",
                url: "/orders",
                headers: { authorization: `Bearer ${userToken}` },
                payload: orderData,
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain(
                "Produto(s) com ID 20 não encontrado(s)",
            );
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("deve rejeitar produto inativo, tamanho inválido ou estoque insuficiente", async () => {
            const invalidProducts = [
                {
                    ...product,
                    active: false,
                },
                {
                    ...product,
                    sizes: ["P", "G"],
                },
                {
                    ...product,
                    stock: 1,
                },
            ];

            for (const invalidProduct of invalidProducts) {
                vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
                    invalidProduct,
                ] as any);

                const response = await app.inject({
                    method: "POST",
                    url: "/orders",
                    headers: { authorization: `Bearer ${userToken}` },
                    payload: orderData,
                });

                expect(response.statusCode).toBe(500);
                expect(prisma.$transaction).not.toHaveBeenCalled();
            }
        });
    });

    describe("PUT /orders/:id", () => {
        it("deve atualizar o status do pedido do usuário autenticado", async () => {
            const updatedOrder = {
                ...order,
                status: "PAID",
            };
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(
                order as any,
            );
            vi.mocked(prisma.order.update).mockResolvedValueOnce(
                updatedOrder as any,
            );

            const response = await app.inject({
                method: "PUT",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
                payload: { status: "PAID" },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toMatchObject({
                message: "Pedido atualizado com sucesso",
                order: {
                    id: order.id,
                    status: "PAID",
                },
            });
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: order.id },
                    data: { status: "PAID" },
                    include: expect.any(Object),
                }),
            );
        });

        it("deve atualizar apenas o endereço de entrega", async () => {
            const updatedAddress = {
                ...shippingAddress,
                number: "2000",
            };
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(
                order as any,
            );
            vi.mocked(prisma.order.update).mockResolvedValueOnce({
                ...order,
                shippingAddress: updatedAddress,
            } as any);

            const response = await app.inject({
                method: "PUT",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
                payload: { shippingAddress: updatedAddress },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: order.id },
                    data: { shippingAddress: updatedAddress },
                }),
            );
        });

        it("deve permitir que admin atualize pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);
            vi.mocked(prisma.order.update).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
                status: "SHIPPED",
            } as any);

            const response = await app.inject({
                method: "PUT",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${adminToken}` },
                payload: { status: "SHIPPED" },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.order.update).toHaveBeenCalled();
        });

        it("deve exigir autenticação", async () => {
            const response = await app.inject({
                method: "PUT",
                url: `/orders/${order.id}`,
                payload: { status: "PAID" },
            });

            expect(response.statusCode).toBe(401);
            expect(prisma.order.findUnique).not.toHaveBeenCalled();
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("deve rejeitar atualização de pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);

            const response = await app.inject({
                method: "PUT",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
                payload: { status: "PAID" },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain("permissão");
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("deve retornar erro quando o pedido não existir", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

            const response = await app.inject({
                method: "PUT",
                url: "/orders/999999",
                headers: { authorization: `Bearer ${adminToken}` },
                payload: { status: "PAID" },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain(
                "Pedido não encontrado",
            );
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("deve rejeitar status, endereço e ID inválidos", async () => {
            const invalidPayloads = [
                { status: "INVALID" },
                { shippingAddress: { ...shippingAddress, cep: "123" } },
                { shippingAddress: { ...shippingAddress, state: "São Paulo" } },
            ];

            for (const payload of invalidPayloads) {
                const response = await app.inject({
                    method: "PUT",
                    url: `/orders/${order.id}`,
                    headers: { authorization: `Bearer ${adminToken}` },
                    payload,
                });

                expect(response.statusCode).toBe(400);
            }

            const invalidIdResponse = await app.inject({
                method: "PUT",
                url: "/orders/invalid-id",
                headers: { authorization: `Bearer ${adminToken}` },
                payload: { status: "PAID" },
            });

            expect(invalidIdResponse.statusCode).toBe(400);
            expect(prisma.order.findUnique).not.toHaveBeenCalled();
            expect(prisma.order.update).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /orders/:id", () => {
        it("deve cancelar o pedido do usuário autenticado", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(
                order as any,
            );
            vi.mocked(prisma.order.update).mockResolvedValueOnce({
                ...order,
                status: "CANCELLED",
            } as any);

            const response = await app.inject({
                method: "DELETE",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({
                message: "Pedido cancelado com sucesso",
            });
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: order.id },
                    data: { status: "CANCELLED" },
                    include: expect.any(Object),
                }),
            );
        });

        it("deve permitir que admin cancele pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);
            vi.mocked(prisma.order.update).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
                status: "CANCELLED",
            } as any);

            const response = await app.inject({
                method: "DELETE",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.order.update).toHaveBeenCalled();
        });

        it("deve exigir autenticação", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: `/orders/${order.id}`,
            });

            expect(response.statusCode).toBe(401);
            expect(prisma.order.findUnique).not.toHaveBeenCalled();
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("deve rejeitar cancelamento de pedido de outro usuário", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
                ...order,
                userId: otherUserId,
            } as any);

            const response = await app.inject({
                method: "DELETE",
                url: `/orders/${order.id}`,
                headers: { authorization: `Bearer ${userToken}` },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).debug).toContain("permissão");
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("deve rejeitar pedido inexistente, já cancelado ou já entregue", async () => {
            const invalidOrders = [
                null,
                { ...order, status: "CANCELLED" },
                { ...order, status: "DELIVERED" },
            ];

            for (const invalidOrder of invalidOrders) {
                vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(
                    invalidOrder as any,
                );

                const response = await app.inject({
                    method: "DELETE",
                    url: `/orders/${order.id}`,
                    headers: { authorization: `Bearer ${adminToken}` },
                });

                expect(response.statusCode).toBe(500);
                expect(prisma.order.update).not.toHaveBeenCalled();
            }
        });

        it("deve rejeitar ID inválido", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/orders/invalid-id",
                headers: { authorization: `Bearer ${adminToken}` },
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.order.findUnique).not.toHaveBeenCalled();
            expect(prisma.order.update).not.toHaveBeenCalled();
        });
    });
});
