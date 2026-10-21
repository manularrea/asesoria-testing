import { notFound } from "next/navigation";
import { paymentsProvider } from "@/lib/payments";
import { getPlan } from "@/lib/plans";
import MockGateway from "@/components/MockGateway";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pasarela simulada · AsesorIA" };

/** Página "alojada" del proveedor mock: equivale a la página de Stripe Checkout en modo test. */
export default async function MockCheckoutPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const provider = paymentsProvider();
  if (provider.name !== "mock" || !sessionId) notFound();
  const details = await provider.retrieve(sessionId);
  const plan = details && getPlan(details.planId);
  if (!details || !plan) notFound();
  return <MockGateway sessionId={sessionId} planId={plan.id} planNombre={plan.nombre} precioUsd={plan.precioUsd} email={details.email} />;
}
