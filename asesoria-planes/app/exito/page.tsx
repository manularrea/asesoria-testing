import Link from "next/link";
import { paymentsProvider } from "@/lib/payments";
import { formatUsd, getPlan } from "@/lib/plans";
import ActivarButton from "@/components/ActivarButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pago confirmado · AsesorIA" };

export default async function ExitoPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const details = sessionId ? await paymentsProvider().retrieve(sessionId) : null;
  const plan = details && getPlan(details.planId);

  if (!details || !plan || details.paymentStatus !== "paid") {
    return (
      <section className="card card-narrow" data-testid="exito-invalido">
        <h1>No encontramos un pago confirmado</h1>
        <p className="muted">La sesión de pago no existe, expiró o aún no se ha completado.</p>
        <Link href="/planes" className="btn btn-primary" data-testid="volver-planes">Volver a planes</Link>
      </section>
    );
  }

  return (
    <section className="card card-narrow" data-testid="exito">
      <div className="success" data-testid="exito-mensaje">Pago confirmado. ¡Bienvenida a AsesorIA {plan.nombre}!</div>
      <dl className="resumen">
        <dt>Plan</dt><dd data-testid="exito-plan">{plan.nombre}</dd>
        <dt>Importe</dt><dd data-testid="exito-importe">{formatUsd(details.amountUsd)} / mes</dd>
        <dt>Correo</dt><dd data-testid="exito-email">{details.email}</dd>
        <dt>Referencia</dt><dd data-testid="exito-referencia" style={{ wordBreak: "break-all" }}>{details.id.slice(0, 24)}…</dd>
        <dt>Proveedor</dt><dd data-testid="exito-proveedor">{details.provider}</dd>
      </dl>
      <ActivarButton sessionId={details.id} />
    </section>
  );
}
