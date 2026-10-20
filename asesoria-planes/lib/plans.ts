/** Catálogo de planes de AsesorIA (precios en USD, cobro mensual). */
export type PlanId = "basico" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  nombre: string;
  precioUsd: number;          // precio mensual
  descripcion: string;
  caracteristicas: string[];
  destacado?: boolean;
  /** Price ID de Stripe (modo test). Si no existe se crea el precio al vuelo con price_data. */
  stripePriceEnv: string;
}

export const PLANES: Plan[] = [
  {
    id: "basico",
    nombre: "Básico",
    precioUsd: 19,
    descripcion: "Para un asesor o una sucursal pequeña.",
    caracteristicas: ["1 asesor", "500 consultas/mes", "Base de conocimiento estándar", "Historial 30 días"],
    stripePriceEnv: "STRIPE_PRICE_BASICO",
  },
  {
    id: "pro",
    nombre: "Pro",
    precioUsd: 49,
    descripcion: "Para equipos de servicio al cliente.",
    caracteristicas: ["Hasta 10 asesores", "5.000 consultas/mes", "Guardrail de datos sensibles", "Historial 12 meses", "Soporte prioritario"],
    destacado: true,
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "enterprise",
    nombre: "Enterprise",
    precioUsd: 199,
    descripcion: "Para entidades reguladas con múltiples canales.",
    caracteristicas: ["Asesores ilimitados", "Consultas ilimitadas", "Guardrail como servicio dedicado", "Auditoría y trazabilidad", "SLA 99,9 %"],
    stripePriceEnv: "STRIPE_PRICE_ENTERPRISE",
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANES.find((p) => p.id === id);
}

export function formatUsd(value: number): string {
  return `USD ${value}`;
}
