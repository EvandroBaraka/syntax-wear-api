import z from "zod";

export const loginSchema = z.object({
    email: z.email("Email inválido"),
    password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().min(1, "Sobrenome é obrigatório"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
    cpf: z.string().optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
});

export const productFilterSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1, "Página deve ser no mínimo 1")
        .optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1, "Limite deve ser no mínimo 1")
        .optional(),
    minPrice: z.coerce
        .number()
        .nonnegative("Preço mínimo deve ser no mínimo 0")
        .optional(),
    maxPrice: z.coerce
        .number()
        .nonnegative("Preço máximo deve ser no mínimo 0")
        .optional(),
    search: z.string().optional(),
    categoryId: z.coerce.number().int().optional(),
    sortBy: z.enum(["price", "name", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const categoryFilterSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1, "Página deve ser no mínimo 1")
        .optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1, "Limite deve ser no mínimo 1")
        .optional(),
    search: z.string().optional(),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, "Nome da categoria é obrigatório"),
    slug: z.string().min(1, "Slug da categoria é obrigatório").optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1, "Nome da categoria é obrigatório").optional(),
    slug: z.string().min(1, "Slug da categoria é obrigatório").optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
});

export const createProductSchema = z.object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    description: z.string().min(1, "Descrição do produto é obrigatória"),
    price: z.number().nonnegative("Preço deve ser no mínimo 0"),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    slug: z.string().min(1, "Slug do produto é obrigatório"),
    stock: z.number().int().nonnegative("Estoque deve ser no mínimo 0"),
    active: z.boolean(),
    images: z.array(z.string()).optional(),
    categoryId: z.number().int().min(1, "ID da categoria inválido"),
});

export const updateProductSchema = z.object({
    name: z.string().min(1, "Nome do produto é obrigatório").optional(),
    description: z
        .string()
        .min(1, "Descrição do produto é obrigatória")
        .optional(),
    price: z.number().nonnegative("Preço deve ser no mínimo 0").optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    slug: z.string().min(1, "Slug do produto é obrigatório").optional(),
    stock: z
        .number()
        .int()
        .nonnegative("Estoque deve ser no mínimo 0")
        .optional(),
    active: z.boolean().optional(),
    images: z.array(z.string()).optional(),
    categoryId: z.number().int().min(1, "ID da categoria inválido").optional(),
});

export const deleteProductSchema = z.object({
    id: z.number().int().min(1, "ID inválido"),
});

export const orderFiltersSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1, "Página deve ser no mínimo 1")
        .optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1, "Limite deve ser no mínimo 1")
        .optional(),
    status: z
        .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
        .optional(),
    userId: z.coerce.number().int().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const createOrderItemSchema = z.object({
    productId: z.number().int().min(1, "ID do produto inválido"),
    quantity: z.number().int().min(1, "Quantidade deve ser no mínimo 1"),
    size: z.string().optional(),
});

export const createOrderSchema = z.object({
    userId: z.number().int().optional(),
    items: z
        .array(createOrderItemSchema)
        .min(1, "Pedido deve ter pelo menos um item"),
    shippingAddress: z.object({
        cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
        street: z.string().min(1, "Rua é obrigatória"),
        number: z.string().min(1, "Número é obrigatório"),
        complement: z.string().optional(),
        neighborhood: z.string().min(1, "Bairro é obrigatório"),
        city: z.string().min(1, "Cidade é obrigatória"),
        state: z.string().length(2, "Estado deve ter 2 caracteres"),
        country: z.string().default("BR"),
    }),
    paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
});

export const updateOrderSchema = z.object({
    status: z
        .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
        .optional(),
    shippingAddress: z
        .object({
            cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
            street: z.string().min(1, "Rua é obrigatória"),
            number: z.string().min(1, "Número é obrigatório"),
            complement: z.string().optional(),
            neighborhood: z.string().min(1, "Bairro é obrigatório"),
            city: z.string().min(1, "Cidade é obrigatória"),
            state: z.string().length(2, "Estado deve ter 2 caracteres"),
            country: z.string().default("BR"),
        })
        .optional(),
});
