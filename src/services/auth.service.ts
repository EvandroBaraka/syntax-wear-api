import { AuthRequest, RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

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
    });

    return newUser;
};

export const loginUser = async (data: AuthRequest) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new Error("Usuário não encontrado.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new Error("Senha inválida.");
    }

    return user;
};
