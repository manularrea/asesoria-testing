/** Suscripción activa del visitante, persistida en una cookie firmada (sin base de datos en el MVP). */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SUBSCRIPTION_COOKIE = "asesoria_suscripcion";

export interface Subscription {
  planId: string;
  email: string;
  sessionId: string;
  provider: "stripe" | "mock";
  activadaEn: string;   // ISO
}

const secret = () => process.env.SUBSCRIPTION_SECRET ?? "asesoria-subscription-secret";
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

export function encodeSubscription(sub: Subscription): string {
  const payload = Buffer.from(JSON.stringify(sub)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSubscription(value: string | undefined): Subscription | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Subscription;
  } catch {
    return null;
  }
}

export async function currentSubscription(): Promise<Subscription | null> {
  const jar = await cookies();
  return decodeSubscription(jar.get(SUBSCRIPTION_COOKIE)?.value);
}
