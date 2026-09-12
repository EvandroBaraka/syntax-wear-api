import Fastify, { FastifyInstance } from "fastify";
import "dotenv/config";
import cors from "@fastify/cors";
// Plugin Helmet para aumentar a segurança da API através de headers HTTP
import helmet from "@fastify/helmet";
import csrf from "@fastify/csrf-protection";
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import swagger from "@fastify/swagger";
import scalar from "@scalar/fastify-api-reference";
import jwt from "@fastify/jwt";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const PORT = parseInt(process.env.PORT ?? "3000");

export async function buildApp(): Promise<FastifyInstance> {
    // Instancia o Fastify e habilita o log para monitoramento de requisições
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || "info",
            serializers: {
                req(request) {
                    return {
                        method: request.method,
                        url: request.url,
                        // ❌ NÃO logar body, headers com Authorization
                    };
                },
                res(reply) {
                    return {
                        statusCode: reply.statusCode,
                    };
                },
            },
        },
    });

    fastify.register(jwt, {
        secret: process.env.JWT_SECRET!,
    });

    // Registra o plugin de CORS permitindo qualquer origem e envio de credenciais
    fastify.register(cors, {
        origin: true,
        credentials: true,
    });

    // Registra o plugin Helmet para segurança, desabilitando o CSP para simplificar o desenvolvimento inicial
    fastify.register(helmet, {
        contentSecurityPolicy: false,
    });

    fastify.register(csrf, {
        cookieOpts: { signed: true },
    });

    // Registra o plugin Swagger para documentação automática da API, configurando título, descrição e versão
    fastify.register(swagger, {
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "Syntax Wear API",
                description: "API para o e-commerce Syntax Wear",
                version: "1.0.0",
            },
            servers: [],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                        description: "Autenticação via token JWT",
                    },
                },
            },
        },
    });

    fastify.register(scalar, {
        routePrefix: "/api-docs",
        configuration: {
            theme: "deepSpace",
        },
    });

    fastify.register(productRoutes, { prefix: "/products" });
    fastify.register(authRoutes, { prefix: "/auth" });
    fastify.register(categoryRoutes, { prefix: "/categories" });
    fastify.register(orderRoutes, { prefix: "/orders" });

    // Define a rota principal (home) que retorna informações básicas da API
    fastify.get("/", async (request, reply) => {
        return {
            message: "E-commerce Syntax Wear API",
            version: "1.0.0",
            status: "running",
        };
    });

    // Define uma rota de 'health check' para verificar se a API está online e o timestamp atual
    fastify.get("/health", async (request, reply) => {
        return {
            status: "ok",
            timeStamp: new Date().toISOString(),
        };
    });

    fastify.setErrorHandler(errorHandler);

    await fastify.ready(); // Aguarda o Fastify estar pronto antes de retornar a instância

    return fastify;
}
