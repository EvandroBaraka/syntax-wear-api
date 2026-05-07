import Fastify from "fastify";
import "dotenv/config";
import cors from "@fastify/cors";
// Plugin Helmet para aumentar a segurança da API através de headers HTTP
import helmet from "@fastify/helmet";
import productRoutes from "./routes/products.routes";
import swagger from "@fastify/swagger";
import scalar from "@scalar/fastify-api-reference";

// Define a porta do servidor, buscando das variáveis de ambiente ou usando 3000 como padrão
const PORT = parseInt(process.env.PORT ?? "3000");

// Instancia o Fastify e habilita o log para monitoramento de requisições
const fastify = Fastify({
    logger: true,
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

// Registra o plugin Swagger para documentação automática da API, configurando título, descrição e versão
fastify.register(swagger, {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "Syntax Wear API",
            description: "API para o e-commerce Syntax Wear",
            version: "1.0.0",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Servidor local de desenvolvimento",
            },
        ],
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
        theme: "dark",
    },
});

fastify.register(productRoutes, { prefix: "/products" });

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

// Tenta iniciar o servidor na porta definida
try {
    fastify.listen({ port: PORT });
} catch (err) {
    // Em caso de erro ao iniciar, registra o erro no log e encerra o processo
    fastify.log.error(err);
    process.exit(1);
}

// Exporta a instância do servidor para ser utilizada em outros arquivos (ex: testes)
export default fastify;
