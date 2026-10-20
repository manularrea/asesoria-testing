import { test, expect } from "@playwright/test";

test("TC011 Contrato de la API: health, checkout y sesión", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const body = await health.json();
  expect(body.status).toBe("ok");
  expect(body.planes).toEqual(["basico", "pro", "enterprise"]);
  expect(["mock", "stripe"]).toContain(body.paymentsProvider);

  expect((await request.post("/api/checkout", { data: { planId: "pro" } })).status()).toBe(400);
  expect((await request.post("/api/checkout", { data: { planId: "oro", email: "a@b.cr" } })).status()).toBe(400);

  const ok = await request.post("/api/checkout", { data: { planId: "pro", email: "asesor@entidad.cr" } });
  expect(ok.status()).toBe(200);
  const session = await ok.json();
  expect(session.sessionId).toBeTruthy();
  expect(session.url).toMatch(/^https?:\/\//);

  const detalle = await request.get(`/api/session/${session.sessionId}`);
  expect(detalle.status()).toBe(200);
  expect((await detalle.json()).paymentStatus).toBe("unpaid");
  expect((await request.get("/api/session/inexistente")).status()).toBe(404);
});
