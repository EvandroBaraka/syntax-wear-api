import { FastifyReply, FastifyRequest } from "fastify";
import Stripe from "stripe";
import { prisma } from "../utils/prisma";

export class StripeWebhookController {
    async handle(request: FastifyRequest, reply: FastifyReply) {

        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("Missing Stripe secret key.");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-02-24.acacia",
        });

        const signature = request.headers["stripe-signature"];

        if (!signature) {
            return reply
                .status(400)
                .send({ error: "Missing Stripe signature." });
        }

        const webhookSecretKey = process.env.STRIPE_WEBHOOK_SECRET_KEY;

        if (!webhookSecretKey) {
            throw new Error("Missing Stripe webhook secret key.");
        }

        const raw = (await request.rawBody) as Buffer;

        const event = stripe.webhooks.constructEvent(
            raw,
            signature,
            webhookSecretKey,
        );

        console.log("Evento recebido do Stripe:", event.type);
        switch (event.type) {
            case "checkout.session.completed": {
                const orderId = event.data.object.metadata?.orderId;

                if (!orderId) {
                    request.log.error(
                        { eventId: event.id },
                        "Stripe checkout event is missing orderId metadata.",
                    );
                    return reply.status(400).send({
                        error: "Missing order metadata.",
                    });
                }

                await prisma.order.update({
                    where: {
                        id: Number(orderId),
                    },
                    data: {
                        status: "PAID",
                    },
                });
                console.log("Pedido atualizado para o status PAID.");

                break;
            }

            case "charge.failed": {
                const orderId = event.data.object.metadata?.orderId;

                if (!orderId) {
                    request.log.error(
                        { eventId: event.id },
                        "Stripe charge event is missing orderId metadata.",
                    );
                    return reply.status(400).send({
                        error: "Missing order metadata.",
                    });
                }

                await prisma.order.update({
                    where: {
                        id: Number(orderId),
                    },
                    data: {
                        status: "CANCELLED",
                    },
                });
                console.log("Pedido atualizado para o status CANCELLED.");

                break;
            }

            default:
                console.log(`Tipo de evento não tratado: ${event.type}`);
        }

        return reply.status(200).send({ received: true });
    }
}
