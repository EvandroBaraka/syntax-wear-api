import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export const errorHandler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    console.log("Error handler called with error:", error);

    // Verifica se é um erro de validação de Schema nativo do Fastify (Ajv)
    if (error.validation) {
        return reply.status(400).send({
            message: "Erro de validação de rota",
            errors: error.validation,
        });
    }

    // Loga o erro para análise posterior
    if (error instanceof ZodError) {
        console.log("entrou no zod error");
        return reply.status(400).send({
            message: "Erro de validação (zod)",
            errors: z.treeifyError(error),
        });
    }

    return reply
        .status(500)
        .send({ error: "Erro interno do servidor sfasfasfas" });
};
