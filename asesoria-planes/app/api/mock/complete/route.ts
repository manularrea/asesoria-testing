import { NextResponse } from "next/server";
import { mockProvider, paymentsProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Simula la confirmación del pago en la página alojada mock: devuelve la sesión en estado "complete". */
export async function POST(request: Request) {
  if (paymentsProvider().name !== "mock") return NextResponse.json({ error: "Solo disponible con el proveedor mock." }, { status: 404 });
  const { sessionId, outcome } = (await request.json()) as { sessionId?: string; outcome?: "pay" | "cancel" };
  const mock = mockProvider();
  const data = mock.decode(sessionId ?? "");
  if (!data) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  const status = outcome === "pay" ? "complete" : "expired";
  return NextResponse.json({ sessionId: mock.encode(data.planId, data.email, status), status });
}
