import { RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";

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

    const newUser = await prisma.user.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: payload.password, // Em produção, a senha deve ser hashada
            cpf: payload.cpf,
            birthDate: birthDate,
            phone: payload.phone,
            role: "USER", // Define o papel do usuário como "USER" por padrão
        },
    });

    return newUser;
};
