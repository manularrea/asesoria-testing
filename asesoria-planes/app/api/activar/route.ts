import { NextResponse } from "next/server";
import { paymentsProvider } from "@/lib/payments";
import { encodeSubscription, SUBSCRIPTION_COOKIE } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/** Tras un pago confirmado, activa la suscripción del visitante (cookie firmada). */
export async function POST(request: Request) {
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  const details = sessionId ? await paymentsProvider().retrieve(sessionId) : null;
  if (!details || details.paymentStatus !== "paid") {
    return NextResponse.json({ error: "El pago no está confirmado." }, { status: 402 });
  }
  const response = NextResponse.json({ activada: true, planId: details.planId });
  response.cookies.set(SUBSCRIPTION_COOKIE, encodeSubscription({
    planId: details.planId, email: details.email, sessionId: details.id, provider: details.provider,
    activadaEn: new Date().toISOString(),
  }), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ activada: false });
  response.cookies.set(SUBSCRIPTION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
