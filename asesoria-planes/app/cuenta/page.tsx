import Link from "next/link";
import { currentSubscription } from "@/lib/subscription";
import { formatUsd, getPlan } from "@/lib/plans";
import CancelarButton from "@/components/CancelarButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta · AsesorIA" };

export default async function CuentaPage() {
  const sub = await currentSubscription();
  const plan = getPlan(sub?.planId);
  if (!sub || !plan) {
    return (
      <section className="card card-narrow" data-testid="cuenta-sin-plan">
        <h1>Mi cuenta</h1>
        <p className="muted">Aún no tienes una suscripción activa.</p>
        <Link href="/planes" className="btn btn-primary" data-testid="cuenta-ver-planes">Ver planes</Link>
      </section>
    );
  }
  return (
    <section className="card card-narrow" data-testid="cuenta">
      <h1>Mi cuenta</h1>
      <div className="success">Suscripción activa</div>
      <dl className="resumen">
        <dt>Plan</dt><dd data-testid="cuenta-plan">{plan.nombre}</dd>
        <dt>Precio</dt><dd>{formatUsd(plan.precioUsd)} / mes</dd>
        <dt>Correo</dt><dd data-testid="cuenta-email">{sub.email}</dd>
        <dt>Activada</dt><dd data-testid="cuenta-fecha">{new Date(sub.activadaEn).toLocaleDateString("es-CR")}</dd>
        <dt>Proveedor</dt><dd>{sub.provider}</dd>
      </dl>
      <CancelarButton />
    </section>
  );
}
