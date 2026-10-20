import Link from "next/link";
import { PLANES, formatUsd } from "@/lib/plans";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 data-testid="hero-title">El asistente de IA para asesores financieros</h1>
        <p>Respuestas oficiales de producto en segundos, con guardrail de datos sensibles y trazabilidad para auditoría. Elige un plan y activa tu equipo hoy.</p>
        <Link href="/planes" className="btn btn-primary" data-testid="cta-ver-planes">Ver planes</Link>
      </section>
      <section className="grid" data-testid="resumen-planes">
        {PLANES.map((p) => (
          <div key={p.id} className="card">
            <h2>{p.nombre}</h2>
            <div className="precio">{formatUsd(p.precioUsd)} <small>/ mes</small></div>
            <p className="muted">{p.descripcion}</p>
          </div>
        ))}
      </section>
    </>
  );
}
