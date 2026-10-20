import { test, expect } from "@playwright/test";
import { heal } from "../support/healing";

test.describe("Landing y catálogo", () => {
  test("TC001 La landing presenta la propuesta de valor, el CTA y el resumen de los tres planes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-title")).toBeVisible();
    const resumen = page.getByTestId("resumen-planes");
    await expect(resumen.locator(".card")).toHaveCount(3);
    await expect(resumen.locator(".card")).toContainText(["USD 19", "USD 49", "USD 199"]);   // una expectativa por tarjeta
    await page.getByTestId("cta-ver-planes").click();
    await expect(page).toHaveURL(/\/planes$/);
  });

  test("TC002 El catálogo lista los planes con precios correctos y destaca el plan Pro", async ({ page }) => {
    await page.goto("/planes");
    await expect(page.getByTestId("precio-basico")).toContainText("USD 19");
    await expect(page.getByTestId("precio-pro")).toContainText("USD 49");
    await expect(page.getByTestId("precio-enterprise")).toContainText("USD 199");
    await expect(page.getByTestId("plan-pro")).toContainText("Más elegido");
    for (const id of ["basico", "pro", "enterprise"]) {
      await expect(page.getByTestId(`suscribir-${id}`)).toHaveAttribute("href", `/checkout?plan=${id}`);
    }
  });

  test("TC003 El checkout muestra el plan y el precio seleccionados", async ({ page }, testInfo) => {
    await page.goto("/planes");
    // Localizador auto-curable: el testid "primario" está deliberadamente obsoleto para demostrar la curación.
    const suscribir = await heal(page, "botón Suscribirse (Pro)", {
      testId: "btn-subscribe-pro",
      role: { role: "link", name: "Suscribirse" },
      css: '[data-testid="suscribir-pro"]',
    }, { test: testInfo.title });
    await suscribir.nth(0).click();
    await expect(page).toHaveURL(/\/checkout\?plan=/);
    const plan = await heal(page, "resumen del plan", { testId: "checkout-plan", text: /^Pro$/ }, { test: testInfo.title });
    await expect(plan).toHaveText(/Básico|Pro|Enterprise/);
    await expect(page.getByTestId("checkout-email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar al pago" })).toBeEnabled();
  });
});
