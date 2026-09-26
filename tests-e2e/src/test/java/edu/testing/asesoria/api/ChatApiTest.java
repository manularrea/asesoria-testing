package edu.testing.asesoria.api;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.FormData;
import com.microsoft.playwright.options.RequestOptions;
import edu.testing.asesoria.config.TestConfig;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Escenario E-04: contrato de la API del asistente (RF-03..RF-06, RNF-01, RNF-03).
 * Nivel de integración/API: sin navegador, usando el cliente HTTP de Playwright.
 */
@Tag("api")
@DisplayName("E-04 API del asistente")
class ChatApiTest {

  private static final Gson GSON = new Gson();
  private static Playwright playwright;
  private static APIRequestContext session;    // contexto autenticado (conserva la cookie de sesión)
  private static APIRequestContext anonymous;  // contexto sin sesión

  @BeforeAll
  static void setUp() {
    playwright = Playwright.create();
    APIRequest.NewContextOptions options = new APIRequest.NewContextOptions().setBaseURL(TestConfig.BASE_URL);
    session = playwright.request().newContext(options);
    anonymous = playwright.request().newContext(options);
    APIResponse login = session.post("/login", RequestOptions.create()
        .setForm(FormData.create().set("username", TestConfig.DEMO_USER).set("password", TestConfig.DEMO_PASSWORD)));
    assertTrue(login.ok(), "El login de la API falló con HTTP " + login.status());
  }

  @AfterAll
  static void tearDown() {
    session.dispose();
    anonymous.dispose();
    playwright.close();
  }

  private static APIResponse postChat(APIRequestContext ctx, String message) {
    return ctx.post("/api/chat", RequestOptions.create().setData(Map.of("message", message)));
  }

  private static JsonObject json(APIResponse response) {
    return GSON.fromJson(response.text(), JsonObject.class);
  }

  @Test
  @DisplayName("CP-API-01 /api/health expone estado, versión y configuración del NLU")
  void healthDisponible() {
    APIResponse response = session.get("/api/health");
    assertEquals(200, response.status());
    JsonObject body = json(response);
    assertEquals("ok", body.get("status").getAsString());
    assertEquals(10, body.get("intents").getAsInt());
    assertEquals(TestConfig.NLU_THRESHOLD, body.get("threshold").getAsDouble(), 1e-9);
  }

  @Test
  @DisplayName("CP-API-02 Sin sesión, /api/chat responde 401")
  void sinSesionRetorna401() {
    APIResponse response = postChat(anonymous, "hola");
    assertEquals(401, response.status());
    assertEquals("No autenticado.", json(response).get("detail").getAsString());
  }

  @DisplayName("CP-API-03 Mensaje vacío o en blanco responde 422")
  @ParameterizedTest(name = "CP-API-03 Mensaje vacío ''{0}'' responde 422")
  @ValueSource(strings = {"", "   "})
  void mensajeVacioRetorna422(String message) {
    APIResponse response = postChat(session, message);
    assertEquals(422, response.status());
    assertTrue(json(response).get("detail").getAsString().contains("vacío"));
  }

  @Test
  @DisplayName("CP-API-04 Análisis de valores límite: 500 caracteres se acepta, 501 se rechaza")
  void limiteDeLongitud() {
    assertEquals(200, postChat(session, "a".repeat(500)).status(), "500 caracteres debe aceptarse");
    APIResponse tooLong = postChat(session, "a".repeat(501));
    assertEquals(422, tooLong.status(), "501 caracteres debe rechazarse");
    assertTrue(json(tooLong).get("detail").getAsString().contains("500"));
  }

