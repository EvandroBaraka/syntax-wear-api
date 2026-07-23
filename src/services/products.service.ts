import { prisma } from "../utils/prisma";
import { ProductFilters } from "../types";

export const getProducts = async (filters: ProductFilters) => {
    // Desestrutura os filtros recebidos, definindo valores padrão para página (1) e limite (10)
    const {
        page = 1,
        limit = 10,
        minPrice,
        maxPrice,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = filters;

    // Inicializa o objeto de condições (where) que será usado na consulta do Prisma
    const where: any = {};

    // Se houver filtros de preço mínimo ou máximo, constrói a condição no campo 'price'
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
            // Filtra produtos com preço maior ou igual (gte) ao minPrice
            where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
            // Filtra produtos com preço menor ou igual (lte) ao maxPrice
            where.price.lte = maxPrice;
        }
    }

    // Se houver um termo de busca, aplica um filtro 'OR' insensível a maiúsculas/minúsculas
    if (search && search.trim()) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } }, // Busca no nome
            { description: { contains: search, mode: "insensitive" } }, // Busca na descrição
            { slug: { contains: search, mode: "insensitive" } }, // Busca no slug
        ];
    }

    // Calcula quantos registros devem ser pulados para a paginação
    const skip = (Number(page) - 1) * Number(limit);
    // Define o número de registros a serem retornados
    const take = Number(limit);
    // Prepara o objeto de ordenação
    const orderBy: any = {};
    if (sortBy) {
        // Atribui o campo e a direção da ordenação (ex: createdAt: 'desc')
        orderBy[sortBy] = sortOrder || "asc";
    }

    try {
        // Executa simultaneamente a busca dos produtos e a contagem total para otimizar o tempo
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
                skip,
                take,
            }),
            // Conta o total de produtos que correspondem aos mesmos filtros (sem skip/take)
            prisma.product.count({ where }),
        ]);

        // Retorna um objeto estruturado com os dados e informações de paginação
        return {
            data: products, // Lista de produtos da página atual
            total, // Total de registros encontrados no banco
            page, // Número da página atual
            limit, // Limite de itens por página
            totalPages: Math.ceil(total / limit), // Cálculo total de páginas disponíveis
        };

    } catch (error) {
        // Registra o erro no log e repassa a exceção
        console.error("Error fetching products:", error);
        throw error;
    }
};
