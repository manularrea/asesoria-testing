"use client";
import { useState } from "react";
import { formatUsd } from "@/lib/plans";

interface Props { sessionId: string; planId: string; planNombre: string; precioUsd: number; email: string }

/** Simulación de la página de pago alojada: tarjeta de prueba, pagar o cancelar. */
export default function MockGateway({ sessionId, planId, planNombre, precioUsd, email }: Props) {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish(outcome: "pay" | "cancel") {
    setError(null);
    if (outcome === "pay" && card.replace(/\s/g, "") !== "4242424242424242") {
      setError("Tarjeta rechazada. Usa la tarjeta de prueba 4242 4242 4242 4242.");
      return;
    }
    setBusy(true);
    const r = await fetch("/api/mock/complete", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, outcome }) });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { setError(data.error ?? "Error"); return; }
    // Al cancelar se conserva el plan (igual que cancel_url de Stripe) para que "Reintentar" reabra el mismo checkout.
    // Defecto detectado por TestSprite (ejecución 2026-10-20): antes redirigía a /cancelado sin plan.
    window.location.assign(outcome === "pay" ? `/exito?session_id=${encodeURIComponent(data.sessionId)}` : `/cancelado?plan=${encodeURIComponent(planId)}`);
  }

  return (
    <section className="card card-narrow" data-testid="mock-gateway">
      <span className="badge badge-warn">Pasarela simulada</span>
      <h1>Pago seguro</h1>
      <dl className="resumen">
        <dt>Producto</dt><dd>AsesorIA {planNombre}</dd>
        <dt>Importe</dt><dd data-testid="gateway-importe">{formatUsd(precioUsd)} / mes</dd>
        <dt>Correo</dt><dd data-testid="gateway-email">{email}</dd>
      </dl>
      {error && <div className="alert" role="alert" data-testid="gateway-error">{error}</div>}
      <label htmlFor="card">Número de tarjeta (prueba)</label>
      <input id="card" type="text" value={card} onChange={(e) => setCard(e.target.value)} data-testid="gateway-card" />
      <div className="row">
        <button className="btn btn-primary" disabled={busy} onClick={() => finish("pay")} data-testid="gateway-pagar">Pagar {formatUsd(precioUsd)}</button>
        <button className="btn btn-secondary" disabled={busy} onClick={() => finish("cancel")} data-testid="gateway-cancelar">Cancelar</button>
      </div>
    </section>
  );
}