  @DisplayName("CP-API-05 Clasificación del conjunto dorado de intenciones (10 consultas)")
  @ParameterizedTest(name = "CP-API-05 [{index}] ''{0}'' -> {1}")
  @CsvSource({
      "'¿Cuál es el horario de atención de las sucursales?', horario_sucursales",
      "'qué necesito para pedir un préstamo personal', credito_personal",
      "'perdí mi tarjeta de débito, ¿cómo la bloqueo?', bloqueo_tarjeta",
      "'cuánto puedo retirar del cajero por día', limites_cajero",
      "'olvidé la contraseña de la banca en línea', cambio_clave",
      "'hay un cargo que no reconozco en mi tarjeta', reporte_fraude",
      "'cómo abro una cuenta de ahorros', apertura_cuenta",
      "'tasa del CDP a 12 meses', tasa_cdp",
      "'cómo envío dinero al exterior', transferencias_internacionales",
      "'descargar estado de cuenta en pdf', estado_cuenta"
  })
  void clasificaConjuntoDorado(String message, String expectedIntent) {
    APIResponse response = postChat(session, message);
    assertEquals(200, response.status());
    JsonObject body = json(response);
    assertEquals(expectedIntent, body.get("intent").getAsString());
    assertEquals("ok", body.get("status").getAsString());
    assertTrue(body.get("confidence").getAsDouble() >= TestConfig.NLU_THRESHOLD,
        "confianza " + body.get("confidence") + " por debajo del umbral " + TestConfig.NLU_THRESHOLD);
  }

  @DisplayName("CP-API-06 Consultas fuera de dominio producen fallback")
  @ParameterizedTest(name = "CP-API-06 [{index}] fuera de dominio: ''{0}''")
  @ValueSource(strings = {"¿cómo preparo una lasaña?", "resultado del partido de anoche", "hola"})
  void fueraDeDominioProduceFallback(String message) {
    JsonObject body = json(postChat(session, message));
    assertEquals("fallback", body.get("status").getAsString());
    assertEquals("fuera_de_dominio", body.get("intent").getAsString());
    assertTrue(body.get("confidence").getAsDouble() < TestConfig.NLU_THRESHOLD);
  }

  @Test
  @DisplayName("CP-API-07 Un PAN válido se bloquea y se almacena enmascarado")
  void bloqueaDatosSensibles() {
    JsonObject body = json(postChat(session, "el cliente reporta su tarjeta 4111-1111-1111-1111 extraviada"));
    assertEquals("blocked", body.get("status").getAsString());
    assertEquals("bloqueado_pii", body.get("intent").getAsString());
    assertTrue(body.get("confidence").isJsonNull());
    String stored = body.get("message").getAsString();
    assertTrue(stored.contains("**** **** **** 1111"), "mensaje almacenado: " + stored);
    assertFalse(stored.contains("4111-1111"), "el PAN no debe almacenarse en claro");
  }

  @Test
  @DisplayName("CP-API-08 La latencia de inferencia se mantiene bajo 200 ms")
  void latenciaBajoUmbral() {
    long start = System.nanoTime();
    JsonObject body = json(postChat(session, "límite de retiro en cajero"));
    long roundTripMs = (System.nanoTime() - start) / 1_000_000;
    double latencyMs = body.get("latency_ms").getAsDouble();
    assertTrue(latencyMs < 200, "latencia de inferencia " + latencyMs + " ms");
    assertTrue(roundTripMs < 2_000, "tiempo de ida y vuelta " + roundTripMs + " ms");
  }

  @Test
  @DisplayName("CP-API-09 /api/history refleja cada consulta registrada")
  void historialApiReflejaConsultas() {
    int before = GSON.fromJson(session.get("/api/history").text(), JsonArray.class).size();
    postChat(session, "cómo cambio la clave de banca en línea");
    JsonArray after = GSON.fromJson(session.get("/api/history").text(), JsonArray.class);
    assertEquals(before + 1, after.size());
    JsonObject last = after.get(after.size() - 1).getAsJsonObject();
    assertEquals("cambio_clave", last.get("intent").getAsString());
    assertNull(last.get("password"), "el historial no debe exponer campos inesperados");
  }
}
