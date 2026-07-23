import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export const errorHandler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    console.log("Error handler called with error:", error);

    // Loga o erro para análise posterior
    if (error instanceof ZodError) {
        console.log("entrou no zod error");
        return reply.status(400).send({
            message: "Erro de validação (zod)",
            errors: z.treeifyError(error),
        });
    }

    if (error.code === "FST_ERR_VALIDATION") {
        return reply.status(400).send({
            message: "Erro de validação do (fastify)",
            errors: error.validation,
        });
    }

    return reply
        .status(500)
        .send({ error: "Erro interno do servidor", debug: error.message });
};
