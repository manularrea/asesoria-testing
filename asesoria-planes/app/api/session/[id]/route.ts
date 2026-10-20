import { NextResponse } from "next/server";
import { paymentsProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Consulta el estado de una sesión de pago (usado por la página de éxito y por las pruebas). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const details = await paymentsProvider().retrieve(id);
  if (!details) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  return NextResponse.json(details);
}
