import "dotenv/config";
import { prisma } from "../src/utils/prisma";

const categories = [
    {
        name: "Camisetas",
        slug: "camisetas",
        description: "Camisetas da Syntax Wear.",
    },
    {
        name: "Moletons",
        slug: "moletons",
        description: "Moletons da Syntax Wear.",
    },
    {
        name: "Jaquetas",
        slug: "jaquetas",
        description: "Jaquetas da Syntax Wear.",
    },
    {
        name: "Calças",
        slug: "calcas",
        description: "Calças da Syntax Wear.",
    },
    {
        name: "Shorts",
        slug: "shorts",
        description: "Shorts da Syntax Wear.",
    },
    {
        name: "Acessórios",
        slug: "acessorios",
        description: "Acessórios da Syntax Wear.",
    },
    {
        name: "Calçados",
        slug: "calcados",
        description: "Calçados da Syntax Wear.",
    },
];

const products = [
    {
        name: "Camiseta Syntax Basics",
        slug: "camiseta-syntax-basics",
        categorySlug: "camisetas",
        description: "Camiseta de algodão com logo Syntax Wear.",
        price: 79.9,
        images: [
            "/images/camiseta-basics-1.png",
            "/images/camiseta-basics-2.png",
        ],
        sizes: ["P", "M", "G", "GG"],
        colors: ["preto", "branco", "cinza"],
        stock: 55,
        active: true,
    },
    {
        name: "Moletom Syntax Comfort",
        slug: "moletom-syntax-comfort",
        categorySlug: "moletons",
        description: "Moletom leve e confortável para o dia a dia.",
        price: 149.9,
        images: ["/images/moletom-comfort-1.png"],
        sizes: ["M", "G", "GG"],
        colors: ["azul", "verde"],
        stock: 35,
        active: true,
    },
    {
        name: "Jaqueta Syntax Street",
        slug: "jaqueta-syntax-street",
        categorySlug: "jaquetas",
        description: "Jaqueta com capuz e design urbano.",
        price: 249.9,
        images: [
            "/images/jaqueta-street-1.png",
            "/images/jaqueta-street-2.png",
        ],
        sizes: ["P", "M", "G"],
        colors: ["preto", "marrom"],
        stock: 20,
        active: true,
    },
    {
        name: "Calça Syntax Flex",
        slug: "calca-syntax-flex",
        categorySlug: "calcas",
        description: "Calça esportiva com elasticidade e ajuste perfeito.",
        price: 129.9,
        images: ["/images/calca-flex-1.png"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["cinza", "preto"],
        stock: 28,
        active: true,
    },
    {
        name: "Short Syntax Breeze",
        slug: "short-syntax-breeze",
        categorySlug: "shorts",
        description: "Short leve ideal para treino e lazer.",
        price: 89.9,
        images: ["/images/short-breeze-1.png"],
        sizes: ["P", "M", "G"],
        colors: ["azul", "branco"],
        stock: 40,
        active: true,
    },
    {
        name: "Boné Syntax Classic",
        slug: "bone-syntax-classic",
        categorySlug: "acessorios",
        description: "Boné ajustável com bordado minimalista.",
        price: 49.9,
        images: ["/images/bone-classic-1.png"],
        sizes: ["P", "M", "G"],
        colors: ["preto", "bege"],
        stock: 70,
        active: true,
    },
    {
        name: "Tênis Syntax Run",
        slug: "tenis-syntax-run",
        categorySlug: "calcados",
        description: "Tênis de corrida com amortecimento avançado.",
        price: 299.9,
        images: ["/images/tenis-run-1.png", "/images/tenis-run-2.png"],
        sizes: ["38", "39", "40", "41", "42"],
        colors: ["branco", "cinza"],
        stock: 18,
        active: true,
    },
    {
        name: "Camiseta Syntax Vintage",
        slug: "camiseta-syntax-vintage",
        categorySlug: "camisetas",
        description: "Camiseta estilo vintage com estampa exclusiva.",
        price: 89.9,
        images: ["/images/camiseta-vintage-1.png"],
        sizes: ["P", "M", "G"],
        colors: ["vinho", "azul-marinho"],
        stock: 26,
        active: true,
    },
    {
        name: "Regata Syntax Cool",
        slug: "regata-syntax-cool",
        categorySlug: "camisetas",
        description: "Regata leve para looks casuais e esportivos.",
        price: 59.9,
        images: ["/images/regata-cool-1.png"],
        sizes: ["P", "M", "G"],
        colors: ["branco", "preto"],
        stock: 50,
        active: true,
    },
    {
        name: "Calça Jogger Syntax",
        slug: "calca-jogger-syntax",
        categorySlug: "calcas",
        description: "Calça jogger estilo urbano com bolsos laterais.",
        price: 139.9,
        images: ["/images/calca-jogger-1.png"],
        sizes: ["P", "M", "G"],
        colors: ["cinza", "preto"],
        stock: 32,
        active: true,
    },
];

async function main() {
    const categoryIds = new Map<string, number>();

    for (const category of categories) {
        const savedCategory = await prisma.category.upsert({
            where: { slug: category.slug },
            update: {
                name: category.name,
                description: category.description,
                active: true,
            },
            create: category,
        });

        categoryIds.set(savedCategory.slug, savedCategory.id);
    }

    await prisma.product.createMany({
        data: products.map((product) => ({
            name: product.name,
            slug: product.slug,
            categoryId: categoryIds.get(product.categorySlug)!,
            description: product.description,
            price: product.price,
            stock: product.stock,
            active: product.active,
            images: product.images,
            sizes: product.sizes,
            colors: product.colors,
        })),
        skipDuplicates: true,
    });

    console.log("Seed concluída: 10 produtos inseridos ou já existentes.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
