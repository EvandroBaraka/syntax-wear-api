import { FastifyInstance } from "fastify";
import { StripeController } from "../controllers/stripe.controller";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller";
import FastifyRawBody from "fastify-raw-body";

export default async function stripeRoutes(fastify: FastifyInstance) {
    const stripeController = new StripeController();
    const stripeWebhookController = new StripeWebhookController();

    await fastify.register(FastifyRawBody, {
        field: "rawBody",
        global: false,
        encoding: false,
        runFirst: true,
    });
    
    fastify.post(
        "/checkout", 
        stripeController.createCheckoutSession.bind(stripeController)
    );

    fastify.post(
        "/webhook", 
        {
            config: {
                rawBody: true,
            },
        },
        stripeWebhookController.handle.bind(stripeWebhookController)
    );
}