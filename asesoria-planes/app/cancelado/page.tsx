import Link from "next/link";

export const metadata = { title: "Pago cancelado · AsesorIA" };

export default async function CanceladoPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return (
    <section className="card card-narrow" data-testid="cancelado">
      <h1>Pago cancelado</h1>
      <p className="muted">No se realizó ningún cargo. Puedes retomar la suscripción cuando quieras.</p>
      <Link href={plan ? `/checkout?plan=${plan}` : "/planes"} className="btn btn-primary" data-testid="reintentar">Reintentar</Link>
    </section>
  );
}
