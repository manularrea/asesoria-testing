import { NextResponse } from "next/server";
import { isValidEmail, paymentsProvider } from "@/lib/payments";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** Crea la sesión de pago y devuelve la URL de la página alojada (Stripe o mock). */
export async function POST(request: Request) {
  let body: { planId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }
  const plan = getPlan(body.planId);
  if (!plan) return NextResponse.json({ error: "Plan desconocido." }, { status: 400 });
  const email = (body.email ?? "").trim();
  if (!isValidEmail(email)) return NextResponse.json({ error: "Correo electrónico inválido." }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
  try {
    const session = await paymentsProvider().createCheckout(plan, email, baseUrl);
    return NextResponse.json({ sessionId: session.id, url: session.url, provider: session.provider });
  } catch (error) {
    console.error("checkout", error);
    return NextResponse.json({ error: "No fue posible iniciar el pago. Intenta de nuevo." }, { status: 502 });
  }
}
