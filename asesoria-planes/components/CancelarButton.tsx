"use client";
import { useRouter } from "next/navigation";

export default function CancelarButton() {
  const router = useRouter();
  async function cancelar() {
    await fetch("/api/activar", { method: "DELETE" });
    router.push("/planes");
    router.refresh();
  }
  return <button className="btn btn-secondary" onClick={cancelar} data-testid="cancelar-suscripcion">Cancelar suscripción</button>;
}
