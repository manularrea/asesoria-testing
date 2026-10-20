import { notFound } from "next/navigation";
import { getPlan } from "@/lib/plans";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Suscripción · AsesorIA" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planId } = await searchParams;
  const plan = getPlan(planId);
  if (!plan) notFound();
  return <CheckoutForm plan={plan} />;
}
