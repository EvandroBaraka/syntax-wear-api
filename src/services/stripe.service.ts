import Stripe from "stripe";

interface OrderItems {
    id: number;
    name: string;
    unitPrice: number;
    quantity: number;
}

interface CreateStripeCheckoutServiceRequest {
    products: OrderItems[];
    orderId: number;
}

export const createStripeCheckoutService = async ({
    products,
    orderId
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
        metadata: {
            orderId: String(orderId), //CAMPO ALTERADO PARA STRING, POIS O METADATA DO STRIPE SÓ ACEITA STRING
        },
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
        // success_url: `http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        success_url: `http://localhost:5173/account/orders?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:5173/checkout/cancel`,
    });

    return {
        sessionId: session.id,
    };
};
