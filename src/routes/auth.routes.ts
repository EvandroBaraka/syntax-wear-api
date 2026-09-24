import { FastifyInstance } from "fastify";
import { googleLogin, login, logout, profile, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default async function authRoutes(fastify: FastifyInstance) {
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
                            description: "Email do usuário",
                        },
                        password: {
                            type: "string",
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

    fastify.get(
        "/profile",
        {
            preHandler: [authenticate],
            schema: {
                tags: ["Auth"],
                description: "Retorna o perfil do usuário autenticado",
                security: [{ bearerAuth: [] }], //Indica que essa rota requer autenticação com token JWT
            },
        },
        profile,
    );

    fastify.post(
        "/google",
        {
            schema: {
                tags: ["Auth"],
                description: "Rota que autentica um usuário via Google e retorna um token JWT",
                body: {
                    type: "object",
                    required: ["credentials"],
                    properties: {
                        credentials: {
                            type: "string",
                            description: "Credenciais do Google",
                        },
                    },
                },
            },
        },
        googleLogin,
    );

    fastify.post(
        "/logout",
        {
            preHandler: [authenticate],
            schema: {
                tags: ["Auth"],
                description: "Realiza o logout do usuário autenticado, removendo o token JWT do cookie",
                security: [{ bearerAuth: [] }], //Indica que essa rota requer autenticação com token JWT
            },
        },
        logout,
    );
}
