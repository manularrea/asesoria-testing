/**
 * Capa de pagos con dos proveedores intercambiables:
 *  - StripeProvider: Stripe Checkout (modo test) — producción/staging.
 *  - MockProvider:   simula la página alojada de pago sin red; se usa en pruebas E2E y en CI.
 * Selección: PAYMENTS_PROVIDER=stripe|mock (por defecto, stripe si existe STRIPE_SECRET_KEY).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { getPlan, type Plan } from "./plans";

export type CheckoutStatus = "complete" | "open" | "expired";

export interface CheckoutSession {
  id: string;
  url: string;             // URL de la página de pago alojada
  provider: "stripe" | "mock";
}

export interface SessionDetails {
  id: string;
  provider: "stripe" | "mock";
  status: CheckoutStatus;
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  planId: string;
  email: string;
  amountUsd: number;
}

export interface PaymentProvider {
  readonly name: "stripe" | "mock";
  createCheckout(plan: Plan, email: string, baseUrl: string): Promise<CheckoutSession>;
  retrieve(sessionId: string): Promise<SessionDetails | null>;
}

function normalizePaymentStatus(value: string): SessionDetails["paymentStatus"] {
  return value === "paid" || value === "no_payment_required" ? value : "unpaid";
}

// ---------------------------------------------------------------- Stripe
class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(plan: Plan, email: string, baseUrl: string): Promise<CheckoutSession> {
    const priceId = process.env[plan.stripePriceEnv];
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: plan.precioUsd * 100,
                recurring: { interval: "month" },
                product_data: { name: `AsesorIA ${plan.nombre}`, description: plan.descripcion },
              },
            },
      ],
      metadata: { planId: plan.id },
      success_url: `${baseUrl}/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancelado?plan=${plan.id}`,
    });
    if (!session.url) throw new Error("Stripe no devolvió la URL de Checkout");
    return { id: session.id, url: session.url, provider: "stripe" };
  }

  async retrieve(sessionId: string): Promise<SessionDetails | null> {
    try {
      const s = await this.stripe.checkout.sessions.retrieve(sessionId);
      return {
        id: s.id,
        provider: "stripe",
        status: (s.status ?? "open") as CheckoutStatus,
        paymentStatus: normalizePaymentStatus(String(s.payment_status)),
        planId: s.metadata?.planId ?? "",
        email: s.customer_details?.email ?? s.customer_email ?? "",
        amountUsd: (s.amount_total ?? 0) / 100,
      };
    } catch {
      return null;
    }
  }
}

// ------------------------------------------------------------------ Mock
/** Sesión simulada y *stateless*: el id lleva el plan y el correo firmados con HMAC, sin base de datos. */
class MockProvider implements PaymentProvider {
  readonly name = "mock" as const;
  private readonly secret = process.env.MOCK_SIGNING_SECRET ?? "asesoria-mock-secret";

  private sign(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("hex").slice(0, 16);
  }

  encode(planId: string, email: string, status: CheckoutStatus): string {
    const payload = Buffer.from(JSON.stringify({ planId, email, status })).toString("base64url");
    return `mock_${payload}.${this.sign(payload)}`;
  }

  decode(sessionId: string): { planId: string; email: string; status: CheckoutStatus } | null {
    const match = /^mock_([A-Za-z0-9_-]+)\.([a-f0-9]{16})$/.exec(sessionId);
    if (!match) return null;
    const [, payload, sig] = match;
    const expected = this.sign(payload);
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
      return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
      return null;
    }
  }

  async createCheckout(plan: Plan, email: string, baseUrl: string): Promise<CheckoutSession> {
    const id = this.encode(plan.id, email, "open");
    return { id, url: `${baseUrl}/checkout/mock?session_id=${encodeURIComponent(id)}`, provider: "mock" };
  }

  async retrieve(sessionId: string): Promise<SessionDetails | null> {
    const data = this.decode(sessionId);
    const plan = data && getPlan(data.planId);
    if (!data || !plan) return null;
    return {
      id: sessionId,
      provider: "mock",
      status: data.status,
      paymentStatus: data.status === "complete" ? "paid" : "unpaid",
      planId: plan.id,
      email: data.email,
      amountUsd: plan.precioUsd,
    };
  }
}

// --------------------------------------------------------------- factory
let cached: PaymentProvider | undefined;

export function paymentsProvider(): PaymentProvider {
  if (cached) return cached;
  const wanted = process.env.PAYMENTS_PROVIDER ?? (process.env.STRIPE_SECRET_KEY ? "stripe" : "mock");
  if (wanted === "stripe") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("PAYMENTS_PROVIDER=stripe requiere STRIPE_SECRET_KEY");
    cached = new StripeProvider(key);
  } else {
    cached = new MockProvider();
  }
  return cached;
}

export function mockProvider(): MockProvider {
  const p = paymentsProvider();
  if (!(p instanceof MockProvider)) throw new Error("El proveedor activo no es mock");
  return p;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
