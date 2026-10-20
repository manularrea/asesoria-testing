import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

/**
 * Webhook de Stripe: valida la firma y registra el evento (checkout.session.completed).
 * En el MVP solo se registra en el log; en producción aquí se activaría la cuenta en la base de datos.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Falta la firma." }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = new Stripe(key).webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: `Firma inválida: ${(error as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.info("suscripción activada", { session: session.id, plan: session.metadata?.planId, email: session.customer_details?.email });
  }
  return NextResponse.json({ received: true, type: event.type });
}
