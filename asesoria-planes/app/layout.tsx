import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentSubscription } from "@/lib/subscription";
import { getPlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "AsesorIA Planes",
  description: "Suscripción al asistente de IA para asesores financieros",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sub = await currentSubscription();
  const plan = getPlan(sub?.planId);
  const mock = (process.env.PAYMENTS_PROVIDER ?? (process.env.STRIPE_SECRET_KEY ? "stripe" : "mock")) === "mock";
  return (
    <html lang="es">
      <body>
        {mock && <div className="mock-banner" data-testid="mock-banner">Entorno de pruebas: pasarela de pagos simulada (sin cargos reales)</div>}
        <header className="topbar">
          <Link href="/" className="brand" data-testid="brand">Asesor<span>IA</span> Planes</Link>
          <nav className="nav">
            <Link href="/planes" data-testid="nav-planes">Planes</Link>
            <Link href="/cuenta" data-testid="nav-cuenta">Mi cuenta</Link>
            {plan && <span className="badge badge-ok" data-testid="nav-plan-activo">Plan {plan.nombre}</span>}
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">AsesorIA Planes · MVP académico (Unidad 4) · pagos con Stripe Checkout en modo test</footer>
      </body>
    </html>
  );
}
