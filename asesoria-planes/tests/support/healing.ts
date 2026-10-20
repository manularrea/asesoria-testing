/**
 * Localizadores auto-curables (self-healing locators).
 *
 * Cada elemento se describe con varias estrategias ordenadas de más estable a más frágil
 * (data-testid → rol accesible + nombre → texto → CSS). Si la estrategia primaria no encuentra
 * el elemento (p. ej. porque un refactor cambió el testid), el helper prueba las siguientes,
 * registra la "curación" en test-results/healing-log.json y continúa la prueba. El registro
 * permite revisar después qué localizadores quedaron obsoletos y actualizarlos (deuda de pruebas),
 * en lugar de descubrirlo por una suite roja.
 */
import { expect, type Locator, type Page } from "@playwright/test";
import { appendFileSync, mkdirSync } from "node:fs";

export interface Strategies {
  testId?: string;
  role?: { role: Parameters<Page["getByRole"]>[0]; name?: string | RegExp };
  text?: string | RegExp;
  label?: string | RegExp;
  css?: string;
}

export interface HealingEvent {
  test: string; element: string; failed: string; healed: string; at: string;
}

const LOG = "test-results/healing-log.json";

function record(event: HealingEvent) {
  mkdirSync("test-results", { recursive: true });
  appendFileSync(LOG, JSON.stringify(event) + "\n");
}

function candidates(page: Page, s: Strategies): Array<[string, Locator]> {
  const list: Array<[string, Locator]> = [];
  if (s.testId) list.push([`testId=${s.testId}`, page.getByTestId(s.testId)]);
  if (s.role) list.push([`role=${s.role.role}${s.role.name ? ` name=${s.role.name}` : ""}`, page.getByRole(s.role.role, { name: s.role.name })]);
  if (s.label) list.push([`label=${s.label}`, page.getByLabel(s.label)]);
  if (s.text) list.push([`text=${s.text}`, page.getByText(s.text)]);
  if (s.css) list.push([`css=${s.css}`, page.locator(s.css)]);
  return list;
}

/**
 * Devuelve el primer localizador que resuelve a exactamente un elemento visible dentro del
 * tiempo indicado. Si el primario falla pero otro funciona, lo registra como curación.
 */
export async function heal(page: Page, element: string, s: Strategies, opts: { test?: string; timeout?: number } = {}): Promise<Locator> {
  const timeout = opts.timeout ?? 3000;
  const list = candidates(page, s);
  let primary: string | undefined;
  for (const [name, locator] of list) {
    primary ??= name;
    try {
      await expect(locator.first()).toBeVisible({ timeout });
      if (name !== primary) record({ test: opts.test ?? "", element, failed: primary, healed: name, at: new Date().toISOString() });
      return locator.first();
    } catch {
      // probar la siguiente estrategia
    }
  }
  throw new Error(`Elemento "${element}" no encontrado con ninguna estrategia: ${list.map(([n]) => n).join(" | ")}`);
}
