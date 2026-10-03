import Stripe from "stripe";

interface OrderItems {
    id: number;
    name: string;
    unitPrice: number;
    quantity: number;
}

interface CreateStripeCheckoutServiceRequest {
    products: OrderItems[];
}

export const createStripeCheckoutService = async ({
    products
}: CreateStripeCheckoutServiceRequest) => {

    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe secret key.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia",
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: products.map((product) => ({
            price_data: {
                currency: "brl",
                unit_amount: Math.round(product.unitPrice * 100), // Stripe expects the amount in cents
                product_data: {
                    name: product.name,
                },
            },
            quantity: product.quantity,
        })),
    });

    return {
        sessionId: session.id,
    };
};
