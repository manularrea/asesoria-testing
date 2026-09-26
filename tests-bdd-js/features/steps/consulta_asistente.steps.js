// Glue JavaScript del mismo feature que ConsultaAsistenteSteps.java (verificación cruzada).
const { Given, When, Then, Before, After, BeforeAll, AfterAll, setDefaultTimeout } = require("@cucumber/cucumber");
const { chromium, expect } = require("playwright/test");
const assert = require("node:assert");

const BASE = process.env.SUT_BASE_URL || "http://localhost:8000";
const PASSWORD = "Asesor2026*";
setDefaultTimeout(30_000);
let browser;

BeforeAll(async () => { browser = await chromium.launch({ headless: true }); });
AfterAll(async () => { await browser.close(); });
Before(async function () {
  this.context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-CR" });
  this.page = await this.context.newPage();
});
After(async function (scenario) {
  const png = await this.page.screenshot({ fullPage: true });
  this.attach(png, "image/png");
  await this.context.close();
});

const tid = (page, id) => page.getByTestId(id);

Given("que el asesor {string} ha iniciado sesión en AsesorIA", async function (usuario) {
  await this.page.goto(`${BASE}/login`);
  await tid(this.page, "login-username").fill(usuario);
  await tid(this.page, "login-password").fill(PASSWORD);
  await tid(this.page, "login-submit").click();
});
Given("se encuentra en la pantalla de chat", async function () {
  await expect(this.page).toHaveURL(/\/chat$/);
  await expect(tid(this.page, "chat-greeting")).toBeVisible();
});
When("el asesor consulta {string}", async function (consulta) {
  const before = await tid(this.page, "msg-bot").count();
  await tid(this.page, "chat-input").fill(consulta);
  await tid(this.page, "chat-send").click();
  this.reply = tid(this.page, "msg-bot").nth(before);
  await expect(this.reply).toBeVisible();
});
Then("el asistente responde con la intención {string}", async function (intencion) {
  await expect(this.reply.getByTestId("intent-badge")).toHaveText(intencion);
});
Then("la respuesta contiene {string}", async function (fragmento) {
  await expect(this.reply.getByTestId("bot-answer")).toContainText(fragmento);
});
Then("el estado de la respuesta es {string}", async function (estado) {
  await expect(this.reply.getByTestId("status-badge")).toHaveText(`estado: ${estado}`);
});
Then("la confianza mostrada es mayor o igual a {float}", async function (umbral) {
  const texto = await this.reply.getByTestId("confidence-badge").textContent();
  assert.ok(parseFloat(texto.replace("confianza:", "")) >= umbral, texto);
});
Then("el asistente indica que no tiene información suficiente", async function () {
  await expect(this.reply.getByTestId("bot-answer")).toContainText("No tengo información suficiente");
  await expect(this.reply.getByTestId("intent-badge")).toHaveText("fuera_de_dominio");
});
Then("el asistente rechaza la consulta por contener datos sensibles", async function () {
  await expect(this.reply.getByTestId("bot-answer")).toContainText("Por seguridad");
  await expect(this.reply.getByTestId("intent-badge")).toHaveText("bloqueado_pii");
  await expect(this.reply.getByTestId("confidence-badge")).toHaveCount(0);
});
Then("el historial muestra la consulta con el número enmascarado como {string}", async function (mascara) {
  await tid(this.page, "nav-historial").click();
  const fila = tid(this.page, "history-row").last().getByTestId("history-message");
  await expect(fila).toContainText(mascara);
  await expect(fila).not.toContainText("4111 1111 1111 1111");
});
