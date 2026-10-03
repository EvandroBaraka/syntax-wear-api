import { FastifyInstance } from "fastify";
import { StripeController } from "../controllers/stripe.controller";

export default async function stripeRoutes(fastify: FastifyInstance) {
    const stripeController = new StripeController();

    fastify.post("/checkout", stripeController.createCheckoutSession.bind(stripeController));
}