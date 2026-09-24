import { FastifyReply } from "fastify";
import { AuthRequest, RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (payload: RegisterRequest) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existingUser) {
        throw new Error("Email já cadastrado");
    }

    const birthDate = payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined;

    if (birthDate) {
        if (payload.dateOfBirth && Number.isNaN(birthDate.getTime())) {
            throw new Error(
                "Data de nascimento inválida. Use formato YYYY-MM-DD ou ISO-8601.",
            );
        }
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const newUser = await prisma.user.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: hashedPassword,
            cpf: payload.cpf,
            birthDate: birthDate,
            phone: payload.phone,
            role: "USER", // Define o papel do usuário como "USER" por padrão
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cpf: true,
            birthDate: true,
            phone: true,
            role: true,
            createdAt: true,
        },
    });

    return newUser;
};

export const loginUser = async (data: AuthRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        reply.status(409).send({ message: "Credenciais inválidas." });
        return;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
        reply.status(409).send({ message: "Credenciais inválidas." });
        return;
    }

    // Remover password antes de retornar
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

export const loginWithGoogle = async (
    credentials: string,
    reply: FastifyReply,
) => {
    const ticket = await googleClient.verifyIdToken({
        idToken: credentials,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        reply.status(401).send({ message: "Token do Google inválido." });
        return;
    }

    const { email, given_name, family_name } = payload;

    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Se o usuário não existir, crie um novo
        user = await prisma.user.create({
            data: {
                firstName: given_name || "",
                lastName: family_name || "",
                email,
                password: "", // Nenhuma senha é necessária para login via Google
                role: "USER",
            },
        });
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};
