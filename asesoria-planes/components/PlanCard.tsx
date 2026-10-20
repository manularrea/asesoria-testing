import Link from "next/link";
import { formatUsd, type Plan } from "@/lib/plans";

export default function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={`card${plan.destacado ? " destacado" : ""}`} data-testid={`plan-${plan.id}`}>
      {plan.destacado && <span className="badge badge-ok">Más elegido</span>}
      <h2>{plan.nombre}</h2>
      <div className="precio" data-testid={`precio-${plan.id}`}>{formatUsd(plan.precioUsd)} <small>/ mes</small></div>
      <p className="muted">{plan.descripcion}</p>
      <ul>{plan.caracteristicas.map((c) => <li key={c}>{c}</li>)}</ul>
      <Link href={`/checkout?plan=${plan.id}`} className="btn btn-primary" data-testid={`suscribir-${plan.id}`}>Suscribirse</Link>
    </article>
  );
}
