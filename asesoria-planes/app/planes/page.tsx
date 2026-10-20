import { PLANES } from "@/lib/plans";
import PlanCard from "@/components/PlanCard";

export const metadata = { title: "Planes · AsesorIA" };

export default function PlanesPage() {
  return (
    <>
      <h1>Elige tu plan</h1>
      <p className="muted">Facturación mensual en USD. Puedes cancelar cuando quieras.</p>
      <section className="grid" data-testid="catalogo-planes">
        {PLANES.map((p) => <PlanCard key={p.id} plan={p} />)}
      </section>
    </>
  );
}
