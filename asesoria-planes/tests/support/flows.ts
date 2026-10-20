import { expect, type Page } from "@playwright/test";

export const CORREO = "asesor@entidad.cr";
export const TARJETA_OK = "4242 4242 4242 4242";

/** Lleva al usuario desde el checkout hasta la pasarela de pagos (mock o Stripe). */
export async function irALaPasarela(page: Page, planId: string, email = CORREO) {
  await page.goto(`/checkout?plan=${planId}`);
  await page.getByTestId("checkout-email").fill(email);
  await page.getByTestId("checkout-pagar").click();
  await expect(page).toHaveURL(/\/checkout\/mock\?session_id=|checkout\.stripe\.com/);
}

/** Completa el pago en la pasarela simulada y espera la página de éxito. */
export async function pagarEnPasarela(page: Page, tarjeta = TARJETA_OK) {
  await page.getByTestId("gateway-card").fill(tarjeta);
  await page.getByTestId("gateway-pagar").click();
}

export async function pagoExitoso(page: Page, planId = "pro") {
  await irALaPasarela(page, planId);
  await pagarEnPasarela(page);
  await expect(page).toHaveURL(/\/exito\?session_id=/);
  await expect(page.getByTestId("exito-mensaje")).toContainText("Pago confirmado");
}
