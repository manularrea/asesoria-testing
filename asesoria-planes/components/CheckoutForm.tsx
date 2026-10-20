"use client";
import { useState } from "react";
import { formatUsd, type Plan } from "@/lib/plans";

export default function CheckoutForm({ plan }: { plan: Plan }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, email }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Error inesperado."); return; }
      window.location.assign(data.url);
    } catch {
      setError("No fue posible contactar la pasarela de pagos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-narrow" data-testid="checkout">
      <h1>Suscripción al plan {plan.nombre}</h1>
      <dl className="resumen">
        <dt>Plan</dt><dd data-testid="checkout-plan">{plan.nombre}</dd>
        <dt>Precio</dt><dd data-testid="checkout-precio">{formatUsd(plan.precioUsd)} / mes</dd>
      </dl>
      {error && <div className="alert" role="alert" data-testid="checkout-error">{error}</div>}
      <form onSubmit={submit} data-testid="checkout-form" noValidate>
        <label htmlFor="email">Correo electrónico de facturación</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
               placeholder="asesor@entidad.cr" data-testid="checkout-email" autoComplete="email" />
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy} data-testid="checkout-pagar">
            {busy ? "Redirigiendo a la pasarela…" : "Continuar al pago"}
          </button>
          <a href="/planes" className="btn btn-secondary" data-testid="checkout-volver">Volver a planes</a>
        </div>
      </form>
      <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>El cobro lo procesa Stripe en una página segura. No almacenamos datos de tarjeta.</p>
    </section>
  );
}
