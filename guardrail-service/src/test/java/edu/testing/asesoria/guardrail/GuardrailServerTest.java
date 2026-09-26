package edu.testing.asesoria.guardrail;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TDD ciclo 4b (integración): contrato HTTP del servicio que consume el SUT (POST /guardrail/evaluate). */
@DisplayName("GuardrailServer (HTTP)")
class GuardrailServerTest {

  private static GuardrailServer server;
  private static String base;
  private static final HttpClient http = HttpClient.newHttpClient();

  @BeforeAll
  static void start() throws Exception {
    server = GuardrailServer.start(0);           // puerto libre
    base = "http://localhost:" + server.port();
  }

  @AfterAll
  static void stop() {
    server.stop();
  }

  private static HttpResponse<String> post(String body) throws Exception {
    return http.send(HttpRequest.newBuilder(URI.create(base + "/guardrail/evaluate"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
  }

  @Test
  @DisplayName("GET /health responde 200 con el estado del servicio")
  void health() throws Exception {
    HttpResponse<String> r = http.send(HttpRequest.newBuilder(URI.create(base + "/health")).GET().build(),
        HttpResponse.BodyHandlers.ofString());
    assertEquals(200, r.statusCode());
    assertTrue(r.body().contains("\"status\":\"ok\""));
  }

  @Test
  @DisplayName("un mensaje con PAN devuelve 200 con status blocked y texto enmascarado")
  void evaluaMensajeConPan() throws Exception {
    HttpResponse<String> r = post("{\"message\":\"tarjeta 4111 1111 1111 1111 clonada\"}");
    assertEquals(200, r.statusCode());
    assertTrue(r.body().contains("\"status\":\"blocked\""), r.body());
    assertTrue(r.body().contains("**** **** **** 1111"), r.body());
    assertTrue(!r.body().contains("4111 1111"), "el PAN no debe volver en claro");
  }

  @Test
  @DisplayName("un mensaje limpio devuelve status allowed")
  void evaluaMensajeLimpio() throws Exception {
    HttpResponse<String> r = post("{\"message\":\"horario de sucursales\"}");
    assertEquals(200, r.statusCode());
    assertTrue(r.body().contains("\"status\":\"allowed\""), r.body());
  }

  @Test
  @DisplayName("un cuerpo sin campo message devuelve 400")
  void cuerpoInvalido() throws Exception {
    assertEquals(400, post("{\"texto\":\"x\"}").statusCode());
    assertEquals(400, post("no json").statusCode());
  }

  @Test
  @DisplayName("un método distinto de POST en /guardrail/evaluate devuelve 405")
  void metodoNoPermitido() throws Exception {
    HttpResponse<String> r = http.send(HttpRequest.newBuilder(URI.create(base + "/guardrail/evaluate")).GET().build(),
        HttpResponse.BodyHandlers.ofString());
    assertEquals(405, r.statusCode());
  }
}
