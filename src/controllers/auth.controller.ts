import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, loginWithGoogle, registerUser } from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema } from "../utils/validators";

export const register = async ( request: FastifyRequest, reply: FastifyReply ) => {
    const validation = registerSchema.parse(request.body as RegisterRequest);

    const user = await registerUser(validation);

    const token = request.server.jwt.sign({
        userId: user.id,
        role: user.role,
    });

    return reply.status(201).send({ user, token });
};

export const login = async ( request: FastifyRequest<{Body: AuthRequest}>, reply: FastifyReply ) => {

    const validation = loginSchema.parse(request.body as AuthRequest);

    const user = await loginUser(validation, reply);
    
    if (!user) return;

    const token = request.server.jwt.sign({
        userId: user.id,
        role: user.role,
    });
    
    reply.setCookie("syntaxwear.token", token, {
        httpOnly: true, // Impede que o cookie seja acessado via JavaScript no lado do cliente
        secure: process.env.NODE_ENV === "production", // Garante que o cookie seja enviado apenas em conexões HTTPS em produção
        sameSite: "lax", // Protege contra ataques CSRF, permitindo apenas requisições do mesmo site
        path: "/", // Define o caminho para o qual o cookie é válido, neste caso, para toda a aplicação
        maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    reply.status(200).send({ user });
}

export const profile = async ( request: FastifyRequest, reply: FastifyReply ) => reply.status(200).send({ user: request.user });

export const googleLogin = async ( 
    request: FastifyRequest<{  Body: { credentials: string } }>, 
    reply: FastifyReply 
) => {
    const { credentials } = request.body;

    if (!credentials) {
        reply.status(400).send({ message: "Credenciais do Google não fornecidas." });
        return;
    }

    const user = await loginWithGoogle(credentials, reply);

    if (!user) return;

    const token = request.server.jwt.sign({
        userId: user.id,
        role: user.role,
    });

    reply.setCookie("syntaxwear.token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    reply.status(200).send({ user });
};

export const logout = async ( request: FastifyRequest, reply: FastifyReply ) => {
    reply.clearCookie("syntaxwear.token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    reply.status(200).send({ message: "Logout realizado com sucesso." });
};