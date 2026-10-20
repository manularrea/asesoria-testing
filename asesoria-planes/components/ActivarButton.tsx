"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivarButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function activar() {
    setBusy(true); setError(null);
    const r = await fetch("/api/activar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
    setBusy(false);
    if (!r.ok) { setError((await r.json()).error ?? "No fue posible activar la suscripción."); return; }
    router.push("/cuenta");
    router.refresh();   // refresca el layout (RSC) para que la cabecera muestre el plan activo
  }

  return (
    <>
      {error && <div className="alert" role="alert" data-testid="activar-error">{error}</div>}
      <button className="btn btn-primary" onClick={activar} disabled={busy} data-testid="activar-suscripcion">
        {busy ? "Activando…" : "Activar mi suscripción"}
      </button>
    </>
  );
}
