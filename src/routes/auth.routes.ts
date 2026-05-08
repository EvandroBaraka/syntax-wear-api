import { FastifyInstance } from "fastify";
import { login, register } from "../controllers/auth.controller";

export default function authRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/register",
        {
            schema: {
                tags: ["Auth"],
                description:
                    "Rota que registra um novo usuário e retorna um token JWT",
                body: {
                    type: "object",
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            description: "Email do usuário",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            description: "Senha do usuário",
                        },
                        firstName: {
                            type: "string",
                            description: "Primeiro nome do usuário",
                        },
                        lastName: {
                            type: "string",
                            description: "Sobrenome do usuário",
                        },
                        cpf: {
                            type: "string",
                            description: "CPF do usuário",
                        },
                        dateOfBirth: {
                            type: "string",
                            format: "date",
                            description:
                                "Data de nascimento do usuário (YYYY-MM-DD)",
                        },
                        phone: {
                            type: "string",
                            description:
                                "Telefone do usuário (apenas números, com DDD)",
                        },
                    },
                    required: ["email", "password", "firstName", "lastName"],
                },
            },
        },
        register,
    );

    fastify.post(
        "/login",
        {
            schema: {
                tags: ["Auth"],
                description:
                    "Rota que autentica um usuário e retorna um token JWT",
                body: {
                    type: "object",
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            description: "Email do usuário",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            description: "Senha do usuário",
                        },
                    },
                    required: ["email", "password"],
                },
            },
        },
        login,
    );
}
