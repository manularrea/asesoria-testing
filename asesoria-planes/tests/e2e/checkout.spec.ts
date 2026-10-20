import { test, expect } from "@playwright/test";
import { CORREO, irALaPasarela, pagarEnPasarela, pagoExitoso } from "../support/flows";
import { heal } from "../support/healing";

test.describe("Checkout y pasarela", () => {
  test("TC004 El checkout rechaza un correo inválido sin redirigir a la pasarela", async ({ page }) => {
    await page.goto("/checkout?plan=pro");
    await page.getByTestId("checkout-email").fill("correo-invalido");
    await page.getByTestId("checkout-pagar").click();
    const error = page.getByTestId("checkout-error");   // getByRole("alert") era ambiguo: Next.js añade <next-route-announcer role="alert">
    await expect(error).toHaveText("Correo electrónico inválido.");
    await expect(page).toHaveURL(/\/checkout\?plan=pro$/);
  });

  test("TC005 Un plan inexistente en el checkout devuelve 404", async ({ page }) => {
    const response = await page.goto("/checkout?plan=inexistente");
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("checkout-form")).toHaveCount(0);
  });

  test("TC006 Flujo de pago exitoso de extremo a extremo", async ({ page }, testInfo) => {
    await irALaPasarela(page, "pro");
    await expect(page.getByTestId("gateway-importe")).toContainText("USD 49");
    await expect(page.getByTestId("gateway-email")).toHaveText(CORREO);
    // El botón de pago se localiza de forma auto-curable (testid obsoleto a propósito → rol + nombre).
    const pagar = await heal(page, "botón Pagar", { testId: "btn-pay", role: { role: "button", name: /^Pagar/ } }, { test: testInfo.title });
    await page.getByTestId("gateway-card").fill("4242 4242 4242 4242");
    await pagar.click();
    await expect(page).toHaveURL(/\/exito\?session_id=/);
    await expect(page.getByTestId("exito-mensaje")).toContainText("Pago confirmado");
    await expect(page.getByTestId("exito-plan")).toHaveText("Pro");
    await expect(page.getByTestId("exito-importe")).toContainText("USD 49");
    await expect(page.getByTestId("exito-email")).toHaveText(CORREO);
    await expect(page.getByTestId("exito-referencia")).not.toBeEmpty();
    await page.screenshot({ path: "test-results/evidencia/TC006_exito.png", fullPage: true });
  });

  test("TC007 Activar la suscripción muestra el plan en Mi cuenta y en la cabecera", async ({ page }) => {
    await pagoExitoso(page, "pro");
    await page.getByTestId("activar-suscripcion").click();
    await expect(page).toHaveURL(/\/cuenta$/);
    await expect(page.getByTestId("cuenta-plan")).toHaveText("Pro");
    await expect(page.getByTestId("cuenta-email")).toHaveText(CORREO);
    await expect(page.getByTestId("nav-plan-activo")).toHaveText("Plan Pro");
    await page.screenshot({ path: "test-results/evidencia/TC007_cuenta.png", fullPage: true });
  });

  test("TC008 Cancelar en la pasarela lleva a /cancelado y permite reintentar el mismo plan", async ({ page }) => {
    await irALaPasarela(page, "basico");
    await page.getByTestId("gateway-cancelar").click();
    await expect(page).toHaveURL(/\/cancelado/);
    await expect(page.getByTestId("cancelado")).toContainText("No se realizó ningún cargo");
    await page.getByTestId("reintentar").click();
    await expect(page).toHaveURL(/\/(checkout\?plan=basico|planes)/);
    await page.goto("/cuenta");
    await expect(page.getByTestId("cuenta-sin-plan")).toBeVisible();
  });

  test("TC009 La pasarela rechaza una tarjeta inválida y no confirma el pago", async ({ page }) => {
    await irALaPasarela(page, "enterprise");
    await pagarEnPasarela(page, "4000 0000 0000 0002");
    await expect(page.getByTestId("gateway-error")).toContainText("Tarjeta rechazada");
    await expect(page).toHaveURL(/\/checkout\/mock/);
  });

  test("TC010 Una sesión de pago inválida o manipulada no muestra la confirmación ni activa la suscripción", async ({ page, request }) => {
    const manipulada = "mock_eyJwbGFuSWQiOiJwcm8iLCJlbWFpbCI6InhAeC5jciIsInN0YXR1cyI6ImNvbXBsZXRlIn0.0000000000000000";
    await page.goto(`/exito?session_id=${manipulada}`);
    await expect(page.getByTestId("exito-invalido")).toContainText("No encontramos un pago confirmado");
    const r = await request.post("/api/activar", { data: { sessionId: manipulada } });
    expect(r.status()).toBe(402);
    await page.goto("/cuenta");
    await expect(page.getByTestId("cuenta-sin-plan")).toBeVisible();
  });

  test("TC012 Cancelar la suscripción desde Mi cuenta elimina el plan activo", async ({ page }) => {
    await pagoExitoso(page, "basico");
    await page.getByTestId("activar-suscripcion").click();
    await expect(page.getByTestId("cuenta-plan")).toHaveText("Básico");
    await page.getByTestId("cancelar-suscripcion").click();
    await expect(page).toHaveURL(/\/planes$/);
    await expect(page.getByTestId("nav-plan-activo")).toHaveCount(0);
    await page.goto("/cuenta");
    await expect(page.getByTestId("cuenta-sin-plan")).toContainText("Aún no tienes una suscripción activa");
  });
});
